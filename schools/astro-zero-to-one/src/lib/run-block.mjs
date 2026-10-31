import {
  scanCodeFences,
  assertPredictFence,
  assertNumberlineFence,
} from './predict-block.mjs';

const SUPPORTED_RUN_LANGS = new Set(['python', 'javascript', 'typescript']);
const SUPPORTED_PREVIEW_LANGS = new Set(['html', 'jsx', 'tsx']);
const LANG_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
};

export const PROGRAMMING_LANGUAGES = new Set([
  'python', 'py',
  'javascript', 'js',
  'typescript', 'ts',
  'jsx',
  'tsx',
  'html',
  'css',
  'c', 'cpp', 'c++', 'csharp', 'c#',
  'java', 'rust', 'rs', 'go',
  'ruby', 'rb', 'php', 'swift', 'kotlin', 'kt',
  'sql', 'shell', 'bash', 'sh', 'zsh',
]);

export const EXTERNAL_RESOURCE_WARNING =
  'html preview 引用了外部 http:// 或 https:// 资源：部分学习者（比如国内）可能访问不了，建议把资源复制到课程的 public/ 下。';

export function normalizeRunLang(lang) {
  const lower = (lang || '').toLowerCase().trim();
  return LANG_ALIASES[lower] || lower;
}

export function isRunnableLang(lang) {
  return SUPPORTED_RUN_LANGS.has(normalizeRunLang(lang));
}

export function isPreviewLang(lang) {
  return SUPPORTED_PREVIEW_LANGS.has(normalizeRunLang(lang));
}

export const tsRunTransformOptions = {
  transforms: ['typescript'],
};

export function previewTransformOptions(lang, runtime) {
  const normalized = normalizeRunLang(lang);
  const transforms =
    normalized === 'tsx'
      ? ['jsx', 'imports', 'typescript']
      : ['jsx', 'imports'];
  return {
    transforms,
    jsxPragma: runtime === 'react' ? 'React.createElement' : 'h',
    jsxFragmentPragma: runtime === 'react' ? 'React.Fragment' : 'Fragment',
  };
}

function fail(fileName, message) {
  throw new Error(`Run block in ${fileName}: ${message}`);
}

function parseFenceInfo(info) {
  const trimmed = info.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/);
  const hasRun = tokens.includes('run');
  const hasPreview = tokens.includes('preview');
  if (!hasRun && !hasPreview) return null;
  const rawLang = tokens[0] === 'run' || tokens[0] === 'preview' ? tokens[0] : tokens[0];
  const lang = normalizeRunLang(rawLang);
  if (hasRun && hasPreview) {
    return { lang, rawLang, mode: 'both', hasBoth: true };
  }
  const hasReact = tokens.includes('react');
  const hasPreact = tokens.includes('preact');
  return {
    lang,
    rawLang,
    mode: hasPreview ? 'preview' : 'run',
    explicitRuntime: hasReact && hasPreact ? 'both' : (hasReact ? 'react' : (hasPreact ? 'preact' : null)),
    hasBothRuntimes: hasReact && hasPreact,
  };
}

