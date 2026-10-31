import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanCodeFences } from '../school-kit/overlay/src/lib/predict-block.mjs';
import { assertRunFence } from '../school-kit/overlay/src/lib/run-block.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CHILD_SCRIPT = resolve(__dirname, 'verify-lesson-blocks-child.mjs');

function getFenceStartLine(markdown, fence) {
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

    const allBlocks = [...blockResults, ...(childResult.blocks || [])];
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
