import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { completionConditionText } from './generate.mjs';
import { parseFrontmatter, writeBaseline, checkSchool } from './source-state.mjs';
import { runUpdate } from './source-update.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
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

function page(body, retrieved = '2026-10-19') {
  return `<!-- source: https://example.com/${body.split(' ')[0]} -->\n<!-- retrieved: ${retrieved}; tool: siteone-crawler 2.5.1; scope: siteone-domain -->\n\n# ${body}\n\n    keep indent\n`;
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
  完成条件：${slug} done
---

# ${title}

body of ${slug}
`;
}

function makeSchool({ shared = false } = {}) {
  const root = temp('source-update-');
  const school = join(root, 'schools', 'demo');
  mkdirSync(join(school, 'src/content/lessons'), { recursive: true });
  mkdirSync(join(school, 'public/sources/material-1/pages'), { recursive: true });
  writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
    name: 'demo',
    output: 'schools/demo',
    port: 59999,
    materials: [{ path: 'material-1', url: 'https://example.com', crawl: { tool: 'siteone-crawler' } }],
  }, null, 2)}\n`);
  writeFileSync(join(school, 'school.config.ts'), `export default {
  name: "demo-dir",
  publicName: "Public Course",
  shortName: "Public",
};
`);
  writeFileSync(join(school, 'COURSE.md'), `# demo

| 教学主张 / 核心机制 | 官方文档原始位置 | 对应本地副本文件路径 |
| :--- | :--- | :--- |
| 页面 A | \`a/\` | \`pages/a.md\` |
| 页面 B | \`b/\` | \`pages/b.md\` |
| 共享页 | \`shared/\` | \`pages/shared.md\` |
`);
  write(join(school, 'public/sources/material-1/pages/a.md'), page('Alpha page'));
  write(join(school, 'public/sources/material-1/pages/b.md'), page('Beta page'));
  write(join(school, 'public/sources/material-1/pages/shared.md'), page('Shared page'));
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
  const dest = join(temp('update-candidate-'), 'sources');
  cpSync(join(school, 'public/sources'), dest, { recursive: true });
  return dest;
}

function planIdFrom(now) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

function readPlan(school, planId) {
  return JSON.parse(readFileSync(join(school, 'evidence/updates', planId, 'plan.json'), 'utf8'));
}

function savePlan(school, plan) {
  writeFileSync(join(school, 'evidence/updates', plan.planId, 'plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
}

function treeFiles(root) {
  const files = {};
  const walk = (dir, rel = '') => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const key = rel ? `${rel}/${name}` : name;
      if (statSync(full).isDirectory()) walk(full, key);
      else files[key] = readFileSync(full);
    }
  };
  walk(root);
  return files;
}

function lessonSources(school, file) {
  return parseFrontmatter(readFileSync(join(school, 'src/content/lessons', file), 'utf8')).sources;
}

function applyOpts(school, planId, extra = {}) {
  return {
    schoolPath: school,
    options: { apply: true, 'plan-id': planId },
    finish: extra.finish || (async () => {}),
    portBusy: extra.portBusy || (async () => false),
  };
}

