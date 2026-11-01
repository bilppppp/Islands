import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGeneration } from './generate.mjs';
import { command } from './materials.mjs';
import {
  EXTRACTOR_VERSION,
  INCOMPLETE_CANDIDATE_REASON,
  UNOBSERVED_CRAWL_REASON,
  assertLessonHasSources,
  buildLessonDeps,
  checkDocsMaterial,
  checkSingleMaterial,
  checkSchool,
  compareSources,
  gitFileHistory,
  textFingerprint,
  writeBaseline,
} from './source-state.mjs';

const dirs = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function temp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

function write(path, text) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
}

function lessonFile({ slug, order, sources, title = slug }) {
  const list = sources.map(path => `  - ${path}`).join('\n');
  return `---
title: "${title}"
slug: "${slug}"
description: "${slug}"
order: ${order}
quiz: false
agentOnly: true
sources:
${list}
agentInstructions: |
  notes
---

# ${title}

body of ${slug}
`;
}

function page(body, retrieved = '2026-10-19') {
  return `<!-- source: https://example.com/${body.split(' ')[0]} -->\n<!-- retrieved: ${retrieved}; tool: siteone-crawler 2.5.1; scope: siteone-domain -->\n\n# ${body}\n\n    keep indent\n`;
}

function makeSchool({ shared = true } = {}) {
  const root = temp('source-state-');
  const school = join(root, 'schools', 'demo');
  mkdirSync(join(school, 'src/content/lessons'), { recursive: true });
  mkdirSync(join(school, 'public/sources/material-1/pages'), { recursive: true });
  writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
    name: 'demo',
    output: 'schools/demo',
    materials: [{ path: 'material-1', url: 'https://example.com', crawl: { tool: 'siteone-crawler' } }],
  }, null, 2)}\n`);
  writeFileSync(join(school, 'COURSE.md'), `# demo

| 教学主张 / 核心机制 | 官方文档原始位置 | 对应本地副本文件路径 |
| :--- | :--- | :--- |
| 页面 A | \`a/\` | \`pages/a.md\` |
| 页面 B | \`b/\` | \`pages/b.md\` |
| 共享页 | \`shared/\` | \`pages/shared.md\` |
| 未编入的页 | \`loose/\` | \`pages/loose.md\` |
`);
  write(join(school, 'public/sources/material-1/pages/a.md'), page('Alpha page'));
  write(join(school, 'public/sources/material-1/pages/b.md'), page('Beta page'));
  write(join(school, 'public/sources/material-1/pages/shared.md'), page('Shared page'));
  write(join(school, 'public/sources/material-1/pages/unref.md'), page('Unreferenced page'));
  write(join(school, 'public/sources/material-1/pages/loose.md'), page('Loose ledger page'));
  const sharedSources = shared ? ['material-1/pages/shared.md'] : [];
  write(join(school, 'src/content/lessons/01-a.md'), lessonFile({
    slug: 'lesson-a', order: 1, sources: ['material-1/pages/a.md', ...sharedSources],
  }));
  write(join(school, 'src/content/lessons/02-b.md'), lessonFile({
    slug: 'lesson-b', order: 2, sources: ['material-1/pages/b.md', ...sharedSources],
  }));
  return school;
}

function copySources(school) {
  const dest = join(temp('candidate-'), 'sources');
  cpSync(join(school, 'public/sources'), dest, { recursive: true });
  return dest;
}

function seedMaterials(school, extra = true) {
  const dest = join(school, 'materials', 'material-1');
  cpSync(join(school, 'public/sources/material-1'), dest, { recursive: true });
  if (extra) write(join(dest, 'pages/secret.md'), page('Secret unpublished'));
  return dest;
}

function gitAt(repo, args) {
  return execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  }).trim();
}

