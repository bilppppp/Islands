<!-- source: https://docs.astro.build/zh-cn/tutorial/3-components/2/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 创建社交媒体 Footer

准备好…

- 创建一个页脚组件
- 创建并传递参数到一个社交媒体组件

现在你已经在页面上使用了 Astro 组件，是时候在一个组件中使用另一个组件！

## 创建一个页脚组件
1. 创建一个新文件：`src/components/Footer.astro`。
2. 将以下代码复制到你的新文件 `Footer.astro` 中。
src/components/Footer.astro
```
---const platform = "github";const username = "withastro";---
<footer> <p>在 <a href={`https://www.${platform}.com/${username}`}>{platform}</a> 上，了解有关我的项目的更多信息！</p></footer>
```
### 导入并使用 Footer.astro

[Section titled “导入并使用 Footer.astro”](#导入并使用-footerastro)
1. 在每个 Astro 页面（`index.astro`、`about.astro` 和 `blog.astro`）的前置元数据中添加以下导入语句：
```
import Footer from '../components/Footer.astro';
```
2. 在每个页面的 Astro 模板中，在 `</body>` 标签之前添加一个新的 `<Footer />` 组件，以在页面底部显示页脚。
```
<Footer /> </body></html>
```
3. 在浏览器预览中，检查每个页面是否都能看到新的页脚文本。

## 自己试一试 - 个性化你的页脚

[Section titled “自己试一试 - 个性化你的页脚”](#自己试一试---个性化你的页脚)

自定义你的页脚，展示多个社交网络（如 Instagram、Twitter、LinkedIn）并包括你的用户名以直接链接到你自己的个人资料。

### 代码检查

如果你一步一步按照教程进行操作，你的 `index.astro` 文件应该如下所示：

src/pages/index.astro

```
---import Navigation from '../components/Navigation.astro';import Footer from '../components/Footer.astro';import '../styles/global.css';
const pageTitle = '首页';---
<html lang="zh-CN">  <head>    <meta charset="utf-8" />    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />    <meta name="viewport" content="width=device-width" />    <meta name="generator" content={Astro.generator} />    <title>{pageTitle}</title>  </head>  <body>    <Navigation />    <h1>{pageTitle}</h1>    <Footer />  </body></html>
```
## 创建一个社交媒体组件

由于你可能有多个可以展示的社交媒体账号，你可以创建一个单独的、可重用的组件，并在多个位置显示它。每次显示时，你将传递不同的参数（`props`）给它，即社交媒体名称和你在该社交媒体上的用户名。
1. 创建一个新文件：`src/components/Social.astro`。
2. 将以下代码复制到你的新文件 `Social.astro` 中。
src/components/Social.astro
```
---const { platform, username } = Astro.props;---<a href={`https://www.${platform}.com/${username}`}>{platform}</a>
```
### 在你的页脚中导入并使用 Social.astro

[Section titled “在你的页脚中导入并使用 Social.astro”](#在你的页脚中导入并使用-socialastro)
1. 修改 `src/components/Footer.astro` 中的代码，导入并使用这个新组件三次，每次传递不同的**组件参数**作为 props：
src/components/Footer.astro
```
---const platform = "github";const username = "withastro";import Social from './Social.astro';---
<footer> <p>在 <a href={`https://www.${platform}.com/${username}`}>{platform}</a> 上，了解有关我的项目的更多信息！</p> <Social platform="twitter" username="astrodotbuild" /> <Social platform="github" username="withastro" /> <Social platform="youtube" username="astrodotbuild" /></footer>
```
2. 检查浏览器上的预览，你应该在每个页面上看到新的页脚，显示链接到这三个平台的链接。

## 给你的社交媒体组件添加样式
1. 通过在 `src/components/Social.astro` 中添加一个 `<style>` 标签，自定义链接的外观。
src/components/Social.astro
```
---const { platform, username } = Astro.props;---<a href={`https://www.${platform}.com/${username}`}>{platform}</a>
<style> a { padding: 0.5rem 1rem; color: white; background-color: #4c1d95; text-decoration: none; }</style>
```
2. 同样，在 `src/components/Footer.astro` 中添加一个 `<style>` 标签，以改善其内容的布局。
src/components/Footer.astro
```
---import Social from './Social.astro';---<style> footer { display: flex; gap: 1rem; margin-top: 2rem; }</style>
<footer> <Social platform="twitter" username="astrodotbuild" /> <Social platform="github" username="withastro" /> <Social platform="youtube" username="astrodotbuild" /></footer>
```
3. 再次检查浏览器上的预览，确认每个页面都显示更新后的页脚。

### 自测
1. 你需要在 Astro 组件的前置元数据中写入什么代码来将 `title`、`author` 和 `date` 的值作为 props 接收？
2. 如何将值作为 props 传递给 Astro 组件？

## 任务清单
### 相关资源
- [Astro 组件中的组件参数](../../../../zh-cn/basics/astro-components/index.md#组件参数)

Tutorials

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
