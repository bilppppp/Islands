import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import {
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

  it('rejects run on non-python language', () => {
    const doc = lesson(`\`\`\`javascript run\nconsole.log(1)\n\`\`\``);
    const collected = collectRunBlocks(doc, 'test.md');
    assert.equal(collected.length, 1);
    assert.equal(collected[0].lang, 'javascript');

    assert.throws(
      () => assertRunBlocks(doc, 'invalid-lang.md'),
      /Run block in invalid-lang\.md: "run" is only supported for python, got "javascript"/,
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
