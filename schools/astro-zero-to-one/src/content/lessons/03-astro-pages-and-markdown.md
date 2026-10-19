---
title: "页面与路由：基于文件的页面生成、Markdown 文章与站内导航"
slug: "astro-pages-and-markdown"
description: "掌握 Astro 基于文件系统的路由机制，学会编写 .astro 页面与 .md Markdown 文章，使用根绝对路径构建健壮的站内导航链接与 404 页面。"
order: 3
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 指导学员透彻掌握 Astro“基于文件系统路由（File-based routing）”的核心规律：文件在 `src/pages/` 里的相对路径直接决定了浏览器中的访问 URL。
  2. 按照官方教程步骤，亲手创建 `about.astro`、`blog.astro`，并在 `src/pages/posts/` 下创建 Markdown 文章（`post-1.md`、`post-2.md`、`post-3.md`），观察 Markdown 被自动编译为标准 HTML 的过程。
  3. 掌握站内链接的最佳实践：严格使用根绝对路径（如 `<a href="/about/">`），理解相对路径（如 `../about`）在不同层级嵌套下容易导致死链的隐患。
  4. 教学活动：路由映射推导。给出 4 个文件路径（`src/pages/index.astro`、`src/pages/about.astro`、`src/pages/posts/post-1.md`、`src/pages/404.astro`），让学员推导它们在浏览器中对应的最终 URL，并使用辅助脚本核对结果。
  5. 完成条件：学员能够准确推导路由映射规则，解释为什么 Markdown frontmatter 里的属性不会直接自动渲染到正文中，并收到反馈。
---

# 页面与路由：基于文件的页面生成、Markdown 文章与站内导航

在传统 Web 开发中，如果你想让网站支持多页面跳转，往往需要编写复杂的“路由配置文件”来告诉服务器哪个网址该展示哪段代码。

但在 Astro 中，这一切变得无比直观和自然：**你只需要把文件放进 `src/pages/` 文件夹，Astro 就会自动为你生成对应的网页！** 这种机制被称为**基于文件系统的路由（File-based Routing）**。

这一关，我们将跟随 Astro 官方教程，亲手创建关于页面、博客页面和三篇 Markdown 博客文章，并打通它们之间的互相跳转链接。

---

## 1. 核心概念与新术语白话解析

### (1) 基于文件的路由（File-based Routing）
- **它是什么**：一种由文件目录结构直接映射成网址 URL 的规则。
- **为什么需要它**：无需手动配置任何路由表，文件放在哪，网址就在哪，简单清晰，不易出错。
- **映射规则一览**：
  - `src/pages/index.astro`  ——>  `/`（网站首页）
  - `src/pages/about.astro`  ——>  `/about/`（关于页面）
  - `src/pages/blog.astro`   ——>  `/blog/`（博客页面）
  - `src/pages/posts/post-1.md` ——>  `/posts/post-1/`（子文件夹里的文章页）
  - `src/pages/404.astro`    ——>  `/404.html`（未找到页面时的友好提示页）

### (2) Markdown（`.md`）文件
- **它是什么**：一种专为人类写作设计的纯文本标记语言。你可以用 `# 标题`、`* 斜体`、`- 列表项` 进行快速排版。
- **为什么需要它**：写长篇文章如果手敲 HTML 标签会非常累。Astro 原生支持将 `src/pages/` 下的 `.md` 文件直接转换为规范的 HTML 网页，无需任何第三方插件！

### (3) Frontmatter（前置元数据围栏）
- **它是什么**：写在 Markdown 文件（或 `.astro` 文件）最顶部、被两道三连破折号（`---`）包裹的代码区域，采用 YAML 语法书写键值对。
- **为什么需要它**：用来记录文章的“元数据”（Metadata）——比如文章标题 `title`、发布日期 `pubDate`、作者 `author`、分类标签 `tags` 等。这些数据供系统读取，不会直接暴露在文章正文流里。
- **在哪能看到**：每个 `.md` 文件的最开头：
  ```markdown
  ---
  title: '我的第一篇博客文章'
  pubDate: 2026-10-19
  author: 'Astro 学习者'
  ---
  ```

### (4) 根绝对路径（Root-relative Links）
- **它是什么**：以斜杠 `/` 开头的 URL 链接，例如 `<a href="/about/">关于</a>`。
- **为什么需要它**：无论访问者当前停留在网站的哪一层页面（哪怕是在深度嵌套的 `/posts/2026/tech/` 下），以 `/` 开头的链接都会直接从网站顶级域名根目录出发进行寻址，从而彻底避免相对路径（如 `../../about`）在层级变更时经常导致的“页面 404 死链”惨剧。

---

## 2. 动手实操：创建你的第一个新页面

打开你的项目，保持 `npm run dev` 在终端中运行。

### 第一步：编辑首页 `src/pages/index.astro`
打开 `src/pages/index.astro`，将其 `<body>` 内的内容修改为：

