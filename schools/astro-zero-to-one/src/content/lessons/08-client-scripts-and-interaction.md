---
title: "客户端原生交互：无需前端框架的 <script> 标签与深色模式切换"
slug: "client-scripts-and-interaction"
description: "掌握 Astro 中客户端原生脚本的应用，理清代码围栏与 <script> 的本质区别，使用轻量 JavaScript 和 CSS 实现响应式汉堡菜单与深色模式切换。"
order: 8
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 破除初学者“做交互必须引入庞大前端框架”的误区：理解很多常见的网页交互（如菜单折叠、弹窗提示、主题切换）用原生 JavaScript 标签就能轻量、高效地完成。
  2. 深刻辨析两种脚本的执行时机与物理位置：
     - 组件脚本（Frontmatter `---`）：运行在服务端/构建期，生成静态 HTML，代码绝不送往客户端；
     - 客户端脚本（`<script>`）：由 Astro 自动打包优化后发送至浏览器，在用户端执行 DOM 事件监听。
  3. 按照官方教程步骤，亲手构建 `Hamburger.astro` 汉堡菜单组件、抽离 `src/scripts/menu.js` 模块，并实现基于 `localStorage` 的 `ThemeIcon.astro` 深浅色主题切换器。
  4. 教学活动：执行时机判断与事件冒泡辨析。给出一组代码，让学员辨析 `document.querySelector` 写在 frontmatter 中为什么会报错（`document is not defined`），而写在 `<script>` 中却能正常运行的原因。
  5. 完成条件：学员能够清晰说出两种脚本的区别，理解原生脚本实现的交互为何依然保持“零框架负担”，并收到反馈。
---

# 客户端原生交互：无需前端框架的 `<script>` 标签与深色模式切换

很多初学者在学习网页制作时，常常被灌输一种错误观念：“如果网页需要点一下按钮弹出一个菜单，或者切换深色模式，就必须引入 React 或 Vue 这样的大型框架”。

Astro 官方教程在第六单元明确指出：**“回到干燥的陆地——别忘了仅仅使用原始的 JavaScript 和 CSS，你就能走得很远！”**

在很多场景下，我们只需要几十行原生 JavaScript 来监听点击事件，完全没必要为了一个展开按钮引入几百 KB 的框架运行时代码。Astro 对标准 HTML `<script>` 标签提供了极其强大的自动化打包和优化支持。

今天，我们将通过制作**响应式汉堡菜单**和**深浅色主题切换按钮**，掌握纯原生交互的极简魅力！

---

## 1. 核心概念与新术语白话解析

### (1) 客户端脚本（Client-side Script）
- **它是什么**：在 `.astro` 模板中写的标准 HTML `<script>` 标签（或引入的 `.js` 文件）。
- **为什么需要它**：当用户在手机或电脑上点击、滑动、输入时，浏览器需要执行事件监听逻辑（例如 `element.addEventListener('click', ...)`）来实时修改网页 DOM。
- **与组件脚本（Frontmatter）的本质区别**：

| 对比维度 | 组件脚本（顶部代码围栏 `---`） | 客户端脚本（`<script>` 标签） |
| :--- | :--- | :--- |
| **执行地点** | **服务端 / 本地构建机**（Node.js 环境） | **用户的浏览器**（Browser 环境） |
| **执行时机** | 构建静态页面时**只执行一次** | 用户在网页上交互时随时触发 |
| **是否有 DOM** | **没有**（试图访问 `window` 或 `document` 会直接报错） | **有**（可以自由操作 `document.getElementById`） |
| **代码传输** | 代码计算完即丢弃，**绝不发给浏览器** | 代码会被 Astro 打包压缩后**发送给浏览器** |

### (2) Astro 对 `<script>` 的自动优化机制
- 在 Astro 中，`<script>` 标签默认被视为 **ES 模块（JavaScript Module）**。
- Astro 会自动为你处理所有 `<script>` 标签：自动压缩代码、自动分析依赖，最厉害的是：**如果同一个组件在页面里被引用了 5 次，该组件自带的 `<script>` 也只会被打包加载一次**，绝不会造成脚本重复执行！

### (3) 本地存储（`localStorage`）
- **它是什么**：浏览器提供的一个微型持久化键值数据库。
- **为什么需要它**：即使用户刷新了网页或关闭浏览器第二天再打开，通过 `localStorage.getItem("theme")` 依然能记住用户选的是“深色模式”还是“浅色模式”。

---

## 2. 动手实操一：制作响应式移动端汉堡菜单

在小屏幕手机上，导航链接太多会挤压变形。标准的做法是隐藏导航链接，并在右上角显示一个三道杠的“汉堡图标”，点击后展开菜单。

### 第一步：创建汉堡菜单按钮组件 `Hamburger.astro`
在 `src/components/` 目录下新建 `Hamburger.astro`：

```html
---
// src/components/Hamburger.astro
---

<div class="hamburger">
  <span class="line"></span>
  <span class="line"></span>
  <span class="line"></span>
</div>

<style>
  .hamburger {
    padding-right: 20px;
    cursor: pointer;
  }
  .hamburger .line {
    display: block;
    width: 30px;
    height: 3px;
    margin-bottom: 7px;
    background-color: #ff9776;
    border-radius: 2px;
  }
  /* 在宽屏电脑上隐藏汉堡图标 */
  @media screen and (min-width: 636px) {
    .hamburger {
      display: none;
    }
  }
</style>
```

