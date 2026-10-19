<!-- source: https://docs.astro.build/zh-cn/tutorial/6-islands/4/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 可选：创建内容集合

现在你已经拥有了一个使用 Astro [内置的基于文件路由](../../../../zh-cn/guides/routing/index.md#静态路由) 的博客，你将要更新博客以使用 [内容集合](../../../../zh-cn/guides/content-collections/index.md)。内容集合是一个管理一组相似内容（例如博客文章）的强大方法。

准备好…

- 将你的博客文章文件夹移至 `src/blog/`
- 创建一个模式（schema）来定义你的博客文章的 frontmatter
- 使用 `getCollection()` 来获取博客文章内容和元数据

## 了解：页面 vs 集合

[Section titled “了解：页面 vs 集合”](#了解页面-vs-集合)

即使是使用了内容集合，你也仍然可以通过 `src/pages/` 文件夹来单独创建页面，例如 **关于** 页面。但是，将你的博客文章移出该特殊文件夹之外，能够允许你使用更加强大也更具性能的 API，从而生成你博客文章的索引并且展示独立的博客文章。

与此同时，你将能够在你的代码编辑器中获得更好地引导和自动补全，因为你将拥有一个用于为每篇文章定义通用结构的 **[模式](../../../../zh-cn/guides/content-collections/index.md#定义集合模式schema)**，通过它 Astro 将会帮助你使用 [Zod](https://zod.dev/)，一个 TypeScript 的模式声明和验证库来实现这一切。在你的模式中，你可以指定在什么时候哪些 frontmatter 属性是必要的，例如描述信息或是作者信息，而这些信息的数据类型又应该是什么样的，例如是字符串或是数组。这样就可以更快速的捕捉到错误，并用带有描述性的错误消息告诉你确切的问题是什么。

在我们的指南中，阅读有关 [Astro 内容集合](../../../../zh-cn/guides/content-collections/index.md) 的更多信息，或者从下面的教学步骤开始，以将基础的博客从 `src/pages/posts/` 转换为 `src/blog/`。

### 检验你的知识
1. 你可能会在 `src/pages/` 中保留哪种类型的页面？
2. 哪个 **不是** 将博客文章转移到内容集合的优势？
3. 内容集合使用 TypeScript …

下面的步骤向你展示了如何通过为博客文章创建内容集合来扩展构建博客教程的最终产品。

## 升级依赖

升级到最新版本的 Astro，并通过在终端中运行以下命令来升级所有集成：

- [npm](#tab-panel-0-0)
- [pnpm](#tab-panel-0-1)
- [Yarn](#tab-panel-0-2)

终端窗口

```perl
# 将 Astro 和官方集成一并升级npx @astrojs/upgrade
```
终端窗口

```perl
# 将 Astro 和官方集成一并升级pnpm dlx @astrojs/upgrade
```
终端窗口

```perl
# 将 Astro 和官方集成一并升级yarn dlx @astrojs/upgrade
```
## 为你的文章创建集合

[Section titled “为你的文章创建集合”](#为你的文章创建集合)
1. 创建一个新的 **集合**（文件夹）并命名为 `src/blog/`。
2. 将你现有的所有博客文章（`.md` 文件）从 `src/pages/posts/` 移至新集合中。
3. 创建一个 `src/content.config.ts` 文件用于为你的 `postsCollection` [定义模式](../../../../zh-cn/guides/content-collections/index.md#定义集合模式schema)。对于现有的博客教程代码，将以下内容添加到文件中，以定义其博客文章中使用的所有 frontmatter 属性：
src/content.config.ts
```
// 导入 glob 加载器（loader）import { glob } from "astro/loaders";// 从 `astro:content` 导入工具函数import { defineCollection } from "astro:content";// 导入 Zodimport { z } from "astro/zod";// 为每个集合定义一个 `loader` 和 `schema`const blog = defineCollection({ loader: glob({ pattern: '**/[^_]*.md', base: "./src/blog" }), schema: z.object({ title: z.string(), pubDate: z.date(), description: z.string(), author: z.string(), image: z.object({ url: z.string(), alt: z.string() }), tags: z.array(z.string()) })});// 导出一个单独的 `collections` 对象用以注册你的集合（们）export const collections = { blog };
```
4. 为了使 Astro 识别你的模式，请退出（`CTRL + C`）并重启开发服务器以继续使用教程。这将定义 `astro:content` 模块。

## 从集合中生成页面
1. 创建一个页面文件并命名为 `src/pages/posts/[...slug].astro`。当你的 Markdown 和 MDX 文件在集合中时，将不再使用 Astro 的基于文件的路由自动生成为页面，因此你必须创建一个页面，用于负责生成每个单独的博客文章。
2. 添加以下代码以 [查询你的集合](../../../../zh-cn/guides/content-collections/index.md#查询构建时集合)，从而使每个博客文章的 slug 和页面内容都可以生成：
src/pages/posts/\[...slug\].astro
```
---import { getCollection, render } from 'astro:content';
export async function getStaticPaths() { const posts = await getCollection('blog'); return posts.map(post => ({ params: { slug: post.id }, props: { post }, }));}
const { post } = Astro.props;const { Content } = await render(post);---
```
3. 在 Markdown 页面的布局中渲染你的文章 `<Content />`。这使得你可以为所有文章指定一个通用布局。
src/pages/posts/\[...slug\].astro
```
---import { getCollection, render } from 'astro:content';import MarkdownPostLayout from '../../layouts/MarkdownPostLayout.astro';
export async function getStaticPaths() { const posts = await getCollection('blog'); return posts.map(post => ({ params: { slug: post.id }, props: { post }, }));}
const { post } = Astro.props;const { Content } = await render(post);---<MarkdownPostLayout frontmatter={post.data}> <Content /></MarkdownPostLayout>
```
4. 移除每个单独的文章 frontmatter 中定义的 `layout`。你的内容在渲染时将被包装在布局中，因此已不再需要该属性。
src/content/posts/post-1.md
```
---layout: ../../layouts/MarkdownPostLayout.astrotitle: '我的第一篇博客文章'pubDate: 2022-07-01...---
```
## 用 getCollection() 代替 import.meta.glob()

[Section titled “用 getCollection\(\) 代替 import.meta.glob\(\)”](#用-getcollection-代替-importmetaglob)
5. 任何有博客文章列表的地方，例如教程中的 Blog 页面（`src/pages/blog.astro`），你都需要用 [`getCollection()`](../../../../zh-cn/reference/modules/astro-content/index.md#getcollection) 来代替 `import.meta.glob()` 以此作为从 Markdown 文件中获取内容和元数据的方式。
src/pages/blog.astro
```
---import { getCollection } from "astro:content";import BaseLayout from "../layouts/BaseLayout.astro";import BlogPost from "../components/BlogPost.astro";
const pageTitle = "我的 Astro 学习博客";const allPosts = Object.values(import.meta.glob("../pages/posts/*.md", { eager: true }));const allPosts = await getCollection("blog");---
```
6. 你还需要更新对每个 `post` 所返回数据的引用。现在，你将在每个对象的 `data` 属性上找到 frontmatter。另外，当使用集合时，每个 `post` 对象会有一个页面 `slug`，而不是一个完整的 URL。
src/pages/blog.astro
```
---import { getCollection } from "astro:content";import BaseLayout from "../layouts/BaseLayout.astro";import BlogPost from "../components/BlogPost.astro";
const pageTitle = "我的 Astro 学习博客";const allPosts = await getCollection("blog");---<BaseLayout pageTitle={pageTitle}> <p>在这里，我将分享我的 Astro 学习之旅。</p> <ul> { allPosts.map((post) => ( <BlogPost url={post.url} title={post.frontmatter.title} />)} <BlogPost url={`/posts/${post.id}/`} title={post.data.title} /> )) } </ul></BaseLayout>
```
7. 教程博客项目也使用 `src/pages/tags/[tag].astro` 为每个标签动态地生成了一个页面，并将标签列表展示在了 `src/pages/tags/index.astro`。
将与上述相同的更改应用于这两个文件：
生成包含某个标签的文章页面现在变为：
src/pages/tags/\[tag\].astro
```
---import { getCollection } from "astro:content";import BaseLayout from "../../layouts/BaseLayout.astro";import BlogPost from "../../components/BlogPost.astro";
export async function getStaticPaths() { const allPosts = await getCollection("blog"); const uniqueTags = [...new Set(allPosts.map((post) => post.data.tags).flat())];
return uniqueTags.map((tag) => { const filteredPosts = allPosts.filter((post) => post.data.tags.includes(tag) ); return { params: { tag }, props: { posts: filteredPosts }, }; });}
const { tag } = Astro.params;const { posts } = Astro.props;---
<BaseLayout pageTitle={tag}> <p>包含「{tag}」标签的文章</p> <ul> { posts.map((post) => <BlogPost url={`/posts/${post.id}/`} title={post.data.title} />) } </ul></BaseLayout>
```
### 亲自尝试 - 更新标签索引页面的查询
[Section titled “亲自尝试 - 更新标签索引页面的查询”](#亲自尝试---更新标签索引页面的查询)
导入并使用 `getCollection` 来获取 `src/pages/tags/index.astro` 中博客文章所使用的标签，依照 [与上述相同的步骤](#%E7%94%A8-getcollection-%E4%BB%A3%E6%9B%BF-importmetaglob)。
给我看看代码！
src/pages/tags/index.astro
```
---import { getCollection } from "astro:content";import BaseLayout from "../../layouts/BaseLayout.astro";const allPosts = await getCollection("blog");const tags = [...new Set(allPosts.map((post) => post.data.tags).flat())];const pageTitle = "标签索引";---<!-- ... -->
```
- 使用 `getCollection("blog")` 来获取有关你所有博客文章的数据，而不是使用 `import.meta.glob()`
    - 使用 `data` 来获取所有 frontmatter 值，而不是使用 `frontmatter`
    - 通过将文章的 `slug` 添加到 `/posts/` 路径来创建页面 URL

[Section titled “更新任意 frontmatter 值以匹配模式”](#更新任意-frontmatter-值以匹配模式)

如有必要，请在整个项目中更新任意 frontmatter，例如在你的布局中，那些与你的集合模式不符的部分。

在博客教程示例中，`pubDate` 是字符串类型。现在，根据模式对文章 frontmatter 定义的类型，`pubDate` 将会是一个 `Date` 对象。现在，你可以利用这一点使用任何 `Date` 对象可用的方法来格式化日期。

要在博客文章布局中渲染日期，请使用 `toLocaleDateString()` 方法将其转换为字符串：

src/layouts/MarkdownPostLayout.astro

```
<!-- ... --><BaseLayout pageTitle={frontmatter.title}>    <p>{frontmatter.pubDate.toLocaleDateString()}</p>    <p><em>{frontmatter.description}</em></p>    <p>作者：{frontmatter.author}</p>    <img src={frontmatter.image.url} width="300" alt={frontmatter.image.alt} /><!-- ... -->
```
## 更新 RSS 函数

[Section titled “更新 RSS 函数”](#更新-rss-函数)

教程博客项目包含了 RSS 订阅。此功能还必须使用 `getCollection()` 以从博客文章中返回信息。然后，你将使用返回的 `data` 对象生成 RSS 订阅项。

src/pages/rss.xml.js

```
import rss from '@astrojs/rss';import { pagesGlobToRssItems } from '@astrojs/rss';import { getCollection } from 'astro:content';
export async function GET(context) {  const posts = await getCollection("blog");  return rss({    title: 'Astro Learner | Blog',    description: 'My journey learning Astro',    site: context.site,    items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')),    items: posts.map((post) => ({      title: post.data.title,      pubDate: post.data.pubDate,      description: post.data.description,      link: `/posts/${post.id}/`,    })),    customData: `<language>en-us</language>`,  })}
```
有关使用内容集合的博客教程的完整示例，请参阅教程存储库中的 [Content Collections 分支](https://github.com/withastro/blog-tutorial-demo/tree/content-collections)。

## 任务清单
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
