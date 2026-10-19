<!-- source: https://docs.astro.build/zh-cn/tutorial/5-astro-api/3/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 编写标签索引页面

现在你已经为每个标签创建了单独的页面，是时候来创建链接到这些页面的索引页面。

准备好…

- 使用 `/pages/folder/index.astro` 路由模式添加一个新页面
- 显示所有标签的列表，并链接到每个标签页面
- 更新你的网站，将这个新的标签页面添加到导航里

[Section titled “使用 /pages/folder/index.astro 路由模式”](#使用-pagesfolderindexastro-路由模式)

要将标签索引页面添加到你的网站，你可以在 `src/pages/tags.astro` 中创建一个新文件。

但是，由于你已经有了 `/tags/` 目录，你可以利用 Astro 中的另一种路由模式，并将所有与标签相关的文件放在一起。

## 试一试 - 创建一个标签索引页面
1. 在 `src/pages/tags/` 目录中创建一个新文件 `index.astro`。
2. 访问 `http://localhost/tags` 并验证你的网站现在是否包含这个 URL 的页面。它将是空的，但是它已经存在了。
3. 在 `src/pages/tags/index.astro` 中创建一个使用你的布局的最小页面。你之前已经做过这个！
展开查看步骤
   1. 在 `src/pages/tags/` 中创建一个新的页面组件。
显示文件名
```
index.astro
```
   2. 导入并使用你的 `<BaseLayout>`。
显示代码
src/pages/tags/index.astro
```
---import BaseLayout from '../../layouts/BaseLayout.astro';---<BaseLayout></BaseLayout>
```
   3. 定义一个页面标题，并将其作为组件属性传递给你的布局。
显示代码
src/pages/tags/index.astro
```
---import BaseLayout from '../../layouts/BaseLayout.astro';const pageTitle = "标签索引";---<BaseLayout pageTitle={pageTitle}></BaseLayout>
```
4. 再次检查你的浏览器的预览，你应该有一个遵循布局设计的页面，可以添加内容了！

## 创建标签数组

之前你已经使用 `map()` 从数组中提取并显示了一个列表中的项目。现在，你想要定义一个包含所有标签的数组，并在页面上以列表的形式显示它们，那么代码会是什么样子呢？

查看代码

src/pages/tags/index.astro

```
---import BaseLayout from '../../layouts/BaseLayout.astro';const tags = ['astro', 'blogging', 'learning in public', 'successes', 'setbacks', 'community']const pageTitle = "标签索引";---<BaseLayout pageTitle={pageTitle}>  <ul>    {tags.map((tag) => <li>{tag}</li>)}  </ul></BaseLayout>
```
你可以这样做，但是每次在未来的博客文章中使用新标签时，你都需要回到这个文件中更新数组。

幸运的是，你已经知道了一种方法，可以一行代码获取你的 Markdown 文件中的所有数据，然后返回所有标签的列表。
1. 在 `src/pages/tags/index.astro` 中，添加以下代码行到 Frontmatter Script 中，这样你的页面就可以访问每个 `.md` 博客文章文件的数据了。
查看代码
src/pages/tags/index.astro
```
---import BaseLayout from '../../layouts/BaseLayout.astro';const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true }));const pageTitle = "标签索引";---
```
2. 接下来，将以下 JavaScript 代码行添加到你的页面组件中。这与你在 `src/pages/tags/[tag].astro` 中使用的代码是相同的，它们依赖于 Astro 内置的 TypeScript 支持，用于返回所有标签的列表。
src/pages/tags/index.astro
```
---import BaseLayout from '../../layouts/BaseLayout.astro';const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true }));const tags = [...new Set(allPosts.map((post) => post.frontmatter.tags).flat())];const pageTitle = "标签索引";---
```
## 创建标签列表

这次不再使用无序列表来创建项目，而是为每个项目创建一个 `<p>`，并将其放在一个 `<div>` 内。这个方式应该很熟悉！
1. 将以下代码添加到你的组件模板中：
src/pages/tags/index.astro
```
<BaseLayout pageTitle={pageTitle}> <div>{tags.map((tag) => <p>{tag}</p>)}</div></BaseLayout>
```
在你的浏览器的预览中，确认你能看到标签的列表。如果任何博客文章缺少标签，或者格式不正确，Astro 内置的 TypeScript 支持将抛出错误，以便你可以检查并更正代码。
2. 为了使每个标签链接到自己的页面，将以下 `<a>` 链接添加到每个标签名称中：
src/pages/tags/index.astro
```
<BaseLayout pageTitle={pageTitle}> <div> {tags.map((tag) => ( <p><a href={`/tags/${tag}`}>{tag}</a></p> ))} </div></BaseLayout>
```
## 为标签列表添加样式
1. 将以下 CSS 类添加到你的 `<div>` 和每个生成的 `<p>` 中。注意：Astro 使用 HTML 语法添加类名！
src/pages/tags/index.astro
```
<BaseLayout pageTitle={pageTitle}> <div class="tags"> {tags.map((tag) => ( <p class="tag"><a href={`/tags/${tag}`}>{tag}</a></p> ))} </div></BaseLayout>
```
2. 通过将以下 `<style>` 标签添加到页面中，定义这些新的 CSS 类：
src/pages/tags/index.astro
```
<style> a { color: #00539F; }
.tags { display: flex; flex-wrap: wrap; }
.tag { margin: 0.25em; border: dotted 1px #a1a1a1; border-radius: .5em; padding: .5em 1em; font-size: 1.15em; background-color: #F8FCFD; }</style>
```
3. 在 `http://localhost/tags` 上检查你的浏览器的预览，确认这些新的样式正确应用了，并且页面上的每个标签都有链接到自己独立标签页面的功能。

### 检查代码

你的新页面应该如下所示：

```
---import BaseLayout from '../../layouts/BaseLayout.astro';const allPosts = Object.values(import.meta.glob('../posts/*.md', { eager: true }));const tags = [...new Set(allPosts.map((post: any) => post.frontmatter.tags).flat())];const pageTitle = "标签索引";---<BaseLayout pageTitle={pageTitle}>  <div class="tags">    {tags.map((tag) => (      <p class="tag"><a href={`/tags/${tag}`}>{tag}</a></p>    ))}  </div></BaseLayout><style>  a {    color: #00539F;  }
  .tags {    display: flex;    flex-wrap: wrap;  }
  .tag {    margin: 0.25em;    border: dotted 1px #a1a1a1;    border-radius: .5em;    padding: .5em 1em;    font-size: 1.15em;    background-color: #F8FCFD;  }</style>
```
## 将此页面添加到你的导航

现在，你可以导航到 `http://localhost/tags` 并查看此页面。通过这个页面，你可以点击链接进入各个标签页面。

但是，你仍然需要让访问者在其他页面也能够发现这个页面。
1. 在你的 `Navigation.astro` 组件中，添加一个链接到这个新的标签索引页面。
查看代码
src/components/Navigation.astro
```
<a href="/">首页</a><a href="/about/">关于</a><a href="/blog/">博客</a><a href="/tags/">标签</a>
```
## 挑战：在博客文章布局中包含标签

[Section titled “挑战：在博客文章布局中包含标签”](#挑战在博客文章布局中包含标签)

你现在已经编写了所有必需的代码，可以在每篇博客文章中显示一个标签列表，并将它们链接到它们的标签页面。你可以重构现有的工作！

按照以下步骤操作，然后通过与[最终代码示例](#%E6%A3%80%E6%9F%A5%E4%BB%A3%E7%A0%81markdownpostlayout)进行比较来检查你的工作。
1. 从 `src/pages/tags/index.astro` 中复制 `<div class="tags">...</div>` 和 `<style>...</style>` 并将它们重新用于 `MarkdownPostLayout.astro`中:
src/layouts/MarkdownPostLayout.astro
```
---import BaseLayout from './BaseLayout.astro';const { frontmatter } = Astro.props;---<BaseLayout pageTitle={frontmatter.title}> <p>{frontmatter.pubDate.toString().slice(0,10)}</p> <p><em>{frontmatter.description}</em></p> <p>Written by: {frontmatter.author}</p> <img src={frontmatter.image.url} width="300" alt={frontmatter.image.alt} />
<div class="tags"> {tags.map((tag: string) => ( <p class="tag"><a href={`/tags/${tag}`}>{tag}</a></p> ))} </div>
<slot /></BaseLayout><style> a { color: #00539F; }
.tags { display: flex; flex-wrap: wrap; }
.tag { margin: 0.25em; border: dotted 1px #a1a1a1; border-radius: .5em; padding: .5em 1em; font-size: 1.15em; background-color: #F8FCFD; }</style>
```
在此代码能够工作之前，你需要对粘贴到 `MarkdownPostLayout.astro` 中的代码进行**一个小修改**。你能找出是什么修改吗？

给我个提示

在布局模板中，其他属性（例如标题、作者等）是如何编写的？你的布局如何接收来自单个博客文章的属性？

给我更多的提示吧！

为了在布局中使用从 `.md` 博客文章传递的属性（传递的值），比如标签，你需要在值前面加上一个特定的词。

给我看看代码！

src/layouts/MarkdownPostLayout.astro

```
    <div class="tags">      {frontmatter.tags.map((tag: string) => (        <p class="tag"><a href={`/tags/${tag}`}>{tag}</a></p>      ))}    </div>
```
### 检查代码：MarkdownPostLayout

[Section titled “检查代码：MarkdownPostLayout”](#检查代码markdownpostlayout)

要检查你的工作，或者如果你只想要完整、正确的代码复制到 `MarkdownPostLayout.astro` 中，这是你的 Astro 组件应该的样子：

```
---import BaseLayout from './BaseLayout.astro';const { frontmatter } = Astro.props;---<BaseLayout pageTitle={frontmatter.title}>  <p><em>{frontmatter.description}</em></p>  <p>{frontmatter.pubDate.toString().slice(0,10)}</p>
  <p>作者：{frontmatter.author}</p>
  <img src={frontmatter.image.url} width="300" alt={frontmatter.image.alt} />
  <div class="tags">    {frontmatter.tags.map((tag: string) => (      <p class="tag"><a href={`/tags/${tag}`}>{tag}</a></p>    ))}  </div>
  <slot /></BaseLayout><style>  a {    color: #00539F;  }
  .tags {    display: flex;    flex-wrap: wrap;  }
  .tag {    margin: 0.25em;    border: dotted 1px #a1a1a1;    border-radius: .5em;    padding: .5em 1em;    font-size: 1.15em;    background-color: #F8FCFD;  }</style>
```
### 检验你的知识

将每个文件路径与将在相同路由创建页面的第二个文件路径进行匹配。
1. `src/pages/categories.astro`
2. `src/pages/posts.astro`
3. `src/pages/products/shoes/index.astro`

## 任务清单
### 相关资源
- [Astro 中的静态路由](../../../../zh-cn/guides/routing/index.md#静态路由)

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
