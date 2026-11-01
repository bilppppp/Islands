import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, basename, join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { piPrint } from './pi.mjs';
import { assertLessonHasSources, listFiles, rawSha256, readLessons } from './source-state.mjs';
import { assertSourceCites, assertSourceCitesGfm } from '../school-kit/overlay/src/lib/source-cite.mjs';
import { assertLessonCodeBlocks, resolvePreviewRuntime, normalizeRunLang } from '../school-kit/overlay/src/lib/run-block.mjs';
import { scanCodeFences } from '../school-kit/overlay/src/lib/predict-block.mjs';
import { verifySchoolLessons, getFenceStartLine, formatWarnings } from './verify-lesson-blocks.mjs';

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

export function isIslandChrome(schoolDirOrConfigText) {
  let text = '';
  if (typeof schoolDirOrConfigText === 'string') {
    if (existsSync(join(schoolDirOrConfigText, 'school.config.ts'))) {
      text = readFileSync(join(schoolDirOrConfigText, 'school.config.ts'), 'utf8');
    } else {
      text = schoolDirOrConfigText;
    }
  }
  const stripped = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  return /(?:^|\n)\s*chrome\s*:\s*["']island["']\s*,?\s*(?:$|\n)/m.test(stripped);
}

export function assertIslandBlocksSupported(isIsland, lessons) {
  if (isIsland) return;
  for (const { text, name = 'lesson.md' } of lessons) {
    const fences = scanCodeFences(text);
    for (const fence of fences) {
      if (/^predict(?:\s|$)/.test(fence.info)) {
        throw new Error(`课文 ${name} 包含 predict 交互块，但当前学校不是 island chrome 皮肤。这些块只在 island 皮肤上渲染。`);
      }
      if (/(?:^|\s)(?:run|preview)(?:\s|$)/.test(fence.info)) {
        throw new Error(`课文 ${name} 包含 run/preview 交互块，但当前学校不是 island chrome 皮肤。这些块只在 island 皮肤上渲染。`);
      }
      if (/^numberline(?:\s|$)/.test(fence.info)) {
        throw new Error(`课文 ${name} 包含 numberline 交互块，但当前学校不是 island chrome 皮肤。这些块只在 island 皮肤上渲染。`);
      }
    }
  }
}

export function assertConsistentPreviewRuntimes(lessons) {
  let hasReact = false;
  const preactBlocks = [];

  for (const { text, name = 'lesson.md' } of lessons) {
    const fences = scanCodeFences(text);
    for (const fence of fences) {
      const tokens = fence.info.trim().split(/\s+/);
      const isPreview = tokens.includes('preview');
      const rawLang = tokens[0] === 'run' || tokens[0] === 'preview' ? tokens[0] : tokens[0];
      const lang = normalizeRunLang(rawLang);
      if (isPreview && (lang === 'jsx' || lang === 'tsx')) {
        const line = getFenceStartLine(text, fence);
        let explicit = null;
        if (tokens.includes('react')) explicit = 'react';
        else if (tokens.includes('preact')) explicit = 'preact';
        const runtime = resolvePreviewRuntime(explicit, fence.code);
        if (runtime === 'react') {
          hasReact = true;
        } else if (runtime === 'preact') {
          preactBlocks.push({ name, line });
        }
      }
    }
  }

  if (hasReact && preactBlocks.length > 0) {
    const first = preactBlocks[0];
    throw new Error(`一门课中不能混用 React 和 Preact：发现 ${first.name} 第 ${first.line} 行的代码块落到了 Preact 运行时，但课程其他部分使用了 React。`);
  }
}

export function validateGeneration(inputPath, options = {}) {
  const { logWarnings = true, out = null } = options;
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const output = resolve(root, input.output);
  const lessons = readdirSync(join(output, 'src/content/lessons')).filter(n => /\.mdx?$/.test(n)).sort();
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
  const lessonEntries = [];
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
    assertSourceCitesGfm(text, name, output);
    assertLessonCodeBlocks(text, name);
    if (requireLessonSources) assertLessonHasSources(text, name, join(output, 'public/sources'));
    lessonEntries.push({ name, text });
  }

  const isIsland = isIslandChrome(output);
  assertIslandBlocksSupported(isIsland, lessonEntries);
  assertConsistentPreviewRuntimes(lessonEntries);

  const verification = verifySchoolLessons(join(output, 'src/content/lessons'), output);
  const warnings = verification.warnings || [];
  if (out && typeof out === 'object') {
    out.warnings = warnings;
    out.lessonsCount = lessons.length;
  }

  const totalInteractiveBlocks = (verification.summary?.byType?.predict || 0)
    + (verification.summary?.byType?.numberline || 0)
    + (verification.summary?.byType?.run || 0)
    + (verification.summary?.byType?.preview || 0);
  if (totalInteractiveBlocks > 0 || warnings.length > 0) {
    const schoolName = basename(output);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const evidenceDir = join(root, 'evidence/generation/blocks');
    mkdirSync(evidenceDir, { recursive: true });
    const evidencePath = join(evidenceDir, `${schoolName}-${timestamp}.json`);
    const recordBlocks = verification.blocks.map(b => ({
      file: b.file,
      line: b.line,
      lang: b.lang,
      mode: b.mode,
      runtime: b.runtime ?? null,
      ok: b.ok,
      ms: b.ms ?? 0,
      error: b.error || (b.ok ? null : (b.stderr || '未知错误')),
      stdout: (b.stdout || '').slice(0, 500),
      html: (b.html || '').slice(0, 500),
      pageText: (b.pageText || '').slice(0, 500),
    }));
    const evidenceData = {
      school: schoolName,
      timestamp: new Date().toISOString(),
      summary: verification.summary,
      blocks: recordBlocks,
      warnings,
    };
    writeFileSync(evidencePath, JSON.stringify(evidenceData, null, 2) + '\n');
  }

  if (logWarnings && warnings.length > 0) {
    console.log('\n' + formatWarnings(warnings));
  }

  if (!verification.ok) {
    const err = new Error(verification.error || 'Lesson block verification failed');
    err.warnings = warnings;
    throw err;
  }

  return lessons.length;
}

