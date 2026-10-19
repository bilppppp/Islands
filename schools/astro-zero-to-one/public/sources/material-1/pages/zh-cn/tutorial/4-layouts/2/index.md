<!-- source: https://docs.astro.build/zh-cn/tutorial/4-layouts/2/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 创建并传递数据到博客布局

现在你已经为页面创建了布局，是时候为博客文章也添加一个布局了！

准备好…

- 为你的 Markdown 文件创建一个新的博客文章布局
- 将 YAML frontmatter 的值作为 props 传递给布局组件

## 为你的博客文章编写布局

当你在一个 `.md` 文件中包含 `layout` frontmatter 属性时，你可以在布局文件中使用所有 frontmatter YAML 的值。
1. 创建一个新文件：`src/layouts/MarkdownPostLayout.astro`。
2. 将以下代码复制到 `MarkdownPostLayout.astro` 中。
src/layouts/MarkdownPostLayout.astro
```
---const { frontmatter } = Astro.props;---<meta charset="utf-8" /><h1>{frontmatter.title}</h1><p>作者：{frontmatter.author}</p><slot />
```
3. 在 `post-1.md` 中添加以下 frontmatter 属性。
src/pages/posts/post-1.md
```
---layout: ../../layouts/MarkdownPostLayout.astrotitle: '我的第一篇博客文章'pubDate: 2022-07-01description: '这是我 Astro 博客的第一篇文章。'author: 'Astro 学习者'image: url: 'https://docs.astro.build/assets/rose.webp' alt: 'The Astro logo on a dark background with a pink glow.'tags: ["astro", "blogging", "learning in public"]---
```
4. 再次检查 `localhost:4321/posts/post-1` 上的浏览器预览，并注意布局为页面添加了什么内容。
5. 将相同的布局属性添加到你的另外两篇博客文章 `post-2.md` 和 `post-3.md` 中。在浏览器中验证你的布局是否也应用于这些文章。

当使用布局时，你现在可以选择在 Markdown 内容或布局中包含元素，比如页面标题。记得亲自去检查页面预览并进行任何必要的调整，以避免重复的元素。

## 自己动手尝试 - 自定义博客文章布局

[Section titled “自己动手尝试 - 自定义博客文章布局”](#自己动手尝试---自定义博客文章布局)

**挑战**：确定每篇博客文章中共有的项目，并使用 `MarkdownPostLayout.astro` 来渲染它们，而不是在 `post-1.md` 和将来的每篇博客文章中编写它们。

下面是重构你的代码的例子，将 `pubDate` 包含在布局组件中，而不是在你的 Markdown 内容的正文中编写：

src/pages/posts/post-1.md

```
发表于：2022-07-01
欢迎来到我学习关于 Astro 的新博客！在这里，我将分享我建立新网站的学习历程。
```
src/layouts/MarkdownPostLayout.astro

```
---const { frontmatter } = Astro.props;---<meta charset="utf-8" /><h1>{frontmatter.title}</h1><p>发表于：{frontmatter.pubDate.toString().slice(0,10)}</p><p>作者：{frontmatter.author}</p><slot />
```
根据你认为的有用程度进行重构，并根据需要向布局中添加更多内容。记住，你添加到布局中的每一项都会减少你在每篇博客文章中需要编写的内容！

下面是一个重构后的布局示例，只留下了由 slot 渲染的单个博客文章内容。你可以自由使用这个示例，或者创建自己的布局！

```
---const { frontmatter } = Astro.props;---<meta charset="utf-8" /><h1> {frontmatter.title}</h1><p>{frontmatter.pubDate.toString().slice(0,10)}</p><p><em>{frontmatter.description}</em></p><p>作者：{frontmatter.author}</p><img src={frontmatter.image.url} width="300" alt={frontmatter.image.alt} /><slot />
```
### 检验你的知识

你能找出应该填入空白处的内容，使得以下两个组件一起产生可用的 Astro 代码吗？
1. src/pages/posts/learning-astro.md
```
---layout: ../../__________/MyMarkdownLayout.astrotitle: "了解 Astro 中的 Markdown"author: Astro 学习者____: 2022-08-08---今天我收获颇丰！Astro 支持使用 Markdown 来创作，同时还可以使用来自 frontmatter 中的变量。我甚至能在 Astro 布局组件中拿到这些变量。
```
2. src/layouts/MarkdownLayout.astro
```
---import ____________ from '../components/Footer.astro'const { ___________ } = Astro.props---<h1>{frontmatter.title}</h1><p>Written by:{frontmatter.______ } on {frontmatter.pubDate}</p>< _______ /><Footer />
```
显示填写好空白处的代码！
   1. src/pages/posts/learning-astro.md
```
---layout: ../../layouts/MyMarkdownLayout.astrotitle: "了解 Astro 中的 Markdown"author: Astro 学习者pubDate: 2022-08-08---今天我收获颇丰！Astro 支持使用 Markdown 来创作，同时还可以使用来自 frontmatter 中的变量。我甚至能在 Astro 布局组件中拿到这些变量。
```
   2. src/layouts/MarkdownLayout.astro
```
---import Footer from '../components/Footer.astro'const { frontmatter } = Astro.props---<h1>{frontmatter.title}</h1><p>作者：{frontmatter.author } 发布于 {frontmatter.pubDate}</p><slot /><Footer />
```
## 任务清单
### 相关资源
- [Astro 中的 Markdown 布局](../../../../zh-cn/guides/markdown-content/index.md#frontmatter-layout-属性)
- [Markdown 布局属性](../../../../zh-cn/basics/layouts/index.md#markdown-布局的-props)
- [YAML 介绍](https://dev.to/paulasantamaria/introduction-to-yaml-125f) 外部链接

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
