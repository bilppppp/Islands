---
title: "动态路由与数据获取：getStaticPaths() 批量生成标签页与文章存档"
slug: "dynamic-routes-and-astro-api"
description: "掌握 Astro 动态路由参数语法与 getStaticPaths() 批量构建机制，使用 import.meta.glob 读取文件数据，自动化生成标签聚合页与文章存档。"
order: 9
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 理解动态路由解决的核心矛盾：真实网站不可能为成百上千个分类或文章手工新建 `.astro` 文件，必须通过单份模板结合参数动态批量产出页面。
  2. 掌握文件名中的方括号动态语法（如 `src/pages/tags/[tag].astro`），理解它与浏览器 URL 中可变片段（如 `/tags/astro/`、`/tags/blogging/`）的对应关系。
  3. 深入理解静态构建核心入口 `getStaticPaths()`：它是如何向 Astro 编译器报备“本模板将要生成的所有路径集合（`params`）以及各页面所需的数据（`props`）”的。
  4. 按照官方教程规范，使用 `import.meta.glob` 自动化获取 Markdown 文件数据，构建 `BlogPost.astro` 单项组件、`src/pages/tags/[tag].astro` 动态页面与 `src/pages/tags/index.astro` 标签索引页。
  5. 教学活动：路径清单与参数推导。给出 3 篇各包含不同 tags 数组的博客文章，让学员手动模拟 `getStaticPaths()` 的运行过程，推导出最终会构建生成出的具体 URL 清单。
  6. 完成条件：学员能够解释 `getStaticPaths()`、`params` 与 `props` 的协作流程，完成动态路由清单推导，并收到反馈。
---

# 动态路由与数据获取：`getStaticPaths()` 批量生成标签页与文章存档

在上一关之前，我们如果想给博客加一篇文章，需要手动在 `src/pages/blog.astro` 里手写一行 `<li><a href="/posts/post-x/">文章 x</a></li>`。

但试想一下：
如果你的网站有 100 篇博客文章，每篇文章身上都打着不同的标签（如 `astro`、`react`、`css`、`tooling`）。我们希望访问 `/tags/astro/` 时，能看到所有带有 `astro` 标签的文章；访问 `/tags/css/` 时，能看到所有关于 CSS 的文章。
难道我们要手动去新建几十个文件夹和 `.astro` 文件吗？**绝对不可能！**

Astro 提供了工业级的**动态路由（Dynamic Routing）**机制：**一份模板，自动批量生成成百上千个页面！**

---

## 1. 核心概念与新术语白话解析

### (1) 动态路由文件命名（方括号 `[param].astro`）
- **它是什么**：在 `src/pages/` 目录下，用半角方括号将文件名括起来，例如 `src/pages/tags/[tag].astro`。
- **为什么需要它**：方括号告诉 Astro：“这里的名字不是一个写死的词，而是一个**变量参数**！”
  - 访问 `/tags/astro/` 时，`tag` 的值就是 `"astro"`；
  - 访问 `/tags/learning/` 时，`tag` 的值就是 `"learning"`。

### (2) `export async function getStaticPaths()`
- **它是什么**：动态路由文件在顶部代码栅栏中**必须导出的一个特殊异步函数**。
- **为什么需要它（工作机制）**：
  因为 Astro 是在构建时（Build time）把所有页面预先渲染成静态 HTML 文件的。Astro 看到 `[tag].astro` 时，它不知道世界上到底有哪些标签。
  因此，Astro 会在构建时第一时间调用 `getStaticPaths()`。这个函数的作用就像向 Astro 报备一份“生产工单”：
  ```javascript
  return [
    { params: { tag: "astro" }, props: { posts: [...] } },
    { params: { tag: "blogging" }, props: { posts: [...] } },
  ];
  ```
  Astro 收到这份工单后，就会自动开启流水线，为数组里的每一项生成一个独立的 HTML 页面！

### (3) `params` 与 `props` 的分工
- **`params`**：决定生成出来的**网址 URL 是什么**（必须和方括号里的参数名严格一致，如 `{ tag: "astro" }` 生成 `/tags/astro/`）。
- **`props`**：传递给该页面模板的**数据内容**（通过 `Astro.props` 接收，比如属于该标签的文章列表）。

### (4) `import.meta.glob()`
- **它是什么**：内置的文件批量检索工具函数。
- **为什么需要它**：写 `import.meta.glob('../pages/posts/*.md', { eager: true })`，Astro 会自动把 `posts` 目录下所有匹配的 Markdown 文件一次性全部抓取出来，省去了手动逐一 `import` 的繁琐工作。

---

## 2. 动手实操一：使用 `import.meta.glob` 自动生成博客列表

首先我们来消灭 `src/pages/blog.astro` 里的硬编码文章链接。

### 第一步：创建单篇文章列表项组件 `BlogPost.astro`
在 `src/components/` 目录下新建 `BlogPost.astro`：

```html
---
// src/components/BlogPost.astro
interface Props {
  title: string;
  url: string;
}

const { title, url } = Astro.props;
---

<li><a href={url}>{title}</a></li>
```

### 第二步：动态读取全部文章并渲染
打开 `src/pages/blog.astro`，将其重构为：

