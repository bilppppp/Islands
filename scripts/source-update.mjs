import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertUpdateAllowed, completionSha256, validateGeneration } from './generate.mjs';
import { command } from './materials.mjs';
import {
  EXTRACTOR_VERSION,
  SCHEMA_VERSION,
  listFiles,
  locateCandidateFile,
  rawSha256,
  readLessons,
  runIdFrom,
  stableSourcePath,
} from './source-state.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const PENDING_VERDICT = '待判定';
export const NO_IMPACT_VERDICT = '无教学影响';
export const LOCAL_REVISION_VERDICT = '局部修订';
export const REROUTE_VERDICT = '需要重排路线';
export const UNKNOWN_VERDICT = '暂无法判断';

const FINAL_VERDICTS = new Set([NO_IMPACT_VERDICT, LOCAL_REVISION_VERDICT, REROUTE_VERDICT, UNKNOWN_VERDICT]);
const PROTECTED_FILES = ['COURSE.md', 'school.config.ts', 'school.settings.json'];

function posixRel(from, to) {
  return relative(from, to).split(sep).join('/');
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function settingsOf(schoolPath) {
  return JSON.parse(readFileSync(join(schoolPath, 'school.settings.json'), 'utf8'));
}

export function localRevisionSlugs(plan) {
  const slugs = [];
  for (const change of plan.changes || []) {
    if (change.verdict !== LOCAL_REVISION_VERDICT) continue;
    for (const slug of change.lessons || []) slugs.push(slug);
  }
  return [...new Set(slugs)];
}

function asChangeItem(item) {
  return typeof item === 'string' ? { path: item } : { ...item };
}

function relatedLessonsFor(report, path) {
  return (report.candidateLessons || [])
    .filter(item => (item.paths || []).includes(path))
    .map(item => item.slug);
}

function planChanges(report) {
  const rows = [];
  const push = (item, kind) => {
    const row = asChangeItem(item);
    rows.push({
      ...row,
      kind,
      verdict: PENDING_VERDICT,
      relatedLessons: relatedLessonsFor(report, row.path),
    });
  };
  for (const item of report.changed || []) push(item, 'changed');
  for (const item of report.added || []) push(item, 'added');
  for (const item of report.deleted || []) push(item, 'deleted');
  for (const item of report.unobserved || []) push(item, 'unobserved');
  for (const item of report.failed || []) push(item, 'failed');
  return rows;
}

function lessonBindings(schoolPath) {
  return readLessons(schoolPath).map(lesson => ({
    file: posixRel(schoolPath, lesson.file),
    slug: lesson.slug,
    order: lesson.order,
    sha256: rawSha256(readFileSync(lesson.file)),
    completionSha256: completionSha256(lesson.text),
    sources: lesson.sources,
  }));
}

function addTreeBindings(schoolPath, relRoot, rows, { skip } = {}) {
  const root = join(schoolPath, relRoot);
  if (!existsSync(root)) return;
  for (const rel of listFiles(root, { ignore: false })) {
    if (skip && skip(rel)) continue;
    const path = `${relRoot}/${rel}`;
    rows.push({ path, sha256: rawSha256(readFileSync(join(schoolPath, path))) });
  }
}

function protectedBindings(schoolPath, planId) {
  const rows = PROTECTED_FILES.filter(path => existsSync(join(schoolPath, path))).map(path => ({
    path,
    sha256: rawSha256(readFileSync(join(schoolPath, path))),
  }));
  addTreeBindings(schoolPath, 'public/activities', rows);
  addTreeBindings(schoolPath, 'src/content/exercises', rows);
  addTreeBindings(schoolPath, 'public/sources/snapshots', rows, {
    skip: rel => Boolean(planId) && (rel === planId || rel.startsWith(`${planId}/`)),
  });
  return rows;
}

export function latestChangesRunId(schoolPath) {
  const dir = join(schoolPath, 'evidence/updates');
  if (!existsSync(dir)) return null;
  const ids = readdirSync(dir).filter(name => {
    try {
      return statSync(join(dir, name)).isDirectory() && existsSync(join(dir, name, 'changes.json'));
    } catch {
      return false;
    }
  }).sort();
  return ids.at(-1) ?? null;
}

function loadChanges(schoolPath, runId) {
  const chosen = runId || latestChangesRunId(schoolPath);
  if (!chosen) throw new Error('No source change report. Run sources NAME --check first.');
  const path = join(schoolPath, 'evidence/updates', chosen, 'changes.json');
  if (!existsSync(path)) throw new Error(`No source change report for run ${chosen}.`);
  return { runId: chosen, report: JSON.parse(readFileSync(path, 'utf8')) };
}

function loadPlan(schoolPath, planId) {
  const path = join(schoolPath, 'evidence/updates', planId, 'plan.json');
  if (!existsSync(path)) throw new Error(`Unknown plan ${planId}.`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function copyPlanSnapshots({ schoolPath, planId, changes, source, materials }) {
  if (!source) {
    for (const row of changes) {
      if (row.kind === 'changed' || row.kind === 'added') row.bytesMissing = true;
    }
    return;
  }
  const snapRoot = join(schoolPath, 'public/sources/snapshots', planId);
  for (const row of changes) {
    if (row.kind !== 'changed' && row.kind !== 'added') continue;
    const located = locateCandidateFile(source, row.path, materials);
    if (!located || !existsSync(located)) {
      row.bytesMissing = true;
      continue;
    }
    const actual = rawSha256(readFileSync(located));
    const expected = row.sha256?.candidate;
    if (expected && actual !== expected) {
      row.bytesMissing = true;
      continue;
    }
    const dest = join(snapRoot, row.path);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(located, dest);
    row.bytesMissing = false;
    row.snapshotSha256 = rawSha256(readFileSync(dest));
  }
}

function writeSeen(schoolPath, planId) {
  const path = join(schoolPath, 'source-state/seen.json');
  const prev = readJson(path, {});
  const prevLessons = prev.lessons || {};
  const lessons = {};
  for (const lesson of readLessons(schoolPath)) {
    const old = prevLessons[lesson.slug];
    lessons[lesson.slug] = { adoptedSnapshot: old?.adoptedSnapshot ?? null };
  }
  writeJson(path, { schemaVersion: SCHEMA_VERSION, lastSeenSnapshot: planId, lessons });
}

export function evaluateRouteReview({ lessons, candidateLessons, changePaths }) {
  const reasons = [];
  const candidates = candidateLessons || [];
  const route = lessons || [];
  if (candidates.length > route.length / 2) reasons.push('候选关超过一半');
  const ordered = [...route].sort((a, b) => a.order - b.order || String(a.slug).localeCompare(String(b.slug)));
  const entry = ordered[0];
  const candidateSlugs = new Set(candidates.map(item => item.slug));
  if (entry && candidateSlugs.has(entry.slug)) reasons.push('入口');
  let indexHit = false;
  let prereqHit = false;
  for (const path of changePaths || []) {
    const users = route.filter(lesson =>
      (lesson.sources || []).some(src => stableSourcePath(src) === path),
    );
    if (entry && users.some(lesson => lesson.slug === entry.slug) && users.some(lesson => lesson.slug !== entry.slug)) {
      indexHit = true;
    }
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        if (Math.abs(Number(users[i].order) - Number(users[j].order)) === 1) prereqHit = true;
      }
    }
  }
  if (indexHit) reasons.push('索引');
  if (prereqHit) reasons.push('前置');
  return { routeReview: reasons.length > 0, routeReviewReasons: reasons };
}

function changePathsOf(report) {
  return [...(report.changed || []), ...(report.added || [])].map(item => (
    typeof item === 'string' ? item : item.path
  ));
}

export function assertPlanReady(plan, schoolPath) {
  const known = new Set((plan.lessons || []).map(item => item.slug));
  const bySlug = new Map(readLessons(schoolPath).map(lesson => [lesson.slug, lesson]));
  let pending = 0;
  let local = 0;
  for (const change of plan.changes || []) {
    if (change.verdict === PENDING_VERDICT || !FINAL_VERDICTS.has(change.verdict)) {
      pending += 1;
      continue;
    }
    if (change.verdict === LOCAL_REVISION_VERDICT) {
      local += 1;
      if (change.kind !== 'changed' && change.kind !== 'added') {
        throw new Error(`局部修订 only allowed for changed or added, not ${change.kind}: ${change.path}`);
      }
      if (!Array.isArray(change.lessons) || !change.lessons.length) {
        throw new Error(`局部修订 for ${change.path} must include a lessons array of slugs.`);
      }
      for (const slug of change.lessons) {
        if (!known.has(slug)) throw new Error(`局部修订 names unknown lesson ${slug}.`);
        const lesson = bySlug.get(slug) || (plan.lessons || []).find(item => item.slug === slug);
        const sources = (lesson?.sources || []).map(stableSourcePath);
        if (!sources.includes(change.path)) {
          throw new Error(`局部修订 names ${slug} but that lesson does not reference ${change.path}.`);
        }
      }
      continue;
    }
    if (!String(change.reason || '').trim()) {
      throw new Error(`${change.verdict} for ${change.path} must include a reason.`);
    }
  }
  if (pending) throw new Error('计划仍有待判定，不能准备或应用局部修订。');
  if (plan.routeReview && local) {
    throw new Error('routeReview 为 true 时不能做局部修订。请改判成「需要重排路线」或缩小范围。');
  }
  const baselinePath = join(schoolPath, 'source-state/baseline.json');
  if (!existsSync(baselinePath)) throw new Error('No source baseline. Run sources NAME --baseline first.');
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  if (String(baseline.extractorVersion) !== String(plan.extractorVersion)) {
    throw new Error(`Plan extractorVersion ${plan.extractorVersion} does not match baseline ${baseline.extractorVersion}.`);
  }
  if (String(plan.extractorVersion) !== String(EXTRACTOR_VERSION)) {
    throw new Error(`Plan extractorVersion ${plan.extractorVersion} does not match ${EXTRACTOR_VERSION}.`);
  }
}

function snapshotPrefix(planId) {
  return `snapshots/${planId}/`;
}

export function retargetSourceList(sources, planId, snapshotted) {
  const prefix = snapshotPrefix(planId);
  return sources.map(path => {
    const original = stableSourcePath(path);
    if (snapshotted.has(original)) return `${prefix}${original}`;
    return path;
  });
}

function replaceSourcesBlock(text, sources) {
  const next = `sources:\n${sources.map(path => `  - ${path}`).join('\n')}\n`;
  if (/^sources:\n(?:[ \t]*-[ \t]+\S.*\n)+/m.test(text)) {
    return text.replace(/^sources:\n(?:[ \t]*-[ \t]+\S.*\n)+/m, next);
  }
  return text;
}

function snapshottedPaths(plan) {
  const paths = new Set();
  for (const change of plan.changes || []) {
    if (change.verdict !== LOCAL_REVISION_VERDICT) continue;
    if (change.kind !== 'changed' && change.kind !== 'added') continue;
    if (!change.snapshotSha256) continue;
    paths.add(change.path);
  }
  return paths;
}

function assertNamedLessonsRevised(plan, schoolPath) {
  const named = new Set(localRevisionSlugs(plan));
  if (!named.size) return;
  const prepared = plan.preparedLessonSha256 || {};
  const current = new Map(lessonBindings(schoolPath).map(item => [item.slug, item.sha256]));
  for (const slug of named) {
    if (current.get(slug) === prepared[slug]) {
      throw new Error(`课文尚未按计划修订: ${slug}`);
    }
  }
}

function readAdoptions(schoolPath) {
  return readJson(join(schoolPath, 'source-state/adoptions.json'), { lessons: {} });
}

function sourcesMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function alreadyApplied(plan, schoolPath) {
  const adoptions = readAdoptions(schoolPath);
  if (adoptions.planId !== plan.planId) return false;
  for (const slug of localRevisionSlugs(plan)) {
    if (adoptions.lessons?.[slug]?.adoptedSnapshot !== plan.planId) return false;
  }
  const snapshotted = snapshottedPaths(plan);
  const bySlug = new Map(readLessons(schoolPath).map(lesson => [lesson.slug, lesson]));
  for (const slug of localRevisionSlugs(plan)) {
    const lesson = bySlug.get(slug);
    if (!lesson) return false;
    const expected = retargetSourceList(lesson.sources, plan.planId, snapshotted);
    if (!sourcesMatch(lesson.sources, expected)) return false;
  }
  try {
    assertUpdateAllowed(plan, schoolPath);
  } catch {
    return false;
  }
  return true;
}

function sourceFileExists(schoolPath, path) {
  return existsSync(join(schoolPath, 'public/sources', path));
}

function adoptedSnapshotPaths(sources, planId) {
  const prefix = snapshotPrefix(planId);
  return sources.filter(path => path.startsWith(prefix));
}

function canAdoptSnapshot(schoolPath, sources, planId) {
  const adopted = adoptedSnapshotPaths(sources, planId);
  return adopted.length > 0 && adopted.every(path => sourceFileExists(schoolPath, path));
}

function lessonFileTexts(schoolPath) {
  return Object.fromEntries(
    readLessons(schoolPath).map(lesson => [lesson.file, readFileSync(lesson.file, 'utf8')]),
  );
}

function restoreLessonFiles(texts) {
  for (const [file, text] of Object.entries(texts)) writeFileSync(file, text);
}

function retargetRevisedLessons(plan, schoolPath) {
  const slugs = new Set(localRevisionSlugs(plan));
  const snapshotted = snapshottedPaths(plan);
  for (const lesson of readLessons(schoolPath)) {
    if (!slugs.has(lesson.slug)) continue;
    const next = retargetSourceList(lesson.sources, plan.planId, snapshotted);
    if (sourcesMatch(lesson.sources, next)) continue;
    if (!canAdoptSnapshot(schoolPath, next, plan.planId)) continue;
    writeFileSync(lesson.file, replaceSourcesBlock(lesson.text, next));
  }
}

function writeAdoptions(plan, schoolPath) {
  const slugs = localRevisionSlugs(plan);
  const prev = readAdoptions(schoolPath);
  const lessons = { ...(prev.lessons || {}) };
  const bySlug = new Map(readLessons(schoolPath).map(lesson => [lesson.slug, lesson]));
  for (const slug of slugs) {
    const lesson = bySlug.get(slug);
    if (!lesson || !canAdoptSnapshot(schoolPath, lesson.sources, plan.planId)) continue;
    lessons[slug] = { adoptedSnapshot: plan.planId };
  }
  writeJson(join(schoolPath, 'source-state/adoptions.json'), {
    schemaVersion: SCHEMA_VERSION,
    planId: plan.planId,
    createdAt: plan.createdAt,
    lessons,
  });
}

function publicSourceBindings(schoolPath) {
  const root = join(schoolPath, 'public/sources');
  if (!existsSync(root)) return [];
  return listFiles(root)
    .filter(path => !path.startsWith('snapshots/'))
    .map(path => ({
      path,
      sha256: rawSha256(readFileSync(join(root, path))),
    }));
}

function assertSnapshotsMatch(plan, schoolPath) {
  const expected = new Map();
  for (const change of plan.changes || []) {
    if (change.kind !== 'changed' && change.kind !== 'added') continue;
    if (change.bytesMissing) continue;
    if (!change.snapshotSha256) {
      throw new Error(`Snapshot hash missing for ${change.path}.`);
    }
    expected.set(change.path, change.snapshotSha256);
  }
  const snapRoot = join(schoolPath, 'public/sources/snapshots', plan.planId);
  const actual = existsSync(snapRoot) ? listFiles(snapRoot, { ignore: false }) : [];
  for (const path of actual) {
    if (!expected.has(path)) {
      throw new Error(`Unexpected snapshot file ${path}.`);
    }
  }
  for (const [path, sha] of expected) {
    const full = join(snapRoot, path);
    if (!existsSync(full)) throw new Error(`Snapshot missing for ${path}.`);
    if (rawSha256(readFileSync(full)) !== sha) {
      throw new Error(`Snapshot hash mismatch for ${path}.`);
    }
  }
}

function assertNotSuperseded(plan, schoolPath) {
  const adoptions = readAdoptions(schoolPath);
  if (!adoptions.planId || adoptions.planId === plan.planId) return;
  if (adoptions.createdAt && plan.createdAt && adoptions.createdAt > plan.createdAt) {
    throw new Error('计划已被取代');
  }
}

function assertBytesPresent(plan) {
  for (const change of plan.changes || []) {
    if (change.verdict === LOCAL_REVISION_VERDICT && change.bytesMissing) {
      throw new Error(`Cannot apply 局部修订 for ${change.path}: source bytes are missing.`);
    }
  }
}

export function defaultPortBusy(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const done = busy => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(busy);
    };
    socket.setTimeout(500, () => done(true));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

export async function defaultFinish({ schoolPath }) {
  await command('python3', ['scripts/apply-school-kit.py', relative(root, schoolPath)], { inherit: true });
  console.log('已同步共享网站增量。');
  const name = basename(schoolPath);
  const inputPath = join(root, 'inputs', `${name}.json`);
  const count = validateGeneration(inputPath);
  await command('npm', ['run', 'build'], { cwd: schoolPath, inherit: true, rejectOnErrorLog: true });
  console.log('真实教学尚未验证');
  return count;
}

function writeUpdateMd(schoolPath, plan) {
  const name = basename(schoolPath);
  const local = localRevisionSlugs(plan);
  const localSet = new Set(local);
  const blocked = new Map();
  for (const change of plan.changes || []) {
    if (change.verdict === LOCAL_REVISION_VERDICT) continue;
    for (const slug of change.relatedLessons || []) {
      if (localSet.has(slug)) continue;
      blocked.set(slug, change.verdict);
    }
  }
  for (const recorded of plan.lessons || []) {
    if (localSet.has(recorded.slug) || blocked.has(recorded.slug)) continue;
    blocked.set(recorded.slug, '未列入局部修订');
  }
  const localBlock = local.length
    ? local.map(slug => {
      const recorded = (plan.lessons || []).find(item => item.slug === slug);
      const paths = (plan.changes || [])
        .filter(change => change.verdict === LOCAL_REVISION_VERDICT && (change.lessons || []).includes(slug))
        .map(change => change.path);
      const extra = paths.length ? `\n  - 来源变化：${paths.map(path => `\`${path}\``).join('、')}` : '';
      return `- \`${slug}\`（\`${recorded?.file || slug}\`）${extra}`;
    }).join('\n')
    : '- 没有需要局部修订的关。不要改任何课文。';
  const blockedBlock = [...blocked.entries()].map(([slug, verdict]) => {
    const recorded = (plan.lessons || []).find(item => item.slug === slug);
    return `- \`${slug}\`（\`${recorded?.file || slug}\`）：${verdict}`;
  }).join('\n') || '- 无';
  const text = `# 局部修订

这是给当前 Agent 的指令。学校：${name}。计划：${plan.planId}。

## 只改这些关

${localBlock}

只改上面点名的关。不要改 slug、order，也不要改 agentInstructions 里从「完成条件」起的那段文字。

## 一个字都不能改

「无教学影响」「需要重排路线」「暂无法判断」的关一个字都不能改。

${blockedBlock}

## 禁止

- 不要运行 retry
- 不要部署
- 不要改未点名的课文、COURSE.md、school.config.ts、school.settings.json
- 不要改现有 public/sources 正文副本；apply 只会把修订关的 sources 改到 public/sources/snapshots/${plan.planId}/
- 看见新快照不等于整门课已经更新

快照目录：\`public/sources/snapshots/${plan.planId}/\`
`;
  writeFileSync(join(schoolPath, 'UPDATE.md'), text);
}

