import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  PUBLICATION_GROUPS,
  catalogFingerprint,
  parsePublicationOrigin,
  sitemapXml,
} from '../school-kit/overlay/src/lib/publication.ts';

export const PORTAL_ORIGIN = 'https://learnislands.com';
export const EMPTY_TOPIC_MESSAGE = '这一区还没有课';

const SITE_NAME = '学习岛屿';
const SITE_DESCRIPTION = '按方向找课。课文留在各课自己的岛上。';

const PORTAL_CSS = `:root {
  --portal-paper: #f7f3df;
  --portal-paper-deep: #f0e8d8;
  --portal-ink: #725d42;
  --portal-heading: #794f27;
  --portal-muted: #8a6a45;
  --portal-line: #e4d5b7;
  --portal-wood: #e4c48a;
  --portal-wood-edge: #c4a574;
  --portal-wood-shadow: #b08950;
  --portal-teal: #11a89b;
  --portal-teal-deep: #0d8f84;
  --portal-cream: #fffdf7;
}

* { box-sizing: border-box; }

html {
  color-scheme: light;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(1200px 500px at 10% -10%, #fff8e6, transparent 55%),
    linear-gradient(180deg, var(--portal-paper) 0%, var(--portal-paper-deep) 100%);
  color: var(--portal-ink);
  font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
  line-height: 1.7;
}

a {
  color: var(--portal-teal);
}

a:hover {
  color: var(--portal-teal-deep);
}

.portal-shell {
  width: min(52rem, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3.5rem;
}

.portal-brand {
  display: inline-block;
  margin: 0 0 1.25rem;
  color: var(--portal-heading);
  font-weight: 700;
  text-decoration: none;
}

.portal-brand:hover {
  color: var(--portal-teal);
}

.portal-kicker {
  margin: 0 0 0.35rem;
  color: var(--portal-muted);
  font-size: 0.85rem;
}

h1 {
  margin: 0 0 0.75rem;
  color: var(--portal-heading);
  font-size: 1.85rem;
  line-height: 1.3;
}

.portal-lead,
.portal-copy,
.portal-empty {
  margin: 0 0 1.25rem;
  max-width: 40rem;
}

.portal-empty {
  padding: 1rem 1.15rem;
  border: 1px solid var(--portal-line);
  border-radius: 16px;
  background: rgba(247, 243, 223, 0.9);
}

.portal-plaques,
.portal-courses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1rem;
  margin: 1.4rem 0 0;
  padding: 0;
  list-style: none;
}

.portal-plaque {
  display: block;
  padding: 1.15rem 1.2rem 1.2rem;
  border: 2px solid var(--portal-wood-edge);
  border-radius: 10px;
  background:
    linear-gradient(180deg, #f3ddb0 0%, var(--portal-wood) 58%, #d8b572 100%);
  box-shadow: 0 6px 0 var(--portal-wood-shadow), 0 12px 18px rgba(114, 93, 66, 0.16);
  color: var(--portal-heading);
  font-weight: 700;
  text-decoration: none;
}

.portal-plaque:hover {
  color: var(--portal-heading);
  transform: translateY(-1px);
}

.portal-section {
  margin: 1.6rem 0 0;
  padding: 1rem 1.15rem 1.1rem;
  border: 1px solid var(--portal-line);
  border-radius: 16px;
  background: rgba(247, 243, 223, 0.92);
}

.portal-section h2 {
  margin: 0 0 0.55rem;
  color: var(--portal-heading);
  font-size: 1.1rem;
}

.portal-section p {
  margin: 0;
}

.portal-section p + p {
  margin-top: 0.55rem;
}

.portal-path {
  margin: 0;
  padding-left: 1.2rem;
}

.portal-path li + li {
  margin-top: 0.4rem;
}

.portal-home-link {
  display: inline-block;
  margin-top: 1.4rem;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  background: var(--portal-teal);
  color: var(--portal-cream);
  text-decoration: none;
}

.portal-home-link:hover {
  background: var(--portal-teal-deep);
  color: var(--portal-cream);
}
`;

export function defaultCatalogPaths(root) {
  return {
    registryPath: join(root, 'portal', 'registry.json'),
    distPath: join(root, 'portal', 'dist'),
  };
}

export function loadRegistry(registryPath) {
  const raw = JSON.parse(readFileSync(registryPath, 'utf8'));
  const urls = Array.isArray(raw) ? raw : raw?.catalogs;
  if (!Array.isArray(urls)) {
    throw new Error('registry.json 必须列出 catalog.json 的绝对地址。');
  }
  return urls.map((url) => assertRegistryUrl(url));
}

function assertRegistryUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('登记地址必须是 catalog.json 的绝对地址。');
  }
  const trimmed = value.trim();
  if (
    trimmed.startsWith('/')
    || trimmed.startsWith('.')
    || trimmed.startsWith('~')
    || /^[a-zA-Z]:[\\/]/.test(trimmed)
    || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    throw new Error(`登记不接受本地路径：${trimmed}`);
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`登记不接受本地路径或非法地址：${trimmed}`);
  }
  if (parsed.protocol === 'file:') {
    throw new Error(`登记不接受本地路径：${trimmed}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`登记地址必须是绝对 http(s) URL：${trimmed}`);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error(`非法登记地址：${trimmed}`);
  }
  if (!parsed.pathname.endsWith('catalog.json')) {
    throw new Error(`登记只写 catalog.json 的绝对地址：${trimmed}`);
  }
  return trimmed;
}

function requiredText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`catalog 缺少 ${field}`);
  }
  return value;
}

function assertLessonUrl(value, origin) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`关卡 URL 不是绝对地址：${value}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`关卡 URL 必须是该课 origin 下的绝对 https URL：${value}`);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error(`关卡 URL 非法：${value}`);
  }
  if (parsed.origin !== origin) {
    throw new Error(`关卡 URL 不在 ${origin} 下：${value}`);
  }
}

function assertCourseName(name) {
  if (name === '.' || name === '..' || name.includes('/') || name.includes('\\') || name.includes('\0')) {
    throw new Error(`非法课程名：${name}`);
  }
  return name;
}

export async function validateFetchedCatalog(catalog, sourceUrl) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new Error(`${sourceUrl} 不是一份 catalog 对象。`);
  }
  const name = assertCourseName(requiredText(catalog.name, 'name'));
  const origin = parsePublicationOrigin(requiredText(catalog.origin, 'origin'));
  const group = requiredText(catalog.group, 'group');
  if (!PUBLICATION_GROUPS.includes(group)) {
    throw new Error(`非法 group：${JSON.stringify(group)}`);
  }
  const intro = requiredText(catalog.intro, 'intro');
  const prerequisites = requiredText(catalog.prerequisites, 'prerequisites');
  const outcomes = requiredText(catalog.outcomes, 'outcomes');
  if (!Array.isArray(catalog.lessons) || catalog.lessons.length < 1) {
    throw new Error(`${sourceUrl} 至少要有一关。`);
  }
  const lessons = catalog.lessons.map((lesson, index) => {
    if (!lesson || typeof lesson !== 'object') {
      throw new Error(`${sourceUrl} 的 lessons[${index}] 无效。`);
    }
    const title = requiredText(lesson.title, `lessons[${index}].title`);
    const url = requiredText(lesson.url, `lessons[${index}].url`);
    assertLessonUrl(url, origin);
    return { title, url };
  });
  const fingerprint = requiredText(catalog.fingerprint, 'fingerprint');
  const expected = await catalogFingerprint({
    name,
    origin,
    group,
    intro,
    prerequisites,
    outcomes,
    lessons,
  });
  if (fingerprint !== expected) {
    throw new Error(`${sourceUrl} 指纹不一致。`);
  }
  return { name, origin, group, intro, prerequisites, outcomes, lessons, fingerprint, sourceUrl };
}

async function fetchCatalog(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`无法获取 ${url}：${error instanceof Error ? error.message : error}`);
  }
  if (!response.ok) {
    throw new Error(`获取 ${url} 失败：HTTP ${response.status}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${url} 不是有效的 JSON。`);
  }
  return validateFetchedCatalog(payload, url);
}

export async function collectCatalogs(registryPath) {
  const urls = loadRegistry(registryPath);
  const catalogs = [];
  for (const url of urls) {
    catalogs.push(await fetchCatalog(url));
  }
  return { urls, catalogs };
}

function buildState(urls, catalogs) {
  const fingerprints = {};
  for (const catalog of catalogs) {
    fingerprints[catalog.sourceUrl] = catalog.fingerprint;
  }
  return { registry: urls, fingerprints };
}

