import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Import workers directly from school-kit/island/
const jsWorkerUrl = pathToFileURL(resolve(root, 'school-kit/island/js-worker.js')).href;
const pyWorkerUrl = pathToFileURL(resolve(root, 'school-kit/island/pyodide-worker.js')).href;
const { runJsCode } = await import(jsWorkerUrl);
const { PYTHON_BOOTSTRAP, runPythonSnippet } = await import(pyWorkerUrl);

// Import transform options directly from school-kit/overlay/src/lib/run-block.mjs
const runBlockUrl = pathToFileURL(resolve(root, 'school-kit/overlay/src/lib/run-block.mjs')).href;
const { previewTransformOptions, tsRunTransformOptions } = await import(runBlockUrl);

// Minimal Preact stub renderer
function renderPreactStub(vnode, depth = 0) {
  if (depth > 50 || vnode === null || vnode === undefined || typeof vnode === 'boolean') return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode);
  if (Array.isArray(vnode)) {
    return vnode.map((item) => renderPreactStub(item, depth + 1)).join('');
  }
  if (typeof vnode === 'object' && vnode.type) {
    const { type, props } = vnode;
    if (typeof type === 'string') {
      const children = props && props.children ? [props.children].flat(Infinity) : [];
      return '<' + type + '>' + children.map((c) => renderPreactStub(c, depth + 1)).join('') + '</' + type + '>';
    }
    if (typeof type === 'function') {
      return renderPreactStub(type(props || {}), depth + 1);
    }
    if (typeof type === 'symbol') {
      const children = props && props.children ? [props.children].flat(Infinity) : [];
      return children.map((c) => renderPreactStub(c, depth + 1)).join('');
    }
  }
  return '';
}