function makeGeneratedSchool({ requireLessonSources, withSources }) {
  const root = temp('gen-school-');
  const school = join(root, 'schools', 'demo');
  mkdirSync(join(school, 'src/content/lessons'), { recursive: true });
  mkdirSync(join(school, 'public/sources/material-1'), { recursive: true });
  writeFileSync(join(school, 'COURSE.md'), '# demo\n');
  writeFileSync(join(school, 'school.config.ts'), `export default {
  name: "demo-dir",
  publicName: "Public Course",
  shortName: "Public",
};
`);
  const settings = { name: 'demo' };
  if (requireLessonSources === true) settings.requireLessonSources = true;
  writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
  const sources = withSources ? ['material-1/a.md'] : [];
  writeFileSync(join(school, 'src/content/lessons/01.md'), lessonFile({
    slug: 'topic-one', order: 1, sources, title: 'Topic One',
  }));
  if (withSources) write(join(school, 'public/sources/material-1/a.md'), 'body\n');
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const fallback = process.env.ISLANDS_DEPS_SCHOOL || join(repoRoot, 'schools/astro-zero-to-one');
  if (existsSync(join(fallback, 'node_modules'))) {
    writeFileSync(join(school, 'package.json'), '{"name":"demo"}\n');
    try {
      symlinkSync(join(fallback, 'node_modules'), join(school, 'node_modules'), 'junction');
    } catch {}
  }
  const inputPath = join(root, 'input.json');
  writeFileSync(inputPath, `${JSON.stringify({ output: school }, null, 2)}\n`);
  return inputPath;
}

describe('text fingerprint', () => {
  it('keeps the same fingerprint when only the retrieved stamp changes', () => {
    const first = page('Hello world', '2026-01-01');
    const second = page('Hello world', '2026-12-31').replace(/\n/g, '\r\n');
    assert.equal(textFingerprint(first), textFingerprint(second));
  });

  it('changes when one character of the body changes', () => {
    assert.notEqual(textFingerprint(page('Hello world')), textFingerprint(page('Hello worlds')));
  });

  it('does not collapse leading indent', () => {
    const indented = page('Hello world');
    const flat = indented.replace('    keep indent', 'keep indent');
    assert.notEqual(textFingerprint(indented), textFingerprint(flat));
  });

  it('keeps indent on the first body line after source comments', () => {
    const head = '<!-- source: https://example.com/x -->\n<!-- retrieved: 2026-10-19 -->\n';
    assert.notEqual(
      textFingerprint(`${head}    print(1)\n`),
      textFingerprint(`${head}print(1)\n`),
    );
  });
});