function readState(distPath) {
  const path = join(distPath, '.catalog-state.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function sameBuildInput(previous, next) {
  if (!previous || !Array.isArray(previous.registry) || !previous.fingerprints) return false;
  if (previous.registry.length !== next.registry.length) return false;
  if (previous.registry.some((url, index) => url !== next.registry[index])) return false;
  return next.registry.every((url) => previous.fingerprints[url] === next.fingerprints[url]);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function topicPath(group) {
  return `/topics/${group}/`;
}

function coursePath(name) {
  return `/courses/${name}/`;
}

function portalUrl(path) {
  if (path === '/') return `${PORTAL_ORIGIN}/`;
  return `${PORTAL_ORIGIN}${path}`;
}

function page(title, canonical, body, description = SITE_DESCRIPTION) {
  return `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="/portal.css">
</head>
<body>
  <div class="portal-shell">
    <a class="portal-brand" href="/">${escapeHtml(SITE_NAME)}</a>
    ${body}
  </div>
</body>
</html>
`;
}

function writeFile(root, relative, contents) {
  const target = join(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function coursesByGroup(catalogs) {
  const grouped = new Map(PUBLICATION_GROUPS.map((group) => [group, []]));
  for (const catalog of catalogs) {
    grouped.get(catalog.group).push(catalog);
  }
  return grouped;
}

function renderHome(grouped) {
  const plaques = PUBLICATION_GROUPS.map((group) => (
    `<li><a class="portal-plaque" href="${escapeHtml(topicPath(group))}">${escapeHtml(group)}</a></li>`
  )).join('\n        ');
  return page(`${SITE_NAME}`, portalUrl('/'), `
    <p class="portal-kicker">课程目录</p>
    <h1>${escapeHtml(SITE_NAME)}</h1>
    <p class="portal-lead">${escapeHtml(SITE_DESCRIPTION)}</p>
    <ul class="portal-plaques">
        ${plaques}
    </ul>
  `);
}

function renderTopic(group, courses) {
  const list = courses.length
    ? `<ul class="portal-courses">
        ${courses.map((course) => `<li><a class="portal-plaque" href="${escapeHtml(coursePath(course.name))}">${escapeHtml(course.name)}</a></li>`).join('\n        ')}
    </ul>`
    : `<p class="portal-empty">${escapeHtml(EMPTY_TOPIC_MESSAGE)}</p>`;
  return page(`${group} · ${SITE_NAME}`, portalUrl(topicPath(group)), `
    <p class="portal-kicker">分类</p>
    <h1>${escapeHtml(group)}</h1>
    ${list}
  `, group);
}

function renderCourse(course) {
  const lessons = course.lessons.map((lesson) => (
    `<li><a href="${escapeHtml(lesson.url)}">${escapeHtml(lesson.title)}</a></li>`
  )).join('\n        ');
  return page(`${course.name} · ${SITE_NAME}`, portalUrl(coursePath(course.name)), `
    <p class="portal-kicker">${escapeHtml(course.group)}</p>
    <h1>${escapeHtml(course.name)}</h1>
    <section class="portal-section">
      <h2>适合谁</h2>
      <p>${escapeHtml(course.prerequisites)}</p>
    </section>
    <section class="portal-section">
      <h2>学什么</h2>
      <p>${escapeHtml(course.intro)}</p>
      <p>${escapeHtml(course.outcomes)}</p>
    </section>
    <section class="portal-section">
      <h2>完整路径</h2>
      <ol class="portal-path">
        ${lessons}
      </ol>
    </section>
    <a class="portal-home-link" href="${escapeHtml(`${course.origin}/`)}">去这门课的岛</a>
  `, course.intro);
}

function robotsTxt() {
  return `User-agent: *\nSitemap: ${PORTAL_ORIGIN}/sitemap.xml\n`;
}

function sitemapPaths(catalogs) {
  return [
    '/',
    ...PUBLICATION_GROUPS.map((group) => topicPath(group)),
    ...catalogs.map((course) => coursePath(course.name)),
  ];
}

function writeSite(tmp, catalogs, state) {
  const grouped = coursesByGroup(catalogs);
  writeFile(tmp, 'index.html', renderHome(grouped));
  writeFile(tmp, 'portal.css', PORTAL_CSS);
  writeFile(tmp, 'robots.txt', robotsTxt());
  writeFile(tmp, 'sitemap.xml', sitemapXml(PORTAL_ORIGIN, sitemapPaths(catalogs)));
  for (const group of PUBLICATION_GROUPS) {
    writeFile(tmp, join('topics', group, 'index.html'), renderTopic(group, grouped.get(group)));
  }
  for (const course of catalogs) {
    writeFile(tmp, join('courses', course.name, 'index.html'), renderCourse(course));
  }
  writeFile(tmp, '.catalog-state.json', `${JSON.stringify(state, null, 2)}\n`);
}

function replaceDist(tmp, distPath) {
  mkdirSync(dirname(distPath), { recursive: true });
  const previous = `${distPath}.prev`;
  rmSync(previous, { recursive: true, force: true });
  if (existsSync(distPath)) renameSync(distPath, previous);
  try {
    renameSync(tmp, distPath);
  } catch (error) {
    if (existsSync(previous) && !existsSync(distPath)) renameSync(previous, distPath);
    throw error;
  }
  rmSync(previous, { recursive: true, force: true });
}

export function catalogUsageError() {
  return new Error('catalog 需要恰好一个标志：--check 或 --build。用法：npm run school -- catalog --check 或 npm run school -- catalog --build');
}

export async function runCatalog({
  check = false,
  build = false,
  registryPath,
  distPath,
  extra = [],
} = {}) {
  if (extra.length) {
    throw new Error('catalog 不接受 School 名。用法：npm run school -- catalog --check 或 npm run school -- catalog --build');
  }
  if (Boolean(check) === Boolean(build)) throw catalogUsageError();
  const { urls, catalogs } = await collectCatalogs(registryPath);
  if (check) {
    console.log(`已校验 ${catalogs.length} 门课的 catalog，未写 dist。`);
    return 0;
  }
  const state = buildState(urls, catalogs);
  if (sameBuildInput(readState(distPath), state)) {
    console.log('指纹和登记未变，保留上一份站点。');
    return 0;
  }
  mkdirSync(dirname(distPath), { recursive: true });
  const tmp = mkdtempSync(join(dirname(distPath), '.portal-build-'));
  try {
    writeSite(tmp, catalogs, state);
    replaceDist(tmp, distPath);
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    throw error;
  }
  console.log(`已生成聚合站：${catalogs.length} 门课。`);
  return 0;
}
