<!-- source: https://docs.astro.build/zh-cn/tutorial/3-components/1/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 创建一个可重复使用的导航组件

现在你的 Astro 站点的多个页面上都有相同的 HTML 代码，是时候用一个可复用的 Astro 组件替换这些重复的内容！

准备好…

- 为组件创建一个新的文件夹
- 构建一个 Astro 组件来显示导航链接
- 用这个导航组件替换现有的 HTML 代码

## 创建 src/components/ 文件夹

[Section titled “创建 src/components/ 文件夹”](#创建-srccomponents-文件夹)

你需要在项目中创建一个新的文件夹：`src/components/` 来容纳 `.astro` 文件，它们会被用来生成 HTML 代码，但不会成为网站上的新页面。

## 创建一个导航组件
1. 创建一个新文件：`src/components/Navigation.astro`。
2. 将任意页面顶部的导航链接复制并粘贴到你的新文件 `Navigation.astro` 中：
src/components/Navigation.astro
```
------<a href="/">首页</a><a href="/about/">关于</a><a href="/blog/">博客</a>
```
如果你的 `.astro` 文件的 frontmatter 中没有任何内容，你可以不写代码块标记。当你需要时，再加上即可。

### 导入并使用 Navigation.astro

[Section titled “导入并使用 Navigation.astro”](#导入并使用-navigationastro)
1. 回到 `index.astro`，在代码块中导入你的新组件：
src/pages/index.astro
```
---import Navigation from '../components/Navigation.astro';import "../styles/global.css";
const pageTitle = "首页";---
```
2. 然后，在下方用你刚刚导入的新导航组件替换现有的导航 HTML 链接元素：
src/pages/index.astro
```
<a href="/">首页</a><a href="/about/">关于</a><a href="/blog/">博客</a><Navigation />
```
3. 在浏览器中预览，它应该看起来完全相同……这就是你想要的！

你的站点生成了与之前完全相同的 HTML 代码。但现在，这三行代码由你的 `<Navigation />` 组件提供。

## 自己试一试 - 在网站的其余页面上添加导航

[Section titled “自己试一试 - 在网站的其余页面上添加导航”](#自己试一试---在网站的其余页面上添加导航)

使用相同的方法在你的网站的另外两个页面（`about.astro` 和 `blog.astro`）中导入并使用 `<Navigation />` 组件。

不要忘记：
- 在组件脚本的顶部，也就是代码块内添加一个导入语句。
- 用导航组件替换现有的代码。

当你重新编写代码，但是不改变浏览器中的最终效果时，你正在进行的操作叫做**重构**。在这个单元中，你将多次进行**重构**，用组件替换页面 HTML 的各个部分。

这样可以让你快速开始使用任何工作代码，通常在项目中会复用到。然后，你可以逐步改进现有代码的设计，而不改变站点的外观。

### 检验你的知识
1. 当元素在多个页面上重复出现时，你可以：
2. Astro 组件是：
3. 当你……的时候 Astro 组件会自动在你的站点中创建一个新的页面：

## 任务清单
### 相关资源
- [Astro 组件概述](../../../../zh-cn/basics/astro-components/index.md)
- [重构](https://refactoring.com/) 外部链接

Tutorials

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)
