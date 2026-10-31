import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import {
  normalizeRunLang,
  isRunnableLang,
  isPreviewLang,
  collectRunBlocks,
  assertRunBlocks,
  buildPreviewDocument,
} from '../school-kit/overlay/src/lib/run-block.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function lesson(body) {
  return `---\ntitle: Example\norder: 1\n---\n\n${body}\n`;
}

describe('python run blocks', () => {
  it('collects and asserts normal python run blocks', () => {
    const code = `names = ["Ada", "Grace", "Linus"]\nfor name in names:\n    print(name.upper())`;
    const doc = lesson(`\`\`\`python run\n${code}\n\`\`\``);

    const collected = collectRunBlocks(doc, 'test.md');
    assert.equal(collected.length, 1);
    assert.deepEqual(collected[0], {
      lang: 'python',
      code,
      mode: 'run',
    });

    const asserted = assertRunBlocks(doc, 'test.md');
    assert.equal(asserted.length, 1);
    assert.equal(asserted[0].lang, 'python');
  });

  it('collects and asserts normal javascript and typescript run blocks', () => {
    const jsCode = `const nums = [1, 2, 3];\nconsole.log(nums.map(n => n * 2));`;
    const tsCode = `const greeting: string = "hello";\nconsole.log(greeting.toUpperCase());`;
    const doc = lesson(`\`\`\`javascript run\n${jsCode}\n\`\`\`\n\n\`\`\`typescript run\n${tsCode}\n\`\`\``);

    const collected = collectRunBlocks(doc, 'test.md');
    assert.equal(collected.length, 2);
    assert.deepEqual(collected[0], { lang: 'javascript', code: jsCode, mode: 'run' });
    assert.deepEqual(collected[1], { lang: 'typescript', code: tsCode, mode: 'run' });

    const asserted = assertRunBlocks(doc, 'test.md');
    assert.equal(asserted.length, 2);
    assert.equal(asserted[0].lang, 'javascript');
    assert.equal(asserted[1].lang, 'typescript');
  });

  it('normalizes aliases js and ts to javascript and typescript', () => {
    assert.equal(normalizeRunLang('js'), 'javascript');
    assert.equal(normalizeRunLang('ts'), 'typescript');
    assert.equal(normalizeRunLang('python'), 'python');
    assert.equal(normalizeRunLang('javascript'), 'javascript');
    assert.equal(normalizeRunLang('typescript'), 'typescript');
    assert.equal(isRunnableLang('python'), true);
    assert.equal(isRunnableLang('javascript'), true);
    assert.equal(isRunnableLang('typescript'), true);
    assert.equal(isRunnableLang('js'), true);
    assert.equal(isRunnableLang('ts'), true);
    assert.equal(isRunnableLang('ruby'), false);
    assert.equal(isRunnableLang(''), false);
    assert.equal(isPreviewLang('html'), true);
    assert.equal(isPreviewLang('jsx'), true);
    assert.equal(isPreviewLang('tsx'), true);
    assert.equal(isPreviewLang('python'), false);
    assert.equal(isPreviewLang('javascript'), false);
    assert.equal(isPreviewLang('ruby'), false);

    const jsDoc = lesson(`\`\`\`js run\nconsole.log("js alias");\n\`\`\``);
    const tsDoc = lesson(`\`\`\`ts run\nconst n: number = 42;\nconsole.log(n);\n\`\`\``);

    const jsCollected = collectRunBlocks(jsDoc, 'alias-js.md');
    assert.equal(jsCollected.length, 1);
    assert.equal(jsCollected[0].lang, 'javascript');
    const jsAsserted = assertRunBlocks(jsDoc, 'alias-js.md');
    assert.equal(jsAsserted[0].lang, 'javascript');

    const tsCollected = collectRunBlocks(tsDoc, 'alias-ts.md');
    assert.equal(tsCollected.length, 1);
    assert.equal(tsCollected[0].lang, 'typescript');
    const tsAsserted = assertRunBlocks(tsDoc, 'alias-ts.md');
    assert.equal(tsAsserted[0].lang, 'typescript');
  });

  it('rejects javascript and typescript run blocks containing import, export, or require', () => {
    const importDoc = lesson(`\`\`\`js run\nimport React from "react";\nconsole.log(React);\n\`\`\``);
    assert.throws(
      () => assertRunBlocks(importDoc, 'import-test.md'),
      /Run block in import-test\.md: javascript run block cannot contain import or export statements/,
    );

    const exportDoc = lesson(`\`\`\`typescript run\nexport const answer = 42;\n\`\`\``);
    assert.throws(
      () => assertRunBlocks(exportDoc, 'export-test.md'),
      /Run block in export-test\.md: typescript run block cannot contain import or export statements/,
    );

    const requireDoc = lesson(`\`\`\`js run\nconst fs = require("node:fs");\n\`\`\``);
    assert.throws(
      () => assertRunBlocks(requireDoc, 'require-test.md'),
      /Run block in require-test\.md: javascript run block cannot contain require\(\)/,
    );
  });

  it('rejects run on unsupported languages', () => {
    const doc = lesson(`\`\`\`ruby run\nputs 1\n\`\`\``);
    const collected = collectRunBlocks(doc, 'test.md');
    assert.equal(collected.length, 1);
    assert.equal(collected[0].lang, 'ruby');

    assert.throws(
      () => assertRunBlocks(doc, 'invalid-lang.md'),
      /Run block in invalid-lang\.md: "run" is only supported for python, javascript, typescript, got "ruby"/,
    );
  });

  it('rejects python run block containing interactive >>> prompts', () => {
    const doc = lesson(`\`\`\`python run\n>>> width = 20\n>>> width * 2\n\`\`\``);
    assert.throws(
      () => assertRunBlocks(doc, 'with-prompt.md'),
      /Run block in with-prompt\.md: python run block cannot contain interactive interpreter prompt ">>>"/,
    );
  });

  it('ignores nested code fences inside outer fences', () => {
    const text = lesson(`
\`\`\`\`markdown
这是一个示例课文：
\`\`\`python run
print("nested")
\`\`\`
\`\`\`\`
`);
    assert.deepEqual(collectRunBlocks(text), []);
    assert.deepEqual(assertRunBlocks(text), []);
  });

  it('does not collect ordinary code blocks without run', () => {
    const text = lesson(`
\`\`\`python
width = 20
\`\`\`

\`\`\`javascript
const a = 1;
\`\`\`

\`\`\`bash
npm run build
\`\`\`
`);
    assert.deepEqual(collectRunBlocks(text), []);
    assert.deepEqual(assertRunBlocks(text), []);
  });

  it('executes pilot lesson python run blocks with pyodide in Node', async () => {
    const lessonPath = resolve(root, 'schools/python-official/src/content/lessons/02-numbers-and-strings.md');
    const content = readFileSync(lessonPath, 'utf8');
    const blocks = assertRunBlocks(content, '02-numbers-and-strings.md');
    assert.equal(blocks.length, 2, 'Pilot lesson must have exactly 2 python run blocks');

    const pyodideMjs = resolve(root, 'schools/python-official/node_modules/pyodide/pyodide.mjs');
    const { loadPyodide } = await import(pathToFileURL(pyodideMjs).href);
    const pyodide = await loadPyodide();

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      let output = '';
      pyodide.setStdout({
        batched: (str) => {
          output += str + '\n';
        },
      });
      pyodide.runPython(block.code);
      console.log(`[Pyodide Test] Pilot Block ${i + 1} Output:\n${output.trim()}`);
      assert.ok(output.trim().length > 0, `Block ${i + 1} should produce output`);
    }
  });

  it('executes pilot lesson ts run block with vm in Node', async () => {
    const astroDir = resolve(root, 'schools/astro-zero-to-one');
    const sucrasePath = resolve(astroDir, 'node_modules/sucrase/dist/index.js');
    const { transform } = await import(pathToFileURL(sucrasePath).href);
    const vm = await import('node:vm');

    // Lesson 09 (ts run)
    const lesson09Path = resolve(astroDir, 'src/content/lessons/09-dynamic-routes-and-astro-api.md');
    const lesson09Content = readFileSync(lesson09Path, 'utf8');
    const tsBlocks = assertRunBlocks(lesson09Content, '09-dynamic-routes-and-astro-api.md');
    assert.equal(tsBlocks.length, 1, 'Lesson 09 must have exactly 1 run block');
    assert.equal(tsBlocks[0].lang, 'typescript');
    assert.equal(tsBlocks[0].mode, 'run');

    const transformed = transform(tsBlocks[0].code, { transforms: ['typescript'] });
    let tsOutput = '';
    const tsContext = vm.createContext({
      console: {
        log: (...args) => {
          tsOutput += args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ') + '\n';
        },
      },
      Set,
      Array,
    });
    vm.runInContext(transformed.code, tsContext);
    console.log('[TS Pilot Test] Lesson 09 Output:\n' + tsOutput.trim());
    assert.ok(tsOutput.includes('"tag": "astro"'), 'Output should contain astro tag');
  });

  it('validates pilot lesson html and jsx preview blocks', async () => {
    const astroDir = resolve(root, 'schools/astro-zero-to-one');

    // Lesson 04 (html preview)
    const lesson04Path = resolve(astroDir, 'src/content/lessons/04-astro-components-and-syntax.md');
    const lesson04Content = readFileSync(lesson04Path, 'utf8');
    const htmlBlocks = assertRunBlocks(lesson04Content, '04-astro-components-and-syntax.md');
    assert.equal(htmlBlocks.length, 1, 'Lesson 04 must have exactly 1 preview block');
    assert.equal(htmlBlocks[0].lang, 'html');
    assert.equal(htmlBlocks[0].mode, 'preview');
    assert.ok(htmlBlocks[0].code.includes('<li>HTML</li>'), 'Lesson 04 html preview should contain list items');

    // Lesson 10 (jsx preview)
    const lesson10Path = resolve(astroDir, 'src/content/lessons/10-islands-and-client-directives.md');
    const lesson10Content = readFileSync(lesson10Path, 'utf8');
    const jsxBlocks = assertRunBlocks(lesson10Content, '10-islands-and-client-directives.md');
    const previewBlocks = jsxBlocks.filter((b) => b.mode === 'preview');
    assert.equal(previewBlocks.length, 1, 'Lesson 10 must have exactly 1 preview block');
    assert.equal(previewBlocks[0].lang, 'jsx');
    assert.equal(previewBlocks[0].mode, 'preview');
    assert.ok(previewBlocks[0].code.includes('export default function App'), 'Lesson 10 jsx preview should export default App');
  });

  it('executes lesson 10 jsx preview block with sucrase and vm in Node', async () => {
    const astroDir = resolve(root, 'schools/astro-zero-to-one');
    const sucrasePath = resolve(astroDir, 'node_modules/sucrase/dist/index.js');
    const { transform } = await import(pathToFileURL(sucrasePath).href);
    const vm = await import('node:vm');
    const { createRequire } = await import('node:module');
    const req = createRequire(resolve(astroDir, 'package.json'));
    const preact = req('preact');
    const preactHooks = req('preact/hooks');

    const lesson10Path = resolve(astroDir, 'src/content/lessons/10-islands-and-client-directives.md');
    const lesson10Content = readFileSync(lesson10Path, 'utf8');
    const blocks = assertRunBlocks(lesson10Content, '10-islands-and-client-directives.md');
    const previewBlocks = blocks.filter((b) => b.mode === 'preview');
    assert.equal(previewBlocks.length, 1, 'Lesson 10 must have exactly 1 preview block');
    assert.equal(previewBlocks[0].lang, 'jsx');

    const transformed = transform(previewBlocks[0].code, {
      transforms: ['jsx', 'imports'],
      jsxPragma: 'h',
      jsxFragmentPragma: 'Fragment',
    });

    const context = vm.createContext({
      require: (name) => {
        if (name === 'preact') return preact;
        if (name === 'preact/hooks') return preactHooks;
        throw new Error(`Cannot find module '${name}'`);
      },
      exports: {},
      console,
      h: preact.h,
      Fragment: preact.Fragment,
    });
    vm.runInContext(transformed.code, context);
    console.log('[JSX Pilot Test] Lesson 10 App exported:', typeof context.exports.default);
    assert.equal(typeof context.exports.default, 'function', 'exports.default must be a component function');
  });

  it('executes complete preview document for lesson 10 jsx preview block', async () => {
    const astroDir = resolve(root, 'schools/astro-zero-to-one');
    const sucrasePath = resolve(astroDir, 'node_modules/sucrase/dist/index.js');
    const { transform } = await import(pathToFileURL(sucrasePath).href);
    const vm = await import('node:vm');

    const lesson10Path = resolve(astroDir, 'src/content/lessons/10-islands-and-client-directives.md');
    const lesson10Content = readFileSync(lesson10Path, 'utf8');
    const blocks = assertRunBlocks(lesson10Content, '10-islands-and-client-directives.md');
    const previewBlocks = blocks.filter((b) => b.mode === 'preview');
    assert.equal(previewBlocks.length, 1, 'Lesson 10 must have exactly 1 preview block');

    const transformed = transform(previewBlocks[0].code, {
      transforms: ['jsx', 'imports'],
      jsxPragma: 'h',
      jsxFragmentPragma: 'Fragment',
    });

    const doc = buildPreviewDocument({
      lang: 'jsx',
      code: transformed.code,
      runtimeSources: {},
    });

    const scriptMatches = [...doc.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
    assert.ok(scriptMatches.length > 0, 'Document must contain script tags');
    const lastScript = scriptMatches[scriptMatches.length - 1][1];

    const renderCalls = [];
    const consoleErrors = [];

    const windowStub = {
      preact: {
        h: (type, props, ...children) => ({ type, props, children }),
        render: (...args) => {
          renderCalls.push(args);
        },
        Fragment: 'FragmentPlaceholder',
      },
      preactHooks: {
        useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
      },
    };
    windowStub.window = windowStub;

    const documentStub = {
      getElementById: (id) => ({ id }),
    };

    const consoleStub = {
      ...console,
      error: (...args) => {
        consoleErrors.push(args);
      },
    };

    windowStub.document = documentStub;
    windowStub.console = consoleStub;

    const context = vm.createContext({
      window: windowStub,
      document: documentStub,
      console: consoleStub,
    });

    vm.runInContext(lastScript, context);

    assert.equal(renderCalls.length, 1, 'window.preact.render should be called once');
    assert.equal(consoleErrors.length, 0, `console.error should not be called: ${JSON.stringify(consoleErrors)}`);
  });

  it('highlights code with island shiki theme matching palette', async () => {
    const themePath = resolve(root, 'school-kit/island/island-theme.json');
    const theme = JSON.parse(readFileSync(themePath, 'utf8'));
    const shikiMjs = resolve(root, 'schools/python-official/node_modules/shiki/dist/index.mjs');
    const { codeToTokensBase, codeToHtml } = await import(pathToFileURL(shikiMjs).href);

    const pyCode = 'print("向下取整", 17 // 3)  # 注释';
    const pyTokens = await codeToTokensBase(pyCode, { lang: 'python', theme });
    let slashSlashColor = null;
    let commentColor = null;
    for (const line of pyTokens) {
      for (const t of line) {
        if (t.content.includes('//')) {
          slashSlashColor = t.color?.toLowerCase();
        }
        if (t.content.includes('# 注释')) {
          commentColor = t.color?.toLowerCase();
        }
      }
    }
    assert.notEqual(slashSlashColor, '#6b5e50', '// token color must NOT be comment color #6b5e50');
    assert.equal(commentColor, '#6b5e50', '# 注释 token color must BE comment color #6b5e50');

    const jsxCode = 'const [n, setN] = useState(0); return <button onClick={f}>{n}</button>;';
    const jsxHtml = await codeToHtml(jsxCode, { lang: 'jsx', theme });
    console.log('[Shiki JSX Test Output]:\n' + jsxHtml);
    assert.ok(jsxHtml.includes('background-color:#2b2118'), 'background must be #2b2118');
    assert.ok(jsxHtml.includes('color:#E06C75') || jsxHtml.includes('color:#e06c75'), 'tag button must be #e06c75');
    assert.ok(jsxHtml.includes('color:#D4A0E0') || jsxHtml.includes('color:#d4a0e0'), 'keyword must be #d4a0e0');
    assert.ok(jsxHtml.includes('color:#E8C87A') || jsxHtml.includes('color:#e8c87a'), 'prop must be #e8c87a');
  });
});