```html
---
// 代码围栏
---

<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width" />
    <title>我的 Astro 站点</title>
  </head>
  <body>
    <h1>我的 Astro 站点</h1>
  </body>
</html>
```
保存后切换到浏览器 `http://localhost:4321`，你会发现标题已经实时更新。

### 第二步：新建关于页面 `src/pages/about.astro`
1. 在 `src/pages/` 目录下新建一个文件，命名为 `about.astro`。
2. 写入以下内容：

```html
---
// src/pages/about.astro
---

<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>关于我</title>
  </head>
  <body>
    <h1>关于我</h1>
    <h2>……和我的新 Astro 网站！</h2>
    <p>我正在学习 Astro 的官方入门教程。这是我网站上的第二个页面，也是我自己建立的第一个页面！</p>
    <p>随着我完成更多教程，该站点将持续更新，欢迎见证我的学习旅程！</p>
  </body>
</html>
```
3. 在浏览器地址栏中访问 `http://localhost:4321/about/`，即可看到崭新的关于页面！

---

## 3. 编写 Markdown 博客文章并实现页面间链接

### 第一步：创建博客文章目录与文章文件
1. 在 `src/pages/` 目录下新建一个子文件夹，命名为 `posts`（即完整路径为 `src/pages/posts/`）。
2. 在该文件夹下新建空文件 `post-1.md`，填入以下官方示例内容：

```markdown
---
title: '我的第一篇博客文章'
pubDate: 2026-10-19
description: '这是我 Astro 博客的第一篇文章。'
author: 'Astro 学习者'
tags: ["astro", "blogging", "learning in public"]
---
# 我的第一篇博客文章

发表于：2026-10-19

欢迎来到我的 Astro 新博客！在这里，我将分享我建立新网站的学习历程。

## 我做了什么
1. **安装 Astro**：首先，我创建了一个新的 Astro 项目。
2. **制作页面**：然后我学习了如何通过创建 `.astro` 文件来制作页面。
3. **发表博客文章**：这是我的第一篇 Markdown 文章！
```

3. 依次在 `src/pages/posts/` 下再创建 `post-2.md` 和 `post-3.md`。
4. 在浏览器中访问 `http://localhost:4321/posts/post-1/`。
   > **请特别注意**：打开浏览器的开发者工具（F12）审查元素，你会惊喜地发现，虽然你写的是简单的 Markdown 文本，但 Astro 已经自动帮你渲染成了标准的 `<h1>`、`<p>`、`<h2>`、`<ol>` 和 `<li>` HTML 标签！

### 第二步：创建博客索引页 `src/pages/blog.astro` 并添加链接
在 `src/pages/` 下创建 `blog.astro`，使用 HTML 的标准 `<a>` 标签列出文章清单：

```html
---
// src/pages/blog.astro
---

<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>我的 Astro 学习博客</title>
  </head>
  <body>
    <h1>我的 Astro 学习博客</h1>
    <p>在这里，我将分享我的 Astro 学习之旅。</p>
    <ul>
      <li><a href="/posts/post-1/">文章 1：我的第一篇博客文章</a></li>
      <li><a href="/posts/post-2/">文章 2：我的第二篇博客文章</a></li>
      <li><a href="/posts/post-3/">文章 3：我的第三篇博客文章</a></li>
    </ul>
  </body>
</html>
```

### 第三步：为所有页面添加全局导航链接
为了让访客能自由在三个页面间切换，我们需要在每个页面的 `<h1>` 之前添加统一的导航链接：

```html
<a href="/">首页</a>
<a href="/about/">关于</a>
<a href="/blog/">博客</a>
```

请将这三行链接添加到 `index.astro`、`about.astro` 和 `blog.astro` 的 `<body>` 开头处。
现在点击浏览器中的链接，即可顺畅地在首页、关于我、博客列表和各篇文章之间往返穿梭！

---

## 4. 404 错误页面的官方约定

在 `src/pages/` 目录下，如果你创建一个名为 `404.astro` 的文件：

```html
---
// src/pages/404.astro
---
<html>
  <head><title>页面未找到</title></head>
  <body>
    <h1>404 - 页面迷路了</h1>
    <p>你访问的地址不存在，请点击返回 <a href="/">首页</a>。</p>
  </body>
</html>
```

当访问者输入了一个不存在的 URL（比如 `http://localhost:4321/non-existent`）时，Astro 会自动提供这个自定义的 404 页面，体验非常友好。

---

## 5. 本关小结与思考

1. **路由自动化**：`src/pages/` 内部目录和文件名直接对应最终网址。
2. **Markdown 赋能**：`.md` 文本直接被编译为结构化 HTML，Frontmatter 提供元数据支撑。
3. **根绝对路径规范**：站内跳转务必使用 `/` 开头的绝对路径。

在下一关中，我们将深入探索 `.astro` 文件的内在奥秘——学习组件脚本、代码围栏以及像写 JavaScript 一样灵活强大的模板语法！
