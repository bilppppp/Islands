---
title: "组件与模板语法：.astro 单文件双代码块、变量插值与列表渲染"
slug: "astro-components-and-syntax"
description: "深入剖析 .astro 单文件结构，掌握代码栅栏（Frontmatter）的服务端执行机制，熟练运用大括号变量插值、条件渲染与数组列表渲染。"
order: 4
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 帮助初学者透彻理解 `.astro` 单文件组件的“双代码块”设计：顶部的“组件脚本（Component Script）”与下方的“组件模板（Component Template）”。
  2. 深刻建立“代码栅栏内的 JavaScript 仅在服务端或构建期执行，绝不泄漏到浏览器”的安全与性能心智。
  3. 掌握大括号 `{}` 变量插值、对象属性访问、条件渲染（逻辑与 `&&`、三元表达式 `? :`）以及 `.map()` 列表渲染的核心语法。
  4. 教学活动：模板输出推导与代码执行时机辨析。给出一段包含数组 `.map()` 和三元运算的 `.astro` 代码片段，让学员推导出最终在浏览器里生成的纯 HTML 结构，并回答：“用户在浏览器控制台能看到 frontmatter 里的 `console.log` 吗？为什么？”
  5. 完成条件：学员能够准确推导 HTML 输出，说明构建期执行与客户端执行的本质区别，并收到反馈。
---

# 组件与模板语法：.astro 单文件双代码块、变量插值与列表渲染

在前两关中，我们已经创建了几个 `.astro` 文件。但当时我们只是把它当作普通的 HTML 页面来写。

事实上，`.astro` 文件（也称为 **Astro 组件**）是 Astro 最具魔力的核心武器。它采用了一种被称为“超集 HTML”的设计：既保留了 HTML 的简单直观，又赋予了你使用 JavaScript 动态生成内容的高级工程能力。

今天，我们将彻底拆解 `.astro` 的结构，并跟随官方教程为我们的关于页面添加动态数据！

---

## 1. 核心概念与新术语白话解析

打开任意一个标准的 `.astro` 文件，你会发现它由上下两个完全不同的区域组合而成：

```html
---
// ==========================================
// 1. 组件脚本（Component Script / Frontmatter）
// 这里写纯纯的 JavaScript / TypeScript
// ==========================================
const pageTitle = "关于我";
---

<!-- ==========================================
     2. 组件模板（Component Template）
     这里写 HTML，可以在大括号内使用上面定义的变量
     ========================================== -->
<html>
  <head><title>{pageTitle}</title></head>
  <body>
    <h1>{pageTitle}</h1>
  </body>
</html>
```

### (1) 代码栅栏（Code Fence `---`）
- **它是什么**：位于文件顶部、被两行三连破折号 `---` 夹住的区域。
- **为什么需要它**：它为 JavaScript 提供了一个专门的运行沙盒，让你可以在渲染页面前做数据计算、网络请求或定义变量。
- **核心心智（极其重要）**：
  > **代码栅栏里的所有 JavaScript 只在服务器上（或本地构建时）执行一次！**
  无论你在围栏里写了多少复杂的逻辑、读取了本地什么文件、甚至 `console.log("你好")`，输出结果都只打印在你本机的终端控制台中，**绝对不会有一行围栏代码被发送给用户的浏览器！**

### (2) 变量插值（大括号 `{...}`）
- **它是什么**：在 HTML 模板部分，只要你想使用 JavaScript 变量或表达式，就把它用花括号 `{ }` 裹起来。
- **为什么需要它**：告诉 Astro 编译器：“请把花括号里的变量值计算出来，替换成普通文本塞进 HTML 里”。

### (3) 条件渲染（Conditional Rendering）
- **它是什么**：根据某个条件是真是假，决定是否渲染某段 HTML。
- **常用方式**：
  - 逻辑与：`{isLoggedIn && <p>欢迎回来！</p>}`（当真时显示，假时什么都不渲染）
  - 三元表达式：`{score >= 60 ? <span>及格</span> : <span>待努力</span>}`

### (4) 列表渲染（List Rendering）
- **它是什么**：把一个包含很多项的数组，批量循环渲染为多个 HTML 标签（如 `<li>`）。
- **Astro 规范写法**：使用 JavaScript 原生数组的 `.map()` 方法：
  ```jsx
  <ul>
    {skills.map((skill) => <li>{skill}</li>)}
  </ul>
  ```

### (5) 原生 `class` 属性（对比 React 的优势）
- 如果你曾听说过 React，在 React JSX 中因为 `class` 是 JavaScript 关键字，所以被迫改写成 `className`。
- **Astro 原生拥抱 Web 标准**：在 Astro 模板中，你可以理直气壮、毫无负担地直接写 `<div class="box">`，完全不需要改写成 `className`！

