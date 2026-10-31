import {
  scanCodeFences,
  assertPredictFence,
  assertNumberlineFence,
} from './predict-block.mjs';

const SUPPORTED_LANGS = new Set(['python', 'javascript', 'typescript']);
const LANG_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
};

export function normalizeRunLang(lang) {
  const lower = (lang || '').toLowerCase().trim();
  return LANG_ALIASES[lower] || lower;
}

export function isRunnableLang(lang) {
  return SUPPORTED_LANGS.has(normalizeRunLang(lang));
}

function fail(fileName, message) {
  throw new Error(`Run block in ${fileName}: ${message}`);
}

function parseFenceInfo(info) {
  const trimmed = info.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/);
  const hasRun = tokens.includes('run');
  if (!hasRun) return null;
  const rawLang = tokens[0] === 'run' ? 'run' : tokens[0];
  const lang = normalizeRunLang(rawLang);
  return { lang, rawLang, isRun: true };
}

export function assertRunFence(fence, fileName = 'lesson.md') {
  const fenceInfo = parseFenceInfo(fence.info);
  if (!fenceInfo) return null;
  if (!fence.closed) {
    fail(fileName, 'unclosed run code fence');
  }
  if (!SUPPORTED_LANGS.has(fenceInfo.lang)) {
    fail(fileName, `"run" is only supported for python, javascript, typescript, got "${fenceInfo.rawLang}"`);
  }
  const lines = fence.code.split('\n');
  if (fenceInfo.lang === 'python') {
    for (const line of lines) {
      if (/^\s*>>>/.test(line)) {
        fail(fileName, 'python run block cannot contain interactive interpreter prompt ">>>"');
      }
    }
  } else if (fenceInfo.lang === 'javascript' || fenceInfo.lang === 'typescript') {
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
        fail(fileName, `${fenceInfo.lang} run block cannot contain import or export statements`);
      }
    }
    if (fence.code.includes('require(')) {
      fail(fileName, `${fenceInfo.lang} run block cannot contain require()`);
    }
  }
  return {
    lang: fenceInfo.lang,
    code: fence.code,
  };
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
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const block = assertRunFence(fence, fileName);
    if (block) blocks.push(block);
  }
  return blocks;
}

export function assertLessonCodeBlocks(markdown, fileName = 'lesson.md') {
  for (const fence of scanCodeFences(markdown)) {
    if (/^predict(?:\s|$)/.test(fence.info)) {
      assertPredictFence(fence, fileName);
    } else if (/(?:^|\s)run(?:\s|$)/.test(fence.info)) {
      assertRunFence(fence, fileName);
    } else if (/^numberline(?:\s|$)/.test(fence.info)) {
      assertNumberlineFence(fence, fileName);
    }
  }
}
