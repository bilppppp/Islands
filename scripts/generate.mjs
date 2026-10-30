import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { piPrint } from './pi.mjs';
import { assertLessonHasSources, listFiles, rawSha256, readLessons } from './source-state.mjs';
import { assertSourceCites } from '../school-kit/overlay/src/lib/source-cite.mjs';
import { assertPredictBlocks } from '../school-kit/overlay/src/lib/predict-block.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function generationPrompt(inputPath) {
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const output = resolve(root, input.output);
  if (!existsSync(join(output, 'school.config.ts'))) throw new Error('School must be scaffolded before generation.');
  const protocol = readFileSync(join(root, 'generation/protocol.md'), 'utf8');
  return `${protocol}\n\nRepository working directory: ${root}\nInput:\n${JSON.stringify(input, null, 2)}\nRead the sources and write the actual curriculum files now.`;
}

function failMath(fileName, line, kind) {
  throw new Error(`${kind} in ${fileName}:${line}`);
}

function stripQuote(line) {
  let rest = line;
  while (true) {
    const marker = rest.match(/^[ \t]{0,3}>[ \t]?/);
    if (!marker) return rest;
    rest = rest.slice(marker[0].length);
  }
}

function isDisplayDelimiter(line) {
  return /^[ \t]*\$\$[ \t]*$/.test(stripQuote(line));
}

function isIndentedCode(line) {
  return /^(?:    |\t)/.test(stripQuote(line));
}