async function planUpdate({ schoolPath, options, originalCwd, now }) {
  const { report, runId } = loadChanges(schoolPath, options.run);
  const baselinePath = join(schoolPath, 'source-state/baseline.json');
  if (!existsSync(baselinePath)) throw new Error('No source baseline. Run sources NAME --baseline first.');
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const planId = runIdFrom(now);
  const lessons = lessonBindings(schoolPath);
  const review = evaluateRouteReview({
    lessons,
    candidateLessons: report.candidateLessons || [],
    changePaths: changePathsOf(report),
  });
  const source = options.source?.[0] ? resolve(originalCwd, options.source[0]) : undefined;
  if (source && !existsSync(source)) throw new Error(`Candidate source is not an accessible local path: ${source}`);
  const changes = planChanges(report);
  copyPlanSnapshots({
    schoolPath,
    planId,
    changes,
    source,
    materials: settingsOf(schoolPath).materials || [],
  });
  const plan = {
    schemaVersion: SCHEMA_VERSION,
    planId,
    runId: report.runId || runId,
    extractorVersion: baseline.extractorVersion,
    createdAt: now.toISOString(),
    routeReview: review.routeReview,
    routeReviewReasons: review.routeReviewReasons,
    candidateLessons: report.candidateLessons || [],
    lessons,
    protectedFiles: protectedBindings(schoolPath, planId),
    publicSources: publicSourceBindings(schoolPath),
    changes,
  };
  const planPath = join(schoolPath, 'evidence/updates', planId, 'plan.json');
  writeJson(planPath, plan);
  writeSeen(schoolPath, planId);
  console.log(`已写入 ${posixRel(root, planPath)}。判定先为「待判定」。一次扫描不等于整门课已更新。`);
  return 0;
}

