import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import {
  normalizeRunLang,
  isRunnableLang,
  collectRunBlocks,
  assertRunBlocks,
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
    assert.deepEqual(collected[0], { lang: 'javascript', code: jsCode });
    assert.deepEqual(collected[1], { lang: 'typescript', code: tsCode });

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

  it('executes pilot lesson js/ts run blocks with vm in Node', async () => {
    const astroDir = resolve(root, 'schools/astro-zero-to-one');
    const sucrasePath = resolve(astroDir, 'node_modules/sucrase/dist/index.js');
    const { transform } = await import(pathToFileURL(sucrasePath).href);
    const vm = await import('node:vm');

    // 1. Lesson 04 (js run)
    const lesson04Path = resolve(astroDir, 'src/content/lessons/04-astro-components-and-syntax.md');
    const lesson04Content = readFileSync(lesson04Path, 'utf8');
    const jsBlocks = assertRunBlocks(lesson04Content, '04-astro-components-and-syntax.md');
    assert.equal(jsBlocks.length, 1, 'Lesson 04 must have exactly 1 run block');
    assert.equal(jsBlocks[0].lang, 'javascript');

    let jsOutput = '';
    const jsContext = vm.createContext({
      console: {
        log: (...args) => {
          jsOutput += args.join(' ') + '\n';
        },
      },
    });
    vm.runInContext(jsBlocks[0].code, jsContext);
    console.log('[JS Pilot Test] Lesson 04 Output:\n' + jsOutput.trim());
    assert.ok(jsOutput.includes('<li>HTML</li>'), 'Output should contain HTML list items');

    // 2. Lesson 09 (ts run)
    const lesson09Path = resolve(astroDir, 'src/content/lessons/09-dynamic-routes-and-astro-api.md');
    const lesson09Content = readFileSync(lesson09Path, 'utf8');
    const tsBlocks = assertRunBlocks(lesson09Content, '09-dynamic-routes-and-astro-api.md');
    assert.equal(tsBlocks.length, 1, 'Lesson 09 must have exactly 1 run block');
    assert.equal(tsBlocks[0].lang, 'typescript');

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
