import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogFingerprint, PUBLICATION_GROUPS } from '../school-kit/overlay/src/lib/publication.ts';
import { EMPTY_TOPIC_MESSAGE, loadRegistry, runCatalog } from './catalog.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const schoolCli = join(repoRoot, 'scripts/school.mjs');
const dirs = [];
const servers = [];

after(() => {
  for (const server of servers) server.close();
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

function snapshot(dir) {
  const files = {};
  if (!existsSync(dir)) return files;
  const walk = (current, prefix = '') => {
    for (const name of readdirSync(current, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${name.name}` : name.name;
      const path = join(current, name.name);
      if (name.isDirectory()) walk(path, relative);
      else files[relative] = readFileSync(path);
    }
  };
  walk(dir);
  return files;
}

function assertSameBytes(left, right) {
  assert.deepEqual(Object.keys(left).sort(), Object.keys(right).sort());
  for (const name of Object.keys(left)) {
    assert.deepEqual(left[name], right[name], name);
  }
}

const LESSON_BODY = '课文正文：解释器唤出的全部说明，测试时不得出现。';
const DECOY_TITLE = '七年级数学上册不该出现';

async function makeCatalog(overrides = {}) {
  const origin = overrides.origin ?? 'https://python.example';
  const lessons = overrides.lessons ?? [
    { title: '第一关', url: `${origin}/lessons/first/`, body: LESSON_BODY },
    { title: '第二关', url: `${origin}/lessons/second/`, body: LESSON_BODY },
  ];
  const fields = {
    name: overrides.name ?? 'Python 官方教程 AI 互动课程',
    origin,
    group: overrides.group ?? '编程语言、后端与开发环境',
    intro: overrides.intro ?? '按官方教程学完基础。',
    prerequisites: overrides.prerequisites ?? '零基础，不需要先学别的课。',
    outcomes: overrides.outcomes ?? '能独立写一个文本处理小脚本。',
    lessons: lessons.map(({ title, url }) => ({ title, url })),
  };
  return {
    ...fields,
    lessons,
    fingerprint: overrides.fingerprint ?? await catalogFingerprint(fields),
  };
}

function startCatalogServer(initial) {
  let payload = initial;
  let status = 200;
  const server = createServer((req, res) => {
    if (req.url !== '/catalog.json') {
      res.writeHead(404);
      res.end('missing');
      return;
    }
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      servers.push(server);
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}/catalog.json`,
        setPayload(next) { payload = next; },
        setStatus(next) { status = next; },
      });
    });
  });
}

function workspace() {
  const root = temp('portal-catalog-');
  mkdirSync(join(root, 'schools', 'math-grade7'), { recursive: true });
  write(join(root, 'schools', 'math-grade7', 'school.settings.json'), `${JSON.stringify({ name: 'math-grade7' }, null, 2)}\n`);
  write(join(root, 'schools', 'math-grade7', 'catalog.json'), `${JSON.stringify({
    name: DECOY_TITLE,
    origin: 'https://shuxue.learnislands.com',
    group: '数据科学、测试及其他应用',
    intro: ' decoy ',
    prerequisites: 'decoy',
    outcomes: 'decoy',
    lessons: [{ title: '不该出现的关', url: 'https://shuxue.learnislands.com/lessons/one/' }],
    fingerprint: 'decoy',
  }, null, 2)}\n`);
  return {
    root,
    registryPath: join(root, 'portal', 'registry.json'),
    distPath: join(root, 'portal', 'dist'),
  };
}

function writeRegistry(path, catalogs) {
  write(path, `${JSON.stringify({ catalogs }, null, 2)}\n`);
}

async function builtSite() {
  const catalog = await makeCatalog();
  const fake = await startCatalogServer(catalog);
  const ctx = workspace();
  writeRegistry(ctx.registryPath, [fake.url]);
  await runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
  return { ...ctx, catalog, fake };
}

function cli(args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('node', [schoolCli, ...args], { encoding: 'utf8', cwd: repoRoot }),
      stderr: '',
    };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || error.message),
    };
  }
}

