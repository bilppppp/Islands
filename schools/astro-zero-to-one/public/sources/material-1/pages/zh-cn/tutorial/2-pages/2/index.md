<!-- source: https://docs.astro.build/zh-cn/tutorial/2-pages/2/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)

现在你已经使用 `.astro` 文件构建了页面，是时候使用 `.md` 文件编写一些博客文章！

准备好…

- 创建一个新文件夹并写一篇新文章
- 编写一些 Markdown 内容
- 将你的博客文章链接到你的博客页面

## 创建你的第一个 .md 文件

[Section titled “创建你的第一个 .md 文件”](#创建你的第一个-md-文件)
1. 在 `src/pages/posts/` 创建一个新目录。
2. 在新的 `/posts/` 文件夹中添加一个新的（空）文件 `post-1.md`。
3. 通过将 `/posts/post-1` 拼接到现有预览 URL 的末尾，并在浏览器中预览此页面。（例如 `http://localhost/posts/post-1`）
4. 将浏览器预览 URL 更改为查看 `/posts/post-2`。（这是你尚未创建的页面。）
请注意预览“空”页面和不存在页面时控制台的不同输出。这将有助于你进行故障排查。

[Section titled “编写 Markdown 内容”](#编写-markdown-内容)
1. 将以下代码复制或键入到 `post-1.md` 中
src/pages/posts/post-1.md
```
---title: '我的第一篇博客文章'pubDate: 2022-07-01description: '这是我 Astro 博客的第一篇文章。'author: 'Astro 学习者'image: url: 'https://docs.astro.build/assets/rose.webp' alt: 'The Astro logo on a dark background with a pink glow.'tags: ["astro", "blogging", "learning in public"]---
# 我的第一篇博客文章
发表于：2022-07-01
欢迎来到我学习关于 Astro 的新博客！在这里，我将分享我建立新网站的学习历程。
## 我做了什么
    1. **安装 Astro**：首先，我创建了一个新的 Astro 项目并设置好了我的在线账号。
    2. **制作页面**：然后我学习了如何通过创建新的 `.astro` 文件并将它们保存在 `src/pages/` 文件夹里来制作页面。
    3. **发表博客文章**：这是我的第一篇博客文章！我现在有用 Astro 编写的页面和用 Markdown 写的文章了！
## 下一步计划
我将完成 Astro 教程，然后继续编写更多内容。关注我以获取更多信息。
```
2. 在 `localhost:4321/posts/post-1` 再次查看你的浏览器上的页面预览。你现在应该可以在此页面上看到文章内容。
3. 使用浏览器的开发工具检查此页面。请注意，虽然你没有键入任何 HTML 元素，但你的 Markdown 已转换为 HTML。你可以看到标题、段落和列表项等元素。

文件顶部的信息，在代码块内，称为 frontmatter。此数据（包括标签和文章图像）是 Astro 可以使用的*有关*你的文章的信息。它不会自动出现在页面上，但你稍后会在教程中了解它的作用。

## 链接到你的文章

[Section titled “链接到你的文章”](#链接到你的文章)
1. 在 `src/pages/blog.astro` 中使用`<a href=""><a/>`标签链接到你的第一篇文章：
src/pages/blog.astro
```
------<html lang = "zh"> <head> <meta charset="utf-8"/> <meta name="viewport" content="width=device-width" /> <title>Astro</title> </head> <body> <a href="/">首页</a> <a href="/about/">关于</a> <a href="/blog/">博客</a>
<h1>我的 Astro 学习博客</h1> <p>这是我的 Astro 学习笔记</p> <ul> <li><a href="/posts/post-1/">文章 1</a></li> </ul> </body></html>
```
2. 现在，在 `src/pages/posts/` 中再添加两个文件：`post-2.md` 和 `post-3.md`。这里有一些示例代码，你可以将其复制并粘贴到你的文件中，或者，你可以编写自己的代码！
src/pages/posts/post-2.md
```
---title: 我的第二篇博客文章author: Astro 学习者description: "学习了一些 Astro 后，我根本停不下来！"image: url: "https://docs.astro.build/assets/arc.webp" alt: "The Astro logo on a dark background with a purple gradient arc."pubDate: 2022-07-08tags: ["astro", "blogging", "learning in public", "successes"]---在学习 Astro 大约一周后，我决定尝试些新的东西。我编写并导入了一个小组件！
```
src/pages/posts/post-3.md
```
---title: 我的第三篇博客文章author: Astro 学习者description: "我遇到了一些问题，但是在社区里面提问真的很有帮助！"image: url: "https://docs.astro.build/assets/rays.webp" alt: "The Astro logo on a dark background with rainbow rays."pubDate: 2022-07-15tags: ["astro", "learning in public", "setbacks", "community"]---尽管这并不总是一帆风顺，但我很享受使用 Astro 进行搭建。并且，[Discord 社区](https://astro.build/chat)真的很友好而且乐于助人！
```
3. 使用 `<a></a>` 标签链接到新文章：
src/pages/blog.astro
```
------<html lang = "zh"> <head> <meta charset="utf-8"/> <meta name="viewport" content="width=device-width" /> <title>Astro</title> </head> <body> <a href="/">首页</a> <a href="/about/">关于</a> <a href="/blog/">博客</a>
<h1>我的 Astro 学习博客</h1> <p>这是我的 Astro 学习笔记</p> <ul> <li><a href="/posts/post-1/">文章 1</a></li> <li><a href="/posts/post-2/">文章 2</a></li> <li><a href="/posts/post-3/">文章 3</a></li> </ul> </body></html>
```
4. 检查你的浏览器预览并确保：
`文章1`、`文章2` 和 `文章3` 的所有链接都指向你网站上的工作页面。（如果你发现错误，请检查你在 `blog.astro` 上的链接或你的 Markdown 文件名。）

### 小测试
1. Markdown \(`.md`\) 文件中的内容将会转换为：

## 任务清单
### 相关资源
- [Markdown 指南中的 Markdown 备忘单](https://www.markdownguide.org/cheat-sheet/) 外部链接
- [什么是浏览器开发者工具？- MDN](https://developer.mozilla.org/zh-CN/docs/Learn/Common_questions/What_are_browser_developer_tools) 外部链接
- [YAML frontmatter](https://assemble.io/docs/YAML-front-matter.md) 外部链接

Tutorials

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![Scrimba](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