### 第二步：更新全局样式以支持菜单展开/折叠
打开 `src/styles/global.css`，在文件末尾追加以下响应式 CSS 样式：

```css
/* 移动端默认隐藏导航链接，拥有 .expanded 类时显示 */
.nav-links {
  width: 100%;
  display: none;
}

.nav-links.expanded {
  display: unset;
}

/* 宽屏设备直接平铺展示导航 */
@media screen and (min-width: 636px) {
  .nav-links {
    display: block;
    position: static;
    width: auto;
    background: none;
  }
}
```

### 第三步：编写客户端交互脚本并抽离为模块
1. 在 `src/` 目录下新建 `scripts` 文件夹，并在其中创建 `menu.js`（路径：`src/scripts/menu.js`）：

```javascript
// src/scripts/menu.js
document.querySelector('.hamburger')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('expanded');
});
```

2. 打开 `src/components/Header.astro`，引入 `<Hamburger />`，并在底部加上 `<script>` 导入该交互模块：

```html
---
// src/components/Header.astro
import Hamburger from './Hamburger.astro';
import Navigation from './Navigation.astro';
---

<header>
  <nav>
    <Hamburger />
    <Navigation />
  </nav>
</header>

<script>
  import '../scripts/menu.js';
</script>

<style>
  header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
</style>
```

保存后切回浏览器，把浏览器窗口缩窄到类似手机屏幕的宽度：
- 顶部的三个导航链接自动收起隐藏；
- 右侧出现了漂亮的三条橙色短杠；
- 点击汉堡图标，导航栏平滑展开；再次点击，导航栏收起折叠！
整个过程**没有引入任何第三方库**，纯原生代码，运行速度极快。

---

## 3. 动手实操二：实现深色/浅色模式切换器 `ThemeIcon.astro`

现在让我们跟随官方教程第六单元，制作一个酷炫的昼夜模式切换按钮。

### 第一步：创建 `ThemeIcon.astro` 组件
在 `src/components/` 目录下新建 `ThemeIcon.astro`：

```html
---
// src/components/ThemeIcon.astro
---

<button id="themeToggle" aria-label="切换深色/浅色主题">
  <svg width="24px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path class="sun" fill-rule="evenodd" d="M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0 1.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
    <path class="moon" fill-rule="evenodd" d="M16.5 18a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11z" />
  </svg>
</button>

<style>
  #themeToggle {
    border: 0;
    background: none;
    cursor: pointer;
    padding: 0.5rem;
  }
  .sun { fill: black; }
  .moon { fill: transparent; }

  /* 当 html 标签拥有 .dark 类时，反转日月图标显示 */
  :global(.dark) .sun { fill: transparent; }
  :global(.dark) .moon { fill: white; }
</style>

<script>
  // 1. 初始化读取本地偏好
  const theme = (() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  })();

  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  window.localStorage.setItem('theme', theme);

  // 2. 绑定点击切换逻辑
  const handleToggleClick = () => {
    const element = document.documentElement;
    element.classList.toggle('dark');
    const isDark = element.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  document.getElementById('themeToggle')?.addEventListener('click', handleToggleClick);
</script>
```

### 第二步：在全局样式中支持深色主题变量
打开 `src/styles/global.css`，在末尾加入深色模式的全局视觉规则：

```css
/* 深色模式下的全局配色 */
html.dark {
  background-color: #0f172a;
  color: #f8fafc;
}

html.dark a {
  color: #38bdf8;
}

html.dark .post-meta {
  background-color: #1e293b;
}
```

### 第三步：把切换按钮放进 `Header.astro`
打开 `src/components/Header.astro`，在导航栏旁边加入切换图标：

```html
---
// src/components/Header.astro
import Hamburger from './Hamburger.astro';
import Navigation from './Navigation.astro';
import ThemeIcon from './ThemeIcon.astro';
---

<header>
  <nav style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center;">
      <Hamburger />
      <Navigation />
    </div>
    <ThemeIcon />
  </nav>
</header>
```

保存后刷新网页，点击右上角的太阳图标：
- 整个网站瞬间切换为炫酷的深空黑夜主题（`#0f172a`）；
- 图标平滑切换为白色月亮；
- 刷新页面，或者跳转到博客文章页，依然保持深色模式，状态被 `localStorage` 牢牢记住！

---

## 4. 本关小结

1. **分清战场**：Frontmatter `---` 在服务端执行，`<script>` 在用户浏览器中执行。
2. **拒绝盲目依赖**：很多轻量级交互，用标准 DOM 操作和原生 CSS 就能完成得非常出色。
3. **性能零损耗**：原生脚本无需框架加载器，打包体积几乎忽略不计，体验极致丝滑。

既然纯原生脚本这么好用，那如果我们的网站确实需要复杂的前端组件库（比如随机生成问候语、带交互状态的动态计数器、或者拖拽图表）时，Astro 又该如何应对呢？
下一关，我们将先学习 Astro 如何通过 API 和动态路由批量生成几十个页面，随后我们将正式揭开 Astro 最具革命性的招牌架构——**群岛架构（Islands Architecture）**！