export function resolvePreviewRuntime(fenceInfoOrMeta, code = '') {
  let explicit = null;
  if (typeof fenceInfoOrMeta === 'string') {
    const tokens = fenceInfoOrMeta.trim().split(/\s+/);
    const hasReact = tokens.includes('react');
    const hasPreact = tokens.includes('preact');
    if (hasReact && hasPreact) {
      throw new Error('code fence cannot specify both "react" and "preact"');
    }
    if (hasReact) explicit = 'react';
    else if (hasPreact) explicit = 'preact';
  } else if (fenceInfoOrMeta && typeof fenceInfoOrMeta === 'object') {
    if (fenceInfoOrMeta.hasBothRuntimes || fenceInfoOrMeta.explicitRuntime === 'both') {
      throw new Error('code fence cannot specify both "react" and "preact"');
    }
    explicit = fenceInfoOrMeta.runtime || fenceInfoOrMeta.explicitRuntime || null;
  }

  const importRegex = /(?:^|\n)\s*import\s+([\s\S]*?['"][^'"]+['"]\s*;?)/g;
  let match;
  let hasReactImport = false;
  let hasPreactImport = false;
  let firstReactSource = null;
  let firstPreactSource = null;
  const allSources = [];

  while ((match = importRegex.exec(code)) !== null) {
    const stmt = match[0].trim();
    const fromMatch = stmt.match(/from\s+['"]([^'"]+)['"]/);
    const sideEffectMatch = stmt.match(/import\s+['"]([^'"]+)['"]/);
    const source = fromMatch ? fromMatch[1] : (sideEffectMatch ? sideEffectMatch[1] : null);
    if (source) {
      allSources.push(source);
      if (source === 'react' || source === 'react-dom/client') {
        hasReactImport = true;
        if (!firstReactSource) firstReactSource = source;
      } else if (source === 'preact' || source === 'preact/hooks') {
        hasPreactImport = true;
        if (!firstPreactSource) firstPreactSource = source;
      }
    }
  }

  if (hasReactImport && hasPreactImport) {
    throw new Error('preview block cannot import both React and Preact');
  }

  if (explicit === 'react') {
    if (hasPreactImport) {
      throw new Error(`preview block specifies react runtime but imports from "${firstPreactSource}"`);
    }
    for (const src of allSources) {
      if (src !== 'react' && src !== 'react-dom/client') {
        throw new Error(`preview block can only import from "react" and "react-dom/client", got "${src}"`);
      }
    }
    return 'react';
  }

  if (explicit === 'preact') {
    if (hasReactImport) {
      throw new Error(`preview block specifies preact runtime but imports from "${firstReactSource}"`);
    }
    for (const src of allSources) {
      if (src !== 'preact' && src !== 'preact/hooks') {
        throw new Error(`preview block can only import from "preact" and "preact/hooks", got "${src}"`);
      }
    }
    return 'preact';
  }

  if (hasReactImport) {
    for (const src of allSources) {
      if (src !== 'react' && src !== 'react-dom/client') {
        throw new Error(`preview block can only import from "react" and "react-dom/client", got "${src}"`);
      }
    }
    return 'react';
  }

  if (hasPreactImport) {
    for (const src of allSources) {
      if (src !== 'preact' && src !== 'preact/hooks') {
        throw new Error(`preview block can only import from "preact" and "preact/hooks", got "${src}"`);
      }
    }
    return 'preact';
  }

  for (const src of allSources) {
    if (src !== 'preact' && src !== 'preact/hooks') {
      throw new Error(`preview block can only import from "preact" and "preact/hooks", got "${src}"`);
    }
  }

  return 'preact';
}

