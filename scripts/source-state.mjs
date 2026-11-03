import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { command, writeDocsSnapshot, writeSingleSnapshot } from './materials.mjs';
import { normalizePageMarkdown } from './site-crawl.mjs';

export const SCHEMA_VERSION = 1;
export const EXTRACTOR_VERSION = '1';
export const INCOMPLETE_CANDIDATE_REASON = '候选目录不是完整材料树';
export const UNOBSERVED_CRAWL_REASON = '这次抓取没有观测到该页，不能当成确认删除';
export const SNAPSHOT_PATH = /^snapshots\/[^/]+\//;

export function stableSourcePath(path) {
  return String(path).replace(SNAPSHOT_PATH, '');
}

const SKIP_DIR = new Set(['.git', 'node_modules', '.wrangler', '.astro', '.vite', 'dist', '__pycache__', '.pi']);

export function rawSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function stripLeadingSourceComments(text) {
  return String(text).replace(/^(?:<!-- source: .*? -->\n)?(?:<!-- retrieved: .*? -->\n)?\n*/, '');
}

export function normalizeSourceText(raw) {
  const text = String(raw).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalizePageMarkdown(stripLeadingSourceComments(text));
}

export function textFingerprint(raw) {
  return rawSha256(Buffer.from(normalizeSourceText(raw), 'utf8'));
}

export function parseFrontmatter(text) {
  if (!String(text).startsWith('---\n')) return null;
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) return null;
  const block = text.slice(4, end);
  const result = { sources: [] };
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const keyed = line.match(/^([A-Za-z][\w]*):\s*(.*)$/);
    if (!keyed) continue;
    const [, key, raw] = keyed;
    if (key === 'sources') {
      while (i + 1 < lines.length && /^\s+-\s+\S/.test(lines[i + 1])) {
        i += 1;
        result.sources.push(lines[i].replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
      }
      continue;
    }
    if (raw === '|' || raw === '>') {
      while (i + 1 < lines.length && (lines[i + 1] === '' || /^\s/.test(lines[i + 1]))) i += 1;
      continue;
    }
    result[key] = raw.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

export function unindentYaml(lines) {
  const nonempty = lines.filter(line => line.trim());
  if (!nonempty.length) return '';
  const indent = Math.min(...nonempty.map(line => (line.match(/^ */) || [''])[0].length));
  return lines.map(line => line.slice(Math.min(indent, line.length))).join('\n');
}

export function parseAgentInstructions(text) {
  if (!String(text).startsWith('---\n')) return '';
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) return '';
  const lines = text.slice(4, end).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^agentInstructions:\s*(\||>)\s*$/.test(lines[i])) continue;
    const collected = [];
    i += 1;
    while (i < lines.length && (lines[i] === '' || /^\s/.test(lines[i]))) {
      collected.push(lines[i]);
      i += 1;
    }
    return unindentYaml(collected);
  }
  return '';
}

export function completionConditionText(text) {
  const instructions = parseAgentInstructions(text);
  if (!instructions) return '';
  const zh = instructions.indexOf('完成条件');
  if (zh >= 0) return instructions.slice(zh);
  const en = instructions.indexOf('Completion condition');
  return en < 0 ? '' : instructions.slice(en);
}

export function hasCompletionLine(text) {
  const instructions = parseAgentInstructions(text);
  if (!instructions) return false;
  return instructions.split('\n').some(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('完成条件：') || trimmed.startsWith('完成条件:') || trimmed.startsWith('Completion condition:');
  });
}

export function globMatch(path, pattern) {
  const pathParts = String(path).split('/');
  const patParts = String(pattern).split('/');
  if (pathParts.length !== patParts.length) return false;
  return patParts.every((part, index) => part === '*' || part === pathParts[index]);
}

