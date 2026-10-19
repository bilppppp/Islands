<!-- source: https://docs.astro.build/zh-cn/tutorial/4-layouts/1/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 编写你的第一个布局

准备好…

- 将常见元素重构为页面布局
- 使用 Astro 的 `<slot />` 元素将页面内容放置在布局中
- 将页面特定的值作为 props 传递给布局

你现在仍然在每个页面上重复渲染一些 Astro 组件。是时候再次重构，创建一个共享的页面布局！

## 编写你的第一个布局组件
1. 创建一个新文件：`src/layouts/BaseLayout.astro`（你需要首先创建一个 `layouts` 文件夹）。
2. 将 `index.astro` 的**全部内容**复制到你的新文件 `BaseLayout.astro` 中。
src/layouts/BaseLayout.astro
```
---import Header from '../components/Header.astro';import Footer from '../components/Footer.astro';import '../styles/global.css';const pageTitle = "首页";---<html lang="zh-CN"> <head> <meta charset="utf-8" /> <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> <meta name="viewport" content="width=device-width" /> <meta name="generator" content={Astro.generator} /> <title>{pageTitle}</title> </head> <body> <Header /> <h1>{pageTitle}</h1> <Footer /> <script> import "../scripts/menu.js"; </script> </body></html>
```
## 在页面上使用你的布局
3. 使用以下代码替换 `src/pages/index.astro` 中的代码：
src/pages/index.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';const pageTitle = "首页";---<BaseLayout> <h2>我超棒的博客副标题</h2></BaseLayout>
```
4. 再次查看浏览器预览，注意到发生了什么变化（剧透警告：*没有* 变化！）。
5. 在 `src/layouts/BaseLayout.astro` 的页脚组件上方添加一个 `<slot />` 元素，然后查看你的首页在浏览器的预览中 *真正* 发生了什么变化！
src/layouts/BaseLayout.astro
```
---import Header from '../components/Header.astro';import Footer from '../components/Footer.astro';import '../styles/global.css';const pageTitle = "首页";---<html lang="zh-CN"> <head> <meta charset="utf-8" /> <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> <meta name="viewport" content="width=device-width" /> <meta name="generator" content={Astro.generator} /> <title>{pageTitle}</title> </head> <body> <Header /> <h1>{pageTitle}</h1> <slot /> <Footer /> <script> import "../scripts/menu.js"; </script> </body></html>
```
`<slot />` 允许你将写在开放和闭合 `<Component></Component>` 标签之间的**子内容**注入（或者说是「插入」）到任何 `Component.astro` 文件中。

## 通过 props 传递页面特定的值

[Section titled “通过 props 传递页面特定的值”](#通过-props-传递页面特定的值)
6. 使用组件属性将页面标题从 `index.astro` 传递给你的布局组件：
src/pages/index.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';const pageTitle = "首页";---<BaseLayout pageTitle={pageTitle}> <h2>我超棒的博客副标题</h2></BaseLayout>
```
7. 将 `BaseLayout.astro` 布局组件的脚本更改为通过 `Astro.props` 接收页面标题，而不是将其定义为常量。
src/layouts/BaseLayout.astro
```
---import Header from '../components/Header.astro';import Footer from '../components/Footer.astro';import '../styles/global.css';const pageTitle = "首页";const { pageTitle } = Astro.props;---
```
8. 检查你的浏览器预览，确认页面标题是否有变动。它应该和之前一样，但现在是动态渲染的。现在，每个独立的页面都可以指定自己的标题给布局。

## 试一试 - 在任何地方使用你的布局

[Section titled “试一试 - 在任何地方使用你的布局”](#试一试---在任何地方使用你的布局)

**重构**你的其他页面（`blog.astro` 和 `about.astro`），让它们使用你的新的 `<BaseLayout>` 组件来渲染共同的页面元素。

不要忘记：
- 通过组件属性将页面标题作为 props 传递。
- 让布局负责渲染任何共同的 HTML。
- 将页面 `<head>` 中任何现有的 `<style>` 标签以及你希望保留的样式移动到页面 HTML 模板中。
- 删除由布局正在处理的每个单独页面中的内容，包括：
- HTML 元素
    - 组件及其导入语句
    - `<style>` 标签中的 CSS 样式（例如，你的 About 页面中的 `<h1>`）
    - `<script>` 标签

使用 `<BaseLayout>` 渲染 `about.astro` 页面意味着你将会丢失添加到该页面 `<head>` 的 `<style>` 标签。要维持 Astro 的作用域样式仅在页面级别进行应用的话，请将 `<style>` 标签移动到页面组件的 body 部分。这允许你应用 **在此页面组件中创建的元素** 的样式（例如你的技能列表）。

由于你的 `<h1>` 现在是由布局组件创建的，因此你可以将 `is:global` 属性添加到样式标签中以影响此页面上的每个元素，包括由其他组件创建的元素：`<style is:global define:vars={{ skillColor, fontWeight, textCase }}>`

### 检验你的知识
1. Astro 组件（`.astro` 文件）可以用作：
2. 要在页面上显示页面标题，你可以
3. 可以通过以下什么方式将信息从一个组件传递到另一个组件：

## 任务清单
### 相关资源
- [Astro 布局组件](../../../../zh-cn/basics/layouts/index.md)
- [Astro `<slot />`](../../../../zh-cn/basics/astro-components/index.md)

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