---

## 2. 动手实操：在关于页面中玩转动态变量

现在让我们打开 `src/pages/about.astro`，用官方教程的标准示例为它赋予动态生命力！

### 第一步：在代码栅栏中定义变量
将 `src/pages/about.astro` 顶部的代码围栏补充以下变量：

```html
---
// src/pages/about.astro
const pageTitle = "关于我";

const identity = {
  firstName: "莎拉",
  country: "加拿大",
  occupation: "技术撰稿人",
  hobbies: ["摄影", "观鸟", "棒球"],
};

const skills = ["HTML", "CSS", "JavaScript", "React", "Astro", "编写文档"];

const happy = true;
const finished = false;
const goal = 3;
---
```

### 第二步：在 HTML 模板中插值与输出对象属性
在 `<body>` 标签内，替换静态标题并输出 `identity` 对象的信息：

```html
<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <!-- 这里的 <title> 动态使用变量 -->
    <title>{pageTitle}</title>
  </head>
  <body>
    <a href="/">首页</a>
    <a href="/about/">关于</a>
    <a href="/blog/">博客</a>

    <!-- 这里的 <h1> 动态使用变量 -->
    <h1>{pageTitle}</h1>
    <h2>……和我的新 Astro 网站！</h2>

    <p>以下是关于我的几个事实：</p>
    <ul>
      <li>我的名字是：{identity.firstName}。</li>
      <li>我住在{identity.country}，职业是一名{identity.occupation}。</li>
      {identity.hobbies.length >= 2 && (
        <li>我的两大业余爱好是：{identity.hobbies[0]} 和 {identity.hobbies[1]}。</li>
      )}
    </ul>
```

### 第三步：使用 `.map()` 渲染技能列表
紧接着在下方添加技能清单：

```html
    <p>我的专业技能包括：</p>
    <ul>
      {skills.map((skill) => <li>{skill}</li>)}
    </ul>
```

### 第四步：使用条件渲染控制内容展示
在技能列表下方加入三行条件判断：

```html
    {happy && <p>我非常乐意学习 Astro！</p>}

    {finished && <p>我已经完成了这篇教程！</p>}

    {goal === 3 ? (
      <p>我的目标是在三天内学完基础。</p>
    ) : (
      <p>我的目标不是三天。</p>
    )}
  </body>
</html>
```

保存文件，切回浏览器访问 `http://localhost:4321/about/`！

仔细观察页面呈现：
- 页面大标题和网页标签栏标题都变成了“关于我”；
- 爱好列表中顺利展示了“摄影 和 观鸟”；
- 技能列表整整齐齐输出了 6 个 `<li>` 技能标签；
- 因为 `finished = false`，所以“我已经完成了这篇教程！”**在页面上完全没有出现**，打开控制台检查元素，发现对应的 DOM 标签根本就不存在；
- 因为 `goal === 3` 为真，所以输出了“我的目标是在三天内学完基础。”。

---

## 3. 核心机制深入：Astro 与普通 HTML 的分界线

让我们再退一步，看清楚整个处理流水线：

```text
你编写的 .astro 源码 
   ├── [代码栅栏内] 定义数据 (firstName = "莎拉", skills = [...])
   └── [HTML 模板内] {skills.map(...)}
             │
             ▼ (由本地 Node.js / Astro 编译器在服务端运算)
编译生成的纯静态 HTML 文件 (发送给浏览器)
   └── <ul>
         <li>HTML</li>
         <li>CSS</li>
         <li>JavaScript</li>
         <li>React</li>
         <li>Astro</li>
         <li>编写文档</li>
       </ul>
```

在浏览器收到的最终 HTML 中，**你看不到大括号，也看不到 `.map()`**。浏览器拿到的就是一段极其标准、极其干净的纯原生 HTML！

这就是为什么 Astro 能做到“零 JS 运行时”，却又能享受现代动态模板语法的根本原因。

---

## 4. 本关小结与思考

1. **双代码块**：顶部 `---` 代码栅栏写 JavaScript 处理数据，底部写模板渲染页面。
2. **表达式插值**：花括号 `{}` 赋能 HTML，轻松支持变量、对象属性、三元运算与 `.map()` 列表。
3. **零运行时残留**：所有的模板插值都在服务端计算完毕，输出纯 HTML，没有客户端性能损耗。

在下一关中，我们将学习如何美化页面——深入探索 Astro 独特的局部样式作用域机制（Scoped CSS）、CSS 变量动态注入与静态图片优化！