export function parseSourceLedger(courseMd) {
  const rows = [];
  for (const line of String(courseMd).split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 3) continue;
    if (/^:?-+:?$/.test(cells[0]) || /教学主张/.test(cells[0])) continue;
    const patterns = cells[2].split(',').map(cell => cell.trim().replace(/`/g, '')).filter(Boolean);
    if (!patterns.length) continue;
    rows.push({ claim: cells[0], patterns });
  }
  return rows;
}

export function matchLedgerClaim(sourcePath, ledger) {
  const stable = stableSourcePath(sourcePath);
  const inner = stable.replace(/^material-\d+\//, '');
  for (const row of ledger) {
    for (const pattern of row.patterns) {
      if (globMatch(stable, pattern) || globMatch(inner, pattern)) return row.claim;
    }
  }
  return null;
}

function posixRel(from, to) {
  return relative(from, to).split(sep).join('/');
}

export function listFiles(root, { skipDir = SKIP_DIR, ignore = true } = {}) {
  const files = [];
  if (!existsSync(root) || !statSync(root).isDirectory()) return files;
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      if (ignore && (skipDir.has(name) || name === '.DS_Store')) continue;
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile()) files.push(posixRel(root, full));
    }
  };
  walk(root);
  files.sort();
  return files;
}

export function lessonFiles(schoolPath) {
  const dir = join(schoolPath, 'src/content/lessons');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(name => /\.mdx?$/.test(name)).sort().map(name => join(dir, name));
}

export function readLessons(schoolPath) {
  return lessonFiles(schoolPath).map(file => {
    const text = readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text) || { sources: [] };
    return {
      file,
      slug: fm.slug || '',
      order: Number(fm.order) || 0,
      sources: (fm.sources || []).filter(Boolean),
      text,
    };
  }).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export function collectReferencedPaths(schoolPath) {
  const seen = new Set();
  for (const lesson of readLessons(schoolPath)) {
    for (const path of lesson.sources) seen.add(stableSourcePath(path));
  }
  return [...seen].sort();
}

function settingsOf(schoolPath) {
  return JSON.parse(readFileSync(join(schoolPath, 'school.settings.json'), 'utf8'));
}

function materialFor(path, materials) {
  const stable = stableSourcePath(path);
  const folder = stable.split('/')[0];
  return (materials || []).find(item => {
    if (!item?.path) return false;
    if (stable === item.path || stable.startsWith(`${item.path}/`)) return true;
    return folder === item.path.split('/')[0];
  });
}

export async function gitFileHistory(repoDir, filePath, { run = command } = {}) {
  return inspectGitRepo(repoDir, filePath, { run });
}

async function inspectGitRepo(repoDir, filePath, { run = command } = {}) {
  const isShallow = existsSync(join(repoDir, '.git', 'shallow'));
  let snapshotCommit = null;
  try {
    snapshotCommit = await run('git', ['rev-parse', 'HEAD'], { cwd: repoDir });
  } catch {
    snapshotCommit = null;
  }
  if (isShallow) {
    return { snapshotCommit, historyStatus: 'unknown', lastChangeCommit: null };
  }
  try {
    const last = await run('git', ['log', '-1', '--format=%H', '--', filePath], { cwd: repoDir });
    return { snapshotCommit, historyStatus: 'complete', lastChangeCommit: last || null };
  } catch {
    return { snapshotCommit, historyStatus: 'unknown', lastChangeCommit: null };
  }
}

function fingerprintRecord(path, bytes) {
  return {
    path,
    sha256: rawSha256(bytes),
    textFingerprint: textFingerprint(bytes.toString('utf8')),
  };
}

function fileRecord(schoolPath, sourcePath, materials, gitMeta) {
  const full = join(schoolPath, 'public/sources', sourcePath);
  const record = fingerprintRecord(sourcePath, readFileSync(full));
  const material = materialFor(sourcePath, materials);
  if (material?.commit || gitMeta) {
    record.snapshotCommit = gitMeta?.snapshotCommit ?? material?.commit ?? null;
    record.historyStatus = gitMeta?.historyStatus ?? null;
    record.lastChangeCommit = gitMeta?.lastChangeCommit ?? null;
  }
  return record;
}

export function collectInventory(schoolPath, materials) {
  const byPath = new Map();
  const publicRoot = join(schoolPath, 'public/sources');
  if (existsSync(publicRoot) && statSync(publicRoot).isDirectory()) {
    for (const rel of listFiles(publicRoot)) {
      if (rel.startsWith('snapshots/')) continue;
      byPath.set(rel, fingerprintRecord(rel, readFileSync(join(publicRoot, rel))));
    }
  }
  for (const material of materials || []) {
    if (!material?.path) continue;
    const folderName = material.path.split('/')[0];
    const folder = join(schoolPath, 'materials', folderName);
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const rel of listFiles(folder)) {
      const sourcePath = `${folderName}/${rel}`;
      byPath.set(sourcePath, fingerprintRecord(sourcePath, readFileSync(join(folder, rel))));
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function publishedSourceUrl(schoolPath, sourcePath) {
  const full = join(schoolPath, 'public/sources', sourcePath);
  if (!existsSync(full)) return null;
  const match = readFileSync(full, 'utf8').match(/^<!-- source: (\S+) -->/m);
  return match?.[1] || null;
}

function parseNameStatus(status) {
  const rows = [];
  for (const line of String(status).split('\n').map(item => item.trim()).filter(Boolean)) {
    const match = line.match(/^([A-Z])(?:\d*)\t(.+)$/) || line.match(/^([A-Z])(?:\d*)\s+(.+)$/);
    if (!match) continue;
    rows.push({ code: match[1], inner: match[2] });
  }
  return rows;
}

export async function gitMetaFor(schoolPath, sourcePath, materials, { run = command } = {}) {
  const material = materialFor(sourcePath, materials);
  if (!material?.commit && !material?.path) return null;
  if (!material?.commit) return null;
  const repo = join(schoolPath, 'materials', material.path);
  if (!existsSync(join(repo, '.git'))) {
    return { snapshotCommit: material.commit, historyStatus: 'unknown', lastChangeCommit: null };
  }
  const inner = sourcePath.slice(material.path.length + 1);
  return inspectGitRepo(repo, inner, { run });
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function expandLedgerPatterns(sourcesRoot, ledger) {
  const files = listFiles(sourcesRoot).filter(file => !file.startsWith('snapshots/'));
  const expanded = [];
  for (const row of ledger) {
    for (const pattern of row.patterns) {
      const matched = files.filter(file => globMatch(file, pattern) || globMatch(file.replace(/^material-\d+\//, ''), pattern));
      if (pattern.includes('*') && !matched.length) {
        expanded.push({ path: pattern, claim: row.claim, kind: 'unexpanded' });
      }
      for (const file of matched) {
        expanded.push({ path: file, claim: row.claim, kind: 'file' });
      }
    }
  }
  return expanded;
}

export function buildLessonDeps(schoolPath) {
  const lessons = readLessons(schoolPath);
  const coursePath = join(schoolPath, 'COURSE.md');
  const ledger = existsSync(coursePath) ? parseSourceLedger(readFileSync(coursePath, 'utf8')) : [];
  const sourcesRoot = join(schoolPath, 'public/sources');
  const assigned = new Set();
  const lessonEntries = lessons.map(lesson => {
    const sources = lesson.sources.map(path => {
      const stable = stableSourcePath(path);
      assigned.add(stable);
      assigned.add(stable.replace(/^material-\d+\//, ''));
      const exists = existsSync(join(sourcesRoot, path)) || existsSync(join(sourcesRoot, stable));
      const claim = matchLedgerClaim(stable, ledger);
      if (!exists) {
        return {
          path: stable,
          claim: claim || '',
          status: 'unresolved',
          reason: 'public/sources 中不存在该路径',
        };
      }
      if (!claim) {
        return {
          path: stable,
          claim: '',
          status: 'unresolved',
          reason: '账本没有对应这条路径，未用关键词猜测',
        };
      }
      return { path: stable, claim, status: 'reviewed' };
    });
    return { slug: lesson.slug, order: lesson.order, sources };
  });
  const unresolved = [];
  for (const item of expandLedgerPatterns(sourcesRoot, ledger)) {
    if (item.kind === 'unexpanded') {
      unresolved.push({
        path: item.path,
        claim: item.claim,
        status: 'unresolved',
        reason: '通配无法展开到 public/sources 中的真实文件',
      });
      continue;
    }
    if (assigned.has(item.path) || assigned.has(item.path.replace(/^material-\d+\//, ''))) continue;
    unresolved.push({
      path: item.path,
      claim: item.claim,
      status: 'unresolved',
      reason: '账本有此路径，但与各关已写入的 sources 对不上，未编入 frontmatter',
    });
  }
  for (const row of ledger) {
    for (const pattern of row.patterns) {
      if (!pattern.includes('*')) continue;
      const prefix = pattern.split('*')[0];
      for (const file of listFiles(sourcesRoot).filter(item => !item.startsWith('snapshots/'))) {
        const inner = file.replace(/^material-\d+\//, '');
        if (!(file.startsWith(prefix) || inner.startsWith(prefix))) continue;
        if (assigned.has(file) || assigned.has(inner)) continue;
        if (globMatch(file, pattern) || globMatch(inner, pattern)) continue;
        if (unresolved.some(item => item.path === file || item.path === inner)) continue;
        unresolved.push({
          path: file,
          claim: row.claim,
          status: 'unresolved',
          reason: `通配 ${pattern} 展不开该真实文件`,
        });
      }
    }
  }
  return { schemaVersion: SCHEMA_VERSION, lessons: lessonEntries, unresolved };
}

export async function writeBaseline(schoolPath, { now = new Date(), run = command } = {}) {
  const settings = settingsOf(schoolPath);
  const materials = settings.materials || [];
  const referenced = collectReferencedPaths(schoolPath);
  const files = [];
  for (const path of referenced) {
    const full = join(schoolPath, 'public/sources', path);
    if (!existsSync(full)) continue;
    const gitMeta = await gitMetaFor(schoolPath, path, materials, { run });
    files.push(fileRecord(schoolPath, path, materials, gitMeta));
  }
  const baseline = {
    schemaVersion: SCHEMA_VERSION,
    extractorVersion: EXTRACTOR_VERSION,
    generatedAt: now.toISOString(),
    files,
    inventory: collectInventory(schoolPath, materials),
  };
  const deps = buildLessonDeps(schoolPath);
  writeJson(join(schoolPath, 'source-state/baseline.json'), baseline);
  writeJson(join(schoolPath, 'source-state/lesson-deps.json'), deps);
  return { baseline, deps };
}

export function runIdFrom(now) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

export function locateCandidateFile(candidateRoot, sourcePath, materials) {
  const stable = stableSourcePath(sourcePath);
  const direct = join(candidateRoot, stable);
  if (existsSync(direct)) return direct;
  const folder = stable.split('/')[0];
  const rest = stable.startsWith(`${folder}/`) ? stable.slice(folder.length + 1) : stable;
  const nested = join(candidateRoot, rest);
  if (existsSync(nested)) return nested;
  const material = materialFor(stable, materials);
  if (material) {
    const matRest = stable.slice(material.path.length + 1);
    const matNested = join(candidateRoot, matRest);
    if (existsSync(matNested)) return matNested;
  }
  return null;
}

export function listCandidateSourcePaths(candidateRoot, materials) {
  const files = listFiles(candidateRoot).filter(file => !file.startsWith('snapshots/'));
  if (files.some(file => /^material-\d+\//.test(file))) return files;
  if ((materials || []).length === 1) {
    const matFolder = (materials[0]?.path || '').split('/')[0];
    return files.map(file => `${matFolder}/${file}`);
  }
  return files;
}

function fingerprintPair(bytes) {
  return {
    sha256: rawSha256(bytes),
    textFingerprint: textFingerprint(bytes.toString('utf8')),
  };
}

export function compareSources({
  baseline,
  deps,
  candidateFiles,
  missing = [],
  failed = [],
  unobserved = [],
  added = [],
  lessonFingerprints = {},
}) {
  const baselineByPath = new Map((baseline.files || []).map(file => [file.path, file]));
  const lessonByPath = new Map();
  for (const lesson of deps.lessons || []) {
    for (const source of lesson.sources || []) {
      const stable = stableSourcePath(source.path);
      const list = lessonByPath.get(stable) || [];
      list.push(lesson.slug);
      lessonByPath.set(stable, list);
    }
  }
  const changed = [];
  const unchanged = [];
  const candidateLessons = [];
  const bySlug = new Map();
  const failedPaths = new Set(failed.map(item => item.path));
  const unobservedPaths = new Set(unobserved.map(item => item.path));
  const missingSet = new Set(missing);
  for (const [path, file] of baselineByPath) {
    if (failedPaths.has(path) || unobservedPaths.has(path) || missingSet.has(path)) continue;
    const current = candidateFiles[path];
    if (!current) continue;
    const slugs = lessonByPath.get(path) || [];
    const differing = [];
    for (const slug of slugs) {
      const currentFp = lessonFingerprints?.[slug]?.[path] ?? file.textFingerprint;
      if (currentFp === current.textFingerprint) continue;
      differing.push(slug);
    }
    const matchesBaseline = current.textFingerprint === file.textFingerprint;
    if (matchesBaseline && !differing.length) {
      unchanged.push({ path });
      continue;
    }
    changed.push({
      path,
      sha256: { baseline: file.sha256, candidate: current.sha256 },
      textFingerprint: { baseline: file.textFingerprint, candidate: current.textFingerprint },
    });
    for (const slug of differing) {
      const entry = bySlug.get(slug) || { slug, paths: [] };
      entry.paths.push(path);
      bySlug.set(slug, entry);
    }
  }
  for (const entry of bySlug.values()) candidateLessons.push(entry);
  candidateLessons.sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    schemaVersion: SCHEMA_VERSION,
    extractorVersion: EXTRACTOR_VERSION,
    added: added.map(path => typeof path === 'string' ? { path } : path),
    deleted: missing.map(path => typeof path === 'string' ? { path } : path),
    unobserved: unobserved.map(item => typeof item === 'string' ? { path: item } : item),
    failed: failed.map(item => typeof item === 'string' ? { path: item } : item),
    changed,
    unchanged,
    candidateLessons,
  };
}

function hasContentShift(report) {
  const blockingUnobserved = (report.unobserved || []).filter(item => item.reason !== INCOMPLETE_CANDIDATE_REASON);
  return report.added.length || report.deleted.length || report.changed.length || report.failed.length || blockingUnobserved.length;
}

export function assertLessonHasSources(text, fileName, sourcesRoot) {
  const fm = parseFrontmatter(text);
  if (!fm?.sources?.length) throw new Error(`Lesson ${fileName} is missing sources.`);
  for (const path of fm.sources) {
    if (!path || path.includes('..') || path.startsWith('/')) {
      throw new Error(`Lesson ${fileName} has an invalid source path: ${path}`);
    }
    if (!existsSync(join(sourcesRoot, path))) {
      throw new Error(`Lesson ${fileName} source not found: ${path}`);
    }
  }
}

export function assertRequiredLessonSources(schoolPath) {
  const sourcesRoot = join(schoolPath, 'public/sources');
  for (const lesson of readLessons(schoolPath)) {
    assertLessonHasSources(lesson.text, lesson.file.split(sep).pop(), sourcesRoot);
  }
}

async function defaultGitFetch(repo) {
  await command('git', ['fetch', '--depth', '1'], { cwd: repo });
  return command('git', ['rev-parse', 'FETCH_HEAD'], { cwd: repo });
}

async function defaultGitDiff(repo, paths) {
  const args = ['diff', '--name-status', 'HEAD', 'FETCH_HEAD', '--', ...paths];
  return command('git', args, { cwd: repo });
}

async function defaultGitDiffAll(repo) {
  return command('git', ['diff', '--name-status', 'HEAD', 'FETCH_HEAD'], { cwd: repo });
}

function gitShowBytes(repo, spec) {
  return new Promise((accept, reject) => {
    const child = spawn('git', ['show', spec], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let stderr = '';
    child.stdout.on('data', data => chunks.push(data));
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? accept(Buffer.concat(chunks)) : reject(new Error(stderr.trim() || `git show failed (${code})`)));
  });
}

async function defaultGitShow(repo, spec) {
  return gitShowBytes(repo, spec);
}

function lessonSourceFingerprints(schoolPath) {
  const result = {};
  const sourcesRoot = join(schoolPath, 'public/sources');
  for (const lesson of readLessons(schoolPath)) {
    const byPath = {};
    for (const path of lesson.sources) {
      if (!SNAPSHOT_PATH.test(path)) continue;
      const full = join(sourcesRoot, path);
      if (!existsSync(full)) continue;
      byPath[stableSourcePath(path)] = textFingerprint(readFileSync(full, 'utf8'));
    }
    if (Object.keys(byPath).length) result[lesson.slug] = byPath;
  }
  return result;
}

async function checkGitMaterial({ schoolPath, material, referenced, run, git }) {
  referenced = referenced.map(stableSourcePath);
  const repo = join(schoolPath, 'materials', material.path);
  const failed = [];
  const deleted = [];
  const unobserved = [];
  const candidateFiles = {};
  if (!existsSync(join(repo, '.git'))) {
    for (const path of referenced) failed.push({ path, reason: 'materials 中没有可 fetch 的 Git 工作副本' });
    return { candidateFiles, failed, deleted, unobserved, added: [] };
  }
  try {
    await (git.fetch || defaultGitFetch)(repo, { run });
  } catch (error) {
    for (const path of referenced) failed.push({ path, reason: error.message });
    return { candidateFiles, failed, deleted, unobserved, added: [] };
  }
  const innerPaths = referenced.map(path => path.slice(material.path.length + 1));
  let status = '';
  try {
    status = await (git.diff || defaultGitDiff)(repo, innerPaths, { run });
  } catch (error) {
    for (const path of referenced) failed.push({ path, reason: error.message });
    return { candidateFiles, failed, deleted, unobserved, added: [] };
  }
  const seen = new Set();
  for (const { code, inner } of parseNameStatus(status)) {
    const path = `${material.path}/${inner}`;
    seen.add(path);
    if (code === 'D') {
      deleted.push(path);
      continue;
    }
    try {
      const shown = await (git.show || defaultGitShow)(repo, `FETCH_HEAD:${inner}`, { run });
      const bytes = Buffer.isBuffer(shown) ? shown : Buffer.from(shown, 'utf8');
      candidateFiles[path] = fingerprintPair(bytes);
    } catch (error) {
      failed.push({ path, reason: error.message });
    }
  }
  for (const path of referenced) {
    if (seen.has(path) || failed.some(item => item.path === path) || deleted.includes(path)) continue;
    const full = join(schoolPath, 'public/sources', path);
    if (!existsSync(full)) {
      unobserved.push({ path, reason: 'Git diff 未给出该已引用路径，本地公开副本也不存在' });
      continue;
    }
    const bytes = readFileSync(full);
    candidateFiles[path] = fingerprintPair(bytes);
  }
  const added = [];
  try {
    const allStatus = await (git.diffAll || defaultGitDiffAll)(repo, { run });
    for (const { code, inner } of parseNameStatus(allStatus)) {
      if (code !== 'A') continue;
      added.push(`${material.path}/${inner}`);
    }
  } catch (error) {
    failed.push({ path: material.path, reason: error.message });
  }
  return { candidateFiles, failed, deleted, unobserved, added };
}

function readLocalCandidate(schoolPath, candidateRoot, materials, referenced, { inventory = [], incomplete = false } = {}) {
  referenced = referenced.map(stableSourcePath);
  const failed = [];
  const deleted = [];
  const unobserved = [];
  const candidateFiles = {};
  const referencedSet = new Set(referenced);
  const inventoryByPath = new Map((inventory || []).map(item => [item.path, item]));
  for (const path of referenced) {
    const located = locateCandidateFile(candidateRoot, path, materials);
    if (!located) {
      deleted.push(path);
      continue;
    }
    try {
      candidateFiles[path] = fingerprintPair(readFileSync(located));
    } catch (error) {
      failed.push({ path, reason: error.message });
    }
  }
  const candidatePaths = listCandidateSourcePaths(candidateRoot, materials);
  const candidateSet = new Set(candidatePaths);
  const added = [];
  const extraChanged = [];
  for (const path of candidatePaths) {
    if (referencedSet.has(path)) continue;
    const located = locateCandidateFile(candidateRoot, path, materials);
    if (!located) continue;
    const current = fingerprintPair(readFileSync(located));
    const known = inventoryByPath.get(path);
    if (known) {
      if (current.textFingerprint !== known.textFingerprint) extraChanged.push({ path, ...current });
      candidateFiles[path] = current;
      continue;
    }
    added.push(path);
  }
  if (incomplete) {
    for (const item of inventory) {
      if (referencedSet.has(item.path) || candidateSet.has(item.path)) continue;
      unobserved.push({ path: item.path, reason: INCOMPLETE_CANDIDATE_REASON });
    }
  }
  return { candidateFiles, failed, deleted, unobserved, added, extraChanged };
}

function mergeExtraChanged(report, extraChanged) {
  for (const item of extraChanged) {
    if (report.changed.some(row => row.path === item.path) || report.added.some(row => row.path === item.path)) continue;
    report.changed.push({
      path: item.path,
      sha256: { candidate: item.sha256 },
      textFingerprint: { candidate: item.textFingerprint },
    });
  }
  return report;
}

function pageBytes(dest, page) {
  if (page?.text != null) return Buffer.from(page.text, 'utf8');
  const full = join(dest, page.file);
  if (existsSync(full)) return readFileSync(full);
  return null;
}

export async function checkDocsMaterial({ schoolPath, material, referenced, now = new Date(), crawl, inventory = [] }) {
  referenced = referenced.map(stableSourcePath);
  const date = now.toISOString().slice(0, 10);
  const materialsDir = join(schoolPath, 'materials');
  try {
    const snapshot = await (crawl || writeDocsSnapshot)(material, materialsDir, date);
    if (!snapshot || typeof snapshot === 'string' || !snapshot.dest) {
      throw new Error('抓取没有返回逐页结果');
    }
    const dest = snapshot.dest;
    const pages = snapshot.pages || [];
    const failedUrls = new Set(snapshot.failedUrls || []);
    const referencedSet = new Set(referenced);
    const inventoryByPath = new Map((inventory || []).map(item => [item.path, item]));
    const candidateFiles = {};
    const failed = [];
    const unobserved = [];
    const added = [];
    const extraChanged = [];
    const seen = new Set();
    for (const page of pages) {
      const path = `${material.path}/${String(page.file || '').replace(/\\/g, '/').replace(/^\.\//, '')}`;
      seen.add(path);
      if (page.url && failedUrls.has(page.url)) {
        failed.push({ path, reason: `抓取状态不是 2xx: ${page.url}` });
        continue;
      }
      const bytes = pageBytes(dest, page);
      if (!bytes) {
        if (referencedSet.has(path)) unobserved.push({ path, reason: UNOBSERVED_CRAWL_REASON });
        continue;
      }
      const current = fingerprintPair(bytes);
      if (referencedSet.has(path)) {
        candidateFiles[path] = current;
        continue;
      }
      const known = inventoryByPath.get(path);
      if (known) {
        if (current.textFingerprint !== known.textFingerprint) extraChanged.push({ path, ...current });
        candidateFiles[path] = current;
        continue;
      }
      added.push(path);
    }
    for (const path of referenced) {
      if (seen.has(path) || failed.some(item => item.path === path) || unobserved.some(item => item.path === path)) continue;
      const url = publishedSourceUrl(schoolPath, path);
      if (url && failedUrls.has(url)) {
        failed.push({ path, reason: `抓取状态不是 2xx: ${url}` });
        continue;
      }
      unobserved.push({ path, reason: UNOBSERVED_CRAWL_REASON });
    }
    return { candidateFiles, failed, deleted: [], unobserved, added, extraChanged };
  } catch (error) {
    return {
      candidateFiles: {},
      failed: referenced.map(path => ({ path, reason: error.message })),
      deleted: [],
      unobserved: [],
      added: [],
      extraChanged: [],
    };
  }
}

export async function checkSingleMaterial({
  schoolPath,
  material,
  referenced,
  now = new Date(),
  run = command,
  fetchSingle,
  inventory = [],
}) {
  referenced = referenced.map(stableSourcePath);
  const date = now.toISOString().slice(0, 10);
  const materialsDir = join(schoolPath, 'materials');
  const folder = referenced[0]?.split('/')[0] || (material.path || '').split('/')[0];
  try {
    const snapshot = await (fetchSingle || writeSingleSnapshot)(material, materialsDir, date, { run });
    const dest = snapshot?.dest || (typeof snapshot === 'string' ? snapshot : null);
    if (!dest || !existsSync(dest)) {
      throw new Error('单页快照目录不存在');
    }
    const referencedSet = new Set(referenced);
    const inventoryByPath = new Map((inventory || []).map(item => [item.path, item]));
    const candidateFiles = {};
    const failed = [];
    const deleted = [];
    const unobserved = [];
    const added = [];
    const extraChanged = [];

    for (const path of referenced) {
      const rel = path.startsWith(`${folder}/`) ? path.slice(folder.length + 1) : path;
      const located = join(dest, rel);
      if (!existsSync(located)) {
        deleted.push(path);
        continue;
      }
      try {
        candidateFiles[path] = fingerprintPair(readFileSync(located));
      } catch (error) {
        failed.push({ path, reason: error.message });
      }
    }

    const snapshotFiles = listFiles(dest);
    for (const rel of snapshotFiles) {
      const path = `${folder}/${rel}`;
      if (referencedSet.has(path)) continue;
      const located = join(dest, rel);
      let current;
      try {
        current = fingerprintPair(readFileSync(located));
      } catch (error) {
        failed.push({ path, reason: error.message });
        continue;
      }
      const known = inventoryByPath.get(path);
      if (known) {
        if (current.textFingerprint !== known.textFingerprint) {
          extraChanged.push({ path, ...current });
        }
        candidateFiles[path] = current;
        continue;
      }
      added.push(path);
    }

    return { candidateFiles, failed, deleted, unobserved, added, extraChanged };
  } catch (error) {
    return {
      candidateFiles: {},
      failed: referenced.map(path => ({ path, reason: error.message })),
      deleted: [],
      unobserved: [],
      added: [],
      extraChanged: [],
    };
  }
}

export async function checkSchool(schoolPath, {
  source,
  now = new Date(),
  run = command,
  git = {},
  crawl,
  fetchFailedMaterials = [],
  fetchSingle,
} = {}) {
  const baselinePath = join(schoolPath, 'source-state/baseline.json');
  const depsPath = join(schoolPath, 'source-state/lesson-deps.json');
  if (!existsSync(baselinePath) || !existsSync(depsPath)) {
    throw new Error('No source baseline. Run sources NAME --baseline first.');
  }
  if (source && !existsSync(source)) throw new Error(`Candidate source is not an accessible local path: ${source}`);
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const deps = buildLessonDeps(schoolPath);
  if (String(baseline.extractorVersion) !== String(EXTRACTOR_VERSION)) {
    throw new Error(`Baseline extractorVersion ${baseline.extractorVersion} does not match ${EXTRACTOR_VERSION}. Re-run sources NAME --baseline.`);
  }
  const settings = settingsOf(schoolPath);
  const materials = settings.materials || [];
  const referenced = (baseline.files || []).map(file => stableSourcePath(file.path));
  const inventory = baseline.inventory || [];
  const candidateFiles = {};
  const failed = [];
  const deleted = [];
  const unobserved = [];
  const added = [];
  const extraChanged = [];

  if (source) {
    const local = readLocalCandidate(schoolPath, source, materials, referenced, { inventory, incomplete: true });
    Object.assign(candidateFiles, local.candidateFiles);
    failed.push(...local.failed);
    deleted.push(...local.deleted);
    unobserved.push(...local.unobserved);
    added.push(...local.added);
    extraChanged.push(...local.extraChanged);
  } else {
    const grouped = new Map();
    for (const path of referenced) {
      const stable = stableSourcePath(path);
      const material = materialFor(stable, materials) || { path: stable.split('/')[0] };
      const folder = (material.path || stable).split('/')[0];
      const list = grouped.get(folder) || { material, folder, paths: [] };
      if (!list.material.commit && material.commit) list.material = material;
      if (!list.material.crawl && material.crawl) list.material = material;
      if (!list.material.url && material.url) list.material = material;
      list.paths.push(path);
      grouped.set(folder, list);
    }
    for (const { material, folder, paths } of grouped.values()) {
      if (fetchFailedMaterials.includes(material.path) || fetchFailedMaterials.includes(folder)) {
        failed.push(...paths.map(path => ({ path, reason: 'fetch failed' })));
        continue;
      }
      if (material.commit) {
        const gitResult = await checkGitMaterial({ schoolPath, material, referenced: paths, run, git });
        Object.assign(candidateFiles, gitResult.candidateFiles);
        failed.push(...gitResult.failed);
        deleted.push(...gitResult.deleted);
        unobserved.push(...gitResult.unobserved);
        added.push(...gitResult.added);
        continue;
      }
      if (material.crawl && !material.crawl.fallback) {
        const docs = await checkDocsMaterial({ schoolPath, material, referenced: paths, now, crawl, inventory });
        Object.assign(candidateFiles, docs.candidateFiles);
        failed.push(...docs.failed);
        deleted.push(...docs.deleted);
        unobserved.push(...docs.unobserved);
        added.push(...docs.added);
        extraChanged.push(...(docs.extraChanged || []));
        continue;
      }
      if (/^https?:\/\//i.test(material.url || '')) {
        const single = await checkSingleMaterial({ schoolPath, material, referenced: paths, now, run, fetchSingle, inventory });
        Object.assign(candidateFiles, single.candidateFiles);
        failed.push(...single.failed);
        deleted.push(...single.deleted);
        unobserved.push(...single.unobserved);
        added.push(...single.added);
        extraChanged.push(...(single.extraChanged || []));
        continue;
      }
      const folderPath = join(schoolPath, 'materials', folder);
      if (existsSync(folderPath)) {
        const local = readLocalCandidate(schoolPath, folderPath, [material], paths, { inventory, incomplete: false });
        Object.assign(candidateFiles, local.candidateFiles);
        failed.push(...local.failed);
        deleted.push(...local.deleted);
        unobserved.push(...local.unobserved);
        added.push(...local.added);
        extraChanged.push(...local.extraChanged);
      } else {
        failed.push(...paths.map(path => ({ path, reason: '没有 --source，也没有可检查的本地材料副本' })));
      }
    }
  }

  const report = mergeExtraChanged(compareSources({
    baseline,
    deps,
    candidateFiles,
    missing: deleted,
    failed,
    unobserved,
    added,
    lessonFingerprints: lessonSourceFingerprints(schoolPath),
  }), extraChanged);
  report.runId = runIdFrom(now);
  const outDir = join(schoolPath, 'evidence/updates', report.runId);
  writeJson(join(outDir, 'changes.json'), report);
  return { report, exitCode: hasContentShift(report) ? 2 : 0, outDir };
}

export async function runSources({ schoolPath, options = {}, originalCwd = process.cwd(), now = new Date(), run = command, git = {}, crawl, fetchFailedMaterials, fetchSingle } = {}) {
  if (options.baseline && options.check) throw new Error('Use only one of --baseline or --check.');
  if (!options.baseline && !options.check) throw new Error('sources requires --baseline or --check.');
  if (options.baseline && options.source?.length) throw new Error('--source is only valid with sources --check.');
  if (options.check && options.source?.length > 1) throw new Error('sources --check accepts at most one --source.');
  if (options.baseline) {
    const result = await writeBaseline(schoolPath, { now, run });
    console.log(`已写入 ${posixRel(resolve(schoolPath, '../..'), join(schoolPath, 'source-state/baseline.json'))}（${result.baseline.files.length} 个被引用文件）。`);
    console.log(`已写入 ${posixRel(resolve(schoolPath, '../..'), join(schoolPath, 'source-state/lesson-deps.json'))}。`);
    return 0;
  }
  const source = options.source?.[0] ? resolve(originalCwd, options.source[0]) : undefined;
  const result = await checkSchool(schoolPath, { source, now, run, git, crawl, fetchFailedMaterials, fetchSingle });
  const rel = posixRel(resolve(schoolPath, '../..'), join(result.outDir, 'changes.json'));
  if (result.exitCode === 0) console.log(`已写入 ${rel}。无内容变化。`);
  else console.log(`已写入 ${rel}。内容变化或抓取失败，退出码 2。`);
  return result.exitCode;
}
