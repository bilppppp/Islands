import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLICATION_GROUPS,
  buildCatalog,
  catalogFingerprint,
  catalogHashInput,
  catalogResponse,
  lessonUrl,
  listCourseHtmlPaths,
  pageCanonicalUrl,
  parsePublicationOrigin,
  robotsTextForConfig,
  robotsTxt,
  shouldNoindex,
  sitemapResponse,
  sitemapXml,
} from '../school-kit/overlay/src/lib/publication.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const PUBLIC_CONFIG = {
  publicName: 'Python 官方教程 AI 互动课程',
  description: '按官方教程学完第 1 到 12 章。',
  publication: {
    visibility: 'public',
    origin: 'https://python-official.learnislands.com',
    group: '编程语言、后端与开发环境',
    prerequisites: '零基础，不需要先学别的课。',
    outcomes: '能独立写一个文本处理小脚本。',
  },
};

const LESSONS = [
  { title: '第二关', slug: 'a-second', order: 2, body: 'second body' },
  { title: '第一关', slug: 'z-first', order: 1, body: 'first body' },
];

function publicConfig(overrides = {}, publicationOverrides = {}) {
  return {
    ...PUBLIC_CONFIG,
    ...overrides,
    publication: {
      ...PUBLIC_CONFIG.publication,
      ...publicationOverrides,
    },
  };
}

describe('parsePublicationOrigin', () => {
  it('stores a https origin without a trailing slash', () => {
    assert.equal(
      parsePublicationOrigin('https://python-official.learnislands.com/'),
      'https://python-official.learnislands.com',
    );
  });

  it('rejects http, credentials, path, query, and hash', () => {
    assert.throws(() => parsePublicationOrigin('http://python-official.learnislands.com'), /publication\.origin/);
    assert.throws(() => parsePublicationOrigin('https://user:pass@example.com'), /publication\.origin/);
    assert.throws(() => parsePublicationOrigin('https://example.com/path'), /publication\.origin/);
    assert.throws(() => parsePublicationOrigin('https://example.com?q=1'), /publication\.origin/);
    assert.throws(() => parsePublicationOrigin('https://example.com#hash'), /publication\.origin/);
  });
});

describe('catalog fingerprint', () => {
  it('does not change when lesson bodies change', async () => {
    const original = await buildCatalog(PUBLIC_CONFIG, LESSONS);
    const rewritten = await buildCatalog(PUBLIC_CONFIG, LESSONS.map((lesson) => ({
      ...lesson,
      body: `${lesson.body} changed ${lesson.slug}`,
    })));
    assert.equal(rewritten.fingerprint, original.fingerprint);
    assert.equal(rewritten.lessons.length, 2);
  });

  it('changes when title, order, URL, group, origin, intro, prerequisites, or outcomes change', async () => {
    const original = await buildCatalog(PUBLIC_CONFIG, LESSONS);
    const cases = [
      await buildCatalog(PUBLIC_CONFIG, LESSONS.map((lesson) => (
        lesson.slug === 'z-first' ? { ...lesson, title: '改过的第一关' } : lesson
      ))),
      await buildCatalog(PUBLIC_CONFIG, LESSONS.map((lesson) => ({
        ...lesson,
        order: lesson.order === 1 ? 2 : 1,
      }))),
      await buildCatalog(PUBLIC_CONFIG, LESSONS.map((lesson) => (
        lesson.slug === 'z-first' ? { ...lesson, slug: 'renamed-first' } : lesson
      ))),
      await buildCatalog(publicConfig({}, { group: 'Web 前端开发' }), LESSONS),
      await buildCatalog(publicConfig({}, { origin: 'https://other.learnislands.com' }), LESSONS),
      await buildCatalog(publicConfig({ description: '另一段介绍' }), LESSONS),
      await buildCatalog(publicConfig({}, { prerequisites: '先学另一门课。' }), LESSONS),
      await buildCatalog(publicConfig({}, { outcomes: '另一项成果。' }), LESSONS),
    ];
    for (const next of cases) {
      assert.notEqual(next.fingerprint, original.fingerprint);
    }
  });

  it('hashes only the public fields in a fixed key order and omits fingerprint itself', async () => {
    const catalog = await buildCatalog(PUBLIC_CONFIG, LESSONS);
    const expected = await catalogFingerprint({
      name: catalog.name,
      origin: catalog.origin,
      group: catalog.group,
      intro: catalog.intro,
      prerequisites: catalog.prerequisites,
      outcomes: catalog.outcomes,
      lessons: catalog.lessons,
    });
    assert.equal(catalog.fingerprint, expected);
    assert.match(catalog.fingerprint, /^[0-9a-f]{64}$/);
    const hashed = catalogHashInput({
      name: catalog.name,
      origin: catalog.origin,
      group: catalog.group,
      intro: catalog.intro,
      prerequisites: catalog.prerequisites,
      outcomes: catalog.outcomes,
      lessons: catalog.lessons,
    });
    assert.equal(
      hashed,
      JSON.stringify({
        name: catalog.name,
        origin: catalog.origin,
        group: catalog.group,
        intro: catalog.intro,
        prerequisites: catalog.prerequisites,
        outcomes: catalog.outcomes,
        lessons: catalog.lessons.map((lesson) => ({ title: lesson.title, url: lesson.url })),
      }),
    );
    assert.doesNotMatch(hashed, /fingerprint/);
    assert.doesNotMatch(hashed, /first body/);
  });
});