describe('git shallow history', () => {
  it('does not write a fake lastChangeCommit for a shallow clone', async () => {
    const school = makeSchool();
    const repo = join(school, 'materials', 'material-1');
    mkdirSync(join(repo, '.git'), { recursive: true });
    writeFileSync(join(repo, '.git', 'shallow'), `${'a'.repeat(40)}\n`);
    writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
      name: 'demo',
      materials: [{ path: 'material-1', url: 'https://github.com/ex/repo', commit: 'a'.repeat(40) }],
    }, null, 2)}\n`);
    const run = async (_cmd, args) => {
      if (args.includes('rev-parse')) return 'a'.repeat(40);
      throw new Error(`git log must not invent lastChangeCommit: ${args.join(' ')}`);
    };
    const history = await gitFileHistory(repo, 'pages/a.md', { run });
    assert.equal(history.historyStatus, 'unknown');
    assert.equal(history.lastChangeCommit, null);
    const { baseline } = await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z'), run });
    assert.ok(baseline.files.length);
    for (const file of baseline.files) {
      assert.equal(file.historyStatus, 'unknown');
      assert.equal(file.lastChangeCommit, null);
      assert.equal(file.snapshotCommit, 'a'.repeat(40));
    }
  });
});

describe('sources --check --source', () => {
  it('lists only the lessons that reference a changed mapped page', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/a.md'), page('Alpha page changed'));
    const { report, exitCode } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:00:00Z'),
    });
    assert.equal(exitCode, 2);
    assert.deepEqual(report.candidateLessons.map(item => item.slug), ['lesson-a']);
    assert.deepEqual(report.candidateLessons[0].paths, ['material-1/pages/a.md']);
    assert.equal(report.changed.length, 1);
    assert.equal(report.failed.length, 0);
  });

  it('records an unreferenced page change without lesson candidates', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/unref.md'), page('Unreferenced page changed'));
    const { report, exitCode } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:02:00Z'),
    });
    assert.equal(exitCode, 2);
    assert.deepEqual(report.candidateLessons, []);
    assert.equal(report.changed.some(item => item.path === 'material-1/pages/unref.md'), true);
  });

  it('lists every lesson that shares a changed source', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/shared.md'), page('Shared page changed'));
    const { report } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:03:00Z'),
    });
    assert.deepEqual(report.candidateLessons.map(item => item.slug), ['lesson-a', 'lesson-b']);
    for (const lesson of report.candidateLessons) {
      assert.deepEqual(lesson.paths, ['material-1/pages/shared.md']);
    }
  });

  it('keeps added, missing, and failed records apart', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/new.md'), page('Brand new'));
    rmSync(join(candidate, 'material-1/pages/b.md'));
    const local = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:04:00Z'),
    });
    assert.equal(local.report.added.some(item => item.path === 'material-1/pages/new.md'), true);
    assert.equal(local.report.deleted.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(local.report.failed.length, 0);
    const compared = compareSources({
      baseline: JSON.parse(readFileSync(join(school, 'source-state/baseline.json'), 'utf8')),
      deps: JSON.parse(readFileSync(join(school, 'source-state/lesson-deps.json'), 'utf8')),
      candidateFiles: {},
      missing: ['material-1/pages/a.md'],
      failed: [{ path: 'material-1/pages/b.md', reason: 'crawl failed' }],
      added: ['material-1/pages/new.md'],
    });
    assert.deepEqual(compared.added.map(item => item.path), ['material-1/pages/new.md']);
    assert.deepEqual(compared.deleted.map(item => item.path), ['material-1/pages/a.md']);
    assert.deepEqual(compared.failed.map(item => item.path), ['material-1/pages/b.md']);
    assert.equal(compared.deleted.some(item => item.path === 'material-1/pages/b.md'), false);
  });

  it('treats a date-stamp-only candidate as unchanged and exits 0', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const before = readFileSync(join(school, 'source-state/baseline.json'), 'utf8');
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/a.md'), page('Alpha page', '2026-10-21'));
    const { report, exitCode } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:05:00Z'),
    });
    assert.equal(exitCode, 0);
    assert.deepEqual(report.candidateLessons, []);
    assert.equal(report.changed.length, 0);
    assert.equal(report.unchanged.some(item => item.path === 'material-1/pages/a.md'), true);
    assert.equal(readFileSync(join(school, 'source-state/baseline.json'), 'utf8'), before);
    assert.equal(readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8').includes('body of lesson-a'), true);
  });

  it('marks unmatched ledger pages unresolved instead of guessing', async () => {
    const school = makeSchool();
    const { deps } = await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const loose = deps.unresolved.find(item => item.path.endsWith('pages/loose.md'));
    assert.equal(loose.status, 'unresolved');
    assert.match(loose.reason, /对不上/);
    const mapped = deps.lessons[0].sources.find(item => item.path.endsWith('pages/a.md'));
    assert.equal(mapped.status, 'reviewed');
  });
});

describe('requireLessonSources', () => {
  it('accepts lessons with existing source paths and rejects missing ones', () => {
    const school = makeSchool();
    const text = readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8');
    assert.doesNotThrow(() => assertLessonHasSources(text, '01-a.md', join(school, 'public/sources')));
    const empty = text.replace(/sources:\n(?:  - .+\n)+/, '');
    assert.throws(() => assertLessonHasSources(empty, '01-a.md', join(school, 'public/sources')), /missing sources/);
  });

  it('fails validateGeneration when the flag is true and a lesson has no sources', () => {
    const inputPath = makeGeneratedSchool({ requireLessonSources: true, withSources: false });
    assert.throws(() => validateGeneration(inputPath), /missing sources/);
  });

  it('lets validateGeneration pass when the flag is absent even without sources', () => {
    const inputPath = makeGeneratedSchool({ requireLessonSources: undefined, withSources: false });
    assert.equal(validateGeneration(inputPath), 1);
  });
});

describe('usage errors', () => {
  it('fails closed when the baseline is missing', async () => {
    const school = makeSchool();
    await assert.rejects(
      () => checkSchool(school, { source: join(school, 'public/sources') }),
      /No source baseline/,
    );
  });

  it('rejects a baseline from a different extractor', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const path = join(school, 'source-state/baseline.json');
    const baseline = JSON.parse(readFileSync(path, 'utf8'));
    baseline.extractorVersion = `not-${EXTRACTOR_VERSION}`;
    writeFileSync(path, `${JSON.stringify(baseline, null, 2)}\n`);
    await assert.rejects(
      () => checkSchool(school, { source: join(school, 'public/sources') }),
      /extractorVersion/,
    );
  });
});

describe('unpublished materials inventory', () => {
  it('does not treat unpublished materials as added until a new file appears', async () => {
    const school = makeSchool();
    const materials = seedMaterials(school);
    const { baseline } = await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    assert.equal(baseline.files.some(item => item.path === 'material-1/pages/secret.md'), false);
    assert.equal(baseline.inventory.some(item => item.path === 'material-1/pages/secret.md'), true);
    const first = await checkSchool(school, {
      source: materials,
      now: new Date('2026-10-20T01:10:00Z'),
    });
    assert.equal(first.exitCode, 0);
    assert.equal(first.report.added.length, 0);
    write(join(materials, 'pages/brand-new.md'), page('Brand new after baseline'));
    const second = await checkSchool(school, {
      source: materials,
      now: new Date('2026-10-20T01:11:00Z'),
    });
    assert.equal(second.report.added.some(item => item.path === 'material-1/pages/brand-new.md'), true);
    assert.deepEqual(second.report.candidateLessons, []);
    const incomplete = await checkSchool(school, {
      source: join(school, 'public/sources'),
      now: new Date('2026-10-20T01:12:00Z'),
    });
    assert.equal(incomplete.exitCode, 0);
    const secret = incomplete.report.unobserved.find(item => item.path === 'material-1/pages/secret.md');
    assert.equal(secret?.reason, INCOMPLETE_CANDIDATE_REASON);
    assert.equal(incomplete.report.added.length, 0);
  });
});

describe('git added files', () => {
  it('records unrestricted A files from a local repository', async () => {
    const school = makeSchool();
    const repo = join(school, 'materials', 'material-1');
    cpSync(join(school, 'public/sources/material-1'), repo, { recursive: true });
    gitAt(repo, ['-c', 'init.defaultBranch=main', 'init', '--template=', '-b', 'main']);
    gitAt(repo, ['add', '.']);
    gitAt(repo, ['commit', '-m', 'first']);
    const first = gitAt(repo, ['rev-parse', 'HEAD']);
    writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
      name: 'demo',
      materials: [{ path: 'material-1', url: 'https://github.com/ex/repo', commit: first }],
    }, null, 2)}\n`);
    write(join(repo, 'pages/extra.md'), page('Git added page'));
    gitAt(repo, ['add', 'pages/extra.md']);
    gitAt(repo, ['commit', '-m', 'second']);
    const second = gitAt(repo, ['rev-parse', 'HEAD']);
    gitAt(repo, ['reset', '--hard', first]);
    writeFileSync(join(repo, '.git/FETCH_HEAD'), `${second}\n`);
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:20:00Z'),
      git: { fetch: async () => second },
    });
    assert.equal(exitCode, 2);
    assert.equal(report.added.some(item => item.path === 'material-1/pages/extra.md'), true);
    assert.deepEqual(report.candidateLessons, []);
  });

  it('records unrestricted diffAll failure without dropping referenced diffs', async () => {
    const school = makeSchool();
    mkdirSync(join(school, 'materials/material-1/.git'), { recursive: true });
    writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
      name: 'demo',
      materials: [{ path: 'material-1', url: 'https://github.com/ex/repo', commit: 'a'.repeat(40) }],
    }, null, 2)}\n`);
    await writeBaseline(school, {
      now: new Date('2026-10-20T00:00:00Z'),
      run: async () => 'a'.repeat(40),
    });
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:21:00Z'),
      git: {
        fetch: async () => 'a'.repeat(40),
        diff: async () => '',
        diffAll: async () => { throw new Error('diffAll exploded'); },
      },
    });
    assert.equal(exitCode, 2);
    assert.equal(report.failed.some(item => item.reason.includes('diffAll exploded')), true);
    assert.equal(report.unchanged.some(item => item.path === 'material-1/pages/a.md'), true);
    assert.equal(report.failed.some(item => item.path === 'material-1/pages/a.md'), false);
  });
});

describe('docs crawl status', () => {
  function materialOf(school) {
    return JSON.parse(readFileSync(join(school, 'school.settings.json'), 'utf8')).materials[0];
  }

  it('marks a thrown crawl as failed, not deleted', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const referenced = ['material-1/pages/a.md', 'material-1/pages/b.md'];
    const docs = await checkDocsMaterial({
      schoolPath: school,
      material: materialOf(school),
      referenced,
      crawl: async () => { throw new Error('network down'); },
    });
    assert.equal(docs.deleted.length, 0);
    assert.equal(docs.failed.length, 2);
    for (const item of docs.failed) assert.match(item.reason, /network down/);
    const { report } = await checkSchool(school, {
      now: new Date('2026-10-20T01:30:00Z'),
      crawl: async () => { throw new Error('network down'); },
    });
    assert.equal(report.deleted.length, 0);
    assert.ok(report.failed.length >= 2);
  });

  it('treats a non-2xx manifest URL as failed', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const dest = join(temp('crawl-'), 'snap');
    mkdirSync(join(dest, 'pages'), { recursive: true });
    write(join(dest, 'pages/a.md'), page('Alpha page'));
    const crawl = async () => ({
      dest,
      pages: [{ file: 'pages/a.md', url: 'https://example.com/Alpha' }],
      failedUrls: ['https://example.com/Beta'],
    });
    const docs = await checkDocsMaterial({
      schoolPath: school,
      material: materialOf(school),
      referenced: ['material-1/pages/a.md', 'material-1/pages/b.md'],
      crawl,
    });
    assert.equal(docs.failed.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(docs.deleted.length, 0);
    assert.equal(docs.unobserved.some(item => item.path === 'material-1/pages/b.md'), false);
    const { report } = await checkSchool(school, {
      now: new Date('2026-10-20T01:31:00Z'),
      crawl,
    });
    assert.equal(report.failed.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(report.deleted.length, 0);
  });

  it('treats a page present in both pages and failedUrls as failed', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const dest = join(temp('crawl-'), 'snap');
    mkdirSync(join(dest, 'pages'), { recursive: true });
    const changed = page('Beta page changed');
    write(join(dest, 'pages/b.md'), changed);
    const crawl = async () => ({
      dest,
      pages: [{ file: 'pages/b.md', url: 'https://example.com/Beta', text: changed }],
      failedUrls: ['https://example.com/Beta'],
    });
    const docs = await checkDocsMaterial({
      schoolPath: school,
      material: materialOf(school),
      referenced: ['material-1/pages/a.md', 'material-1/pages/b.md'],
      crawl,
    });
    assert.equal(docs.failed.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(docs.candidateFiles['material-1/pages/b.md'], undefined);
    const { report } = await checkSchool(school, {
      now: new Date('2026-10-20T01:33:00Z'),
      crawl,
    });
    assert.equal(report.failed.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(report.changed.some(item => item.path === 'material-1/pages/b.md'), false);
    assert.equal(report.unchanged.some(item => item.path === 'material-1/pages/b.md'), false);
  });

  it('treats a referenced page missing from crawl results as unobserved', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const dest = join(temp('crawl-'), 'snap');
    mkdirSync(join(dest, 'pages'), { recursive: true });
    write(join(dest, 'pages/a.md'), page('Alpha page'));
    const crawl = async () => ({
      dest,
      pages: [{ file: 'pages/a.md', url: 'https://example.com/Alpha' }],
      failedUrls: [],
    });
    const docs = await checkDocsMaterial({
      schoolPath: school,
      material: materialOf(school),
      referenced: ['material-1/pages/a.md', 'material-1/pages/b.md'],
      crawl,
    });
    assert.equal(docs.unobserved.some(item => item.path === 'material-1/pages/b.md' && item.reason === UNOBSERVED_CRAWL_REASON), true);
    assert.equal(docs.deleted.length, 0);
    assert.equal(docs.failed.some(item => item.path === 'material-1/pages/b.md'), false);
    const { report } = await checkSchool(school, {
      now: new Date('2026-10-20T01:32:00Z'),
      crawl,
    });
    assert.equal(report.unobserved.some(item => item.path === 'material-1/pages/b.md'), true);
    assert.equal(report.deleted.length, 0);
  });
});

describe('snapshot source paths', () => {
  it('maps snapshots/<id>/material-N paths to the original material path', async () => {
    const school = makeSchool({ shared: false });
    write(join(school, 'public/sources/snapshots/PLAN/material-1/pages/a.md'), page('Alpha page changed'));
    const file = join(school, 'src/content/lessons/01-a.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace(
      'material-1/pages/a.md',
      'snapshots/PLAN/material-1/pages/a.md',
    ));
    const { baseline, deps } = await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const mapped = deps.lessons.find(item => item.slug === 'lesson-a').sources.find(item => item.path.endsWith('pages/a.md'));
    assert.equal(mapped.path, 'material-1/pages/a.md');
    assert.equal(mapped.status, 'reviewed');
    assert.equal(deps.unresolved.some(item => String(item.path).includes('snapshots/')), false);
    assert.equal(baseline.files.some(item => item.path === 'material-1/pages/a.md'), true);
    assert.equal(baseline.files.some(item => String(item.path).startsWith('snapshots/')), false);
    assert.equal(baseline.inventory.some(item => String(item.path).startsWith('snapshots/')), false);

    const live = buildLessonDeps(school);
    assert.equal(live.lessons.find(item => item.slug === 'lesson-a').sources.some(item => item.path === 'material-1/pages/a.md'), true);

    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/a.md'), page('Alpha page changed'));
    const { report } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:00:00Z'),
    });
    assert.equal(report.deleted.some(item => item.path === 'material-1/pages/a.md'), false);
    assert.equal(report.failed.some(item => item.path === 'material-1/pages/a.md'), false);
    assert.equal(report.deleted.some(item => String(item.path).includes('snapshots/')), false);
    assert.equal(report.candidateLessons.some(item => item.slug === 'lesson-a'), false);
  });

  it('lists only lessons whose adopted snapshot differs from the candidate', () => {
    const baseline = {
      files: [{ path: 'material-1/pages/a.md', sha256: 'aa', textFingerprint: 'old' }],
    };
    const deps = {
      lessons: [{
        slug: 'lesson-a',
        sources: [{ path: 'snapshots/PLAN/material-1/pages/a.md' }],
      }, {
        slug: 'lesson-b',
        sources: [{ path: 'material-1/pages/a.md' }],
      }],
    };
    const same = compareSources({
      baseline,
      deps,
      candidateFiles: { 'material-1/pages/a.md': { sha256: 'bb', textFingerprint: 'new' } },
      lessonFingerprints: { 'lesson-a': { 'material-1/pages/a.md': 'new' } },
    });
    assert.equal(same.changed.length, 1);
    assert.deepEqual(same.candidateLessons.map(item => item.slug), ['lesson-b']);

    const next = compareSources({
      baseline,
      deps,
      candidateFiles: { 'material-1/pages/a.md': { sha256: 'cc', textFingerprint: 'newer' } },
      lessonFingerprints: { 'lesson-a': { 'material-1/pages/a.md': 'new' } },
    });
    assert.deepEqual(next.candidateLessons.map(item => item.slug), ['lesson-a', 'lesson-b']);

    const reverted = compareSources({
      baseline,
      deps,
      candidateFiles: { 'material-1/pages/a.md': { sha256: 'aa', textFingerprint: 'old' } },
      lessonFingerprints: { 'lesson-a': { 'material-1/pages/a.md': 'new' } },
    });
    assert.equal(reverted.unchanged.some(item => item.path === 'material-1/pages/a.md'), false);
    assert.equal(reverted.changed.some(item => item.path === 'material-1/pages/a.md'), true);
    assert.deepEqual(reverted.candidateLessons.map(item => item.slug), ['lesson-a']);
  });

  it('lists only the adopting lesson when a candidate reverts from snapshot v2 to baseline v1', async () => {
    const school = makeSchool({ shared: false });
    write(join(school, 'public/sources/snapshots/PLAN/material-1/pages/a.md'), page('Alpha page changed'));
    const fileA = join(school, 'src/content/lessons/01-a.md');
    writeFileSync(fileA, readFileSync(fileA, 'utf8').replace(
      'material-1/pages/a.md',
      'snapshots/PLAN/material-1/pages/a.md',
    ));
    const fileB = join(school, 'src/content/lessons/02-b.md');
    writeFileSync(fileB, readFileSync(fileB, 'utf8').replace(
      'material-1/pages/b.md',
      'material-1/pages/a.md',
    ));
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    const { report, exitCode } = await checkSchool(school, {
      source: candidate,
      now: new Date('2026-10-20T01:00:00Z'),
    });
    assert.equal(exitCode, 2);
    assert.deepEqual(report.candidateLessons.map(item => item.slug), ['lesson-a']);
    assert.deepEqual(report.candidateLessons[0].paths, ['material-1/pages/a.md']);
    assert.equal(report.deleted.length, 0);
    assert.equal(report.failed.length, 0);
  });
});

function makeSingleSchool({ fallback = false, multi = false } = {}) {
  const root = temp('single-page-');
  const school = join(root, 'schools', 'single-demo');
  mkdirSync(join(school, 'src/content/lessons'), { recursive: true });
  mkdirSync(join(school, 'public/sources/material-1'), { recursive: true });
  const material = {
    path: 'material-1/original.html',
    url: 'https://example.com/cli',
    readableText: 'material-1/original.html.txt',
  };
  if (fallback) {
    material.crawl = { fallback: 'siteone-crawler failed', tool: 'siteone-crawler' };
  }
  const materials = [material];
  if (multi) {
    mkdirSync(join(school, 'public/sources/material-2/pages'), { recursive: true });
    materials.push({
      path: 'material-2',
      url: 'https://example.com/docs',
      crawl: { tool: 'siteone-crawler' },
    });
    write(join(school, 'public/sources/material-2/pages/guide.md'), page('Guide page'));
  }
  writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
    name: 'single-demo',
    output: 'schools/single-demo',
    materials,
  }, null, 2)}\n`);
  writeFileSync(join(school, 'COURSE.md'), `# single-demo\n\n| 教学主张 / 核心机制 | 官方文档原始位置 | 对应本地副本文件路径 |\n| :--- | :--- | :--- |\n| 单页 | \`cli\` | \`material-1/original.html\` |\n${multi ? '| 文档 | `guide` | `material-2/pages/guide.md` |\n' : ''}`);
  write(join(school, 'public/sources/material-1/original.html'), '<html><body>Hello single page</body></html>');
  write(join(school, 'public/sources/material-1/original.html.txt'), 'Hello single page\n');
  const sources = ['material-1/original.html'];
  if (multi) sources.push('material-2/pages/guide.md');
  write(join(school, 'src/content/lessons/01-a.md'), lessonFile({
    slug: 'lesson-1', order: 1, sources,
  }));
  return school;
}

