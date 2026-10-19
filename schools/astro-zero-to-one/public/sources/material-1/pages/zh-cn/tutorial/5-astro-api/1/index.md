<!-- source: https://docs.astro.build/zh-cn/tutorial/5-astro-api/1/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 创建文章存档页

现在你有一些要展示的博客文章了，是时候配置博客页面来自动创建一个存档列表了！

准备好…

- 使用 `import.meta.glob()` 一次性访问所有文章的数据
- 在博客页面上显示动态生成的文章列表
- 重构以使用 `<BlogPost />` 组件来显示每个列表项

## 动态展示文章列表

[Section titled “动态展示文章列表”](#动态展示文章列表)
1. 将以下代码添加到 `blog.astro` 中，以返回关于所有 Markdown 文件的信息。`import.meta.glob()` 将返回一个对象数组，每个博客文章对应一个对象。
src/pages/blog.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro'const allPosts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));const pageTitle = "我的 Astro 学习博客";---<BaseLayout pageTitle={pageTitle}> <p>在这里，我将分享我的 Astro 学习之旅。</p> <ul> <li><a href="/posts/post-1/">文章 1</a></li> <li><a href="/posts/post-2/">文章 2</a></li> <li><a href="/posts/post-3/">文章 3</a></li> </ul></BaseLayout>
```
2. 为了动态生成整个文章列表，展示文章的标题和链接，将个别的 `<li>` 标签替换为以下 Astro 代码：
src/pages/blog.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro'const allPosts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));const pageTitle = "我的 Astro 学习博客";---<BaseLayout pageTitle={pageTitle}> <p>在这里，我将分享我的 Astro 学习之旅。</p> <ul> <li><a href="/posts/post-1/">文章 1</a></li> <li><a href="/posts/post-2/">文章 2</a></li> <li><a href="/posts/post-3/">文章 3</a></li>
{allPosts.map((post: any) => <li><a href={post.url}>{post.frontmatter.title}</a></li>)} </ul></BaseLayout>
```
通过对 `import.meta.glob()` 返回的数组进行映射，你的整个博客文章列表现在是通过 Astro 内置的 TypeScript 支持而动态生成的。
3. 通过在 `src/pages/posts/` 中创建一个新的 `post-4.md` 文件并添加一些 Markdown 内容来添加一个新的博客文章。请确保至少包含下面使用的 frontmatter
```
---layout: ../../layouts/MarkdownPostLayout.astrotitle: '我的第四篇博客文章'author: 'Astro 学习者'description: "这篇文章会自己出现在列表中！"image: url: "https://docs.astro.build/default-og-image.png" alt: "The word astro against an illustration of planets and stars."pubDate: 2022-08-08tags: ["astro", "successes"]---这篇文章应该会与其他的博客文章一起显示，因为 `import.meta.glob()` 会返回一个包含所有文章的列表，以创建这个文章列表。
```
4. 在浏览器预览中重新访问博客页面 `http://localhost/blog`，并查看更新后的包含四篇文章的列表，其中包括你的新博客文章！

## 挑战：创建 BlogPost 组件

[Section titled “挑战：创建 BlogPost 组件”](#挑战创建-blogpost-组件)

尝试自己对 Astro 项目进行所有必要的更改，以便你可以使用以下代码来生成博客文章列表：

src/pages/blog.astro

```
<ul>  {allPosts.map((post: any) => <li><a href={post.url}>{post.frontmatter.title}</a></li>)}  {allPosts.map((post: any) => <BlogPost url={post.url} title={post.frontmatter.title} />)}</ul>
```
展开以查看步骤
1. 在 `src/components/` 中创建一个新的组件。
显示文件名
```
BlogPost.astro
```
2. 编写组件中的代码行，以便它能够接收 `title` 和 `url` 作为 `Astro.props`。
显示代码
src/components/BlogPost.astro
```
---const { title, url } = Astro.props;---
```
3. 添加用于创建博客文章列表中的每个项目的模板。
显示代码
src/components/BlogPost.astro
```
<li><a href={url}>{title}</a></li>
```
4. 将新组件导入到博客页面中。
显示代码
src/pages/blog.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';import BlogPost from '../components/BlogPost.astro';const allPosts = Object.values(import.meta.glob('../pages/posts/*.md', { eager: true }));const pageTitle = "我的 Astro 学习博客";---
```
5. 自己检查：查看已完成的组件代码。
显示代码
src/components/BlogPost.astro
```
---const { title, url } = Astro.props---<li><a href={url}>{title}</a></li>
```
src/pages/blog.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';import BlogPost from '../components/BlogPost.astro';const allPosts = Object.values(import.meta.glob('../pages/posts/*.md', { eager: true }));const pageTitle = "我的 Astro 学习博客"---<BaseLayout pageTitle={pageTitle}> <p>在这里，我将分享我的学习 Astro 的之旅。</p> <ul> {allPosts.map((post: any) => <BlogPost url={post.url} title={post.frontmatter.title} />)} </ul></BaseLayout>
```
### 检验你的知识

```
---const myPosts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));---
```
选出你可以用以下哪种语法来表示：
1. 你的第三篇博客文章的标题。
2. 指向你的第一篇博客文章的 URL 链接。
3. 每篇文章的上次更新的日期的组件。

## 任务清单
### 相关资源
- [在 Astro 中导入 glob 模式](../../../../zh-cn/guides/imports/index.md#importmetaglob)

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

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)
