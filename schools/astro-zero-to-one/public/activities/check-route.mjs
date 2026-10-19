#!/usr/bin/env node
// 路由映射推导校验工具（官方路由规则辅助脚本）
// 用途：帮助学员核对 src/pages 路径到浏览器 URL 的映射关系

const table = new Map([
  ['src/pages/index.astro', '/'],
  ['src/pages/about.astro', '/about/'],
  ['src/pages/blog.astro', '/blog/'],
  ['src/pages/posts/post-1.md', '/posts/post-1/'],
  ['src/pages/posts/post-2.md', '/posts/post-2/'],
  ['src/pages/posts/post-3.md', '/posts/post-3/'],
  ['src/pages/tags/index.astro', '/tags/'],
  ['src/pages/tags/[tag].astro', '/tags/:tag/'],
  ['src/pages/posts/[...slug].astro', '/posts/:slug/'],
  ['src/pages/404.astro', '/404.html'],
]);

const query = process.argv[2];

if (!query || query === '--list') {
  console.log('--- Astro 官方静态路由对照表 ---');
  for (const [file, url] of table.entries()) {
    console.log(`${file} => ${url}`);
  }
  process.exit(0);
}

if (table.has(query)) {
  console.log(`[匹配成功] ${query} => ${table.get(query)}`);
} else if (query.startsWith('src/components/') || query.startsWith('src/layouts/')) {
  console.log(`[非路由文件] ${query} 位于组件或布局目录，不会生成独立 URL 路由！`);
} else if (query.startsWith('public/')) {
  const rel = query.slice('public/'.length);
  console.log(`[静态资源] ${query} 会被原样复制为静态文件 => /${rel}`);
} else {
  console.log(`[未收录] ${query} 未在预设典型示例中，请检查文件命名格式。`);
}