function reviseBody(school, file, stamp = 'revised') {
  const path = join(school, 'src/content/lessons', file);
  const text = readFileSync(path, 'utf8');
  writeFileSync(path, text.replace(/\n# /, `\n# ${stamp} `));
}

function writeLesson(school, file, spec) {
  write(join(school, 'src/content/lessons', file), lessonFile(spec));
}

function setVerdict(plan, path, verdict, extra = {}) {
  const change = plan.changes.find(item => item.path === path);
  assert.ok(change, `missing change ${path}`);
  change.verdict = verdict;
  Object.assign(change, extra);
}

async function planned({ shared = false, mutate, withSource = true } = {}) {
  const school = makeSchool({ shared });
  await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
  const candidate = copySources(school);
  mutate(candidate, school);
  await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
  const now = new Date('2026-10-20T02:00:00Z');
  await runUpdate({
    schoolPath: school,
    options: withSource ? { plan: true, source: [candidate] } : { plan: true },
    originalCwd: '/',
    now,
  });
  return { school, candidate, planId: planIdFrom(now) };
}

describe('update --plan', () => {
  it('writes a pending plan, snapshots, and seen.json without changing public copies', async () => {
    const originalB = page('Beta page');
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    assert.equal(plan.runId, '20261020T010000Z');
    assert.equal(plan.routeReview, false);
    assert.deepEqual(plan.routeReviewReasons, []);
    assert.equal(plan.changes.every(item => item.verdict === '待判定'), true);
    assert.equal(plan.changes.find(item => item.path === 'material-1/pages/b.md').bytesMissing, false);
    assert.equal(plan.changes.find(item => item.path === 'material-1/pages/b.md').snapshotSha256.length, 64);
    assert.equal(plan.publicSources.some(item => item.path === 'material-1/pages/b.md'), true);
    const seen = JSON.parse(readFileSync(join(school, 'source-state/seen.json'), 'utf8'));
    assert.equal(seen.lastSeenSnapshot, planId);
    assert.equal(seen.lessons['lesson-a'].adoptedSnapshot, null);
    assert.equal(seen.lessons['lesson-b'].adoptedSnapshot, null);
    assert.equal(
      readFileSync(join(school, 'public/sources/snapshots', planId, 'material-1/pages/b.md'), 'utf8'),
      page('Beta page changed'),
    );
    assert.equal(readFileSync(join(school, 'public/sources/material-1/pages/b.md'), 'utf8'), originalB);
  });

  it('does not snapshot a --source file whose hash does not match the report', async () => {
    const school = makeSchool();
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page replaced after check'));
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    const row = plan.changes.find(item => item.path === 'material-1/pages/b.md');
    assert.equal(row.bytesMissing, true);
    assert.equal(row.snapshotSha256, undefined);
    assert.equal(existsSync(join(school, 'public/sources/snapshots', planId, 'material-1/pages/b.md')), false);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /source bytes are missing/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
  });
});

describe('update --prepare-only', () => {
  it('rejects a plan that still has 待判定', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/a.md'), page('Alpha page changed'));
      },
    });
    const before = readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8');
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /待判定/,
    );
    assert.equal(existsSync(join(school, 'UPDATE.md')), false);
    assert.equal(readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8'), before);
  });

  it('rejects 局部修订 when candidate lessons are more than half the route', async () => {
    const { school, planId } = await planned({
      shared: true,
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/shared.md'), page('Shared page changed'));
      },
    });
    const plan = readPlan(school, planId);
    assert.equal(plan.routeReview, true);
    assert.equal(plan.routeReviewReasons.includes('候选关超过一半'), true);
    setVerdict(plan, 'material-1/pages/shared.md', '局部修订', { lessons: ['lesson-a'] });
    savePlan(school, plan);
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /需要重排路线|缩小范围/,
    );
    assert.equal(existsSync(join(school, 'UPDATE.md')), false);
  });

  it('rejects prepare when a lesson body changed after the plan', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    const file = join(school, 'src/content/lessons/02-b.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('body of lesson-b', 'body of lesson-b changed'));
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /not allowed to change/,
    );
    assert.equal(existsSync(join(school, 'UPDATE.md')), false);
    assert.equal(readPlan(school, planId).preparedLessonSha256, undefined);
  });
});