describe('single page http materials', () => {
  it('reports unchanged when single-page material content did not change', async () => {
    const school = makeSingleSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      fetchSingle: async (material, materialsDir, date) => {
        const dest = join(materialsDir, 'material-1.snapshots', date);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, 'original.html'), '<html><body>Hello single page</body></html>');
        writeFileSync(join(dest, 'original.html.txt'), 'Hello single page\n');
        return { dest };
      },
    });
    assert.equal(exitCode, 0);
    assert.equal(report.changed.length, 0);
    assert.equal(report.unchanged.some(item => item.path === 'material-1/original.html'), true);
    assert.equal(report.failed.length, 0);
  });

  it('reports changed when single-page material content changes', async () => {
    const school = makeSingleSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      fetchSingle: async (material, materialsDir, date) => {
        const dest = join(materialsDir, 'material-1.snapshots', date);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, 'original.html'), '<html><body>Hello modified page</body></html>');
        writeFileSync(join(dest, 'original.html.txt'), 'Hello modified page\n');
        return { dest };
      },
    });
    assert.equal(exitCode, 2);
    assert.equal(report.changed.some(item => item.path === 'material-1/original.html'), true);
    assert.deepEqual(report.candidateLessons.map(item => item.slug), ['lesson-1']);
  });

  it('records failed with reason when download fails and continues checking other materials', async () => {
    const school = makeSingleSchool({ multi: true });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    let crawlCalled = false;
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      fetchSingle: async () => {
        throw new Error('network down 503');
      },
      crawl: async (material, materialsDir, date) => {
        crawlCalled = true;
        const dest = join(materialsDir, 'material-2.snapshots', date);
        mkdirSync(join(dest, 'pages'), { recursive: true });
        writeFileSync(join(dest, 'pages/guide.md'), page('Guide page'));
        return { dest, pages: [{ file: 'pages/guide.md', url: 'https://example.com/docs/guide' }] };
      },
    });
    assert.equal(exitCode, 2);
    assert.equal(crawlCalled, true);
    assert.equal(report.failed.some(item => item.path === 'material-1/original.html' && item.reason.includes('network down 503')), true);
    assert.equal(report.unchanged.some(item => item.path === 'material-2/pages/guide.md'), true);
  });

  it('uses single-page branch for materials with crawl.fallback without triggering crawl', async () => {
    const school = makeSingleSchool({ fallback: true });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    let fetchCalled = false;
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      crawl: async () => {
        throw new Error('crawl should not be called for crawl.fallback material');
      },
      fetchSingle: async (material, materialsDir, date) => {
        fetchCalled = true;
        const dest = join(materialsDir, 'material-1.snapshots', date);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, 'original.html'), '<html><body>Hello single page</body></html>');
        return { dest };
      },
    });
    assert.equal(fetchCalled, true);
    assert.equal(exitCode, 0);
    assert.equal(report.unchanged.some(item => item.path === 'material-1/original.html'), true);
  });

  it('routes successful multi-page docs material to checkDocsMaterial', async () => {
    const school = makeSingleSchool({ multi: true });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    let crawlCalled = false;
    let singleCalled = false;
    await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      fetchSingle: async (material, materialsDir, date) => {
        singleCalled = true;
        const dest = join(materialsDir, 'material-1.snapshots', date);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, 'original.html'), '<html><body>Hello single page</body></html>');
        return { dest };
      },
      crawl: async (material, materialsDir, date) => {
        crawlCalled = true;
        const dest = join(materialsDir, 'material-2.snapshots', date);
        mkdirSync(join(dest, 'pages'), { recursive: true });
        writeFileSync(join(dest, 'pages/guide.md'), page('Guide page'));
        return { dest, pages: [{ file: 'pages/guide.md', url: 'https://example.com/docs/guide' }] };
      },
    });
    assert.equal(crawlCalled, true);
    assert.equal(singleCalled, true);
  });

  it('reports deleted and added when single page extension changes', async () => {
    const school = makeSingleSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      fetchSingle: async (material, materialsDir, date) => {
        const dest = join(materialsDir, 'material-1.snapshots', date);
        mkdirSync(dest, { recursive: true });
        writeFileSync(join(dest, 'original.md'), '# Markdown returned instead\n');
        return { dest };
      },
    });
    assert.equal(exitCode, 2);
    assert.equal(report.deleted.some(item => item.path === 'material-1/original.html'), true);
    assert.equal(report.added.some(item => item.path === 'material-1/original.md'), true);
  });

  it('supports fake download injected via run', async () => {
    const school = makeSingleSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const run = async (cmd, args) => {
      if (cmd === 'curl') {
        const outIdx = args.indexOf('-o');
        const outPath = args[outIdx + 1];
        writeFileSync(outPath, '<!doctype html><html><body><h1>Updated CLI Page</h1><p>' + 'A'.repeat(120) + '</p></body></html>');
        return 'text/html\nhttps://example.com/cli';
      }
      return command(cmd, args);
    };
    const { report, exitCode } = await checkSchool(school, {
      now: new Date('2026-10-20T01:00:00Z'),
      run,
    });
    assert.equal(exitCode, 2);
    assert.equal(report.changed.some(item => item.path === 'material-1/original.html'), true);
  });
});
