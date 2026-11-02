import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scanCodeFences,
  stripFrontmatter,
  collectPredictBlocks,
  collectNumberlineBlocks,
} from '../school-kit/overlay/src/lib/predict-block.mjs';
import {
  assertRunFence,
  collectRunBlocks,
  PROGRAMMING_LANGUAGES,
  normalizeRunLang,
} from '../school-kit/overlay/src/lib/run-block.mjs';
import { parseFrontmatter } from './source-state.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CHILD_SCRIPT = resolve(__dirname, 'verify-lesson-blocks-child.mjs');

export function extractStringLiterals(code) {
  const literals = [];
  for (const m of (code || '').matchAll(/'((?:\\.|[^'\\])*)'/g)) literals.push(m[1]);
  for (const m of (code || '').matchAll(/"((?:\\.|[^"\\])*)"/g)) literals.push(m[1]);
  for (const m of (code || '').matchAll(/`((?:\\.|[^`\\])*)`/gs)) literals.push(m[1].replace(/\$\{[^}]*\}/g, ''));
  return literals.join('\n');
}

export function isEchoOnly(code, stdout) {
  if (!stdout || !stdout.trim()) return false;
  const literals = extractStringLiterals(code);
  if (!literals) return false;

  const cjkSegments = stdout.match(/[\u4e00-\u9fff]+/g) || [];
  const asciiWords = stdout.match(/[a-zA-Z0-9]+/g) || [];
  const allTokens = [...cjkSegments, ...asciiWords];

  if (allTokens.length === 0) return false;
  return allTokens.every((tok) => literals.includes(tok));
}

export function extractTechnicalIdentifier(token) {
  if (!token || typeof token !== 'string') return null;
  const w = token.replace(/^[('"`<]+|[)'"`>,;:.]+$/g, '');
  if (!w) return null;

  if (/^--[a-z0-9][a-z0-9-]*$/i.test(w)) {
    return w;
  }
  if (w.startsWith('~/') && /^~\/[a-zA-Z0-9_.~/*+-]+$/.test(w)) {
    return w;
  }
  if (w.length >= 4 && /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(w)) {
    return w;
  }
  return null;
}

export function getFenceStartLine(markdown, fence) {
  const text = String(markdown);
  const frontmatterEnd = text.startsWith('---\n') ? text.indexOf('\n---\n', 4) : -1;
  const frontmatterLineCount = frontmatterEnd >= 0
    ? (text.slice(0, frontmatterEnd + 5).match(/\n/g) || []).length
    : 0;
  return fence.startLine + frontmatterLineCount + 1;
}

export function formatBlockErrors(result, fileName = 'lesson.md') {
  if (!result || result.ok) return '';
  const lines = [];
  if (result.error) {
    lines.push(`【${fileName}】错误: ${result.error}`);
  }
  for (const block of result.blocks || []) {
    if (block.ok) continue;
    const runtimeStr = block.runtime ? ` (${block.runtime})` : '';
    const errText = block.error || block.stderr || '未知错误';
    const errLines = errText.trim().split('\n');
    const tailLines = errLines.slice(-20).join('\n');
    lines.push(
      `【${fileName}】第 ${block.index} 个块 (第 ${block.line} 行) [${block.lang} ${block.mode}${runtimeStr}]:\n${tailLines}`
    );
  }
  return lines.join('\n\n');
}

export function verifyLessonBlocks(
  lessonText,
  fileName = 'lesson.md',
  {
    schoolDir = process.env.ISLANDS_DEPS_SCHOOL || resolve(root, 'schools/astro-zero-to-one'),
    fileTimeoutMs = 60000,
    blockTimeoutMs = 10000,
  } = {}
) {
  try {
    const fences = scanCodeFences(lessonText);
    const candidateFences = fences.filter((f) => /(?:^|\s)(?:run|preview)(?:\s|$)/.test(f.info));

    if (candidateFences.length === 0) {
      return { ok: true, blocks: [] };
    }

    const blocksToRun = [];
    const blockResults = [];

    for (let i = 0; i < candidateFences.length; i++) {
      const fence = candidateFences[i];
      const line = getFenceStartLine(lessonText, fence);
      const index = i + 1;

      let fenceMeta;
      try {
        fenceMeta = assertRunFence(fence, fileName);
      } catch (err) {
        blockResults.push({
          index,
          line,
          lang: fence.info.split(/\s+/)[0] || 'unknown',
          mode: fence.info.includes('preview') ? 'preview' : 'run',
          runtime: null,
          ok: false,
          stdout: '',
          stderr: '',
          html: '',
          pageText: '',
          ms: 0,
          error: err.message,
        });
        continue;
      }

      if (!fenceMeta) {
        continue;
      }

      blocksToRun.push({
        index,
        line,
        lang: fenceMeta.lang,
        mode: fenceMeta.mode,
        runtime: fenceMeta.runtime || null,
        code: fenceMeta.code,
      });
    }

    if (blocksToRun.length === 0) {
      return {
        ok: blockResults.length === 0 || blockResults.every((b) => b.ok),
        blocks: blockResults,
      };
    }

    const inputPayload = JSON.stringify({
      schoolDir,
      blockTimeoutMs,
      blocks: blocksToRun,
    });

    const proc = spawnSync(process.execPath, [CHILD_SCRIPT], {
      input: inputPayload,
      timeout: fileTimeoutMs,
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf8',
      env: { ...process.env },
    });

    if (proc.error && proc.error.code === 'ETIMEDOUT') {
      const stderr = proc.stderr || '';
      const startMatches = [...stderr.matchAll(/^BLOCK (\d+) START$/gm)];
      let stuckIndex = blocksToRun[0].index;
      if (startMatches.length > 0) {
        stuckIndex = parseInt(startMatches[startMatches.length - 1][1], 10);
      }

      const completedMap = new Map();
      const doneMatches = [...stderr.matchAll(/^BLOCK (\d+) RESULT (.*)$/gm)];
      for (const m of doneMatches) {
        try {
          completedMap.set(parseInt(m[1], 10), JSON.parse(m[2]));
        } catch {}
      }

      for (const b of blocksToRun) {
        if (completedMap.has(b.index)) {
          blockResults.push(completedMap.get(b.index));
        } else if (b.index === stuckIndex) {
          blockResults.push({
            index: b.index,
            line: b.line,
            lang: b.lang,
            mode: b.mode,
            runtime: b.runtime,
            ok: false,
            stdout: '',
            stderr: '',
            html: '',
            pageText: '',
            ms: fileTimeoutMs,
            error: '执行超时 (文件超时中断)',
          });
        } else if (b.index > stuckIndex) {
          blockResults.push({
            index: b.index,
            line: b.line,
            lang: b.lang,
            mode: b.mode,
            runtime: b.runtime,
            ok: false,
            stdout: '',
            stderr: '',
            html: '',
            pageText: '',
            ms: 0,
            error: '未执行 (前序块超时中断)',
          });
        } else {
          blockResults.push({
            index: b.index,
            line: b.line,
            lang: b.lang,
            mode: b.mode,
            runtime: b.runtime,
            ok: false,
            stdout: '',
            stderr: '',
            html: '',
            pageText: '',
            ms: 0,
            error: '执行中断',
          });
        }
      }

      blockResults.sort((a, b) => a.index - b.index);
      return {
        ok: false,
        blocks: blockResults,
      };
    }

    if (proc.status !== 0 && !proc.stdout) {
      return {
        ok: false,
        error: proc.stderr || `子进程异常退出 (code: ${proc.status})`,
        blocks: blockResults,
      };
    }

    let childResult;
    try {
      childResult = JSON.parse((proc.stdout || '').trim());
    } catch (err) {
      return {
        ok: false,
        error: `解析子进程结果失败: ${err.message}\n${proc.stdout || proc.stderr}`,
        blocks: blockResults,
      };
    }

    if (childResult.error) {
      return {
        ok: false,
        error: childResult.error,
        blocks: [],
      };
    }

    const codeMap = new Map(blocksToRun.map((b) => [b.index, b.code]));
    const allBlocks = [...blockResults, ...(childResult.blocks || [])];
    for (const b of allBlocks) {
      if (!b.code && codeMap.has(b.index)) {
        b.code = codeMap.get(b.index);
      }
    }
    allBlocks.sort((a, b) => a.index - b.index);

    return {
      ok: allBlocks.every((b) => b.ok),
      blocks: allBlocks,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      blocks: [],
    };
  }
}

export function parseWantedInteractions(courseMdText, courseFile = 'COURSE.md') {
  if (!courseMdText) return [];
  const lines = courseMdText.split(/\r?\n/);
  let inSection = false;
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^#+\s*(.+)$/);
    if (headerMatch) {
      if (/^wanted\s+interactions$/i.test(headerMatch[1].trim())) {
        inSection = true;
        continue;
      } else if (inSection) {
        break;
      }
    }
    if (inSection) {
      if (!trimmed) continue;
      const message = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
      if (message) {
        items.push({
          level: 'info',
          code: 'wanted-interaction',
          file: courseFile,
          line: i + 1,
          message,
        });
      }
    }
  }
  return items;
}

export function collectSchoolWarnings(target, options = {}) {
  let lessonsList = [];
  let courseMdText = options.courseMdText || options.courseMd || '';
  let courseFile = options.courseFile || 'COURSE.md';
  let schoolDir = options.schoolDir || null;
  let sourcesDir = options.sourcesDir || null;
  let blocks = options.blocks || null;

  if (Array.isArray(target)) {
    lessonsList = target.map((item, idx) => ({
      file: item.file || item.name || `lesson-${idx + 1}.md`,
      text: typeof item === 'string' ? item : (item.text || ''),
    }));
  } else if (typeof target === 'string') {
    schoolDir = target;
    let lessonsDir = join(schoolDir, 'src/content/lessons');
    if (!existsSync(lessonsDir) && existsSync(schoolDir)) {
      lessonsDir = schoolDir;
      schoolDir = resolve(schoolDir, '..', '..');
    }
    if (!courseMdText && existsSync(join(schoolDir, 'COURSE.md'))) {
      courseMdText = readFileSync(join(schoolDir, 'COURSE.md'), 'utf8');
      courseFile = 'COURSE.md';
    }
    if (existsSync(lessonsDir)) {
      const files = readdirSync(lessonsDir).filter((n) => /\.mdx?$/.test(n)).sort();
      for (const f of files) {
        lessonsList.push({
          file: f,
          text: readFileSync(join(lessonsDir, f), 'utf8'),
        });
      }
    }
  } else if (target && typeof target === 'object') {
    if (Array.isArray(target.lessons)) {
      lessonsList = target.lessons.map((item, idx) => ({
        file: item.file || item.name || `lesson-${idx + 1}.md`,
        text: typeof item === 'string' ? item : (item.text || ''),
      }));
    }
    if (target.courseMdText || target.courseMd) {
      courseMdText = target.courseMdText || target.courseMd;
    }
    if (target.courseFile) {
      courseFile = target.courseFile;
    }
    if (target.schoolDir) schoolDir = target.schoolDir;
    if (target.sourcesDir) sourcesDir = target.sourcesDir;
    if (target.blocks) blocks = target.blocks;
  }

  if (options.lessons && Array.isArray(options.lessons)) {
    lessonsList = options.lessons.map((item, idx) => ({
      file: item.file || item.name || `lesson-${idx + 1}.md`,
      text: typeof item === 'string' ? item : (item.text || ''),
    }));
  }
  if (!sourcesDir && schoolDir) {
    sourcesDir = join(schoolDir, 'public/sources');
  }

  const warnings = [];
  let hasCodeBlock = false;
  const htmlPreviewBlocks = [];
  let totalInteractiveBlocks = 0;
  const taughtLanguages = new Set();

  for (const { file, text } of lessonsList) {
    const fences = scanCodeFences(text);
    const interactiveLines = [];

    for (const fence of fences) {
      const isPredict = /^predict(?:\s|$)/.test(fence.info);
      const isNumberline = /^numberline(?:\s|$)/.test(fence.info);
      const isRunOrPreview = /(?:^|\s)(?:run|preview)(?:\s|$)/.test(fence.info);
      const isInteractive = isPredict || isNumberline || isRunOrPreview;

      const line = getFenceStartLine(text, fence);

      if (isInteractive) {
        interactiveLines.push(line);
        totalInteractiveBlocks++;

        if (isRunOrPreview) {
          try {
            const runMeta = assertRunFence(fence, file);
            if (runMeta && runMeta.mode === 'preview' && runMeta.lang === 'html') {
              htmlPreviewBlocks.push({ file, line });
              if (runMeta.warning) {
                warnings.push({
                  level: 'warning',
                  code: 'preview-external-resource',
                  file,
                  line,
                  message: runMeta.warning,
                });
              }
            }
          } catch {}
        }
      } else {
        const rawLang = (fence.info || '').trim().split(/\s+/)[0]?.toLowerCase();
        if (rawLang && PROGRAMMING_LANGUAGES.has(rawLang)) {
          hasCodeBlock = true;
        }
        if (rawLang && rawLang !== 'predict' && rawLang !== 'numberline') {
          const norm = rawLang === 'py' ? 'python' : normalizeRunLang(rawLang);
          taughtLanguages.add(norm);
        }
      }
    }

    if (interactiveLines.length > 3) {
      warnings.push({
        level: 'warning',
        code: 'too-many-interactive-blocks',
        file,
        line: interactiveLines[3],
        message: `该关卡包含 ${interactiveLines.length} 个交互块（predict、numberline、run、preview），超过了建议的上限（最多 3 个）。`,
      });
    }
  }

  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (block.mode !== 'run' || !block.ok || !block.stdout) continue;
      const blockLang = block.lang === 'py' ? 'python' : normalizeRunLang(block.lang);
      const isTaught = taughtLanguages.has(blockLang);
      const nonEmptyLines = (block.stdout || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const hasMultipleLines = nonEmptyLines.length >= 2;
      if (hasMultipleLines || !isTaught) {
        let code = block.code;
        if (!code && block.file) {
          const lesson = lessonsList.find((l) => l.file === block.file);
          if (lesson) {
            const fences = scanCodeFences(lesson.text);
            for (const f of fences) {
              const line = getFenceStartLine(lesson.text, f);
              if (line === block.line) {
                code = f.code;
                break;
              }
            }
          }
        }
        if (code && isEchoOnly(code, block.stdout)) {
          warnings.push({
            level: 'warning',
            code: 'echo-only-run-block',
            file: block.file,
            line: block.line,
            message: !isTaught
              ? '这个 run 块只打印写死的文字，且课程并不教这门语言；考虑改成正文、表格或 predict 块。'
              : '这个 run 块只打印写死的文字；考虑改成正文、表格或 predict 块。',
          });
        }
      }
    }
  }

  if (sourcesDir && existsSync(sourcesDir)) {
    for (const { file, text } of lessonsList) {
      const frontmatter = parseFrontmatter(text);
      const sources = frontmatter?.sources;
      if (!sources || !Array.isArray(sources) || sources.length === 0) continue;

      let combinedSourceText = '';
      let readCount = 0;
      for (const s of sources) {
        const full = join(sourcesDir, s);
        if (s.endsWith('.html') || s.endsWith('.htm')) {
          const companion1 = full + '.txt';
          const companion2 = full.replace(/\.html?$/i, '.txt');
          if (existsSync(companion1)) {
            combinedSourceText += '\n' + readFileSync(companion1, 'utf8');
            readCount++;
          } else if (existsSync(companion2)) {
            combinedSourceText += '\n' + readFileSync(companion2, 'utf8');
            readCount++;
          } else if (existsSync(full)) {
            combinedSourceText += '\n' + readFileSync(full, 'utf8').replace(/<[^>]*>/g, ' ');
            readCount++;
          }
        } else if (existsSync(full)) {
          combinedSourceText += '\n' + readFileSync(full, 'utf8');
          readCount++;
        }
      }

      if (readCount === 0) continue;

      const sourceLower = combinedSourceText.toLowerCase();
      const frontmatterEnd = text.startsWith('---\n') ? text.indexOf('\n---\n', 4) : -1;
      const frontmatterLineCount = frontmatterEnd >= 0
        ? (text.slice(0, frontmatterEnd + 5).match(/\n/g) || []).length
        : 0;
      const body = stripFrontmatter(text);
      const fences = scanCodeFences(text);
      const lines = body.split('\n');
      let fenceIdx = 0;
      const unsourcedMap = new Map();

      for (let i = 0; i < lines.length; i++) {
        const fence = fences[fenceIdx];
        if (fence && i >= fence.startLine && i <= fence.endLine) {
          if (i === fence.endLine) fenceIdx++;
          continue;
        }
        const line = lines[i];
        const fileLineNo = i + frontmatterLineCount + 1;
        for (const m of line.matchAll(/(?<!`)(`+)(.+?)\1(?!`)/g)) {
          if (m[1].length >= 3) continue;
          const snippet = m[2];
          const words = snippet.trim().split(/\s+/);
          for (const raw of words) {
            const w = extractTechnicalIdentifier(raw);
            if (!w) continue;
            const target = w.toLowerCase();
            const altTarget = target.replace(/\/+$/, '');
            if (!sourceLower.includes(target) && (!altTarget || !sourceLower.includes(altTarget))) {
              if (!unsourcedMap.has(w)) {
                unsourcedMap.set(w, fileLineNo);
              }
            }
          }
        }
      }

      if (unsourcedMap.size > 0) {
        const uniqueIds = Array.from(unsourcedMap.keys());
        const firstLine = Math.min(...unsourcedMap.values());
        const displayed = uniqueIds.slice(0, 10);
        const remaining = uniqueIds.length - 10;
        const idListStr = remaining > 0 ? `${displayed.join('、')} 等 ${remaining} 个` : displayed.join('、');
        warnings.push({
          level: 'warning',
          code: 'unsourced-identifier',
          file,
          line: firstLine,
          identifiers: uniqueIds,
          message: `这些技术词在本课 sources 的已保存文件中找不到。若来自模型记忆，请先用 supplement --source 保存支持它的页面并加入 sources，或删去该细节；不要只去掉反引号或加入不相关的来源：${idListStr}。`,
        });
      }
    }
  }

  if (hasCodeBlock && totalInteractiveBlocks === 0) {
    warnings.push({
      level: 'warning',
      code: 'no-interactive-blocks-in-coding-course',
      file: 'COURSE.md',
      line: 1,
      message: '课程为编程课（课文中包含编程语言代码块），但整门课没有包含任何交互块（predict、numberline、run、preview）。没有合适的交互可以不加，不要为了消除这条提醒加入只打印固定文字的 run 块。',
    });
  }

  if (!hasCodeBlock && htmlPreviewBlocks.length > 0) {
    for (const block of htmlPreviewBlocks) {
      warnings.push({
        level: 'warning',
        code: 'preview-in-non-programming-course',
        file: block.file,
        line: block.line,
        message: '非编程课使用了 html preview 进行演示，请人工核对演示是否正确。',
      });
    }
  }

  if (courseMdText) {
    const wantedInfos = parseWantedInteractions(courseMdText, courseFile);
    warnings.push(...wantedInfos);
  }

  return warnings;
}

export function formatWarnings(warnings = []) {
  if (!warnings || warnings.length === 0) return '';
  const lines = ['提醒（不阻断）：'];
  for (const w of warnings) {
    const loc = w.file ? (w.line ? `【${w.file}:${w.line}】` : `【${w.file}】`) : '';
    lines.push(`- ${loc} [${w.level || 'warning'}] ${w.message}`);
  }
  return lines.join('\n');
}

export function verifySchoolLessons(lessonsDir, schoolDirOrOptions = {}) {
  const options = typeof schoolDirOrOptions === 'string'
    ? { schoolDir: schoolDirOrOptions }
    : (schoolDirOrOptions || {});
  const schoolDir = options.schoolDir || process.env.ISLANDS_DEPS_SCHOOL || resolve(root, 'schools/astro-zero-to-one');

  const files = existsSync(lessonsDir)
    ? readdirSync(lessonsDir).filter((n) => /\.mdx?$/.test(n)).sort()
    : [];

  const allBlocks = [];
  const lessonResults = [];
  const lessonEntries = [];
  const perLesson = {};
  const byType = {
    predict: 0,
    numberline: 0,
    run: 0,
    preview: 0,
  };
  let allOk = true;

  for (const file of files) {
    const filePath = join(lessonsDir, file);
    const text = readFileSync(filePath, 'utf8');
    lessonEntries.push({ file, text });
    const result = verifyLessonBlocks(text, file, {
      schoolDir,
      fileTimeoutMs: options.fileTimeoutMs,
      blockTimeoutMs: options.blockTimeoutMs,
    });

    let predictCount = 0;
    let numberlineCount = 0;
    try {
      predictCount = collectPredictBlocks(text, file).length;
    } catch {}
    try {
      numberlineCount = collectNumberlineBlocks(text, file).length;
    } catch {}

    let runCount = 0;
    let previewCount = 0;
    try {
      const runBlocks = collectRunBlocks(text, file);
      runCount = runBlocks.filter((b) => b.mode === 'run').length;
      previewCount = runBlocks.filter((b) => b.mode === 'preview').length;
    } catch {
      runCount = (result.blocks || []).filter((b) => b.mode === 'run').length;
      previewCount = (result.blocks || []).filter((b) => b.mode === 'preview').length;
    }

    const totalCount = predictCount + numberlineCount + runCount + previewCount;
    perLesson[file] = {
      total: totalCount,
      predict: predictCount,
      numberline: numberlineCount,
      run: runCount,
      preview: previewCount,
    };

    byType.predict += predictCount;
    byType.numberline += numberlineCount;
    byType.run += runCount;
    byType.preview += previewCount;

    for (const block of result.blocks || []) {
      allBlocks.push({ ...block, file });
    }
    if (!result.ok) {
      allOk = false;
    }
    lessonResults.push({ file, result });
  }

  const totalBlocks = allBlocks.length;
  const passedBlocks = allBlocks.filter((b) => b.ok).length;
  const failedBlocks = totalBlocks - passedBlocks;
  const passRate = totalBlocks > 0 ? Number((passedBlocks / totalBlocks).toFixed(4)) : 1;

  const summary = {
    totalBlocks,
    passedBlocks,
    failedBlocks,
    passRate,
    perLesson,
    byType,
  };

  const error = lessonResults
    .filter((lr) => !lr.result.ok)
    .map((lr) => formatBlockErrors(lr.result, lr.file))
    .filter(Boolean)
    .join('\n\n');

  const courseMdPath = join(schoolDir, 'COURSE.md');
  const courseMdText = existsSync(courseMdPath) ? readFileSync(courseMdPath, 'utf8') : '';
  const warnings = collectSchoolWarnings({
    lessons: lessonEntries,
    courseMdText,
    courseFile: 'COURSE.md',
    schoolDir,
    sourcesDir: join(schoolDir, 'public/sources'),
    blocks: allBlocks,
  }, options);

  return {
    ok: allOk && failedBlocks === 0,
    lessons: lessonResults,
    blocks: allBlocks,
    summary,
    error,
    warnings,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const targetArg = process.argv[2];
  if (!targetArg) {
    console.error('用法: node scripts/verify-lesson-blocks.mjs schools/NAME');
    process.exit(1);
  }
  const schoolDir = resolve(root, targetArg);
  const lessonsDir = join(schoolDir, 'src/content/lessons');
  if (!existsSync(lessonsDir)) {
    console.error(`课文目录不存在: ${lessonsDir}`);
    process.exit(1);
  }
  const res = verifySchoolLessons(lessonsDir, schoolDir);
  for (const block of res.blocks) {
    const status = block.ok ? '✓ PASS' : '✗ FAIL';
    const runtimeStr = block.runtime ? ` (${block.runtime})` : '';
    console.log(`[${status}] 【${block.file}】第 ${block.index} 个块 (第 ${block.line} 行) [${block.lang} ${block.mode}${runtimeStr}] - ${block.ms}ms`);
    if (block.stdout && block.stdout.trim()) {
      console.log(`  stdout:\n${block.stdout.trim().split('\n').map((l) => '    ' + l).join('\n')}`);
    }
    if (!block.ok) {
      const errText = block.error || block.stderr || '未知错误';
      console.log(`  error:\n${errText.trim().split('\n').map((l) => '    ' + l).join('\n')}`);
    }
  }
  console.log(`\n汇总: 共 ${res.summary.totalBlocks} 个块，通过 ${res.summary.passedBlocks}，失败 ${res.summary.failedBlocks}，通过率 ${(res.summary.passRate * 100).toFixed(1)}%`);
  if (res.warnings && res.warnings.length > 0) {
    console.log(`\n${formatWarnings(res.warnings)}`);
  }
  if (!res.ok) {
    process.exit(1);
  }
}