describe('update --apply', () => {
  it('rejects a slug or 完成条件 change on a 局部修订 lesson', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    const file = join(school, 'src/content/lessons/02-b.md');
    const original = readFileSync(file, 'utf8');
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    writeFileSync(file, original.replace('slug: "lesson-b"', 'slug: "lesson-b-renamed"'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /slug/);
    writeFileSync(file, original.replace('完成条件：lesson-b done', '完成条件：lesson-b changed'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /完成条件/);
    writeFileSync(file, original);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
  });

  it('rejects edits to a 无教学影响 lesson', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/a.md'), page('Alpha page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/a.md', '无教学影响', { reason: 'only a recovered date in an unused example' });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    const file = join(school, 'src/content/lessons/01-a.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('body of lesson-a', 'body of lesson-a changed'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /not allowed to change/);
    assert.deepEqual(lessonSources(school, '01-a.md'), ['material-1/pages/a.md']);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
  });

  it('retargets only revised lessons and is a no-op on repeat apply', async () => {
    const originalB = page('Beta page');
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({
      schoolPath: school,
      options: { 'prepare-only': true, 'plan-id': planId },
    });
    assert.match(readFileSync(join(school, 'UPDATE.md'), 'utf8'), /lesson-b/);
    assert.match(readFileSync(join(school, 'UPDATE.md'), 'utf8'), /不要运行 retry/);
    reviseBody(school, '02-b.md');
    await runUpdate(applyOpts(school, planId));
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${planId}/material-1/pages/b.md`]);
    assert.deepEqual(lessonSources(school, '01-a.md'), ['material-1/pages/a.md']);
    assert.equal(readFileSync(join(school, 'public/sources/material-1/pages/b.md'), 'utf8'), originalB);
    const adoptions = JSON.parse(readFileSync(join(school, 'source-state/adoptions.json'), 'utf8'));
    assert.equal(adoptions.lessons['lesson-b'].adoptedSnapshot, planId);
    assert.equal(adoptions.lessons['lesson-a'], undefined);
    const seen = JSON.parse(readFileSync(join(school, 'source-state/seen.json'), 'utf8'));
    assert.equal(seen.lessons['lesson-b'].adoptedSnapshot, null);
    const afterFirst = treeFiles(school);
    await runUpdate(applyOpts(school, planId));
    const afterSecond = treeFiles(school);
    assert.deepEqual(afterSecond, afterFirst);
  });

  it('does not apply when the school port is busy', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    let finished = false;
    await assert.rejects(
      () => runUpdate(applyOpts(school, planId, {
        finish: async () => { finished = true; },
        portBusy: async () => true,
      })),
      /先停止该校开发服务/,
    );
    assert.equal(finished, false);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply when an unnamed lesson changes after prepare', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    const file = join(school, 'src/content/lessons/01-a.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('body of lesson-a', 'body of lesson-a changed'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /not allowed to change/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('retargets lessons already on an old snapshot to the new plan snapshot', async () => {
    const { school, candidate, planId: plan1 } = await planned({
      mutate(next) {
        write(join(next, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const first = readPlan(school, plan1);
    setVerdict(first, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, first);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': plan1 } });
    reviseBody(school, '02-b.md', 'once');
    await runUpdate(applyOpts(school, plan1));
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${plan1}/material-1/pages/b.md`]);

    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed again'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T03:00:00Z') });
    const now2 = new Date('2026-10-20T04:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now: now2,
    });
    const plan2 = planIdFrom(now2);
    const second = readPlan(school, plan2);
    setVerdict(second, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, second);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': plan2 } });
    reviseBody(school, '02-b.md', 'twice');
    await runUpdate(applyOpts(school, plan2));
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${plan2}/material-1/pages/b.md`]);
    const adoptions = JSON.parse(readFileSync(join(school, 'source-state/adoptions.json'), 'utf8'));
    assert.equal(adoptions.planId, plan2);
    assert.equal(adoptions.lessons['lesson-b'].adoptedSnapshot, plan2);
  });

  it('rejects apply when the snapshot directory contains an unplanned file', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/sources/snapshots', planId, 'material-1/pages/extra.md'), page('Extra copy'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /Unexpected snapshot file/);
    assert.deepEqual(lessonSources(school, '01-a.md'), ['material-1/pages/a.md']);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply when the snapshot directory contains skipped junk such as .DS_Store or dist/', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/sources/snapshots', planId, '.DS_Store'), 'Finder junk');
    write(join(school, 'public/sources/snapshots', planId, 'dist/artifact.js'), 'build output');
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /Unexpected snapshot file/);
    assert.deepEqual(lessonSources(school, '01-a.md'), ['material-1/pages/a.md']);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply of a plan superseded by a later applied plan', async () => {
    const { school, candidate, planId: plan1 } = await planned({
      mutate(next) {
        write(join(next, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const first = readPlan(school, plan1);
    setVerdict(first, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, first);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': plan1 } });
    reviseBody(school, '02-b.md', 'once');
    await runUpdate(applyOpts(school, plan1));

    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed again'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T03:00:00Z') });
    const now2 = new Date('2026-10-20T04:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now: now2,
    });
    const plan2 = planIdFrom(now2);
    const second = readPlan(school, plan2);
    setVerdict(second, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, second);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': plan2 } });
    reviseBody(school, '02-b.md', 'twice');
    await runUpdate(applyOpts(school, plan2));
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${plan2}/material-1/pages/b.md`]);

    await assert.rejects(() => runUpdate(applyOpts(school, plan1)), /计划已被取代/);
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${plan2}/material-1/pages/b.md`]);
    const adoptions = JSON.parse(readFileSync(join(school, 'source-state/adoptions.json'), 'utf8'));
    assert.equal(adoptions.planId, plan2);
    assert.equal(adoptions.createdAt, second.createdAt);
    assert.equal(adoptions.lessons['lesson-b'].adoptedSnapshot, plan2);
  });

  it('rejects apply when an existing public source copy changes', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/sources/material-1/pages/a.md'), page('Alpha page tampered'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /public\/sources/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('restores lesson sources when finish throws', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    reviseBody(school, '02-b.md');
    const beforeA = lessonSources(school, '01-a.md');
    const beforeB = lessonSources(school, '02-b.md');
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
    };
    try {
      await assert.rejects(
        () => runUpdate(applyOpts(school, planId, {
          finish: async () => {
            throw new Error('injected finish failure');
          },
        })),
        /injected finish failure/,
      );
    } finally {
      console.log = originalLog;
    }
    assert.equal(logs.some(line => line.includes('已应用')), false);
    assert.deepEqual(lessonSources(school, '01-a.md'), beforeA);
    assert.deepEqual(lessonSources(school, '02-b.md'), beforeB);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('plans and applies a local revision for a single-page material', async () => {
    const root = temp('single-update-');
    const school = join(root, 'schools', 'demo');
    mkdirSync(join(school, 'src/content/lessons'), { recursive: true });
    mkdirSync(join(school, 'public/sources/material-1'), { recursive: true });
    writeFileSync(join(school, 'school.settings.json'), `${JSON.stringify({
      name: 'demo',
      output: 'schools/demo',
      materials: [{
        path: 'material-1/original.html',
        url: 'https://example.com/doc',
        readableText: 'material-1/original.html.txt',
      }],
    }, null, 2)}\n`);
    writeFileSync(join(school, 'COURSE.md'), '# demo\n\n| 教学主张 | 官方文档位置 | 本地副本 |\n| :--- | :--- | :--- |\n| 主张 A | `doc#a` | `material-1/base.md` |\n| 主张 B | `doc#b` | `material-1/original.html` |\n| 主张 C | `doc#c` | `material-1/extra.md` |\n');
    write(join(school, 'public/sources/material-1/base.md'), 'Base doc\n');
    write(join(school, 'public/sources/material-1/original.html'), '<html><body>Version 1</body></html>');
    write(join(school, 'public/sources/material-1/extra.md'), 'Extra doc\n');
    write(join(school, 'src/content/lessons/01-a.md'), lessonFile({
      slug: 'lesson-a', order: 1, sources: ['material-1/base.md'],
    }));
    write(join(school, 'src/content/lessons/02-b.md'), lessonFile({
      slug: 'lesson-b', order: 2, sources: ['material-1/original.html'],
    }));
    write(join(school, 'src/content/lessons/03-c.md'), lessonFile({
      slug: 'lesson-c', order: 3, sources: ['material-1/extra.md'],
    }));
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });

    const candidate = join(temp('single-candidate-'), 'sources');
    mkdirSync(join(candidate, 'material-1'), { recursive: true });
    write(join(candidate, 'material-1/base.md'), 'Base doc\n');
    write(join(candidate, 'material-1/original.html'), '<html><body>Version 2</body></html>');
    write(join(candidate, 'material-1/extra.md'), 'Extra doc\n');

    const checkNow = new Date('2026-10-20T01:00:00Z');
    const { report, exitCode } = await checkSchool(school, { source: candidate, now: checkNow });
    assert.equal(exitCode, 2);
    assert.equal(report.changed.some(item => item.path === 'material-1/original.html'), true);

    const planNow = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now: planNow,
    });
    const planId = planIdFrom(planNow);
    const plan = readPlan(school, planId);
    assert.equal(plan.routeReview, false);
    assert.equal(plan.changes.find(item => item.path === 'material-1/original.html').bytesMissing, false);
    assert.equal(
      readFileSync(join(school, 'public/sources/snapshots', planId, 'material-1/original.html'), 'utf8'),
      '<html><body>Version 2</body></html>',
    );

    setVerdict(plan, 'material-1/original.html', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    reviseBody(school, '02-b.md');
    await runUpdate(applyOpts(school, planId));

    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${planId}/material-1/original.html`]);
  });
});

describe('local revision kind and named lessons', () => {
  it('rejects 局部修订 for deleted, failed, and unobserved without editing lessons', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        rmSync(join(candidate, 'material-1/pages/b.md'));
      },
    });
    const beforeA = readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8');
    const beforeB = readFileSync(join(school, 'src/content/lessons/02-b.md'), 'utf8');
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /changed or added/,
    );
    assert.equal(readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8'), beforeA);
    assert.equal(readFileSync(join(school, 'src/content/lessons/02-b.md'), 'utf8'), beforeB);

    for (const kind of ['failed', 'unobserved']) {
      const copy = readPlan(school, planId);
      const row = copy.changes.find(item => item.path === 'material-1/pages/b.md');
      row.kind = kind;
      row.verdict = '局部修订';
      row.lessons = ['lesson-b'];
      savePlan(school, copy);
      await assert.rejects(
        () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
        /changed or added/,
      );
    }
    assert.equal(readFileSync(join(school, 'src/content/lessons/02-b.md'), 'utf8'), beforeB);
  });

  it('still allows deleted, failed, and unobserved to be 无教学影响, 需要重排路线, or 暂无法判断', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        rmSync(join(candidate, 'material-1/pages/b.md'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '无教学影响', { reason: 'unused example' });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    assert.equal(existsSync(join(school, 'UPDATE.md')), true);

    for (const [kind, verdict] of [['failed', '需要重排路线'], ['unobserved', '暂无法判断']]) {
      const copy = readPlan(school, planId);
      const row = copy.changes.find(item => item.path === 'material-1/pages/b.md');
      row.kind = kind;
      row.verdict = verdict;
      row.reason = `${kind} handled as ${verdict}`;
      delete row.lessons;
      savePlan(school, copy);
      await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    }
  });

  it('rejects a 局部修订 that names a lesson which does not reference the page', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const before = readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8');
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-a'] });
    savePlan(school, plan);
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /does not reference/,
    );
    assert.equal(readFileSync(join(school, 'src/content/lessons/01-a.md'), 'utf8'), before);
    assert.equal(existsSync(join(school, 'UPDATE.md')), false);
  });
});

describe('apply requires a real lesson edit', () => {
  it('rejects apply when a named lesson was not revised after prepare', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /课文尚未按计划修订/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });
});

describe('retarget only local-revision sources', () => {
  it('does not retarget a 暂无法判断 source on the same lesson', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/material-1/pages/extra.md'), page('Extra page'));
    writeLesson(school, '02-b.md', {
      slug: 'lesson-b',
      order: 2,
      sources: ['material-1/pages/b.md', 'material-1/pages/extra.md'],
    });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    write(join(candidate, 'material-1/pages/extra.md'), page('Extra page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    assert.equal(plan.routeReview, false);
    setVerdict(plan, 'material-1/pages/extra.md', '局部修订', { lessons: ['lesson-b'] });
    setVerdict(plan, 'material-1/pages/b.md', '暂无法判断', { reason: 'upstream edit is incomplete' });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    reviseBody(school, '02-b.md');
    await runUpdate(applyOpts(school, planId));
    assert.deepEqual(lessonSources(school, '02-b.md'), [
      'material-1/pages/b.md',
      `snapshots/${planId}/material-1/pages/extra.md`,
    ]);
  });
});

describe('next check uses adopted snapshot bytes', () => {
  it('does not relist an adopted lesson until the candidate changes again', async () => {
    const { school, candidate, planId } = await planned({
      mutate(next) {
        write(join(next, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    reviseBody(school, '02-b.md');
    await runUpdate(applyOpts(school, planId));
    assert.deepEqual(lessonSources(school, '02-b.md'), [`snapshots/${planId}/material-1/pages/b.md`]);

    const same = await checkSchool(school, { source: candidate, now: new Date('2026-10-20T03:00:00Z') });
    assert.equal(same.report.candidateLessons.some(item => item.slug === 'lesson-b'), false);
    assert.equal(same.report.deleted.some(item => item.path === 'material-1/pages/b.md'), false);
    assert.equal(same.report.failed.some(item => item.path === 'material-1/pages/b.md'), false);
    assert.equal(same.report.deleted.some(item => String(item.path).includes('snapshots/')), false);

    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed again'));
    const next = await checkSchool(school, { source: candidate, now: new Date('2026-10-20T03:01:00Z') });
    assert.deepEqual(next.report.candidateLessons.map(item => item.slug), ['lesson-b']);
    assert.deepEqual(next.report.candidateLessons[0].paths, ['material-1/pages/b.md']);
  });

  it('lists only the adopting lesson when the candidate reverts to baseline v1', async () => {
    const { school, candidate, planId } = await planned({
      mutate(next) {
        write(join(next, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    reviseBody(school, '02-b.md');
    await runUpdate(applyOpts(school, planId));
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page'));
    const reverted = await checkSchool(school, { source: candidate, now: new Date('2026-10-20T03:02:00Z') });
    assert.equal(reverted.exitCode, 2);
    assert.deepEqual(reverted.report.candidateLessons.map(item => item.slug), ['lesson-b']);
    assert.deepEqual(reverted.report.candidateLessons[0].paths, ['material-1/pages/b.md']);
    assert.equal(reverted.report.candidateLessons.some(item => item.slug === 'lesson-a'), false);
  });
});

describe('route review reasons', () => {
  it('sets 入口 when the lowest-order lesson is a candidate', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/a.md'), page('Alpha page changed'));
      },
    });
    const plan = readPlan(school, planId);
    assert.equal(plan.routeReview, true);
    assert.equal(plan.routeReviewReasons.includes('入口'), true);
    assert.equal(plan.routeReviewReasons.includes('候选关超过一半'), false);
    setVerdict(plan, 'material-1/pages/a.md', '局部修订', { lessons: ['lesson-a'] });
    savePlan(school, plan);
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /需要重排路线|缩小范围/,
    );
  });

  it('sets 索引 when a changed path is a source of the first lesson and another', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/material-1/pages/c.md'), page('Gamma page'));
    write(join(school, 'public/sources/material-1/pages/d.md'), page('Delta page'));
    write(join(school, 'public/sources/material-1/pages/ac.md'), page('AC shared'));
    writeLesson(school, '01-a.md', {
      slug: 'lesson-a', order: 1, sources: ['material-1/pages/a.md', 'material-1/pages/ac.md'],
    });
    writeLesson(school, '03-c.md', {
      slug: 'lesson-c', order: 3, sources: ['material-1/pages/c.md', 'material-1/pages/ac.md'],
    });
    writeLesson(school, '04-d.md', { slug: 'lesson-d', order: 4, sources: ['material-1/pages/d.md'] });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/ac.md'), page('AC shared changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const plan = readPlan(school, planIdFrom(now));
    assert.equal(plan.routeReview, true);
    assert.equal(plan.routeReviewReasons.includes('索引'), true);
    assert.equal(plan.routeReviewReasons.includes('入口'), true);
    assert.equal(plan.routeReviewReasons.includes('候选关超过一半'), false);
  });

  it('sets 前置 when a changed path is shared by consecutive lessons', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/material-1/pages/c.md'), page('Gamma page'));
    write(join(school, 'public/sources/material-1/pages/d.md'), page('Delta page'));
    write(join(school, 'public/sources/material-1/pages/bc.md'), page('BC shared'));
    writeLesson(school, '02-b.md', {
      slug: 'lesson-b', order: 2, sources: ['material-1/pages/b.md', 'material-1/pages/bc.md'],
    });
    writeLesson(school, '03-c.md', {
      slug: 'lesson-c', order: 3, sources: ['material-1/pages/c.md', 'material-1/pages/bc.md'],
    });
    writeLesson(school, '04-d.md', { slug: 'lesson-d', order: 4, sources: ['material-1/pages/d.md'] });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/bc.md'), page('BC shared changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const plan = readPlan(school, planIdFrom(now));
    assert.equal(plan.routeReview, true);
    assert.equal(plan.routeReviewReasons.includes('前置'), true);
    assert.equal(plan.routeReviewReasons.includes('入口'), false);
    assert.equal(plan.routeReviewReasons.includes('候选关超过一半'), false);
  });

  it('does not treat every index.md page as an index', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/material-1/pages/guide/index.md'), page('Guide index'));
    writeLesson(school, '02-b.md', {
      slug: 'lesson-b',
      order: 2,
      sources: ['material-1/pages/b.md', 'material-1/pages/guide/index.md'],
    });
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/guide/index.md'), page('Guide index changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const plan = readPlan(school, planIdFrom(now));
    assert.equal(plan.routeReview, false);
    assert.deepEqual(plan.routeReviewReasons, []);
  });
});

describe('completion condition markers', () => {
  it('fails closed when a lesson has neither 完成条件 nor Completion condition', async () => {
    const { school, planId } = await planned({
      mutate(candidate) {
        write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
      },
    });
    const file = join(school, 'src/content/lessons/02-b.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('完成条件：lesson-b done', 'no marker here'));
    const plan = readPlan(school, planId);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await assert.rejects(
      () => runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } }),
      /missing 完成条件 or Completion condition/,
    );
  });

  it('hashes from Completion condition when 完成条件 is absent', () => {
    const text = lessonFile({ slug: 'en', order: 1, sources: ['material-1/pages/b.md'] })
      .replace('完成条件：en done', 'Completion condition: en done');
    assert.match(completionConditionText(text), /^Completion condition: en done/);
    const zh = lessonFile({ slug: 'zh', order: 1, sources: ['material-1/pages/b.md'] });
    assert.match(completionConditionText(zh), /^完成条件：zh done/);
  });
});

describe('protected trees', () => {
  it('rejects apply after an older snapshot file changes', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/snapshots/old-plan/material-1/pages/a.md'), page('Old snap'));
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    assert.equal(plan.protectedFiles.some(item => item.path === 'public/sources/snapshots/old-plan/material-1/pages/a.md'), true);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/sources/snapshots/old-plan/material-1/pages/a.md'), page('Old snap tampered'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /not allowed to change|missing/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply after a public/activities file changes', async () => {
    const school = makeSchool();
    write(join(school, 'public/activities/keep.html'), '<p>keep</p>\n');
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    assert.equal(plan.protectedFiles.some(item => item.path === 'public/activities/keep.html'), true);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/activities/keep.html'), '<p>changed</p>\n');
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /not allowed to change|missing/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply after an older snapshot dist/artifact.js changes', async () => {
    const school = makeSchool();
    write(join(school, 'public/sources/snapshots/old-plan/dist/artifact.js'), 'old artifact\n');
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    assert.equal(plan.protectedFiles.some(item => item.path === 'public/sources/snapshots/old-plan/dist/artifact.js'), true);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    write(join(school, 'public/sources/snapshots/old-plan/dist/artifact.js'), 'tampered artifact\n');
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /not allowed to change|missing/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });

  it('rejects apply after public/activities/dist/extra.js is deleted', async () => {
    const school = makeSchool();
    write(join(school, 'public/activities/dist/extra.js'), 'keep extra\n');
    await writeBaseline(school, { now: new Date('2026-10-20T00:00:00Z') });
    const candidate = copySources(school);
    write(join(candidate, 'material-1/pages/b.md'), page('Beta page changed'));
    await checkSchool(school, { source: candidate, now: new Date('2026-10-20T01:00:00Z') });
    const now = new Date('2026-10-20T02:00:00Z');
    await runUpdate({
      schoolPath: school,
      options: { plan: true, source: [candidate] },
      originalCwd: '/',
      now,
    });
    const planId = planIdFrom(now);
    const plan = readPlan(school, planId);
    assert.equal(plan.protectedFiles.some(item => item.path === 'public/activities/dist/extra.js'), true);
    setVerdict(plan, 'material-1/pages/b.md', '局部修订', { lessons: ['lesson-b'] });
    savePlan(school, plan);
    await runUpdate({ schoolPath: school, options: { 'prepare-only': true, 'plan-id': planId } });
    rmSync(join(school, 'public/activities/dist/extra.js'));
    await assert.rejects(() => runUpdate(applyOpts(school, planId)), /missing|not allowed to change/);
    assert.deepEqual(lessonSources(school, '02-b.md'), ['material-1/pages/b.md']);
    assert.equal(existsSync(join(school, 'source-state/adoptions.json')), false);
  });
});

describe('default finish', () => {
  it('validates and builds but does not deploy', () => {
    const text = readFileSync(new URL('./source-update.mjs', import.meta.url), 'utf8');
    const start = text.indexOf('export async function defaultFinish');
    const end = text.indexOf('export async function runUpdate');
    const fn = text.slice(start, end);
    assert.match(fn, /validateGeneration/);
    assert.match(fn, /buildSchool/);
    assert.match(fn, /真实教学尚未验证/);
    assert.equal(/deploy/.test(fn), false);
  });
});

describe('help', () => {
  it('lists the three update commands', () => {
    const out = execFileSync('node', [join(repoRoot, 'scripts/school.mjs'), '--help'], {
      encoding: 'utf8',
      cwd: repoRoot,
    });
    assert.match(out, /update NAME --plan/);
    assert.match(out, /update NAME --prepare-only --plan-id PLAN_ID/);
    assert.match(out, /update NAME --apply --plan-id PLAN_ID/);
  });
});