describe('catalog CLI usage', () => {
  it('lists the two catalog commands in help', () => {
    const out = execFileSync('node', [schoolCli, '--help'], { encoding: 'utf8', cwd: repoRoot });
    assert.match(out, /catalog --check/);
    assert.match(out, /catalog --build/);
  });

  it('fails when catalog has no flag, both flags, or a school name', () => {
    const none = cli(['catalog']);
    assert.notEqual(none.status, 0);
    assert.match(`${none.stderr}${none.stdout}`, /catalog --check/);
    assert.doesNotMatch(`${none.stderr}${none.stdout}`, /School name/);

    const both = cli(['catalog', '--check', '--build']);
    assert.notEqual(both.status, 0);
    assert.match(`${both.stderr}${both.stdout}`, /catalog --check/);

    const named = cli(['catalog', 'python-official', '--check']);
    assert.notEqual(named.status, 0);
    assert.match(`${named.stderr}${named.stdout}`, /不接受 School 名/);
  });

  it('rejects --check and --build on other commands', () => {
    const listCheck = cli(['list', '--check']);
    assert.notEqual(listCheck.status, 0);
    assert.match(`${listCheck.stderr}${listCheck.stdout}`, /--check is only valid with sources or catalog/);

    const sourcesBuild = cli(['sources', 'demo', '--build']);
    assert.notEqual(sourcesBuild.status, 0);
    assert.match(`${sourcesBuild.stderr}${sourcesBuild.stdout}`, /--build is only valid with catalog/);
  });
});

describe('registry', () => {
  it('rejects local paths and does not pick up a grade-7 directory', async () => {
    const ctx = workspace();
    for (const local of [
      join(ctx.root, 'schools', 'math-grade7', 'catalog.json'),
      './schools/math-grade7/catalog.json',
      'schools/math-grade7/catalog.json',
      `file://${join(ctx.root, 'schools', 'math-grade7', 'catalog.json')}`,
    ]) {
      writeRegistry(ctx.registryPath, [local]);
      assert.throws(() => loadRegistry(ctx.registryPath), /本地路径/);
      await assert.rejects(
        () => runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
        /本地路径/,
      );
    }

    const catalog = await makeCatalog();
    const fake = await startCatalogServer(catalog);
    writeRegistry(ctx.registryPath, [fake.url]);
    await runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
    const home = readFileSync(join(ctx.distPath, 'index.html'), 'utf8');
    const topic = readFileSync(join(ctx.distPath, 'topics', '数据科学、测试及其他应用', 'index.html'), 'utf8');
    assert.doesNotMatch(home, new RegExp(DECOY_TITLE));
    assert.doesNotMatch(topic, new RegExp(DECOY_TITLE));
    assert.match(topic, new RegExp(EMPTY_TOPIC_MESSAGE));
    assert.equal(existsSync(join(ctx.distPath, 'courses', DECOY_TITLE, 'index.html')), false);
  });
});

