<!-- source: https://docs.astro.build/zh-cn/tutorial/3-components/3/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)

由于你的网站将在不同的设备上进行浏览，是时候创建一个能够适应多个屏幕尺寸的页面导航了！

准备好…

- 为你的网站创建一个包含导航组件的 Header
- 使导航组件具有响应式能力

[Section titled “亲自尝试 - 构建一个新的 Header 组件”](#亲自尝试---构建一个新的-header-组件)
1. 创建一个新的 Header 组件。在位于 `<header>` 元素内的 `<nav>` 元素中导入并使用你现有的 `Navigation.astro` 组件。
给我看看代码！
在 `src/components/` 下创建一个名为 `Header.astro` 的文件。
src/components/Header.astro
```
---import Navigation from './Navigation.astro';---<header> <nav> <Navigation /> </nav></header>
```
## 亲自尝试 - 更新你的页面

[Section titled “亲自尝试 - 更新你的页面”](#亲自尝试---更新你的页面)
1. 在每个页面中，使用你的新 Header 组件替换现有的 `<Navigation/>` 组件。
给我看看代码！
src/pages/index.astro
```
---import Navigation from '../components/Navigation.astro';import Header from '../components/Header.astro';import Footer from '../components/Footer.astro';import '../styles/global.css';const pageTitle = "首页";---<html lang="zh-CN"> <head> <meta charset="utf-8" /> <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> <meta name="viewport" content="width=device-width" /> <meta name="generator" content={Astro.generator} /> <title>{pageTitle}</title> </head> <body> <Navigation /> <Header /> <h1>{pageTitle}</h1> <Footer /> </body></html>
```
2. 检查你的浏览器中的预览，并验证你的 Header 是否显示在每个页面上。虽然它还没有显示出不同的样式，但是如果你使用开发者工具检查预览页面，你会看到你的导航链接周围现在有 `<header>` 和 `<nav>` 等元素。

## 添加响应式样式
1. 在 `Navigation.astro` 中使用 CSS 类来控制你的导航链接。将现有的导航链接包裹在一个带有类名 `nav-links` 的 `<div>` 元素中，并且把 id 属性设置为 `main-menu`。
src/components/Navigation.astro
```
------<div id="main-menu" class="nav-links"> <a href="/">首页</a> <a href="/about/">关于</a> <a href="/blog/">博客</a></div>
```
2. 将下面的 CSS 样式复制到 `global.css` 中。这些样式会：
首先定义在较小屏幕尺寸上应该渲染的布局！较小的屏幕尺寸需要更简单的布局，然后，调整你的样式以适应较大的设备。如果你先设计复杂情况，那么接下来你反而要努力将其简化。
src/styles/global.css
```
html { background-color: #f1f5f9; font-family: sans-serif;}
body { margin: 0 auto; width: 100%; max-width: 80ch; padding: 1rem; line-height: 1.5;}
   * {  box-sizing: border-box;}
h1 { margin: 1rem 0; font-size: 2.5rem;}
/* 导航样式 */
.nav-links { width: 100%; margin: 0;}
.nav-links a { display: block; text-align: center; padding: 10px 0; text-decoration: none; font-size: 1.2rem; font-weight: bold; text-transform: uppercase; color: #0d0950;}
.nav-links a:hover,.nav-links a:focus { background-color: #ff9776;}
@media screen and (min-width: 636px) { .nav-links { margin-left: 5em; display: block; position: static; width: auto; background: none; }
.nav-links a { display: inline-block; padding: 15px 20px; }}
```
调整窗口大小，查看在不同屏幕宽度下应用的不同样式。现在，通过使用 `@media` 查询，你的页首对于屏幕尺寸是**响应式的**。

## 任务清单
### 相关资源
- [基于组件的设计](https://www.droptica.com/blog/component-based-design/) 外部链接
- [语义化的 HTML 标签](https://www.dofactory.com/html/semantics) 外部链接
- [移动优先设计](https://www.mobileapps.com/blog/mobile-first-design) 外部链接

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