describe('public catalog validation', () => {
  it('throws when a required field is missing instead of writing an empty catalog', async () => {
    const empty = { visibility: 'public', origin: '', group: '', prerequisites: '', outcomes: '' };
    await assert.rejects(() => buildCatalog(publicConfig({ publicName: '' }), LESSONS), /publicName/);
    await assert.rejects(() => buildCatalog(publicConfig({ description: '   ' }), LESSONS), /description/);
    await assert.rejects(() => buildCatalog(publicConfig({}, { origin: undefined }), LESSONS), /origin/);
    await assert.rejects(() => buildCatalog(publicConfig({}, { group: undefined }), LESSONS), /group/);
    await assert.rejects(() => buildCatalog(publicConfig({}, { prerequisites: '' }), LESSONS), /prerequisites/);
    await assert.rejects(() => buildCatalog(publicConfig({}, { outcomes: ' ' }), LESSONS), /outcomes/);
    await assert.rejects(() => buildCatalog(PUBLIC_CONFIG, []), /at least one lesson/);
    await assert.rejects(() => buildCatalog({ ...PUBLIC_CONFIG, publication: empty }, LESSONS), /origin|group|prerequisites|outcomes/);
  });

  it('throws on an illegal group or a non-https origin', async () => {
    await assert.rejects(
      () => buildCatalog(publicConfig({}, { group: 'Frontend' }), LESSONS),
      /publication\.group/,
    );
    await assert.rejects(
      () => buildCatalog(publicConfig({}, { origin: 'http://python-official.learnislands.com' }), LESSONS),
      /publication\.origin/,
    );
    assert.equal(PUBLICATION_GROUPS.length, 6);
  });
});

describe('experimental versus public surfaces', () => {
  it('does not emit a catalog for an experimental course', async () => {
    assert.deepEqual(await catalogResponse({}, LESSONS), { status: 404 });
    assert.deepEqual(await catalogResponse({ publication: { visibility: 'experimental' } }, LESSONS), { status: 404 });
  });

  it('uses an absolute canonical URL for a public course', async () => {
    const catalog = await buildCatalog(PUBLIC_CONFIG, LESSONS);
    assert.equal(
      pageCanonicalUrl(PUBLIC_CONFIG, '/lessons/z-first', LESSONS),
      'https://python-official.learnislands.com/lessons/z-first',
    );
    assert.equal(pageCanonicalUrl(PUBLIC_CONFIG, '/', LESSONS), `${catalog.origin}/`);
    assert.equal(shouldNoindex(PUBLIC_CONFIG), false);
  });

  it('keeps experimental canonical relative and adds noindex', () => {
    assert.equal(pageCanonicalUrl({}, '/lessons/z-first', LESSONS), '/lessons/z-first');
    assert.equal(shouldNoindex({}), true);
    assert.equal(shouldNoindex({ publication: { visibility: 'experimental' } }), true);
  });

  it('advertises Sitemap only for public robots.txt', () => {
    const publicRobots = robotsTextForConfig(PUBLIC_CONFIG, LESSONS);
    assert.match(publicRobots, /^Sitemap: https:\/\/python-official\.learnislands\.com\/sitemap\.xml$/m);
    assert.match(publicRobots, /^Disallow: \/api\/$/m);
    assert.match(publicRobots, /^Disallow: \/sources\/$/m);
    assert.match(publicRobots, /^Disallow: \/harness\/$/m);

    const experimental = robotsTextForConfig({}, LESSONS);
    assert.doesNotMatch(experimental, /Sitemap:/);
    assert.equal(robotsTxt({ advertiseSitemap: false }).includes('Sitemap:'), false);
  });

  it('returns 404 instead of a sitemap for experimental courses', () => {
    assert.deepEqual(
      sitemapResponse({}, { lessons: LESSONS, pages: { glossary: true } }),
      { status: 404 },
    );
  });
});

