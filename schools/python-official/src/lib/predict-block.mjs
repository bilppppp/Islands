function fail(fileName, message) {
  throw new Error(`Predict block in ${fileName}: ${message}`);
}

function splitUnescapedPipes(str) {
  const parts = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length && str[i + 1] === '|') {
      current += '\\|';
      i++;
    } else if (str[i] === '|') {
      parts.push(current);
      current = '';
    } else {
      current += str[i];
    }
  }
  parts.push(current);
  return parts;
}

const unescapePipes = (s) => s.replace(/\\\|/g, '|');

export function parsePredictBlock(source) {
  if (typeof source !== 'string') {
    return { error: 'source must be a string' };
  }

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let question = null;
  let rawChoices = null;
  let answer = null;
  let explainLines = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (explainLines !== null) {
      explainLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      return { error: `invalid line without colon: "${line}"` };
    }

    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();

    if (key === 'question') {
      if (question !== null) return { error: 'duplicate question' };
      question = val;
    } else if (key === 'choices') {
      if (rawChoices !== null) return { error: 'duplicate choices' };
      rawChoices = val;
    } else if (key === 'answer') {
      if (answer !== null) return { error: 'duplicate answer' };
      answer = val;
    } else if (key === 'explain') {
      explainLines = [val];
    } else {
      return { error: `unknown key "${key}"` };
    }
  }

  if (question === null || question === '') {
    return { error: 'missing or empty question' };
  }
  if (answer === null || answer === '') {
    return { error: 'missing or empty answer' };
  }
  if (explainLines === null) {
    return { error: 'missing explain' };
  }

  const explain = explainLines.join('\n').trim();
  if (explain === '') {
    return { error: 'missing or empty explain' };
  }

  const normalizedAnswer = unescapePipes(answer);

  let choices = null;
  if (rawChoices !== null) {
    const items = splitUnescapedPipes(rawChoices).map((s) => unescapePipes(s.trim()));
    if (items.some((item) => item === '')) {
      return { error: 'choices contains empty option' };
    }
    if (items.length < 2 || items.length > 5) {
      return { error: `choices must contain between 2 and 5 options, got ${items.length}` };
    }
    const unique = new Set(items);
    if (unique.size !== items.length) {
      return { error: 'choices contains duplicate options' };
    }
    if (!items.includes(normalizedAnswer)) {
      return { error: `answer "${normalizedAnswer}" is not in choices [${items.join(', ')}]` };
    }
    choices = items;
  }

  return {
    question,
    choices,
    answer: normalizedAnswer,
    explain,
  };
}

export function stripFrontmatter(markdown) {
  const text = String(markdown);
  const end = text.startsWith('---\n') ? text.indexOf('\n---\n', 4) : -1;
  return end < 0 ? text : text.slice(end + 5);
}

export function scanCodeFences(markdown) {
  const body = stripFrontmatter(markdown);
  const blocks = [];
  let current = null;
  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!current) {
      const match = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
      if (match) {
        current = {
          char: match[1][0],
          length: match[1].length,
          info: match[2].trim(),
          startLine: i,
          lines: [],
        };
      }
      continue;
    }

    const closeMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/);
    if (closeMatch && closeMatch[1][0] === current.char && closeMatch[1].length >= current.length) {
      blocks.push({
        info: current.info,
        code: current.lines.join('\n'),
        startLine: current.startLine,
        endLine: i,
        closed: true,
      });
      current = null;
      continue;
    }

    current.lines.push(line);
  }

  if (current) {
    blocks.push({
      info: current.info,
      code: current.lines.join('\n'),
      startLine: current.startLine,
      endLine: lines.length - 1,
      closed: false,
    });
  }

  return blocks;
}

export function collectPredictBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    if (!/^predict(?:\s|$)/.test(fence.info)) continue;
    if (!fence.closed) {
      fail(fileName, 'unclosed predict code fence');
    }
    blocks.push(fence.code);
  }
  return blocks;
}

export function assertPredictBlocks(markdown, fileName = 'lesson.md') {
  const rawBlocks = collectPredictBlocks(markdown, fileName);
  const parsed = [];
  for (const raw of rawBlocks) {
    const res = parsePredictBlock(raw);
    if (res.error) {
      fail(fileName, res.error);
    }
    parsed.push(res);
  }
  return parsed;
}
