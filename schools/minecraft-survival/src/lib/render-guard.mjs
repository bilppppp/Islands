import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function clearAstroCache(schoolDir) {
  const targets = [
    join(schoolDir, '.astro', 'cache', 'data-store.json'),
    join(schoolDir, '.astro', 'data-store.json'),
  ];
  for (const cachePath of targets) {
    if (existsSync(cachePath)) {
      rmSync(cachePath, { force: true });
    }
  }
}

export function parseFrontmatterSlug(text, fileName = '') {
  const str = String(text);
  if (!str.startsWith('---\n')) {
    return fileName.replace(/^\d+-/, '').replace(/\.mdx?$/, '');
  }
  const end = str.indexOf('\n---\n', 4);
  if (end < 0) {
    return fileName.replace(/^\d+-/, '').replace(/\.mdx?$/, '');
  }
  const block = str.slice(4, end);
  for (const line of block.split('\n')) {
    const match = line.match(/^slug:\s*(.*)$/);
    if (match) {
      const val = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (val) return val;
    }
  }
  return fileName.replace(/^\d+-/, '').replace(/\.mdx?$/, '');
}

export function cleanTitleForComparison(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\s\p{P}\p{S}\u200b\u200c\u200d\ufeff]/gu, '')
    .toLowerCase();
}

function nodeToPlainText(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(nodeToPlainText).join('');
  }
  return '';
}

export function remarkNormalizeLessonH1() {
  return (tree, file) => {
    if (!tree || !Array.isArray(tree.children)) return;

    const title = file?.data?.astro?.frontmatter?.title;
    if (!title) return;

    const cleanTitle = cleanTitleForComparison(title);
    if (!cleanTitle) return;

    let firstNonEmptyIndex = -1;
    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];
      if (child.type === 'text') {
        if (child.value && child.value.trim().length > 0) {
          firstNonEmptyIndex = i;
          break;
        }
      } else {
        firstNonEmptyIndex = i;
        break;
      }
    }

    if (firstNonEmptyIndex === -1) return;

    const firstNode = tree.children[firstNonEmptyIndex];
    if (firstNode.type === 'heading' && firstNode.depth === 1) {
      const h1Text = nodeToPlainText(firstNode);
      const cleanH1 = cleanTitleForComparison(h1Text);
      if (cleanH1 && cleanH1 === cleanTitle) {
        tree.children.splice(firstNonEmptyIndex, 1);
      }
    }
  };
}

export function extractLessonBody(html) {
  if (!html || !html.includes('data-lesson-body')) return null;
  const match = html.match(/<([a-zA-Z0-9]+)\b[^>]*\bdata-lesson-body\b[^>]*>([\s\S]*?)<\/\1>/i);
  return match ? match[2] : null;
}

export function assertRenderedLessons(schoolDir) {
  const lessonsDir = join(schoolDir, 'src', 'content', 'lessons');
  if (!existsSync(lessonsDir)) return;
  const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx')).sort();
  const emptySlugs = [];
  for (const file of files) {
    const raw = readFileSync(join(lessonsDir, file), 'utf8');
    const slug = parseFrontmatterSlug(raw, file);
    const htmlPath = join(schoolDir, 'dist', 'client', 'lessons', slug, 'index.html');
    if (!existsSync(htmlPath)) {
      emptySlugs.push(slug);
      continue;
    }
    const html = readFileSync(htmlPath, 'utf8');
    const body = extractLessonBody(html);
    if (body === null) {
      // 页面没有 data-lesson-body 标记（例如非 island 模板未加标记），跳过检查
      continue;
    }
    const text = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) {
      emptySlugs.push(slug);
    }
  }
  if (emptySlugs.length > 0) {
    throw new Error(`课文正文为空（${emptySlugs.join('、')}）。请检查这些课文的 Markdown 是否能渲染（例如 {{cite}} 标记），修改后重新 finish。`);
  }
}

export function lessonRenderGuardIntegration() {
  let schoolDir = null;
  return {
    name: 'lesson-render-guard',
    hooks: {
      'astro:config:setup': ({ config }) => {
        schoolDir = fileURLToPath(config.root);
        clearAstroCache(schoolDir);
      },
      'astro:build:done': () => {
        if (schoolDir) {
          assertRenderedLessons(schoolDir);
        }
      },
    },
  };
}