export function repairPrompt(errorText) {
  return [
    '课程验证未通过，请修复课文中的问题。',
    '',
    '注意：',
    '1. 只修下面列出的问题；',
    '2. 不要改 slug、order、完成条件文字和 COURSE.md 的路线；',
    '3. 修完后不需要自己再调用验证。',
    '',
    '错误全文如下：',
    errorText,
  ].join('\n');
}

export async function repairUntilValid({
  validate,
  repair,
  maxRounds = 2,
  onRoundStart,
  onRoundResult,
  onRoundFailure,
}) {
  let lastError;
  try {
    return await validate();
  } catch (err) {
    lastError = err;
  }

  for (let round = 1; round <= maxRounds; round++) {
    onRoundStart?.(round);
    const repairResult = await repair(lastError, round);
    onRoundResult?.(round, repairResult);
    try {
      return await validate();
    } catch (err) {
      lastError = err;
      onRoundFailure?.(round, lastError);
    }
  }

  throw lastError;
}

export function createGenerationSessionId(schoolName, date = new Date()) {
  const ts = date.toISOString().replace(/[:.]/g, '-');
  return `${schoolName}-${ts}`;
}

export async function generate(inputPath, { model, piPrint: customPiPrint = piPrint, validate } = {}) {
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const output = resolve(root, input.output);
  const schoolName = basename(output);
  const logPath = join(root, `evidence/generation/${schoolName}.jsonl`);
  const sessionDir = join(root, 'evidence/generation/sessions');
  const sessionId = createGenerationSessionId(schoolName);

  const summary = await customPiPrint(generationPrompt(inputPath), {
    model, cwd: root, tools: 'read,bash,write,edit',
    logPath,
    sessionDir,
    sessionId,
    onTool: name => console.log(`生成中：${name}`)
  });
  console.log(summary);

  const appendLog = (entry) => {
    try {
      mkdirSync(dirname(logPath), { recursive: true });
      appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch {}
  };

  try {
    return await repairUntilValid({
      validate: () => (validate ? validate() : validateGeneration(inputPath)),
      repair: async (lastError, round) => {
        return await customPiPrint(repairPrompt(lastError.message), {
          model,
          cwd: root,
          tools: 'read,bash,write,edit',
          logPath,
          sessionDir,
          sessionId,
          appendLog: true,
          onTool: name => console.log(`修复第 ${round} 轮中：${name}`)
        });
      },
      maxRounds: 2,
      onRoundStart: (round) => {
        console.log(`\n课程验证未通过，开始第 ${round} 轮修复...`);
        appendLog({ type: 'repair_round_start', round, sessionId, timestamp: new Date().toISOString() });
      },
      onRoundResult: (round, result) => {
        console.log(`第 ${round} 轮修复完成：${result}`);
        appendLog({ type: 'repair_round_result', round, sessionId, result, timestamp: new Date().toISOString() });
      },
      onRoundFailure: (round, error) => {
        console.log(`第 ${round} 轮修复后验证仍未通过：\n${error.message}`);
        appendLog({ type: 'repair_round_failure', round, sessionId, error: error.message, timestamp: new Date().toISOString() });
      },
    });
  } catch (error) {
    const hint = `已尝试 2 轮修复，仍未全部通过。已保留生成的文件，可以修改后运行 npm run school -- finish ${schoolName}，不要用 retry。`;
    console.error(`\n${hint}`);
    throw new Error(`${error.message}\n\n${hint}`);
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (!process.argv[2]) { console.error('Use: node scripts/generate.mjs INPUT.json (or npm run school -- create)'); process.exitCode = 1; }
  else generate(resolve(process.argv[2])).catch(error => { console.error(error.message); process.exitCode = 1; });
}
