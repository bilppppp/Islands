import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSourceCites,
  assertSourceCitesGfm,
  collectSourceCites,
  parseGfm,
  remarkSourceCite,
  sourceCiteHtml,
  sourceCiteProse,
} from '../school-kit/overlay/src/lib/source-cite.mjs';
import {
  assertRenderedLessons,
  clearAstroCache,
} from '../school-kit/overlay/src/lib/render-guard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultSchoolDir = process.env.ISLANDS_DEPS_SCHOOL || resolve(root, 'schools/astro-zero-to-one');

function checkGfmDeps(schoolDir = defaultSchoolDir) {
  try {
    const req = createRequire(resolve(schoolDir, 'package.json'));
    req.resolve('mdast-util-from-markdown');
    req.resolve('micromark-extension-gfm');
    req.resolve('mdast-util-gfm');
    return true;
  } catch {
    return false;
  }
}
const hasGfmDeps = checkGfmDeps();
const depsSkipReason = '缺少依赖，请在 schools/astro-zero-to-one 执行 npm ci';

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

  it('says url is only needed for sources with a web page when a marker is incomplete', () => {
    assert.throws(
      () => collectSourceCites(lesson('{{cite 短语 | path: material-1/a.md | quote: missing heading here please}}'), 'broken.md'),
      /url \(only when the source has a web page\)/,
    );
  });

  it('ignores a url-less marker inside inline code', () => {
    const markerWithoutUrl = `{{cite 短语 | path: material-1/pages/notes.md | heading: Notes | quote: ${QUOTE}}}`;
    assert.deepEqual(collectSourceCites(lesson(`写法示例：\`${markerWithoutUrl}\`。`), 'inline.md'), []);
  });

  it('accepts a cite without url for local/repo files and preserves visible phrase', () => {
    const markerWithoutUrl = `{{cite 任何基于文本的项目 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | quote: ${QUOTE}}}`;
    const { root, sources, text } = withSource(`在面对${markerWithoutUrl}时。`);
    try {
      const cites = assertSourceCites(text, 'no-url.md', sources, ['material-1/pages/notes.md']);
      assert.equal(cites.length, 1);
      assert.equal(cites[0].phrase, '任何基于文本的项目');
      assert.equal(cites[0].url, null);
      assert.equal(cites[0].quote, QUOTE);
      assert.equal(sourceCiteProse(`在面对${markerWithoutUrl}时。`), '在面对任何基于文本的项目时。');
      const html = sourceCiteHtml(cites[0]);
      assert.match(html, /class="source-cite"/);
      assert.match(html, /data-path="material-1\/pages\/notes\.md"/);
      assert.equal(html.includes('data-url='), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects non-http/https url when url is present', () => {
    const markerFtp = `{{cite 任何基于文本的项目 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | url: ftp://example.com/notes | quote: ${QUOTE}}}`;
    const { root, sources, text } = withSource(`在面对${markerFtp}时。`);
    try {
      assert.throws(
        () => assertSourceCites(text, 'ftp.md', sources, ['material-1/pages/notes.md']),
        /original URL must be http or https/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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

  it('handles cite with bare autolinked URL without error, producing html node and preserving prose', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const { root } = withSource(MARKER);
    const md = `前文 ${MARKER} 后文`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 3);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '前文 ');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /class="source-cite"/);
      assert.match(p.children[1].value, /任何基于文本的项目/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, ' 后文');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('handles two autolinked cites in the same paragraph', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const { root } = withSource(MARKER);
    const marker2 = MARKER.replace('任何基于文本的项目', '第二个引用短语');
    const md = `前文 ${MARKER} 中间 ${marker2} 后文`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 5);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '前文 ');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /任何基于文本的项目/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, ' 中间 ');
      assert.equal(p.children[3].type, 'html');
      assert.match(p.children[3].value, /第二个引用短语/);
      assert.equal(p.children[4].type, 'text');
      assert.equal(p.children[4].value, ' 后文');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('handles cite where quote also contains a URL', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const quoteWithUrl = 'Run inside a notes vault at https://example.com/notes for details.';
    const root = mkdtempSync(join(tmpdir(), 'source-cite-'));
    const sources = join(root, 'public/sources');
    mkdirSync(join(sources, 'material-1/pages'), { recursive: true });
    writeFileSync(
      join(sources, 'material-1/pages/notes.md'),
      `### \u200b(work-in-notes) Work in notes and non-code folders\n\n${quoteWithUrl}\n`,
    );
    const marker = `{{cite 网址引用 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | url: https://example.com/docs/notes | quote: ${quoteWithUrl}}}`;
    const md = `前文 ${marker} 后文`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 3);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '前文 ');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /class="source-cite"/);
      assert.match(p.children[1].value, /网址引用/);
      assert.match(p.children[1].value, /data-quote="Run inside a notes vault at https:\/\/example\.com\/notes for details\."/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, ' 后文');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('handles cite where quote contains an email address', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const quoteWithEmail = 'Please contact support at team@example.com for further help.';
    const root = mkdtempSync(join(tmpdir(), 'source-cite-'));
    const sources = join(root, 'public/sources');
    mkdirSync(join(sources, 'material-1/pages'), { recursive: true });
    writeFileSync(
      join(sources, 'material-1/pages/notes.md'),
      `### \u200b(work-in-notes) Work in notes and non-code folders\n\n${quoteWithEmail}\n`,
    );
    const marker = `{{cite 邮箱引用 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | url: https://example.com/docs/notes | quote: ${quoteWithEmail}}}`;
    const md = `在提示信息中 ${marker} 请注意查收。`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 3);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '在提示信息中 ');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /class="source-cite"/);
      assert.match(p.children[1].value, /邮箱引用/);
      assert.match(p.children[1].value, /team@example\.com/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, ' 请注意查收。');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('handles cite where quote contains _x_ emphasis and backticks inlineCode', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const quoteWithFormatting = 'Run the command `codex init` with _default_ options set.';
    const root = mkdtempSync(join(tmpdir(), 'source-cite-'));
    const sources = join(root, 'public/sources');
    mkdirSync(join(sources, 'material-1/pages'), { recursive: true });
    writeFileSync(
      join(sources, 'material-1/pages/notes.md'),
      `### \u200b(work-in-notes) Work in notes and non-code folders\n\n${quoteWithFormatting}\n`,
    );
    const marker = `{{cite 格式引用 | path: material-1/pages/notes.md | heading: Work in notes and non-code folders | url: https://example.com/docs/notes | quote: ${quoteWithFormatting}}}`;
    const md = `说明指出 ${marker} 即可正常启动。`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 3);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '说明指出 ');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /class="source-cite"/);
      assert.match(p.children[1].value, /格式引用/);
      assert.match(p.children[1].value, /_default_/);
      assert.match(p.children[1].value, /`codex init`/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, ' 即可正常启动。');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('handles cite with Chinese characters before and after', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const { root } = withSource(MARKER);
    const md = `在面对${MARKER}时，这套逻辑完全一致。`;
    const tree = parseGfm(md, defaultSchoolDir);
    try {
      remarkSourceCite()(tree, { cwd: root, path: 'lesson.md', value: md });
      const p = tree.children[0];
      assert.equal(p.children.length, 3);
      assert.equal(p.children[0].type, 'text');
      assert.equal(p.children[0].value, '在面对');
      assert.equal(p.children[1].type, 'html');
      assert.match(p.children[1].value, /任何基于文本的项目/);
      assert.equal(p.children[2].type, 'text');
      assert.equal(p.children[2].value, '时，这套逻辑完全一致。');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('still rejects genuinely incomplete cite markers under GFM with raw file', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const { root } = withSource(MARKER);
    try {
      const broken1Text = '前文 {{cite 只有短语 | url: https://example.com}} 后文';
      const broken1 = parseGfm(broken1Text, defaultSchoolDir);
      assert.throws(
        () => remarkSourceCite()(broken1, { cwd: root, path: 'lesson.md', value: broken1Text }),
        /a \{\{cite\}\} marker is incomplete/i,
      );

      const broken2Text = '前文 {{cite 未闭合短语 | url: https://example.com 没有结束括号 后文';
      const broken2 = parseGfm(broken2Text, defaultSchoolDir);
      assert.throws(
        () => remarkSourceCite()(broken2, { cwd: root, path: 'lesson.md', value: broken2Text }),
        /a \{\{cite\}\} marker is incomplete/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('generation check: assertSourceCitesGfm and assertSourceCites produce consistent results on valid and invalid samples', async (t) => {
    if (!hasGfmDeps) {
      t.skip(depsSkipReason);
      return;
    }
    const { root, sources, text } = withSource(`在面对${MARKER}时，这套逻辑完全一致。`);
    try {
      // Valid sample passes both checks
      const citesRegex = assertSourceCites(text, '01-valid.md', sources, ['material-1/pages/notes.md']);
      assert.equal(citesRegex.length, 1);
      assert.doesNotThrow(() => assertSourceCitesGfm(text, '01-valid.md', defaultSchoolDir, sources));

      // Quote mismatch throws on both with filename
      const mismatchedQuoteText = text.replace(QUOTE, 'This sentence was never written in the source file.');
      assert.throws(
        () => assertSourceCites(mismatchedQuoteText, '02-bad-quote.md', sources, ['material-1/pages/notes.md']),
        /Source cite in 02-bad-quote\.md: quote is not in/,
      );
      assert.throws(
        () => assertSourceCitesGfm(mismatchedQuoteText, '02-bad-quote.md', defaultSchoolDir, sources),
        /Source cite in 02-bad-quote\.md: quote is not in/,
      );

      // Missing GFM dependencies throws an explicit and helpful error with directory name
      const tempEmptyDir = mkdtempSync(join(tmpdir(), 'missing-gfm-'));
      try {
        writeFileSync(join(tempEmptyDir, 'package.json'), '{}');
        assert.throws(
          () => assertSourceCitesGfm(text, '03-missing-deps.md', tempEmptyDir),
          /未找到 GFM 解析依赖/,
        );
      } finally {
        rmSync(tempEmptyDir, { recursive: true, force: true });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('throws an explicit error when dependencies are missing or schoolDir is omitted without fallback', () => {
    assert.throws(
      () => parseGfm('sample prose'),
      /未找到 GFM 解析依赖/,
    );
  });

  it('accepts cite whose quote and heading contain inline code across regex and GFM paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'source-cite-code-'));
    const sources = join(root, 'public/sources');
    mkdirSync(join(sources, 'material-1'), { recursive: true });
    writeFileSync(
      join(sources, 'material-1/setup.md'),
      '### `Setup` Guide\n\nRun `npx nuxi init` to create a new project quickly.\n',
    );
    const citeMarker = '{{cite 初始化 | path: material-1/setup.md | heading: `Setup` Guide | url: https://example.com/setup | quote: Run `npx nuxi init` to create a new project quickly.}}';
    const text = lesson(`按照指南，${citeMarker} 即可。`, '  - material-1/setup.md');
    try {
      const cites = assertSourceCites(text, 'code.md', sources, ['material-1/setup.md']);
      assert.equal(cites.length, 1);
      assert.equal(cites[0].heading, '`Setup` Guide');
      assert.equal(cites[0].quote, 'Run `npx nuxi init` to create a new project quickly.');
      if (hasGfmDeps) {
        assert.doesNotThrow(() => assertSourceCitesGfm(text, 'code.md', defaultSchoolDir, sources));
      }
      assert.equal(sourceCiteProse(`按照指南，${citeMarker} 即可。`), '按照指南，初始化 即可。');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ignores cite syntax inside inline code spans', () => {
    const text = '在文档中写作 `{{cite 示例 | path: fake.md | heading: H | url: https://ex.com | quote: fake quote text that is long}}` 不是真正的引用。';
    const cites = collectSourceCites(text, 'inline.md');
    assert.deepEqual(cites, []);
  });

  it('ignores incomplete cite syntax inside inline code spans', () => {
    const text = '在文档中写作 `{{cite 未完成` 不会当作引用报错。';
    const cites = collectSourceCites(text, 'inline-incomplete.md');
    assert.deepEqual(cites, []);
  });
});

describe('assertRenderedLessons', () => {
  it('fails when a lesson article is empty, passes when content is present, and skips pages without marker', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'lesson-render-test-'));
    try {
      const lessonsDir = join(tempDir, 'src/content/lessons');
      mkdirSync(lessonsDir, { recursive: true });
      writeFileSync(
        join(lessonsDir, '01-first-lesson.md'),
        '---\ntitle: First\nslug: first-lesson\n---\n\nBody prose\n',
      );
      writeFileSync(
        join(lessonsDir, '02-second-lesson.md'),
        '---\ntitle: Second\nslug: second-lesson\n---\n\nBody prose\n',
      );
      writeFileSync(
        join(lessonsDir, '03-third-lesson.md'),
        '---\ntitle: Third\nslug: third-lesson\n---\n\nBody prose\n',
      );

      const distFirst = join(tempDir, 'dist/client/lessons/first-lesson');
      const distSecond = join(tempDir, 'dist/client/lessons/second-lesson');
      const distThird = join(tempDir, 'dist/client/lessons/third-lesson');
      mkdirSync(distFirst, { recursive: true });
      mkdirSync(distSecond, { recursive: true });
      mkdirSync(distThird, { recursive: true });

      // First: has data-lesson-body but empty body -> fails
      writeFileSync(
        join(distFirst, 'index.html'),
        '<!doctype html><html><body><article data-lesson-panel="read" data-lesson-body>   </article></body></html>',
      );
      // Second: has data-lesson-body with content -> passes
      writeFileSync(
        join(distSecond, 'index.html'),
        '<!doctype html><html><body><article data-lesson-panel="read" data-lesson-body><p>正常课文正文内容</p></article></body></html>',
      );
      // Third: no data-lesson-body marker -> skipped
      writeFileSync(
        join(distThird, 'index.html'),
        '<!doctype html><html><body><article data-lesson-panel="read">   </article></body></html>',
      );

      assert.throws(
        () => assertRenderedLessons(tempDir),
        /课文正文为空（first-lesson）。请检查这些课文的 Markdown 是否能渲染（例如 \{\{cite\}\} 标记），修改后重新 finish。/,
      );

      // Fix first lesson content -> all pass
      writeFileSync(
        join(distFirst, 'index.html'),
        '<!doctype html><html><body><article data-lesson-panel="read" data-lesson-body><p>修复后的正文</p></article></body></html>',
      );
      assert.doesNotThrow(() => assertRenderedLessons(tempDir));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('removes both build and dev data-store cache files when present', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'astro-cache-test-'));
    try {
      const buildCacheDir = join(tempDir, '.astro', 'cache');
      mkdirSync(buildCacheDir, { recursive: true });
      const buildCacheFile = join(buildCacheDir, 'data-store.json');
      const devCacheFile = join(tempDir, '.astro', 'data-store.json');
      writeFileSync(buildCacheFile, '{"mode":"build"}');
      writeFileSync(devCacheFile, '{"mode":"dev"}');
      assert.equal(existsSync(buildCacheFile), true);
      assert.equal(existsSync(devCacheFile), true);

      clearAstroCache(tempDir);

      assert.equal(existsSync(buildCacheFile), false);
      assert.equal(existsSync(devCacheFile), false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