async function main() {
  const inputStr = readFileSync(0, 'utf8');
  let data;
  try {
    data = JSON.parse(inputStr);
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: '输入 JSON 无效: ' + err.message, blocks: [] }));
    return;
  }

  const { schoolDir, blockTimeoutMs = 10000, blocks = [] } = data;
  const schoolName = basename(schoolDir);

  let req;
  try {
    req = createRequire(resolve(schoolDir, 'package.json'));
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        ok: false,
        error: `该 School 缺少依赖，请在 schools/${schoolName} 执行 npm ci 或重新 apply kit`,
        blocks: [],
      })
    );
    return;
  }

  // Check dependencies based on required features
  const hasPython = blocks.some((b) => b.mode === 'run' && b.lang === 'python');
  const hasSucrase = blocks.some(
    (b) => (b.mode === 'run' && b.lang === 'typescript') || (b.mode === 'preview' && (b.lang === 'jsx' || b.lang === 'tsx'))
  );
  const hasReact = blocks.some((b) => b.mode === 'preview' && b.runtime === 'react');

  if (hasPython) {
    try {
      req.resolve('pyodide');
    } catch {
      process.stdout.write(
        JSON.stringify({
          ok: false,
          error: `该 School 缺少依赖 pyodide，请在 schools/${schoolName} 执行 npm ci 或重新 apply kit`,
          blocks: [],
        })
      );
      return;
    }
  }

  if (hasSucrase) {
    try {
      req.resolve('sucrase');
    } catch {
      process.stdout.write(
        JSON.stringify({
          ok: false,
          error: `该 School 缺少依赖 sucrase，请在 schools/${schoolName} 执行 npm ci 或重新 apply kit`,
          blocks: [],
        })
      );
      return;
    }
  }

  if (hasReact) {
    for (const dep of ['react', 'react-dom']) {
      try {
        req.resolve(dep);
      } catch {
        process.stdout.write(
          JSON.stringify({
            ok: false,
            error: `该 School 缺少依赖 ${dep}，请在 schools/${schoolName} 执行 npm ci 或重新 apply kit`,
            blocks: [],
          })
        );
        return;
      }
    }
  }

  // Load Pyodide only if python is present
  let pyodide = null;
  if (hasPython) {
    const pyPkg = req.resolve('pyodide/package.json');
    const pyMjs = resolve(dirname(pyPkg), 'pyodide.mjs');
    const { loadPyodide } = await import(pathToFileURL(pyMjs).href);
    pyodide = await loadPyodide();
    pyodide.runPython(PYTHON_BOOTSTRAP);
  }

  // Load sucrase if needed
  let sucraseTransform = null;
  if (hasSucrase) {
    sucraseTransform = req('sucrase').transform;
  }

  const results = [];

  for (const block of blocks) {
    process.stderr.write(`BLOCK ${block.index} START\n`);
    const t0 = performance.now();

    const res = {
      index: block.index,
      line: block.line,
      lang: block.lang,
      mode: block.mode,
      runtime: block.runtime || null,
      ok: false,
      stdout: '',
      stderr: '',
      html: '',
      pageText: '',
      ms: 0,
      error: null,
    };

    try {
      if (block.mode === 'run') {
        if (block.lang === 'python') {
          const runRes = runPythonSnippet(pyodide, block.code, '');
          res.stdout = runRes.stdout || '';
          res.stderr = runRes.stderr || '';
          if (runRes.error) {
            if (runRes.error.includes('EOFError') || block.code.includes('input(')) {
              res.error = '块需要输入：' + runRes.error;
            } else {
              res.error = runRes.error;
            }
          } else if (!res.stdout || res.stdout.trim().length === 0) {
            res.error = '运行块没有输出，学习者看不到结果';
          } else {
            res.ok = true;
          }
        } else if (block.lang === 'javascript' || block.lang === 'typescript') {
          let codeToRun = block.code;
          if (block.lang === 'typescript') {
            const transformed = sucraseTransform(block.code, tsRunTransformOptions);
            codeToRun = transformed.code;
          }
          const runRes = await runJsCode(codeToRun, { vm, timeout: blockTimeoutMs });
          res.stdout = runRes.stdout || '';
          res.stderr = runRes.stderr || '';
          if (runRes.error) {
            res.error = runRes.error;
          } else if (!res.stdout || res.stdout.trim().length === 0) {
            res.error = '运行块没有输出，学习者看不到结果';
          } else {
            res.ok = true;
          }
        }
      } else if (block.mode === 'preview') {
        if (block.lang === 'html') {
          res.ok = true;
          res.html = block.code;
        } else if (block.runtime === 'react') {
          const React = req('react');
          const ReactDOMServer = req('react-dom/server');
          let ReactDOMClient = null;
          try {
            ReactDOMClient = req('react-dom/client');
          } catch {}

          const transformed = sucraseTransform(
            block.code,
            previewTransformOptions(block.lang, 'react')
          );

          const context = vm.createContext({
            require: (name) => {
              if (name === 'react') return React;
              if (name === 'react-dom/client') return ReactDOMClient;
              if (name === 'react-dom/server') return ReactDOMServer;
              throw new Error(`Cannot find module '${name}'`);
            },
            exports: {},
            console,
            React,
          });

          vm.runInContext(transformed.code, context, { timeout: blockTimeoutMs });
          const App = context.exports.default;
          if (!App || typeof App !== 'function') {
            throw new Error('组件必须通过 "export default" 导出函数组件');
          }
          res.html = ReactDOMServer.renderToString(React.createElement(App));
          res.ok = true;
        } else {
          // Preact
          const transformed = sucraseTransform(
            block.code,
            previewTransformOptions(block.lang, 'preact')
          );

          const preactStub = {
            h: (type, props, ...children) => {
              const flat = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false && c !== true);
              return { type, props: { ...(props || {}), children: flat }, children: flat };
            },
            Fragment: Symbol('Fragment'),
          };
          const preactHooksStub = {
            useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
            useEffect: () => {},
            useLayoutEffect: () => {},
            useRef: (initial) => ({ current: initial }),
            useMemo: (factory) => factory(),
            useCallback: (cb) => cb,
            useContext: (ctx) => ctx?._defaultValue,
            useReducer: (reducer, initialArg, init) => [init ? init(initialArg) : initialArg, () => {}],
            useId: () => 'stub-id',
            useImperativeHandle: () => {},
          };

          const context = vm.createContext({
            require: (name) => {
              if (name === 'preact') return preactStub;
              if (name === 'preact/hooks') return preactHooksStub;
              throw new Error(`Cannot find module '${name}'`);
            },
            exports: {},
            console,
            h: preactStub.h,
            Fragment: preactStub.Fragment,
          });

          vm.runInContext(transformed.code, context, { timeout: blockTimeoutMs });
          const App = context.exports.default;
          if (!App || typeof App !== 'function') {
            throw new Error('组件必须通过 "export default" 导出函数组件');
          }
          const vnode = App({});
          res.html = renderPreactStub(vnode);
          res.ok = true;
        }
      }
    } catch (err) {
      res.ok = false;
      res.error = (err && err.stack) ? err.stack : (err && err.message ? `${err.name}: ${err.message}` : String(err));
    }

    res.ms = Math.round(performance.now() - t0);
    results.push(res);
    process.stderr.write(`BLOCK ${block.index} RESULT ${JSON.stringify(res)}\n`);
  }

  process.stdout.write(JSON.stringify({ ok: results.every((r) => r.ok), blocks: results }));
}

await main();
