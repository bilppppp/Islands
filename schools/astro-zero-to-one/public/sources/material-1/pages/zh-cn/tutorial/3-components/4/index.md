<!-- source: https://docs.astro.build/zh-cn/tutorial/3-components/4/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 编写你的第一个浏览器脚本

让我们在移动屏幕上添加一个按钮以打开和关闭你的导航菜单，这需要一些客户端的交互！

准备好…

- 创建一个菜单组件
- 编写一个 `<script>` 使你的网站访问者可以打开和关闭导航菜单
- 将你的 JavaScript 移动到 `.js` 文件中

## 搭建一个菜单组件

[Section titled “搭建一个菜单组件”](#搭建一个菜单组件)

创建一个 `<Menu />` 组件，用于打开和关闭移动端菜单。
1. 在 `src/components/` 中创建一个名为 `Menu.astro` 的文件。
2. 将以下代码复制到你的组件中。这将创建一个按钮，用于在移动端切换导航链接的可见性。（稍后你将把新的 CSS 样式添加到 `global.css` 中。）
src/components/Menu.astro
```
------<button aria-expanded="false" aria-controls="main-menu" class="menu"> Menu</button>
```
3. 将这个新的 `<Menu />` 组件放置在 `Header.astro` 的 `<Navigation />` 组件之前。
给我看看代码！
src/components/Header.astro
```
---import Menu from './Menu.astro';import Navigation from './Navigation.astro';---<header> <nav> <Menu /> <Navigation /> </nav></header>
```
4. 为你的 Menu 组件添加以下样式，包括一些响应式样式：
src/styles/global.css
```
/* 导航样式 */.menu { background-color: #0d0950; border: none; color: #fff; font-size: 1.2rem; font-weight: bold; padding: 5px 10px;}
.nav-links { width: 100%; display: none; margin: 0;}
.nav-links a { display: block; text-align: center; padding: 10px 0; text-decoration: none; font-size: 1.2rem; font-weight: bold; text-transform: uppercase; color: #0d0950;}
.nav-links a:hover,.nav-links a:focus{ background-color: #ff9776;}
:has(.menu[aria-expanded="true"]) .nav-links { display: unset;}
@media screen and (min-width: 636px) { .nav-links { margin-left: 5em; display: block; position: static; width: auto; background: none; }
.nav-links a { display: inline-block; padding: 15px 20px; }
.menu { display: none; }}
```
## 编写你的第一个 script 标签

[Section titled “编写你的第一个 script 标签”](#编写你的第一个-script-标签)

你的页眉还不具有**交互性**，因为它无法响应用户输入，比如点击菜单来显示或隐藏导航链接菜单。
1. 使用 Astro 内置的 TypeScript 支持，将以下 `<script>` 标签添加到 `index.astro`，就在结束的 `</body>` 标签之前。
src/pages/index.astro
```
<Footer /> <script> const menu = document.querySelector('.menu');
menu?.addEventListener('click', () => { const isExpanded = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', `${!isExpanded}`); }); </script></body>
```
2. 再次在各种尺寸下检查你的浏览器预览，并验证你是否在这个页面上拥有一个能够根据屏幕尺寸响应并对用户输入作出响应的正常运作的导航菜单。

### 导入一个 .js 文件

[Section titled “导入一个 .js 文件”](#导入一个-js-文件)

你可以将你的 JavaScript 直接写在每个页面上，也可以将你的 `<script>` 标签的内容移动到项目中自己的 `.js` 文件中。
1. 创建 `src/scripts/menu.js`（你将不得不创建一个新的 `/scripts/` 文件夹），并将你的 JavaScript 移动到其中。
src/scripts/menu.js
```
const menu = document.querySelector('.menu');
menu?.addEventListener('click', () => { const isExpanded = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', `${!isExpanded}`);});
```
2. 用以下文件导入替换 `index.astro` 中的 `<script>` 标签的内容：
src/pages/index.astro
```
<Footer /> <script> const menu = document.querySelector('.menu');
menu?.addEventListener('click', () => { const isExpanded = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', `${!isExpanded}`); });
import "../scripts/menu.js"; </script></body>
```
3. 再次在较小的尺寸下检查你的浏览器预览，验证菜单是否仍然可以打开和关闭导航链接菜单。
4. 在你的其他两个页面 `about.astro` 和 `blog.astro` 中添加相同的带有导入的 `<script>`，并验证每个页面上是否有一个响应式、交互式的页眉。
src/pages/about.astro & src/pages/blog.astro
```
<Footer /> <script> import "../scripts/menu.js"; </script></body>
```
你之前使用了一些 JavaScript 来构建你网站的部分内容：
- 动态定义页面标题和标题
- 在关于页面上映射技能列表
- 有条件地显示 HTML 元素

**`<script>` 标签中的 JavaScript 被发送到浏览器**，并可根据用户的交互（如刷新页面或切换输入）运行。

### 测试你的知识
1. Astro 何时运行在组件的前置数据中编写的任何 JavaScript？
2. 可选地，Astro 可以发送 JavaScript 到浏览器以实现：
3. 在哪里编写或导入客户端 JavaScript，会将其发送到用户的浏览器中：

## 任务清单
### 相关资源

[Astro 中的客户端脚本](../../../../zh-cn/guides/client-side-scripts/index.md)

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