export function assertRunFence(fence, fileName = 'lesson.md') {
  const fenceInfo = parseFenceInfo(fence.info);
  if (!fenceInfo) return null;
  if (!fence.closed) {
    fail(fileName, `unclosed ${fenceInfo.mode === 'preview' ? 'preview' : 'run'} code fence`);
  }
  if (fenceInfo.hasBoth) {
    fail(fileName, 'code fence cannot specify both "run" and "preview"');
  }
  if (fenceInfo.mode === 'run') {
    if (!SUPPORTED_RUN_LANGS.has(fenceInfo.lang)) {
      fail(fileName, `"run" is only supported for python, javascript, typescript, got "${fenceInfo.rawLang}"`);
    }
    const lines = fence.code.split('\n');
    if (fenceInfo.lang === 'python') {
      for (const line of lines) {
        if (/^\s*>>>/.test(line)) {
          fail(fileName, 'python run block cannot contain interactive interpreter prompt ">>>"');
        }
      }
    } else if (fenceInfo.lang === 'javascript' || fenceInfo.lang === 'typescript') {
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
          fail(fileName, `${fenceInfo.lang} run block cannot contain import or export statements`);
        }
      }
      if (fence.code.includes('require(')) {
        fail(fileName, `${fenceInfo.lang} run block cannot contain require()`);
      }
    }
    return {
      lang: fenceInfo.lang,
      code: fence.code,
      mode: 'run',
    };
  }
  if (fenceInfo.mode === 'preview') {
    if (fenceInfo.hasBothRuntimes) {
      fail(fileName, 'code fence cannot specify both "react" and "preact"');
    }
    if (!SUPPORTED_PREVIEW_LANGS.has(fenceInfo.lang)) {
      fail(fileName, `"preview" is only supported for html, jsx, tsx, got "${fenceInfo.rawLang}"`);
    }
    if (fenceInfo.lang === 'html') {
      const block = {
        lang: fenceInfo.lang,
        code: fence.code,
        mode: 'preview',
      };
      if (/(?:src|href)\s*=\s*['"]\s*https?:\/\//i.test(fence.code)) {
        block.warning = EXTERNAL_RESOURCE_WARNING;
      }
      return block;
    } else if (fenceInfo.lang === 'jsx' || fenceInfo.lang === 'tsx') {
      if (!/export\s+default\b/.test(fence.code)) {
        fail(fileName, `${fenceInfo.lang} preview block must contain "export default"`);
      }
      if (fence.code.includes('require(')) {
        fail(fileName, `${fenceInfo.lang} preview block cannot contain require()`);
      }
      if (/\bimport\s*\(/.test(fence.code)) {
        fail(fileName, `${fenceInfo.lang} preview block cannot contain dynamic import()`);
      }
      let runtime;
      try {
        runtime = resolvePreviewRuntime(fenceInfo.explicitRuntime, fence.code);
      } catch (err) {
        fail(fileName, `${fenceInfo.lang} ${err.message}`);
      }
      return {
        lang: fenceInfo.lang,
        code: fence.code,
        mode: 'preview',
        runtime,
      };
    }
  }
  return null;
}

export function collectRunBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const fenceInfo = parseFenceInfo(fence.info);
    if (!fenceInfo) continue;
    if (!fence.closed) {
      fail(fileName, `unclosed ${fenceInfo.mode === 'preview' ? 'preview' : 'run'} code fence`);
    }
    if (fenceInfo.hasBoth) {
      fail(fileName, 'code fence cannot specify both "run" and "preview"');
    }
    if (fenceInfo.hasBothRuntimes) {
      fail(fileName, 'code fence cannot specify both "react" and "preact"');
    }
    let runtime;
    if (fenceInfo.mode === 'preview' && (fenceInfo.lang === 'jsx' || fenceInfo.lang === 'tsx')) {
      runtime = resolvePreviewRuntime(fenceInfo.explicitRuntime, fence.code);
    }
    blocks.push({
      lang: fenceInfo.lang,
      code: fence.code,
      mode: fenceInfo.mode,
      ...(runtime ? { runtime } : {}),
    });
  }
  return blocks;
}

export function assertRunBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const block = assertRunFence(fence, fileName);
    if (block) blocks.push(block);
  }
  return blocks;
}

export function assertLessonCodeBlocks(markdown, fileName = 'lesson.md') {
  for (const fence of scanCodeFences(markdown)) {
    if (/^predict(?:\s|$)/.test(fence.info)) {
      assertPredictFence(fence, fileName);
    } else if (/(?:^|\s)(?:run|preview)(?:\s|$)/.test(fence.info)) {
      assertRunFence(fence, fileName);
    } else if (/^numberline(?:\s|$)/.test(fence.info)) {
      assertNumberlineFence(fence, fileName);
    }
  }
}

const PREVIEW_INJECTED_SCRIPT = `
(function() {
  function formatArg(arg) {
    if (typeof arg === 'string') return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  function sendConsole(level, args) {
    var text = Array.from(args).map(formatArg).join(' ');
    parent.postMessage({ type: 'preview-console', level: level, text: text }, '*');
  }
  var origLog = console.log;
  var origInfo = console.info;
  var origWarn = console.warn;
  var origError = console.error;
  console.log = function() { origLog && origLog.apply(console, arguments); sendConsole('log', arguments); };
  console.info = function() { origInfo && origInfo.apply(console, arguments); sendConsole('info', arguments); };
  console.warn = function() { origWarn && origWarn.apply(console, arguments); sendConsole('warn', arguments); };
  console.error = function() { origError && origError.apply(console, arguments); sendConsole('error', arguments); };

  window.onerror = function(message, source, lineno, colno, error) {
    var text = (error && error.message) ? error.message : String(message);
    parent.postMessage({ type: 'preview-error', text: '运行时错误：' + text }, '*');
  };

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var text = (reason && reason.message) ? reason.message : String(reason);
    parent.postMessage({ type: 'preview-error', text: '未处理的 Promise 拒绝：' + text }, '*');
  });

  function reportMetrics() {
    if (!document.body) return;
    var height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    var rawText = document.body.innerText || '';
    var innerText = rawText.slice(0, 500);
    parent.postMessage({ type: 'preview-metrics', height: height, innerText: innerText }, '*');
  }

  function setupObserver() {
    if (document.body) {
      reportMetrics();
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(reportMetrics).observe(document.body);
      }
    } else {
      document.addEventListener('DOMContentLoaded', setupObserver);
    }
  }
  setupObserver();
  window.addEventListener('load', reportMetrics);
})();
`.trim();