describe('portal pages', () => {
  it('builds six plaques, a course path, and apex-only sitemap', async () => {
    const { distPath, catalog } = await builtSite();
    const home = readFileSync(join(distPath, 'index.html'), 'utf8');
    assert.match(home, /lang="zh"/);
    assert.match(home, /学习岛屿/);
    for (const group of PUBLICATION_GROUPS) {
      assert.match(home, new RegExp(`href="/topics/${group}/"`));
      assert.match(home, new RegExp(group));
      const topic = readFileSync(join(distPath, 'topics', group, 'index.html'), 'utf8');
      assert.match(topic, new RegExp(group));
      if (group === catalog.group) {
        assert.match(topic, new RegExp(catalog.name));
        assert.match(topic, new RegExp(`href="/courses/${catalog.name}/"`));
      } else {
        assert.match(topic, new RegExp(EMPTY_TOPIC_MESSAGE));
        assert.doesNotMatch(topic, /Python 官方教程/);
      }
    }

    const course = readFileSync(join(distPath, 'courses', catalog.name, 'index.html'), 'utf8');
    assert.match(course, /适合谁/);
    assert.match(course, new RegExp(catalog.prerequisites));
    assert.match(course, /学什么/);
    assert.match(course, new RegExp(catalog.intro));
    assert.match(course, new RegExp(catalog.outcomes));
    assert.match(course, /完整路径/);
    const first = course.indexOf('第一关');
    const second = course.indexOf('第二关');
    assert.ok(first >= 0 && second > first);
    assert.match(course, /href="https:\/\/python\.example\/lessons\/first\/"/);
    assert.match(course, /href="https:\/\/python\.example\/lessons\/second\/"/);
    assert.match(course, /href="https:\/\/python\.example\/"/);
    assert.doesNotMatch(course, new RegExp(LESSON_BODY));
    assert.doesNotMatch(course, /课文正文/);

    const sitemap = readFileSync(join(distPath, 'sitemap.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(locs, [
      'https://learnislands.com/',
      ...PUBLICATION_GROUPS.map((group) => `https://learnislands.com/topics/${group}/`),
      `https://learnislands.com/courses/${catalog.name}/`,
    ]);
    assert.doesNotMatch(sitemap, /python\.example\/lessons/);
    assert.doesNotMatch(sitemap, /shuxue\.learnislands/);

    const robots = readFileSync(join(distPath, 'robots.txt'), 'utf8');
    assert.match(robots, /Sitemap: https:\/\/learnislands.com\/sitemap.xml/);
  });
});

describe('build stability', () => {
  it('does not write dist on --check, and keeps bytes when fingerprints stay the same', async () => {
    const catalog = await makeCatalog();
    const fake = await startCatalogServer(catalog);
    const ctx = workspace();
    writeRegistry(ctx.registryPath, [fake.url]);
    await runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
    assert.equal(existsSync(ctx.distPath), false);

    await runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
    const first = snapshot(ctx.distPath);
    const homeBefore = statSync(join(ctx.distPath, 'index.html'));
    await runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
    assertSameBytes(snapshot(ctx.distPath), first);
    const homeAfter = statSync(join(ctx.distPath, 'index.html'));
    assert.equal(homeAfter.mtimeMs, homeBefore.mtimeMs);
  });

  it('keeps the previous dist when one catalog returns 500 or a bad fingerprint', async () => {
    const catalog = await makeCatalog();
    const fake = await startCatalogServer(catalog);
    const ctx = workspace();
    writeRegistry(ctx.registryPath, [fake.url]);
    await runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath });
    const previous = snapshot(ctx.distPath);
    assert.equal(existsSync(join(ctx.distPath, 'courses', catalog.name, 'index.html')), true);

    fake.setStatus(500);
    await assert.rejects(
      () => runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /HTTP 500/,
    );
    assertSameBytes(snapshot(ctx.distPath), previous);

    fake.setStatus(200);
    fake.setPayload({ ...catalog, fingerprint: '0'.repeat(64) });
    await assert.rejects(
      () => runCatalog({ build: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /指纹不一致/,
    );
    assertSameBytes(snapshot(ctx.distPath), previous);
  });
});

describe('catalog validation', () => {
  it('fails on a missing field, illegal group, or lesson URL outside the origin', async () => {
    const catalog = await makeCatalog();
    const fake = await startCatalogServer(catalog);
    const ctx = workspace();
    writeRegistry(ctx.registryPath, [fake.url]);

    fake.setPayload({ ...catalog, prerequisites: '' });
    await assert.rejects(
      () => runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /prerequisites/,
    );

    fake.setPayload({ ...await makeCatalog({ group: 'Frontend' }), group: 'Frontend', fingerprint: 'ab' });
    await assert.rejects(
      () => runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /非法 group/,
    );

    fake.setPayload(await makeCatalog({
      lessons: [{ title: '第一关', url: 'https://other.example/lessons/first/' }],
    }));
    await assert.rejects(
      () => runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /不在 https:\/\/python\.example 下/,
    );

    fake.setPayload({
      ...catalog,
      lessons: [{ title: '第一关', url: '/lessons/first/' }],
    });
    await assert.rejects(
      () => runCatalog({ check: true, registryPath: ctx.registryPath, distPath: ctx.distPath }),
      /绝对/,
    );
  });
});