```html
---
// src/pages/blog.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import BlogPost from '../components/BlogPost.astro';

// 一次性同步抓取 posts 目录下的所有 markdown 文章
const allPosts = Object.values(import.meta.glob('./posts/*.md', { eager: true })) as any[];
const pageTitle = "我的 Astro 学习博客";
---

<BaseLayout pageTitle={pageTitle}>
  <p>在这里，我将分享我的 Astro 学习之旅。</p>
  <ul>
    {allPosts.map((post) => (
      <BlogPost url={post.url} title={post.frontmatter.title} />
    ))}
  </ul>
</BaseLayout>
```

保存后切回浏览器访问 `/blog/`。
此时无论你未来在 `src/pages/posts/` 目录下新写了 `post-4.md` 还是 `post-100.md`，博客列表都会**全自动实时显示最新文章**，完全不需要修改 `blog.astro` 代码！

---

## 3. 动手实操二：创建动态标签页 `src/pages/tags/[tag].astro`

现在我们要实现：点击某个标签（比如 `astro`），自动展示所有被打上该标签的文章。

### 第一步：创建动态路由文件
在 `src/pages/` 目录下新建 `tags` 文件夹，并在其中新建 `[tag].astro`（路径：`src/pages/tags/[tag].astro`）：

```html
---
// src/pages/tags/[tag].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import BlogPost from '../../components/BlogPost.astro';

export async function getStaticPaths() {
  // 1. 读取所有博客文章
  const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true })) as any[];

  // 2. 提取全站所有不重复的标签集合（使用 Set 去重）
  const uniqueTags = [...new Set(allPosts.flatMap((post) => post.frontmatter.tags || []))];

  // 3. 为每个唯一标签生成一个页面工单
  return uniqueTags.map((tag) => {
    // 过滤出包含当前 tag 的文章子集
    const filteredPosts = allPosts.filter((post) =>
      post.frontmatter.tags?.includes(tag)
    );
    return {
      params: { tag },
      props: { posts: filteredPosts },
    };
  });
}

// 从当前 URL 参数中获取 tag 名字
const { tag } = Astro.params;
// 从 getStaticPaths 传递的 props 中获取过滤好的文章列表
const { posts } = Astro.props;
---

<BaseLayout pageTitle={tag}>
  <p>包含标签“{tag}”的所有文章：</p>
  <ul>
    {posts.map((post: any) => (
      <BlogPost url={post.url} title={post.frontmatter.title} />
    ))}
  </ul>
</BaseLayout>
```

保存后，在浏览器中手动访问以下网址测试：
- `http://localhost:4321/tags/astro/` ——> 展示包含了 `astro` 标签的文章 1、2、3！
- `http://localhost:4321/tags/successes/` ——> 只展示包含了 `successes` 标签的文章 2！

**你只写了一份 `[tag].astro` 文件，Astro 就在后台自动为你派生出了整套分类标签页面！**

---

## 4. 动手实操三：制作全站标签云索引页 `src/pages/tags/index.astro`

现在各个单独的标签页有了，访客怎么知道整站一共有哪些标签呢？我们需要一个“标签导航总览页”。

在 `src/pages/tags/` 目录下新建 `index.astro`（路径：`src/pages/tags/index.astro`，对应访问网址 `/tags/`）：

```html
---
// src/pages/tags/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';

const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true })) as any[];
const tags = [...new Set(allPosts.flatMap((post) => post.frontmatter.tags || []))];
const pageTitle = "文章标签总览";
---

<BaseLayout pageTitle={pageTitle}>
  <div class="tags">
    {tags.map((tag) => (
      <p class="tag">
        <a href={`/tags/${tag}/`}>{tag}</a>
      </p>
    ))}
  </div>
</BaseLayout>

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .tag {
    margin: 0;
    border: dotted 1px #a1a1a1;
    border-radius: 0.5em;
    padding: 0.5em 1em;
    font-size: 1.15em;
    background-color: #f8fcfd;
  }
  .tag a {
    color: #00539f;
  }
</style>
```

最后，打开 `src/components/Navigation.astro`，把这个新的标签页链接加入导航：

```html
<div class="nav-links">
  <a href="/">首页</a>
  <a href="/about/">关于</a>
  <a href="/blog/">博客</a>
  <a href="/tags/">标签</a>
</div>
```

保存后访问 `/tags/`，你将看到一个由全站文章实时提炼出的精美标签云，点击任意标签即可秒级穿梭到对应分类列表！

---

## 5. 本关小结

```text
动态批量构建流水线：
  [src/pages/posts/*.md (所有文章)]
         │
         ▼ (import.meta.glob 汇总)
  [getStaticPaths()] ── 提炼出唯一标签：["astro", "blogging", "learning in public", ...]
         │
         ▼ (循环派发生产工单)
  自动生成静态路由：
     ├── /tags/astro/index.html
     ├── /tags/blogging/index.html
     └── /tags/learning in public/index.html
```

1. **方括号即变量**：`[tag].astro` 匹配动态 URL 参数。
2. **`getStaticPaths` 派发工单**：构建期预先计算所有路径（`params`）与对应数据（`props`）。
3. **数据自动化**：`import.meta.glob` 让文件系统变成随取随用的内容数据库。

学到这里，我们的静态多页站点已经具备了非常成熟的数据与页面驱动能力。
但在很多真实业务中，我们依然不可避免地需要一些复杂的客户端动态交互（例如随机切换问候语、复杂的实时表单、或者点赞收藏小部件）。Astro 是如何既保留“默认零 JS”的高性能，又能无缝引入现代前端交互框架（如 React/Preact）的呢？
下一关，让我们一起探索 Astro 最引以为傲的招牌机制——**群岛架构（Islands Architecture）与客户端水合指令**！