async function prepareUpdate({ schoolPath, options }) {
  const plan = loadPlan(schoolPath, options['plan-id']);
  assertPlanReady(plan, schoolPath);
  assertUpdateAllowed(plan, schoolPath, { allowLocalRevisionBody: false });
  assertSnapshotsMatch(plan, schoolPath);
  plan.preparedLessonSha256 = Object.fromEntries(
    lessonBindings(schoolPath).map(item => [item.slug, item.sha256]),
  );
  writeJson(join(schoolPath, 'evidence/updates', plan.planId, 'plan.json'), plan);
  writeUpdateMd(schoolPath, plan);
  console.log(`已写入 ${posixRel(root, join(schoolPath, 'UPDATE.md'))}。尚未修改课文。`);
  return 0;
}

async function applyUpdate({ schoolPath, options, finish, portBusy }) {
  const settings = settingsOf(schoolPath);
  if (await portBusy(settings.port)) throw new Error('先停止该校开发服务');
  const plan = loadPlan(schoolPath, options['plan-id']);
  assertSnapshotsMatch(plan, schoolPath);
  if (alreadyApplied(plan, schoolPath)) {
    console.log(`计划 ${plan.planId} 已应用，未改文件。`);
    return 0;
  }
  assertNotSuperseded(plan, schoolPath);
  if (!plan.preparedLessonSha256) {
    throw new Error('Plan has not been prepared. Run update --prepare-only first.');
  }
  assertPlanReady(plan, schoolPath);
  assertUpdateAllowed(plan, schoolPath);
  assertBytesPresent(plan);
  assertNamedLessonsRevised(plan, schoolPath);
  const previousLessons = lessonFileTexts(schoolPath);
  retargetRevisedLessons(plan, schoolPath);
  try {
    await finish({ schoolPath, plan });
  } catch (error) {
    restoreLessonFiles(previousLessons);
    throw error;
  }
  writeAdoptions(plan, schoolPath);
  console.log(`已应用计划 ${plan.planId}。`);
  return 0;
}

export async function runUpdate({
  schoolPath,
  options = {},
  originalCwd = process.cwd(),
  now = new Date(),
  finish = defaultFinish,
  portBusy = defaultPortBusy,
} = {}) {
  const plan = Boolean(options.plan);
  const apply = Boolean(options.apply);
  const prepare = Boolean(options['prepare-only']);
  const selected = [plan, prepare, apply].filter(Boolean).length;
  if (selected !== 1) throw new Error('update requires exactly one of --plan, --prepare-only, or --apply.');
  if ((prepare || apply) && !options['plan-id']) throw new Error('--plan-id is required with --prepare-only and --apply.');
  if (plan && options['plan-id']) throw new Error('--plan-id is only valid with --prepare-only or --apply.');
  if ((prepare || apply) && options.run) throw new Error('--run is only valid with update --plan.');
  if (plan && options.source?.length > 1) throw new Error('update --plan accepts at most one --source.');
  if ((prepare || apply) && options.source?.length) throw new Error('--source is only valid with update --plan.');
  if (plan) return planUpdate({ schoolPath, options, originalCwd, now });
  if (prepare) return prepareUpdate({ schoolPath, options });
  return applyUpdate({ schoolPath, options, finish, portBusy });
}
