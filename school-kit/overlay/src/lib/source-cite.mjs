import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { scanCodeFences, stripFrontmatter } from './predict-block.mjs';

const CITE_SOURCE = String.raw`\{\{cite\s+([^|\n]+?)\s+\|\s+path:\s*([^\s|]+)\s+\|\s+heading:\s+([^|\n]+?)(?:\s+\|\s+url:\s*([^\s|]+))?\s+\|\s+quote:\s+([\s\S]*?)\}\}`;

function citePattern() {
  return new RegExp(CITE_SOURCE, 'g');
}
const PHRASE_MAX = 40;
const QUOTE_MIN = 20;

export function normalizeSourceText(text) {
  return String(text).replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
}

export function isSafeSourcePath(path) {
  if (!path || path.startsWith('/') || path.includes('\\') || path.includes('..')) return false;
  return path.split('/').every((part) => part && part !== '.' && part !== '..');
}

function fail(fileName, message) {
  throw new Error(`Source cite in ${fileName}: ${message}`);
}

function httpUrl(value, fileName) {
  if (!value) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(fileName, `invalid original URL ${value}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    fail(fileName, `original URL must be http or https: ${value}`);
  }
  return value;
}

function parseCite(match, fileName) {
  const phrase = match[1].trim();
  const path = match[2].trim();
  const heading = normalizeSourceText(match[3]);
  const rawUrl = match[4] ? match[4].trim() : null;
  const url = rawUrl ? httpUrl(rawUrl, fileName) : null;
  const quote = normalizeSourceText(match[5]);
  if (!phrase) fail(fileName, 'the visible phrase is empty');
  if ([...phrase].length > PHRASE_MAX) {
    fail(fileName, `the visible phrase is longer than ${PHRASE_MAX} characters`);
  }
  if (!isSafeSourcePath(path)) fail(fileName, `invalid source path ${path}`);
  if (!heading) fail(fileName, 'the section heading is empty');
  if ([...quote].length < QUOTE_MIN) {
    fail(fileName, `the quote is shorter than ${QUOTE_MIN} characters`);
  }
  return { phrase, path, heading, url, quote };
}

export function visibleProse(markdown) {
  const body = stripFrontmatter(markdown);
  const fences = scanCodeFences(markdown);
  const lines = body.split('\n');
  const kept = [];
  let fenceIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const f = fences[fenceIdx];
    if (f && i >= f.startLine && i <= f.endLine) {
      if (i === f.endLine) fenceIdx++;
      continue;
    }
    kept.push(lines[i]);
  }
  const prose = kept.join('\n');
  const stripInlineCodePattern = new RegExp('(`[^`\\n]*`)|' + CITE_SOURCE, 'g');
  return prose.replace(stripInlineCodePattern, (match, inlineCode) => (inlineCode !== undefined ? '' : match));
}

function rejectBlockedLines(prose, fileName) {
  for (const line of prose.split('\n')) {
    if (!line.includes('{{cite')) continue;
    if (/^\s*\|/.test(line)) fail(fileName, 'a citation cannot sit inside a table');
    if (/^\s{0,3}#{1,6}\s/.test(line)) fail(fileName, 'a citation cannot sit in a heading');
  }
}

export function collectSourceCites(markdown, fileName = 'lesson.md') {
  const prose = visibleProse(markdown);
  rejectBlockedLines(prose, fileName);
  const cites = [];
  for (const match of prose.matchAll(citePattern())) cites.push(parseCite(match, fileName));
  const opened = prose.match(/\{\{cite\b/g) || [];
  if (opened.length !== cites.length) {
    fail(fileName, 'a {{cite}} marker is incomplete. Use phrase, path, heading, url (only when the source has a web page), and quote.');
  }
  return cites;
}

function readSavedSource(sourcesRoot, cite, fileName, readFile) {
  const full = join(sourcesRoot, cite.path);
  if (!existsSync(full)) fail(fileName, `saved source not found: ${cite.path}`);
  return readFile ? readFile(full) : readFileSync(full, 'utf8');
}

function assertAgainstSource(cite, sourceText, fileName) {
  const saved = normalizeSourceText(sourceText);
  if (!saved.includes(cite.heading)) {
    fail(fileName, `heading is not in ${cite.path}: ${cite.heading}`);
  }
  if (!saved.includes(cite.quote)) {
    fail(fileName, `quote is not in ${cite.path}: ${cite.quote}`);
  }
}

function listedSourcesFromMarkdown(markdown) {
  const text = String(markdown);
  if (!text.startsWith('---\n')) return [];
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) return [];
  const sources = [];
  const lines = text.slice(4, end).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^sources:\s*$/.test(lines[i])) continue;
    while (i + 1 < lines.length && /^\s+-\s+\S/.test(lines[i + 1])) {
      i += 1;
      sources.push(lines[i].replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
    }
  }
  return sources;
}

export function assertSourceCites(markdown, fileName, sourcesRoot, listedSources = null) {
  const cites = collectSourceCites(markdown, fileName);
  const listed = listedSources ?? listedSourcesFromMarkdown(markdown);
  const cache = new Map();
  for (const cite of cites) {
    if (!listed.includes(cite.path)) {
      fail(fileName, `${cite.path} is not listed in frontmatter sources`);
    }
    if (!cache.has(cite.path)) {
      cache.set(cite.path, readSavedSource(sourcesRoot, cite, fileName));
    }
    assertAgainstSource(cite, cache.get(cite.path), fileName);
  }
  return cites;
}

function escapeText(value) {
  return value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

export function sourceCiteHtml(cite) {
  const attrs = [
    ['data-path', cite.path],
    ['data-heading', cite.heading],
    ...(cite.url ? [['data-url', cite.url]] : []),
    ['data-quote', cite.quote],
  ].map(([name, value]) => `${name}="${escapeAttr(value)}"`).join(' ');
  return `<button type="button" class="source-cite" aria-expanded="false" ${attrs}>${escapeText(cite.phrase)}</button>`;
}

export function sourceCiteProse(text) {
  if (!text) return text ?? '';
  return String(text).replace(citePattern(), (_match, phrase) => phrase.trim());
}

function expandText(value, fileName, sourcesRoot, cache) {
  if (!value.includes('{{cite')) return null;
  const cites = collectSourceCites(value, fileName);
  const nodes = [];
  let last = 0;
  for (const match of value.matchAll(citePattern())) {
    const cite = parseCite(match, fileName);
    if (!cache.has(cite.path)) cache.set(cite.path, readSavedSource(sourcesRoot, cite, fileName));
    assertAgainstSource(cite, cache.get(cite.path), fileName);
    if (match.index > last) nodes.push({ type: 'text', value: value.slice(last, match.index) });
    nodes.push({ type: 'html', value: sourceCiteHtml(cite) });
    last = match.index + match[0].length;
  }
  if (cites.length && last < value.length) nodes.push({ type: 'text', value: value.slice(last) });
  return nodes;
}

function transformNode(node, fileName, sourcesRoot, cache, rawSource) {
  if (!node || !Array.isArray(node.children)) return;
  if (node.type === 'code' || node.type === 'inlineCode') return;
  const next = [];
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'text' && child.value.includes('{{cite')) {
      let endIdx = -1;
      const startOffset = child.position?.start?.offset;
      if (typeof rawSource === 'string' && rawSource.length > 0 && typeof startOffset === 'number') {
        for (let j = i; j < node.children.length; j++) {
          const endOffset = node.children[j]?.position?.end?.offset;
          if (typeof endOffset !== 'number') break;
          const sub = rawSource.slice(startOffset, endOffset);
          const lastOpen = sub.lastIndexOf('{{cite');
          const lastClose = sub.lastIndexOf('}}');
          if (lastClose !== -1 && lastClose > lastOpen) {
            endIdx = j;
            break;
          }
        }
      }
      if (endIdx !== -1) {
        const endOffset = node.children[endIdx].position.end.offset;
        const slice = rawSource.slice(startOffset, endOffset);
        const parts = expandText(slice, fileName, sourcesRoot, cache);
        next.push(...(parts || node.children.slice(i, endIdx + 1)));
        i = endIdx;
        continue;
      }
      const parts = expandText(child.value, fileName, sourcesRoot, cache);
      next.push(...(parts || [child]));
    } else {
      transformNode(child, fileName, sourcesRoot, cache, rawSource);
      next.push(child);
    }
  }
  node.children = next;
}

export function remarkSourceCite() {
  return (tree, file) => {
    const fileName = file?.path || 'lesson.md';
    const sourcesRoot = file?.sourcesRoot || join(file?.cwd || process.cwd(), 'public/sources');
    let rawSource = '';
    if (typeof file?.value === 'string') {
      rawSource = file.value;
    } else if (file && typeof file.toString === 'function') {
      const str = file.toString();
      if (str && str !== '[object Object]') rawSource = str;
    }
    transformNode(tree, fileName, sourcesRoot, new Map(), rawSource);
  };
}

export function parseGfm(markdownText, schoolDir = null) {
  const targetDir = schoolDir || process.cwd();
  let req = null;
  try {
    const pkgPath = resolve(targetDir, 'package.json');
    if (existsSync(pkgPath)) {
      const candidateReq = createRequire(pkgPath);
      candidateReq.resolve('mdast-util-from-markdown');
      candidateReq.resolve('micromark-extension-gfm');
      candidateReq.resolve('mdast-util-gfm');
      req = candidateReq;
    }
  } catch {}

  if (!req) {
    throw new Error(`在 ${targetDir} 中未找到 GFM 解析依赖（mdast-util-from-markdown 等）。请在该 School 目录下执行 npm ci 或运行 python3 scripts/apply-school-kit.py ${targetDir}。`);
  }
  const { fromMarkdown } = req('mdast-util-from-markdown');
  const { gfm } = req('micromark-extension-gfm');
  const { gfmFromMarkdown } = req('mdast-util-gfm');
  return fromMarkdown(markdownText, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}

export function assertSourceCitesGfm(markdown, fileName, schoolDir, sourcesRoot = null) {
  const content = stripFrontmatter(markdown);
  const tree = parseGfm(content, schoolDir);
  const resolvedSourcesRoot = sourcesRoot || join(schoolDir, 'public/sources');
  remarkSourceCite()(tree, {
    cwd: schoolDir,
    path: fileName,
    value: content,
    sourcesRoot: resolvedSourcesRoot,
  });
}
