---
title: "可复用组件：抽离导航与页脚、组件间 Props 属性传递与组合"
slug: "reusable-components-and-props"
description: "掌握 Astro 组件化思想，将重复的导航栏与页脚抽离为独立组件，熟练使用 Astro.props 进行父子组件参数传递与多层组件装配。"
order: 6
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 理解“不要自我重复（DRY - Don't Repeat Yourself）”的软件设计原则，学会将各个页面中重复书写的导航链接与页脚抽离为 `src/components/` 下的独立组件。
  2. 透彻掌握父子组件通信机制：父组件通过属性传递参数，子组件通过内置的 `Astro.props` 对象解构接收属性。
  3. 按照官方教程规范，亲手创建 `Navigation.astro`、`Social.astro`、`Footer.astro` 与 `Header.astro`，体验组件装配与嵌套组合。
  4. 教学活动：组件重构推导与 Props 接口设计。给出一段包含硬编码链接的 HTML 片段，让学员设计一个通用的 `Social.astro` 组件接口，并推导当传入不同参数时该组件生成的最终 DOM。
  5. 完成条件：学员能够解释 `Astro.props` 的作用，正确分析组件嵌套装配的调用链路，并收到反馈。
---

# 可复用组件：抽离导航与页脚、组件间 Props 属性传递与组合

回顾一下我们在前几关做的事情：
我们在 `index.astro`、`about.astro` 和 `blog.astro` 这三个页面里，手写了三模一样的导航链接：

```html
<a href="/">首页</a>
<a href="/about/">关于</a>
<a href="/blog/">博客</a>
```

如果网站只有 3 个页面，手写 3 次还能忍受；但如果有 50 个页面呢？如果某天我们要把“博客”改成“文章列表”，或者增加一个“作品集”链接，我们就必须再次手动修改 50 个文件——这直接违背了软件工程最核心的原则：**不要自我重复（DRY，Don't Repeat Yourself）**！

今天，我们将迈入现代前端开发的核心殿堂——**组件化（Component-driven Development）**！

---

## 1. 核心概念与新术语白话解析

### (1) UI 组件（UI Component）
- **它是什么**：一段独立的、包含自身结构（HTML）、样式（CSS）和数据计算（JS）的代码积木块，以 `.astro` 文件形式保存在 `src/components/` 目录下。
- **为什么需要它**：把复杂的网页切分成一个个微小、专注的零件（如导航条、页脚、按钮、文章卡片）。修改零件本身，所有引用该零件的页面都会自动更新。
- **如何使用**：
  1. 在要使用的页面顶部 frontmatter 导入：
     ```javascript
     import Navigation from '../components/Navigation.astro';
     ```
  2. 在 HTML 模板里像写普通 HTML 标签一样调用它：
     ```html
     <Navigation />
     ```

### (2) Props（组件属性参数）
- **它是什么**：Props 是 Properties 的缩写，代表“父组件向子组件传递的数据”。
- **为什么需要它**：如果一个组件的内容是完全写死的，它的复用价值就很有限。比如一个“社交媒体按钮”，我们希望它能一会儿展示 GitHub，一会儿展示 Twitter，一会儿展示 Bilibili。通过传参，可以让同一份组件展现不同的内容。
- **调用语法**：
  ```html
  <Social platform="github" username="withastro" />
  ```

### (3) `Astro.props`
- **它是什么**：在任何 Astro 组件的代码栅栏里，Astro 都自动注入了一个全局内置对象 `Astro.props`。
- **为什么需要它**：子组件就是通过读取 `Astro.props`，获取父组件从外面传进来的各种属性值。
- **写法示例**：
  ```javascript
  ---
  // src/components/Social.astro
  const { platform, username } = Astro.props;
  ---
  <a href={`https://www.${platform}.com/${username}`}>{platform}</a>
  ```

### (4) 组件组合（Component Composition）
- **它是什么**：大组件里面包含小组件，就像搭积木一样层层装配（例如 `Header.astro` 里面包含 `Navigation.astro`；`Footer.astro` 里面包含多个 `Social.astro`）。

---

## 2. 动手实操：抽离可复用导航组件

### 第一步：创建 `Navigation.astro`
在 `src/` 目录下新建 `components` 文件夹，并在其中新建 `Navigation.astro`（完整路径：`src/components/Navigation.astro`），写入以下内容：

```html
---
// src/components/Navigation.astro
---
<div class="nav-links">
  <a href="/">首页</a>
  <a href="/about/">关于</a>
  <a href="/blog/">博客</a>