const PREVIEW_RUNTIMES = {
  react: {
    setup: `var __islandReactLib = (typeof window !== "undefined" && window.__islandReact) ? window.__islandReact : {};
        var __islandReact = __islandReactLib.React || (typeof window !== "undefined" ? window.React : null);
        var __islandReactDOMClient = __islandReactLib.ReactDOMClient || (typeof window !== "undefined" ? window.ReactDOMClient : null);
        if (typeof window !== "undefined" && __islandReact) {
          window.React = __islandReact;
        }
        var __islandExports = {};
        function __islandRequire(name) {
          if (name === "react") return __islandReact;
          if (name === "react-dom/client") return __islandReactDOMClient;
          throw new Error('Cannot find module "' + name + '"');
        }`,
    render: `if (__islandReactDOMClient && __islandReactDOMClient.createRoot && __islandReact) {
          var __islandRootInstance = __islandReactDOMClient.createRoot(__islandRoot);
          __islandRootInstance.render(__islandReact.createElement(__islandApp));
        } else {
          throw new Error('React 运行库未加载');
        }`,
  },
  preact: {
    setup: `if (typeof window !== "undefined") {
          window.h = window.preact ? window.preact.h : null;
          window.Fragment = window.preact ? window.preact.Fragment : null;
        }
        var __islandExports = {};
        function __islandRequire(name) {
          if (name === "preact") return window.preact;
          if (name === "preact/hooks") return window.preactHooks;
          throw new Error('Cannot find module "' + name + '"');
        }`,
    render: `if (window.preact && window.preact.render) {
          window.preact.render(window.preact.h(__islandApp), __islandRoot);
        } else {
          throw new Error('Preact 运行库未加载');
        }`,
  },
};

export function buildPreviewDocument({ lang, code, runtime, runtimeSources }) {
  const normalized = normalizeRunLang(lang);
  const injectedTag = `<script>${PREVIEW_INJECTED_SCRIPT}</script>`;

  if (normalized === 'html') {
    return `${injectedTag}\n${code || ''}`;
  }

  const isReact = runtime === 'react' || Boolean(runtimeSources && !Array.isArray(runtimeSources) && runtimeSources.react);

  let runtimeScripts = '';
  if (runtimeSources) {
    if (Array.isArray(runtimeSources)) {
      runtimeScripts = runtimeSources.map((s) => `<script>${s}</script>`).join('\n');
    } else if (typeof runtimeSources === 'object') {
      const parts = [];
      if (runtimeSources.react) parts.push(`<script>${runtimeSources.react}</script>`);
      if (runtimeSources.preact) parts.push(`<script>${runtimeSources.preact}</script>`);
      if (runtimeSources.hooks) parts.push(`<script>${runtimeSources.hooks}</script>`);
      if (runtimeSources.preactHooks && !runtimeSources.hooks) {
        parts.push(`<script>${runtimeSources.preactHooks}</script>`);
      }
      runtimeScripts = parts.join('\n');
    }
  }

  const safeCode = (code || '').replace(/<\/script/gi, '<\\/script');
  const runtimeConfig = PREVIEW_RUNTIMES[isReact ? 'react' : 'preact'];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      box-sizing: border-box;
    }
  </style>
  ${injectedTag}
  ${runtimeScripts}
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      try {
        ${runtimeConfig.setup}
        (function(exports, require) {
          ${safeCode}
        })(__islandExports, __islandRequire);
        var __islandApp = __islandExports.default;
        if (!__islandApp) {
          throw new Error('组件必须通过 "export default" 导出');
        }
        var __islandRoot = document.getElementById('root');
        ${runtimeConfig.render}
      } catch (err) {
        var msg = (err && err.message) ? err.message : String(err);
        console.error(msg);
      }
    })();
  </script>
</body>
</html>`;
}
