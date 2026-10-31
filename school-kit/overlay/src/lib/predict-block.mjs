function fail(fileName, message) {
  throw new Error(`Predict block in ${fileName}: ${message}`);
}

function failNumberline(fileName, message) {
  throw new Error(`Numberline block in ${fileName}: ${message}`);
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

export function splitPipes(str) {
  if (typeof str !== 'string') return [];
  return splitUnescapedPipes(str).map((s) => unescapePipes(s.trim()));
}

export function parseKeyValueBlock(source, { multilineKey = null } = {}) {
  if (typeof source !== 'string') {
    return { error: 'source must be a string' };
  }

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const pairs = {};
  let multilineLines = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (multilineLines !== null) {
      multilineLines.push(line);
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

    if (key in pairs) {
      return { error: `duplicate ${key}` };
    }

    if (multilineKey && key === multilineKey) {
      multilineLines = [val];
    } else {
      pairs[key] = val;
    }
  }

  if (multilineKey && multilineLines !== null) {
    pairs[multilineKey] = multilineLines.join('\n').trim();
  }

  return { pairs };
}

export function parsePredictBlock(source) {
  const kv = parseKeyValueBlock(source, { multilineKey: 'explain' });
  if (kv.error) return { error: kv.error };
  const { pairs } = kv;

  for (const key of Object.keys(pairs)) {
    if (!['question', 'choices', 'answer', 'explain'].includes(key)) {
      return { error: `unknown key "${key}"` };
    }
  }

  const question = pairs.question;
  const rawChoices = pairs.choices ?? null;
  const answer = pairs.answer;
  const explain = pairs.explain;

  if (question === undefined || question === '') {
    return { error: 'missing or empty question' };
  }
  if (answer === undefined || answer === '') {
    return { error: 'missing or empty answer' };
  }
  if (explain === undefined) {
    return { error: 'missing explain' };
  }
  if (explain === '') {
    return { error: 'missing or empty explain' };
  }

  const normalizedAnswer = unescapePipes(answer);

  let choices = null;
  if (rawChoices !== null) {
    const items = splitPipes(rawChoices);
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

export function parseNumberlineBlock(source) {
  const kv = parseKeyValueBlock(source);
  if (kv.error) return { error: kv.error };
  const { pairs } = kv;

  for (const key of Object.keys(pairs)) {
    if (!['range', 'points', 'step', 'show', 'caption'].includes(key)) {
      return { error: `unknown key "${key}"` };
    }
  }

  if (!('range' in pairs) || pairs.range === '') {
    return { error: 'missing or empty range' };
  }
  const rangeMatch = pairs.range.match(/^(-?\d+)\s*\.\.\s*(-?\d+)$/);
  if (!rangeMatch) {
    return { error: `invalid range format "${pairs.range}", expected "min .. max" with integers` };
  }
  const min = parseInt(rangeMatch[1], 10);
  const max = parseInt(rangeMatch[2], 10);
  if (min >= max) {
    return { error: `range left endpoint (${min}) must be less than right endpoint (${max})` };
  }
  if (max - min > 40) {
    return { error: `range span (${max - min}) must not exceed 40` };
  }

  let step = 1;
  if ('step' in pairs) {
    const sStr = pairs.step.trim();
    if (sStr === '1') step = 1;
    else if (sStr === '0.5') step = 0.5;
    else if (sStr === '0.1') step = 0.1;
    else return { error: `invalid step "${sStr}", only 1, 0.5, or 0.1 are allowed` };
  }

  if (!('points' in pairs) || pairs.points === '') {
    return { error: 'missing or empty points' };
  }
  const rawPoints = splitPipes(pairs.points);
  if (rawPoints.length < 1 || rawPoints.length > 3) {
    return { error: `points must contain between 1 and 3 points, got ${rawPoints.length}` };
  }

  const points = [];
  const seenLabels = new Set();
  for (const item of rawPoints) {
    const eqIdx = item.indexOf('=');
    if (eqIdx === -1) {
      return { error: `invalid point format "${item}", expected "Label=value"` };
    }
    const label = item.slice(0, eqIdx).trim();
    const valStr = item.slice(eqIdx + 1).trim();
    if (!label) {
      return { error: `empty point label in "${item}"` };
    }
    if (seenLabels.has(label)) {
      return { error: `duplicate point label "${label}"` };
    }
    seenLabels.add(label);

    if (valStr === '') {
      return { error: `missing value for point "${label}"` };
    }
    const val = Number(valStr);
    if (Number.isNaN(val)) {
      return { error: `invalid numeric value "${valStr}" for point "${label}"` };
    }
    if (val < min || val > max) {
      return { error: `point "${label}" value ${val} is outside range [${min}, ${max}]` };
    }

    if (step === 1) {
      if (!Number.isInteger(val)) {
        return { error: `point "${label}" value ${val} does not land on step 1 tick` };
      }
    } else if (step === 0.5) {
      const rem = Math.abs(val * 2 - Math.round(val * 2));
      if (rem > 1e-6) {
        return { error: `point "${label}" value ${val} does not land on step 0.5 tick` };
      }
    } else if (step === 0.1) {
      const rem = Math.abs(val * 10 - Math.round(val * 10));
      if (rem > 1e-6) {
        return { error: `point "${label}" value ${val} does not land on step 0.1 tick` };
      }
    }

    points.push({ label, value: val });
  }

  let show = [];
  if ('show' in pairs && pairs.show.trim() !== '') {
    const rawShow = splitPipes(pairs.show);
    const validShowOptions = ['opposite', 'abs', 'distance'];
    const seenShow = new Set();
    for (const opt of rawShow) {
      if (!validShowOptions.includes(opt)) {
        return { error: `unknown show option "${opt}", expected one of [opposite, abs, distance]` };
      }
      if (seenShow.has(opt)) {
        return { error: `duplicate show option "${opt}"` };
      }
      seenShow.add(opt);
    }
    show = rawShow;
    if (show.includes('distance') && points.length !== 2) {
      return { error: `show option "distance" requires exactly 2 points, got ${points.length}` };
    }
  }

  const caption = pairs.caption ? pairs.caption.trim() : '';

  return {
    range: [min, max],
    points,
    step,
    show,
    caption,
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

export function assertPredictFence(fence, fileName = 'lesson.md') {
  if (!/^predict(?:\s|$)/.test(fence.info)) return null;
  if (!fence.closed) {
    fail(fileName, 'unclosed predict code fence');
  }
  const res = parsePredictBlock(fence.code);
  if (res.error) {
    fail(fileName, res.error);
  }
  return res;
}

export function collectPredictBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    if (assertPredictFence(fence, fileName)) {
      blocks.push(fence.code);
    }
  }
  return blocks;
}

export function assertPredictBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const block = assertPredictFence(fence, fileName);
    if (block) blocks.push(block);
  }
  return blocks;
}

export function assertNumberlineFence(fence, fileName = 'lesson.md') {
  if (!/^numberline(?:\s|$)/.test(fence.info)) return null;
  if (!fence.closed) {
    failNumberline(fileName, 'unclosed numberline code fence');
  }
  const res = parseNumberlineBlock(fence.code);
  if (res.error) {
    failNumberline(fileName, res.error);
  }
  return res;
}

export function collectNumberlineBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    if (assertNumberlineFence(fence, fileName)) {
      blocks.push(fence.code);
    }
  }
  return blocks;
}

export function assertNumberlineBlocks(markdown, fileName = 'lesson.md') {
  const blocks = [];
  for (const fence of scanCodeFences(markdown)) {
    const block = assertNumberlineFence(fence, fileName);
    if (block) blocks.push(block);
  }
  return blocks;
}