</div>
```

### 第二步：在页面中引入并替换旧代码
打开 `src/pages/index.astro`：
1. 在顶部代码栅栏中导入组件：
   ```javascript
   ---
   import '../styles/global.css';
   import Navigation from '../components/Navigation.astro';
   ---
   ```
2. 在 `<body>` 中把那三行散乱的 `<a>` 标签替换为简洁的组件标签：
   ```html
   <body>
     <Navigation />
     <h1>我的 Astro 站点</h1>
   </body>
   ```

请按照相同的方式，依次修改 `src/pages/about.astro` 和 `src/pages/blog.astro`。
保存后刷新浏览器，导航依然完好运行，但我们的页面代码变得异常干净利落！如果未来要加一个新菜单，只需要修改 `Navigation.astro` 这一个文件即可！

---

## 3. 进阶实操：制作带 Props 参数的社交媒体组件与 Footer

现在，让我们在网站底部增加一个展示作者社交主页的页脚（Footer），并学习如何向组件传参。

### 第一步：创建带 Props 参数的 `Social.astro` 子组件
在 `src/components/` 目录下新建 `Social.astro`，写入以下代码：

```html
---
// src/components/Social.astro
interface Props {
  platform: string;
  username: string;
}

const { platform, username } = Astro.props;
---

<a href={`https://www.${platform}.com/${username}`} target="_blank">{platform}</a>

<style>
  a {
    padding: 0.5rem 1rem;
    color: white;
    background-color: #4c1d95;
    text-decoration: none;
    border-radius: 4px;
    margin-right: 0.5rem;
    display: inline-block;
  }
  a:hover {
    background-color: #6d28d9;
  }
</style>
```

> **仔细观察**：
> - `const { platform, username } = Astro.props;` 优雅地解构出了传入的两个参数；
> - 模板中的 `href` 使用了 ES6 模板字符串 `` `https://www.${platform}.com/${username}` `` 动态拼接网址；
> - 组件自带的 `<style>` 样式只对自己生效，不会污染外部其它超链接！

### 第二步：创建 `Footer.astro` 并组合多个 `Social` 组件
在 `src/components/` 目录下新建 `Footer.astro`，在其中多次调用 `Social` 组件并传入不同参数：

```html
---
// src/components/Footer.astro
import Social from './Social.astro';
---

<footer>
  <p>在这些平台上关注我：</p>
  <Social platform="twitter" username="astrodotbuild" />
  <Social platform="github" username="withastro" />
  <Social platform="youtube" username="astrodotbuild" />
</footer>

<style>
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #cbd5e1;
  }
  p {
    width: 100%;
    margin-bottom: 0.5rem;
    color: #64748b;
  }
</style>
```

### 第三步：在各个页面引入 `Footer`
分别打开 `src/pages/index.astro`、`about.astro` 和 `blog.astro`：
1. 在 frontmatter 导入：`import Footer from '../components/Footer.astro';`
2. 在 `</body>` 闭合标签之前加入：`<Footer />`

切回浏览器刷新任意一个页面，往滚动到底部，你就会看到一行带有精致紫色胶囊按钮的社交链接！

---

## 4. 封装 `Header.astro` 整体页头组件

为了让页面更加模块化，我们可以把顶部的导航栏进一步封装为一个完整的页头组件：

在 `src/components/` 目录下新建 `Header.astro`：

```html
---
// src/components/Header.astro
import Navigation from './Navigation.astro';
---

<header>
  <nav>
    <Navigation />
  </nav>
</header>

<style>
  header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
</style>
```

现在，我们在页面中只需引入 `<Header />`，整个页头布局就自动组装完成了。

---

## 5. 本关小结

```text
组件组装链路：
  [Social.astro (接收平台和用户名)] 
         │ (被包含 3 次并传参)
         ▼
  [Footer.astro (页脚外壳)]
         │
         ▼ (引入各页面底部)
  [index.astro / about.astro / blog.astro] ◄─── [Header.astro ◄─── Navigation.astro]
```

1. **组件解耦**：将公共 HTML 片段封装进 `src/components/*.astro`，一处编写，到处复用。
2. **数据传参**：父组件写属性 `<Comp prop="value" />`，子组件用 `Astro.props` 接收。
3. **层级组合**：小零件组合成大组件，大组件装配成完整页面。

尽管我们已经把导航和页脚做成了组件，但每个页面里仍然要重复写 `<!DOCTYPE html>`、`<head>`、`<meta>` 等外壳标签。下一关，我们将学习 Astro 专门用来消灭页面外壳重复的终极武器——**布局（Layouts）与插槽（Slots）**！
