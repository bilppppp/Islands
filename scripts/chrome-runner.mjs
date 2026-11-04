import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let noticePrinted = false;

export function printChromeMissingNotice() {
  if (!noticePrinted) {
    noticePrinted = true;
    console.warn('[verify] 未找到 Chrome/Chromium 浏览器，跳过 html preview 运行时执行');
  }
}

export function findChromeBinary() {
  const custom = process.env.CHROME_PATH;
  if (custom && existsSync(custom)) return custom;

  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  // Try `which` fallback on unix
  for (const cmd of ['google-chrome', 'chromium', 'chromium-browser']) {
    try {
      const res = spawnSync('which', [cmd], { encoding: 'utf8' });
      const found = res.stdout ? res.stdout.trim() : '';
      if (found && existsSync(found)) return found;
    } catch {}
  }

  return null;
}

export function launchHeadlessChromeSync() {
  const binary = findChromeBinary();
  if (!binary) return null;

  const tmpDir = mkdtempSync(join(tmpdir(), 'island-chrome-verify-'));
  const proc = spawn(
    binary,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-gpu',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
      proc.kill('SIGKILL');
    } catch {}
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  };

  process.once('exit', cleanup);

  let port = null;
  let wsPath = '';
  const portFile = join(tmpDir, 'DevToolsActivePort');
  const start = Date.now();

  // Listen to stderr as fallback/early signal
  let stderrBuffer = '';
  proc.stderr.on('data', (chunk) => {
    stderrBuffer += chunk.toString();
    const match = stderrBuffer.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)(\/[^\s\r\n]+))/);
    if (match && !port) {
      port = parseInt(match[2], 10);
      wsPath = match[3];
    }
  });

  while (Date.now() - start < 5000) {
    if (port && wsPath) break;
    if (existsSync(portFile)) {
      try {
        const lines = readFileSync(portFile, 'utf8').trim().split('\n');
        if (lines.length >= 2) {
          port = parseInt(lines[0], 10);
          wsPath = lines[1];
          break;
        }
      } catch {}
    }
    const endWait = Date.now() + 20;
    while (Date.now() < endWait) {}
  }

  if (!port) {
    cleanup();
    process.removeListener('exit', cleanup);
    return null;
  }

  const wsUrl = `ws://127.0.0.1:${port}${wsPath}`;

  return {
    proc,
    tmpDir,
    port,
    wsUrl,
    close() {
      process.removeListener('exit', cleanup);
      cleanup();
    },
  };
}

export class HeadlessChromeClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)(msg);
        this.pending.delete(msg.id);
      }
      for (const listener of this.listeners) {
        try {
          listener(msg);
        } catch {}
      }
    };

    await this.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    });
  }

  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, (msg) => {
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg);
        }
      });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }

  async executeHtmlPreview(htmlDoc, timeoutMs = 1500) {
    const { result: { targetId } } = await this.send('Target.createTarget', { url: 'about:blank' });

    try {
      const attachRes = await this.send('Target.attachToTarget', { targetId, flatten: true });
      const sessionId = attachRes.result.sessionId;

      await this.send('Page.enable', {}, sessionId);
      await this.send('Runtime.enable', {}, sessionId);

      const runtimeErrors = [];
      const onMessage = (msg) => {
        if (msg.method === 'Target.attachedToTarget') {
          const childSessionId = msg.params.sessionId;
          this.send('Runtime.enable', {}, childSessionId).catch(() => {});
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          const details = msg.params.exceptionDetails;
          const desc = details.exception?.description || details.text;
          if (desc && !runtimeErrors.includes(desc)) {
            runtimeErrors.push(desc);
          }
        }
      };

      this.listeners.push(onMessage);

      const mountScript = `
        window.__islandPreviewErrors = [];
        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'preview-error') {
            var t = String(e.data.text || '');
            if (t && window.__islandPreviewErrors.indexOf(t) === -1) {
              window.__islandPreviewErrors.push(t);
            }
          }
        });
        var iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.srcdoc = ${JSON.stringify(htmlDoc)};
        document.body.appendChild(iframe);
      `;

      await this.send('Runtime.evaluate', { expression: mountScript }, sessionId);

      // Wait ~1.5s after load
      await new Promise((r) => setTimeout(r, timeoutMs));

      let postErrors = [];
      try {
        const evalRes = await this.send(
          'Runtime.evaluate',
          { expression: 'window.__islandPreviewErrors', returnByValue: true },
          sessionId
        );
        postErrors = evalRes.result?.result?.value || [];
      } catch {}

      const listenerIdx = this.listeners.indexOf(onMessage);
      if (listenerIdx !== -1) {
        this.listeners.splice(listenerIdx, 1);
      }

      const allErrors = [];
      for (const err of [...postErrors, ...runtimeErrors]) {
        if (!allErrors.includes(err)) {
          allErrors.push(err);
        }
      }

      if (allErrors.length > 0) {
        return { ok: false, error: allErrors.join('\n') };
      }
      return { ok: true, error: null };
    } finally {
      try {
        await this.send('Target.closeTarget', { targetId });
      } catch {}
    }
  }

  async close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