describe('preview blocks', () => {
  it('collects preview blocks normally with mode: "preview"', () => {
    const htmlCode = '<h1>Hello</h1>';
    const jsxCode = 'import { useState } from "preact/hooks";\nexport default function App() { return <div>App</div>; }';
    const doc = lesson(`\`\`\`html preview\n${htmlCode}\n\`\`\`\n\n\`\`\`jsx preview\n${jsxCode}\n\`\`\``);

    const collected = collectRunBlocks(doc, 'preview.md');
    assert.equal(collected.length, 2);
    assert.deepEqual(collected[0], { lang: 'html', code: htmlCode, mode: 'preview' });
    assert.deepEqual(collected[1], { lang: 'jsx', code: jsxCode, mode: 'preview', runtime: 'preact' });

    const asserted = assertRunBlocks(doc, 'preview.md');
    assert.equal(asserted.length, 2);
    assert.equal(asserted[0].lang, 'html');
    assert.equal(asserted[0].mode, 'preview');
    assert.equal(asserted[1].lang, 'jsx');
    assert.equal(asserted[1].mode, 'preview');
    assert.equal(asserted[1].runtime, 'preact');
  });

  it('rejects unsupported language with preview', () => {
    const doc = lesson('```python preview\nprint("hello")\n```');
    assert.throws(
      () => assertRunBlocks(doc, 'invalid-preview-lang.md'),
      /Run block in invalid-preview-lang\.md: "preview" is only supported for html, jsx, tsx, got "python"/,
    );
  });

  it('rejects code fence with both run and preview', () => {
    const doc = lesson('```html run preview\n<h1>Hello</h1>\n```');
    assert.throws(
      () => assertRunBlocks(doc, 'both-modes.md'),
      /Run block in both-modes\.md: code fence cannot specify both "run" and "preview"/,
    );
    assert.throws(
      () => collectRunBlocks(doc, 'both-modes.md'),
      /Run block in both-modes\.md: code fence cannot specify both "run" and "preview"/,
    );
  });

  it('rejects jsx preview block without export default', () => {
    const doc = lesson('```jsx preview\nimport { useState } from "preact/hooks";\nfunction App() {}\n```');
    assert.throws(
      () => assertRunBlocks(doc, 'missing-export-default.md'),
      /Run block in missing-export-default\.md: jsx preview block must contain "export default"/,
    );
  });

  it('rejects jsx preview block with disallowed imports', () => {
    const reactDoc = lesson('```jsx preview preact\nimport React from "react";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(reactDoc, 'disallowed-import.md'),
      /Run block in disallowed-import\.md: jsx preview block specifies preact runtime but imports from "react"/,
    );

    const relativeDoc = lesson('```jsx preview\nimport { helper } from "./helper";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(relativeDoc, 'disallowed-relative.md'),
      /Run block in disallowed-relative\.md: jsx preview block can only import from "preact" and "preact\/hooks", got "\.\/helper"/,
    );
  });

  it('selects runtime: explicit, inferred by import, or default', () => {
    const explicitReact = lesson('```jsx preview react\nexport default function App() {}\n```');
    assert.equal(collectRunBlocks(explicitReact)[0].runtime, 'react');
    assert.equal(assertRunBlocks(explicitReact)[0].runtime, 'react');

    const explicitPreact = lesson('```jsx preview preact\nexport default function App() {}\n```');
    assert.equal(collectRunBlocks(explicitPreact)[0].runtime, 'preact');
    assert.equal(assertRunBlocks(explicitPreact)[0].runtime, 'preact');

    const importReact = lesson('```jsx preview\nimport { useState } from "react";\nexport default function App() {}\n```');
    assert.equal(collectRunBlocks(importReact)[0].runtime, 'react');
    assert.equal(assertRunBlocks(importReact)[0].runtime, 'react');

    const importReactDom = lesson('```jsx preview\nimport { createRoot } from "react-dom/client";\nexport default function App() {}\n```');
    assert.equal(collectRunBlocks(importReactDom)[0].runtime, 'react');
    assert.equal(assertRunBlocks(importReactDom)[0].runtime, 'react');

    const importPreact = lesson('```jsx preview\nimport { useState } from "preact/hooks";\nexport default function App() {}\n```');
    assert.equal(collectRunBlocks(importPreact)[0].runtime, 'preact');
    assert.equal(assertRunBlocks(importPreact)[0].runtime, 'preact');

    const defaultDoc = lesson('```jsx preview\nexport default function App() { return <div>Hi</div>; }\n```');
    assert.equal(collectRunBlocks(defaultDoc)[0].runtime, 'preact');
    assert.equal(assertRunBlocks(defaultDoc)[0].runtime, 'preact');
  });

  it('rejects runtime and import conflicts', () => {
    const conflictReactPreact = lesson('```jsx preview react\nimport { useState } from "preact/hooks";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(conflictReactPreact, 'conflict-react-preact.md'),
      /Run block in conflict-react-preact\.md: jsx preview block specifies react runtime but imports from "preact\/hooks"/,
    );

    const conflictPreactReact = lesson('```jsx preview preact\nimport { useState } from "react";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(conflictPreactReact, 'conflict-preact-react.md'),
      /Run block in conflict-preact-react\.md: jsx preview block specifies preact runtime but imports from "react"/,
    );

    const mixedImports = lesson('```jsx preview\nimport { useState } from "react";\nimport { useEffect } from "preact/hooks";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(mixedImports, 'mixed.md'),
      /Run block in mixed\.md: jsx preview block cannot import both React and Preact/,
    );

    const reactDisallowed = lesson('```jsx preview react\nimport { helper } from "./helper";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(reactDisallowed, 'react-disallowed.md'),
      /Run block in react-disallowed\.md: jsx preview block can only import from "react" and "react-dom\/client", got "\.\/helper"/,
    );

    const reactInferredDisallowed = lesson('```jsx preview\nimport { useState } from "react";\nimport lodash from "lodash";\nexport default function App() {}\n```');
    assert.throws(
      () => assertRunBlocks(reactInferredDisallowed, 'react-inferred-disallowed.md'),
      /Run block in react-inferred-disallowed\.md: jsx preview block can only import from "react" and "react-dom\/client", got "lodash"/,
    );
  });

  it('rejects html preview referencing external resources with http:// or https://', () => {
    const scriptDoc = lesson('```html preview\n<script src="https://example.com/lib.js"></script>\n```');
    assert.throws(
      () => assertRunBlocks(scriptDoc, 'external-script.md'),
      /Run block in external-script\.md: html preview block cannot reference external resources with http:\/\/ or https:\/\//,
    );

    const linkDoc = lesson('```html preview\n<link rel="stylesheet" href="http://example.com/style.css">\n```');
    assert.throws(
      () => assertRunBlocks(linkDoc, 'external-link.md'),
      /Run block in external-link\.md: html preview block cannot reference external resources with http:\/\/ or https:\/\//,
    );
  });

  it('buildPreviewDocument outputs injected script for html and jsx, and require mapping for jsx', () => {
    const htmlOut = buildPreviewDocument({
      lang: 'html',
      code: '<h1>Test HTML</h1>',
    });
    assert.ok(htmlOut.includes('preview-console'), 'HTML document must include injected console handler');
    assert.ok(htmlOut.includes('preview-metrics'), 'HTML document must include injected metrics handler');
    assert.ok(htmlOut.startsWith('<script>'), 'HTML document must put injected script at the very front');

    const jsxOut = buildPreviewDocument({
      lang: 'jsx',
      code: 'exports.default = function App() { return null; };',
      runtimeSources: {
        preact: 'window.preact = {};',
        hooks: 'window.preactHooks = {};',
      },
    });
    assert.ok(jsxOut.includes('preview-console'), 'JSX document must include injected console handler');
    assert.ok(jsxOut.includes('preview-metrics'), 'JSX document must include injected metrics handler');
    assert.ok(jsxOut.includes('if (name === "preact") return window.preact;'), 'JSX document must include require("preact") mapping');
    assert.ok(jsxOut.includes('if (name === "preact/hooks") return window.preactHooks;'), 'JSX document must include require("preact/hooks") mapping');
    assert.ok(jsxOut.includes('window.preact.render'), 'JSX document must call window.preact.render');
  });

  it('buildPreviewDocument outputs React branch with createRoot and require mappings', () => {
    const reactOut = buildPreviewDocument({
      lang: 'jsx',
      runtime: 'react',
      code: 'exports.default = function App() { return null; };',
      runtimeSources: {
        react: 'window.__islandReact = { React: {}, ReactDOMClient: {} };',
      },
    });
    assert.ok(reactOut.includes('preview-console'), 'React document must include injected console handler');
    assert.ok(reactOut.includes('preview-metrics'), 'React document must include injected metrics handler');
    assert.ok(reactOut.includes('if (name === "react") return __islandReact;'), 'React document must include require("react") mapping');
    assert.ok(reactOut.includes('if (name === "react-dom/client") return __islandReactDOMClient;'), 'React document must include require("react-dom/client") mapping');
    assert.ok(reactOut.includes('window.React = __islandReact;'), 'React document must set window.React');
    assert.ok(reactOut.includes('__islandReactDOMClient.createRoot'), 'React document must call createRoot');
    assert.ok(reactOut.includes('__islandRootInstance.render'), 'React document must call render');
  });

  it('renders pilot lesson react preview blocks with real React in Node', async () => {
    const reactSchoolDir = resolve(root, 'schools/react-official');
    const req = createRequire(resolve(reactSchoolDir, 'package.json'));
    const React = req('react');
    const ReactDOMServer = req('react-dom/server');
    const { transform } = req('sucrase');
    const vm = await import('node:vm');

    const lesson14Path = resolve(reactSchoolDir, 'src/content/lessons/14-state-a-components-memory.md');
    const lesson14Blocks = assertRunBlocks(readFileSync(lesson14Path, 'utf8'), '14-state-a-components-memory.md');
    const preview14 = lesson14Blocks.filter((b) => b.mode === 'preview');
    assert.equal(preview14.length, 1, 'Lesson 14 must have exactly 1 preview block');
    assert.equal(preview14[0].runtime, 'react');

    const lesson16Path = resolve(reactSchoolDir, 'src/content/lessons/16-state-as-a-snapshot.md');
    const lesson16Blocks = assertRunBlocks(readFileSync(lesson16Path, 'utf8'), '16-state-as-a-snapshot.md');
    const preview16 = lesson16Blocks.filter((b) => b.mode === 'preview');
    assert.equal(preview16.length, 1, 'Lesson 16 must have exactly 1 preview block');
    assert.equal(preview16[0].runtime, 'react');

    const pilots = [
      { name: 'Lesson 14 (Counter/Gallery)', block: preview14[0] },
      { name: 'Lesson 16 (State as snapshot)', block: preview16[0] },
    ];

    for (const pilot of pilots) {
      const transformed = transform(pilot.block.code, {
        transforms: ['jsx', 'imports'],
        jsxPragma: 'React.createElement',
        jsxFragmentPragma: 'React.Fragment',
      });
      const context = vm.createContext({
        require: (name) => {
          if (name === 'react') return React;
          if (name === 'react-dom/client') return req('react-dom/client');
          throw new Error(`Cannot find module '${name}'`);
        },
        exports: {},
        React,
      });
      vm.runInContext(transformed.code, context);
      assert.equal(typeof context.exports.default, 'function', `${pilot.name} must export a default component`);
      const html = ReactDOMServer.renderToString(React.createElement(context.exports.default));
      assert.ok(typeof html === 'string' && html.length > 0, `${pilot.name} renderToString must produce HTML`);
      console.log(`[React Pilot Render] ${pilot.name} HTML (first 200 chars):\n${html.slice(0, 200)}`);
    }
  });

  it('executes complete preview document for react preview block with stubs', async () => {
    const reactSchoolDir = resolve(root, 'schools/react-official');
    const req = createRequire(resolve(reactSchoolDir, 'package.json'));
    const { transform } = req('sucrase');
    const vm = await import('node:vm');

    const lesson14Path = resolve(reactSchoolDir, 'src/content/lessons/14-state-a-components-memory.md');
    const blocks = assertRunBlocks(readFileSync(lesson14Path, 'utf8'), '14-state-a-components-memory.md');
    const preview14 = blocks.find((b) => b.mode === 'preview');
    assert.ok(preview14, 'Lesson 14 must have preview block');

    const transformed = transform(preview14.code, {
      transforms: ['jsx', 'imports'],
      jsxPragma: 'React.createElement',
      jsxFragmentPragma: 'React.Fragment',
    });

    const doc = buildPreviewDocument({
      lang: 'jsx',
      code: transformed.code,
      runtime: 'react',
      runtimeSources: {},
    });

    const scriptMatches = [...doc.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
    assert.ok(scriptMatches.length > 0, 'Document must contain script tags');
    const lastScript = scriptMatches[scriptMatches.length - 1][1];

    const renderCalls = [];
    const consoleErrors = [];

    const ReactStub = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      Fragment: 'FragmentPlaceholder',
      useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    };
    const ReactDOMClientStub = {
      createRoot: (container) => ({
        render: (el) => {
          renderCalls.push({ container, el });
        },
      }),
    };

    const windowStub = {
      __islandReact: {
        React: ReactStub,
        ReactDOMClient: ReactDOMClientStub,
      },
    };
    windowStub.window = windowStub;

    const documentStub = {
      getElementById: (id) => ({ id }),
    };

    const consoleStub = {
      ...console,
      error: (...args) => {
        consoleErrors.push(args);
      },
    };

    windowStub.document = documentStub;
    windowStub.console = consoleStub;

    const context = vm.createContext({
      window: windowStub,
      document: documentStub,
      console: consoleStub,
    });

    vm.runInContext(lastScript, context);

    assert.equal(renderCalls.length, 1, 'ReactDOMClient.createRoot().render should be called once');
    assert.equal(consoleErrors.length, 0, `console.error should not be called: ${JSON.stringify(consoleErrors)}`);
  });
});

