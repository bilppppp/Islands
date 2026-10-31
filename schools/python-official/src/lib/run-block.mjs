import { scanCodeFences } from './predict-block.mjs';

function fail(fileName, message) {
  throw new Error(`Run block in ${fileName}: ${message}`);
}

function parseFenceInfo(info) {
  const trimmed = info.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/);
  const hasRun = tokens.includes('run');
  if (!hasRun) return null;
  const lang = tokens[0] === 'run' ? 'run' : tokens[0];
  return { lang, isRun: true };
}

export function collectRunBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const fenceInfo = parseFenceInfo(fence.info);
    if (!fenceInfo) continue;
    if (!fence.closed) {
      fail(fileName, 'unclosed run code fence');
    }
    blocks.push({
      lang: fenceInfo.lang,
      code: fence.code,
    });
  }
  return blocks;
}

export function assertRunBlocks(markdown, fileName = 'lesson.md') {
  const blocks = collectRunBlocks(markdown, fileName);
  for (const block of blocks) {
    if (block.lang !== 'python') {
      fail(fileName, `"run" is only supported for python, got "${block.lang}"`);
    }
    const lines = block.code.split('\n');
    for (const line of lines) {
      if (/^\s*>>>/.test(line)) {
        fail(fileName, 'python run block cannot contain interactive interpreter prompt ">>>"');
      }
    }
  }
  return blocks;
}
