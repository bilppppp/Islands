import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSourceCites,
  remarkSourceCite,
  sourceCiteHtml,
  sourceCiteProse,
} from '../school-kit/overlay/src/lib/source-cite.mjs';

const QUOTE = 'Claude Code works in any directory. Run it inside a notes vault.';
const MARKER = `{{cite 任何基于文本的项目 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | url: https://example.com/docs/notes | quote: ${QUOTE}}}`;

function lesson(body, sources = '  - material-1/pages/notes.md') {
  return `---\ntitle: Example\nsources:\n${sources}\n---\n\n${body}\n`;
}

function withSource(body) {
  const root = mkdtempSync(join(tmpdir(), 'source-cite-'));
  const sources = join(root, 'public/sources');
  mkdirSync(join(sources, 'material-1/pages'), { recursive: true });
  writeFileSync(
    join(sources, 'material-1/pages/notes.md'),
    '### \u200b(work-in-notes) Work in notes and non-code folders\n\nClaude Code works in any directory.\nRun it inside a notes vault.\n',
  );
  return { root, sources, text: lesson(body) };
}

describe('source citations', () => {
  it('accepts a quote that is in the saved file', () => {
    const { root, sources, text } = withSource(`在面对${MARKER}时，这套逻辑完全一致。`);
    try {
      const cites = assertSourceCites(text, 'ok.md', sources, ['material-1/pages/notes.md']);
      assert.equal(cites.length, 1);
      assert.equal(cites[0].phrase, '任何基于文本的项目');
      assert.equal(cites[0].quote, QUOTE);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a quote that is not in the saved file', () => {
    const { root, sources, text } = withSource(MARKER.replace(QUOTE, 'This sentence was never written in the source file.'));
    try {
      assert.throws(() => assertSourceCites(text, 'bad.md', sources, ['material-1/pages/notes.md']), /quote is not in/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a path that is not listed in frontmatter', () => {
    const { root, sources, text } = withSource(MARKER);
    try {
      assert.throws(() => assertSourceCites(text, 'bad.md', sources, []), /not listed in frontmatter sources/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ignores a marker inside a code fence', () => {
    const { root, sources, text } = withSource('```\n' + MARKER.replace(QUOTE, 'not a real quote at all!!!!') + '\n```\n\n正文没有引用。');
    try {
      assert.deepEqual(assertSourceCites(text, 'code.md', sources, ['material-1/pages/notes.md']), []);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects an incomplete marker', () => {
    assert.throws(() => assertSourceCites(lesson('{{cite 只有短语}}'), 'broken.md', '/tmp', []), /incomplete/);
  });

  it('turns the marker into the visible phrase for the teacher', () => {
    assert.equal(sourceCiteProse(`在面对${MARKER}时。`), '在面对任何基于文本的项目时。');
  });

  it('escapes the phrase and the quote in the button', () => {
    const html = sourceCiteHtml({
      phrase: 'a<b',
      path: 'material-1/a.md',
      heading: 'Title',
      url: 'https://example.com/a',
      quote: 'A "quoted" sentence that is long enough.',
    });
    assert.match(html, />a&lt;b</);
    assert.match(html, /data-quote="A &quot;quoted&quot; sentence that is long enough."/);
    assert.match(html, /class="source-cite"/);
  });

  it('renders a button and leaves fenced code untouched', () => {
    const { root, sources } = withSource(MARKER);
    const tree = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: `在面对${MARKER}时。` }] },
        { type: 'code', value: MARKER },
      ],
    };
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md' });
      assert.equal(tree.children[0].children[1].type, 'html');
      assert.match(tree.children[0].children[1].value, /任何基于文本的项目/);
      assert.equal(tree.children[1].value, MARKER);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