describe('lesson order and URLs', () => {
  it('orders catalog lessons by order, not filename or slug', async () => {
    const catalog = await buildCatalog(PUBLIC_CONFIG, LESSONS);
    assert.deepEqual(catalog.lessons, [
      { title: '第一关', url: 'https://python-official.learnislands.com/lessons/z-first' },
      { title: '第二关', url: 'https://python-official.learnislands.com/lessons/a-second' },
    ]);
    assert.equal(lessonUrl(catalog.origin, 'z-first'), catalog.lessons[0].url);
  });

  it('lists only course HTML pages in the public sitemap', () => {
    const paths = listCourseHtmlPaths({
      lessons: LESSONS,
      exercises: [{ slug: 'z-drill', order: 2 }, { slug: 'a-warmup', order: 1 }],
      pages: {
        lessonList: false,
        exerciseList: true,
        glossary: true,
        troubleshooting: true,
      },
    });
    assert.deepEqual(paths, [
      '/',
      '/lessons/z-first',
      '/lessons/a-second',
      '/exercises',
      '/exercises/a-warmup',
      '/exercises/z-drill',
      '/glossary',
      '/troubleshooting',
    ]);
    const xml = sitemapXml('https://python-official.learnislands.com', paths);
    assert.match(xml, /https:\/\/python-official\.learnislands\.com\/lessons\/z-first/);
    assert.doesNotMatch(xml, /\/api\//);
    assert.doesNotMatch(xml, /\/sources\//);
    assert.doesNotMatch(xml, /\/harness\//);
    assert.equal(
      sitemapResponse(PUBLIC_CONFIG, { lessons: LESSONS, pages: { glossary: true } }).status,
      200,
    );
  });
});

describe('overlay wiring', () => {
  it('keeps publication.ts free of astro imports', () => {
    const source = readFileSync(join(root, 'school-kit/overlay/src/lib/publication.ts'), 'utf8');
    assert.doesNotMatch(source, /from ["']astro/);
  });

  it('prerenders catalog, sitemap, and robots routes', () => {
    for (const relative of [
      'school-kit/overlay/src/pages/catalog.json.ts',
      'school-kit/overlay/src/pages/sitemap.xml.ts',
      'school-kit/overlay/src/pages/robots.txt.ts',
    ]) {
      const source = readFileSync(join(root, relative), 'utf8');
      assert.match(source, /export const prerender = true/);
    }
  });

  it('detects optional sitemap pages at build time, not from a packed import.meta.url', () => {
    const source = readFileSync(join(root, 'school-kit/overlay/src/pages/sitemap.xml.ts'), 'utf8');
    assert.match(source, /import\.meta\.glob\(/);
    assert.match(source, /hasSourcePage\("glossary\.astro"\)/);
    assert.match(source, /hasSourcePage\("troubleshooting\.astro"\)/);
    assert.match(source, /hasSourcePage\("lessons\/index\.astro"\)/);
    assert.match(source, /hasSourcePage\("exercises\/index\.astro"\)/);
    assert.match(source, /hasSourcePage\("exercises\/\[slug\]\.astro"\)/);
    assert.doesNotMatch(source, /existsSync/);
    assert.doesNotMatch(source, /import\.meta\.url/);
    assert.doesNotMatch(source, /from ["']node:fs["']/);
    assert.doesNotMatch(source, /from ["']node:path["']/);
    assert.doesNotMatch(source, /from ["']node:url["']/);
  });

  it('uses publication origin for island canonical URLs and experimental noindex', () => {
    const source = readFileSync(join(root, 'school-kit/island/layouts/Base.astro'), 'utf8');
    assert.match(source, /pageCanonicalUrl\(config, Astro\.url\.pathname, lessons\)/);
    assert.match(source, /noindex && <meta name="robots" content="noindex"/);
    assert.doesNotMatch(source, /Astro\.site \? new URL/);
  });
});