function fenceMarker(line) {
  const opened = stripQuote(line).match(/^[ \t]{0,3}(`{3,}|~{3,})/);
  if (!opened) return null;
  return { char: opened[1][0], length: opened[1].length };
}

function isFenceClose(line, fence) {
  const closed = stripQuote(line).match(/^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/);
  return Boolean(closed && closed[1][0] === fence.char && closed[1].length >= fence.length);
}

function tickRun(line, index) {
  let n = 0;
  while (line[index + n] === '`') n += 1;
  return n;
}

function closingTicks(line, from, n) {
  let pos = from;
  while (pos < line.length) {
    if (line[pos] !== '`') {
      pos += 1;
      continue;
    }
    const run = tickRun(line, pos);
    if (run === n) return pos + run;
    pos += run;
  }
  return -1;
}

function scanText(line, start, fileName, lineNo, openTicks) {
  let i = start;
  let ticks = openTicks;
  let inlineOpen = null;
  while (i < line.length) {
    if (ticks !== null) {
      const close = closingTicks(line, i, ticks);
      if (close === -1) return ticks;
      ticks = null;
      i = close;
      continue;
    }
    if (inlineOpen !== null) {
      if (line[i] === '\\' && i + 1 < line.length) {
        i += 2;
        continue;
      }
      if (line[i] === '$') {
        inlineOpen = null;
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }
    if (line[i] === '\\' && line[i + 1] === '$') {
      i += 2;
      continue;
    }
    if (line[i] === '`') {
      const n = tickRun(line, i);
      const close = closingTicks(line, i + n, n);
      if (close === -1) return n;
      i = close;
      continue;
    }
    if (line[i] === '$') {
      if (line[i + 1] === '$') failMath(fileName, lineNo, 'Unclosed display math');
      inlineOpen = lineNo;
      i += 1;
      continue;
    }
    i += 1;
  }
  if (inlineOpen !== null) failMath(fileName, inlineOpen, 'Unclosed inline math');
  return ticks;
}

export function assertMathDelimiters(text, fileName = 'lesson.md') {
  const lines = text.split(/\r?\n/);
  let index = 0;
  if (lines[0] === '---') {
    index = 1;
    while (index < lines.length && lines[index] !== '---') index += 1;
    if (index < lines.length) index += 1;
  }

  let fence = null;
  let displayOpen = null;
  let indentedCode = false;
  let paragraph = false;
  let openTicks = null;

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNo = index + 1;
    const blank = stripQuote(line).trim() === '';

    if (fence) {
      if (isFenceClose(line, fence)) fence = null;
      continue;
    }

    if (displayOpen !== null) {
      if (isDisplayDelimiter(line)) displayOpen = null;
      continue;
    }

    if (openTicks !== null) {
      openTicks = scanText(line, 0, fileName, lineNo, openTicks);
      if (openTicks === null) paragraph = true;
      continue;
    }

    if (indentedCode) {
      if (blank || isIndentedCode(line)) continue;
      indentedCode = false;
    }

    if (blank) {
      paragraph = false;
      continue;
    }

    if (!paragraph && isIndentedCode(line)) {
      indentedCode = true;
      continue;
    }

    const opened = fenceMarker(line);
    if (opened) {
      fence = opened;
      paragraph = false;
      continue;
    }

    if (isDisplayDelimiter(line)) {
      displayOpen = lineNo;
      paragraph = false;
      continue;
    }

    openTicks = scanText(line, 0, fileName, lineNo, null);
    paragraph = openTicks === null;
  }

  if (displayOpen !== null) failMath(fileName, displayOpen, 'Unclosed display math');
}

function unindentYaml(lines) {
  const nonempty = lines.filter(line => line.trim() !== '');
  if (!nonempty.length) return lines.join('\n');
  const indent = Math.min(...nonempty.map(line => (line.match(/^ */) || [''])[0].length));
  return lines.map(line => line.slice(Math.min(indent, line.length))).join('\n');
}

export function completionConditionText(text) {
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
    const instructions = unindentYaml(collected);
    const zh = instructions.indexOf('完成条件');
    if (zh >= 0) return instructions.slice(zh);
    const en = instructions.indexOf('Completion condition');
    return en < 0 ? '' : instructions.slice(en);
  }
  return '';
}

export function completionSha256(text) {
  return rawSha256(Buffer.from(completionConditionText(text), 'utf8'));
}

function posixRel(from, to) {
  return relative(from, to).split(sep).join('/');
}

function localRevisionSlugs(plan) {
  const slugs = new Set();
  for (const change of plan.changes || []) {
    if (change.verdict !== '局部修订') continue;
    for (const slug of change.lessons || []) slugs.add(slug);
  }
  return slugs;
}

function assertPublicSources(plan, schoolPath) {
  if (!plan.publicSources) throw new Error('Plan is missing public source fingerprints.');
  const root = join(schoolPath, 'public/sources');
  const recorded = new Map((plan.publicSources || []).map(item => [item.path, item.sha256]));
  const current = existsSync(root)
    ? listFiles(root).filter(path => !path.startsWith('snapshots/'))
    : [];
  for (const path of current) {
    const expected = recorded.get(path);
    if (!expected) {
      throw new Error(`public/sources/${path} is not allowed to change during this update.`);
    }
    if (rawSha256(readFileSync(join(root, path))) !== expected) {
      throw new Error(`public/sources/${path} is not allowed to change during this update.`);
    }
  }
  for (const item of plan.publicSources) {
    const full = join(root, item.path);
    if (!existsSync(full)) throw new Error(`public/sources/${item.path} is missing.`);
    if (rawSha256(readFileSync(full)) !== item.sha256) {
      throw new Error(`public/sources/${item.path} is not allowed to change during this update.`);
    }
  }
}

export function assertUpdateAllowed(plan, schoolPath, { allowLocalRevisionBody = true } = {}) {
  const allowed = allowLocalRevisionBody ? localRevisionSlugs(plan) : new Set();
  const current = readLessons(schoolPath);
  const byFile = new Map(current.map(lesson => [posixRel(schoolPath, lesson.file), lesson]));
  for (const recorded of plan.lessons || []) {
    const lesson = byFile.get(recorded.file);
    if (!lesson) throw new Error(`Lesson ${recorded.file} is missing.`);
    if (lesson.slug !== recorded.slug || Number(lesson.order) !== Number(recorded.order)) {
      throw new Error(`Lesson ${recorded.file} slug or order changed.`);
    }
    if (!completionConditionText(lesson.text)) {
      throw new Error(`Lesson ${recorded.file} is missing 完成条件 or Completion condition.`);
    }
    if (completionSha256(lesson.text) !== recorded.completionSha256) {
      throw new Error(`Lesson ${recorded.file} 完成条件 changed.`);
    }
    if (!allowed.has(recorded.slug) && rawSha256(readFileSync(lesson.file)) !== recorded.sha256) {
      throw new Error(`Lesson ${recorded.file} is not allowed to change during this update.`);
    }
  }
  for (const lesson of current) {
    const rel = posixRel(schoolPath, lesson.file);
    if (!(plan.lessons || []).some(item => item.file === rel)) {
      throw new Error(`Lesson ${rel} is not allowed to change during this update.`);
    }
  }
  for (const file of plan.protectedFiles || []) {
    const full = join(schoolPath, file.path);
    if (!existsSync(full)) throw new Error(`File ${file.path} is missing.`);
    if (rawSha256(readFileSync(full)) !== file.sha256) {
      throw new Error(`File ${file.path} is not allowed to change during this update.`);
    }
  }
  assertPublicSources(plan, schoolPath);
  assertProtectedTrees(plan, schoolPath);
}

function assertProtectedTrees(plan, schoolPath) {
  const recorded = new Set((plan.protectedFiles || []).map(item => item.path));
  const skipPrefix = plan.planId ? `public/sources/snapshots/${plan.planId}/` : '';
  for (const relRoot of ['public/activities', 'src/content/exercises', 'public/sources/snapshots']) {
    const root = join(schoolPath, relRoot);
    if (!existsSync(root)) continue;
    for (const rel of listFiles(root, { ignore: false })) {
      const path = `${relRoot}/${rel}`;
      if (skipPrefix && path.startsWith(skipPrefix)) continue;
      if (!recorded.has(path)) {
        throw new Error(`${path} is not allowed to change during this update.`);
      }
    }
  }
}

export function validateGeneration(inputPath) {
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const output = resolve(root, input.output);
  const lessons = readdirSync(join(output, 'src/content/lessons')).filter(n => /\.mdx?$/.test(n));
  if (!lessons.length || !existsSync(join(output, 'COURSE.md'))) throw new Error('Generation did not produce a complete route and lessons. Files are preserved for inspection.');
  const configText = readFileSync(join(output, 'school.config.ts'), 'utf8');
  const field = (key) => configText.match(new RegExp(`^\\s*${key}:\\s*"((?:\\\\.|[^"])*)"`, 'm'))?.[1] ?? '';
  const internalName = field('name');
  const publicName = field('publicName');
  const shortName = field('shortName');
  if (!publicName || !shortName || publicName === internalName || shortName === internalName || publicName.includes('Learn Islands')) {
    throw new Error('Set school.config.ts publicName and shortName to the public course names from the generation protocol. The directory slug is not a title.');
  }
  const settingsPath = join(output, 'school.settings.json');
  const requireLessonSources = existsSync(settingsPath) && JSON.parse(readFileSync(settingsPath, 'utf8')).requireLessonSources === true;
  for (const name of lessons) {
    const text = readFileSync(join(output, 'src/content/lessons', name), 'utf8');
    if (!text.startsWith('---\n') || !/agentInstructions:\s*\|/.test(text) || /\bTODO\b|Coming soon\./.test(text)) {
      throw new Error(`Incomplete lesson: ${name}. Generated files have been preserved.`);
    }
    if (/Use the bash tool|Pi is the only|Pi should teach|--mode rpc/.test(text.split('\n---')[0])) throw new Error(`Harness-specific teaching notes in ${name}; revise before using the School.`);
    const lessonTitle = text.match(/^title:\s*(?:"([^"]*)"|'([^']*)'|(.+))\s*$/m);
    const titleValue = (lessonTitle?.[1] ?? lessonTitle?.[2] ?? lessonTitle?.[3] ?? '').trim();
    if (!titleValue || titleValue.includes(internalName) || titleValue.includes('Learn Islands')) {
      throw new Error(`Lesson title in ${name} must name what the learner studies, without the directory slug or the brand.`);
    }
    assertMathDelimiters(text, name);
    assertSourceCites(text, name, join(output, 'public/sources'));
    assertPredictBlocks(text, name);
    if (requireLessonSources) assertLessonHasSources(text, name, join(output, 'public/sources'));
  }
  return lessons.length;
}

export async function generate(inputPath, { model } = {}) {
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const output = resolve(root, input.output);
  const summary = await piPrint(generationPrompt(inputPath), {
    model, cwd: root, tools: 'read,bash,write,edit',
    logPath: join(root, `evidence/generation/${basename(output)}.jsonl`),
    sessionDir: join(root, 'evidence/generation/sessions'),
    onTool: name => console.log(`生成中：${name}`)
  });
  const count = validateGeneration(inputPath);
  console.log(summary);
  return count;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (!process.argv[2]) { console.error('Use: node scripts/generate.mjs INPUT.json (or npm run school -- create)'); process.exitCode = 1; }
  else generate(resolve(process.argv[2])).catch(error => { console.error(error.message); process.exitCode = 1; });
}
