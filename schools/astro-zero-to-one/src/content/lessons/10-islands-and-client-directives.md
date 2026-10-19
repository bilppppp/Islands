---
title: "群岛架构与客户端指令：接入 Preact UI 交互组件与局部按需水合"
slug: "islands-and-client-directives"
description: "深入理解 Astro 核心灵魂——群岛架构（Islands Architecture），集成 Preact 交互组件，掌握 client:load/idle/visible 客户端水合指令与性能权衡。"
order: 10
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 掌握 Astro 最具开创性的架构核心——群岛架构（Islands Architecture）：理解“纯静态 HTML 的广袤海洋”与“高度独立的局部动态小岛”的心智模型。
  2. 理解为什么在 Astro 中引入 React/Preact/Vue 组件时，**默认依然是零客户端 JavaScript**（在服务端编译成纯 HTML）。
  3. 掌握“客户端水合（Hydration）”的底层含义，以及如何通过客户端指令显式授权 Astro 何时向浏览器发送该组件的 JS 代码包。
  4. 深入掌握 4 种核心客户端指令的时机与性能代价：
     - `client:load`：立即水合（首屏关键交互）；
     - `client:idle`：浏览器空闲时水合（次要交互）；
     - `client:visible`：进入视口可见时水合（长页面底部、重型组件）；
     - `client:media`：满足 CSS 媒体查询时水合。
  5. 教学活动：组件水合选型匹配。给出 4 个真实 UI 组件（全站顶部的即时通知横幅、文章底部的评论系统、侧边栏未展开的搜索浮层、静态版权声明），让学员为它们匹配最佳水合指令，并说明理由。
  6. 完成条件：学员能够清晰解释为什么不加指令点击无反应，指出各水合指令的适用场景，并收到反馈。
---

# 群岛架构与客户端指令：接入 Preact UI 交互组件与局部按需水合

如果你在技术社区听到人们讨论 Astro，被提及频率最高的一个词绝对是：**“群岛架构”（Islands Architecture）**。

在上一关中，我们已经体会到了纯静态页面带来的极致飞快。但在现代网站开发中，我们难免会遇到一些需要复杂状态管理的动态交互小部件——比如一个随机切换问候语的小卡片、一个复杂的图片轮播轮盘、或者一个实时打字搜索框。

传统的单页应用（SPA）面对这个问题时的做法是：**“为了页面上一块小小的动态按钮，把整个网页都打包成巨大的 JS 发送给浏览器”**。
而 Astro 给出的革命性答案就是：**群岛架构！**

今天，我们将亲自接入官方推荐的 Preact 框架组件，彻底揭开 Astro 群岛的运作秘密！

---

## 1. 核心概念与新术语白话解析

```text
       【 Astro 群岛架构物理图景 】
┌────────────────────────────────────────────────────────┐
│  静态 HTML 海洋 (Zero JS)                              │
│  <header> 导航栏 (纯 HTML，极速呈现) </header>        │
│                                                        │
│   ┌───────────────────────┐                            │
│   │ 🏝️ 动态交互小岛 1     │     静态文章正文           │
│   │ <Greeting client:load>│     (纯 HTML，0 KB JS)     │
│   │ 局部水合 JavaScript   │                            │
│   └───────────────────────┘                            │
│                                                        │
│   一大段长长的静态图文内容...                           │
│                                                        │
│   ┌───────────────────────────┐                        │
│   │ 🏝️ 动态交互小岛 2         │                        │
│   │ <Comments client:visible> │                        │
│   │ 滚动到可见时才下载 JS     │                        │
│   └───────────────────────────┘                        │
│                                                        │
│  <footer> 静态版权页脚 (纯 HTML) </footer>             │
└────────────────────────────────────────────────────────┘
```

### (1) 群岛架构（Islands Architecture）
- **它是什么**：一种将网页划分为“绝大部分纯静态 HTML 海洋”与“少量局部动态孤岛”的架构范式。
- **为什么需要它**：每个交互小岛都是独立运行的，小岛之间的 JavaScript 互不阻塞。即使一个小岛发生脚本崩溃，整个页面的其余部分依然完好无损、顺畅阅读。
- **与传统 SPA 的根本区别**：传统框架是把整个网页泡在充满 JS 的水里；Astro 是把整个网页做成干燥结实的陆地，只在需要交互的几个小岛上浇上一点水。

### (2) 水合（Hydration / 注水激活）
- **它是什么**：在服务端，组件已经先生成了 HTML 结构骨架。当浏览器下载了对应的 JavaScript 后，JS 脚本会找到这个 HTML 结构，并把点击等事件监听器“捆绑绑定”上去的过程，形象地被称为“水合（注水唤醒）”。

### (3) 默认零客户端 JS（Zero JS by default）
- **这是很多初学者最容易震惊的地方**：
  在 Astro 中，你完全可以在项目里写 React、Preact、Vue 或 Svelte 组件！
  但是——**只要你不在调用它时加上 `client:*` 指令，Astro 在构建时就会把它“榨干”为纯粹的静态 HTML 发给浏览器，浏览器里根本不会加载哪怕 1 个字节的 React 运行时代码！**

### (4) 客户端指令（Client Directives）
- **它是什么**：写在框架组件标签上的专用属性（如 `client:load`、`client:visible`）。
- **为什么需要它**：用来向 Astro 明确授权：“这个小岛请允许它在客户端执行 JS，并按照我指定的时机进行水合！”

---

## 2. 官方四大客户端指令全方位对比

Astro 提供了非常精准的加载时机控制能力：

| 客户端指令 | 触发水合的时机 | 适用场景与性能权衡 |
| :--- | :--- | :--- |
| **`client:load`** | 页面刚一加载，**立即优先下载并执行 JS** | **最高优先级**：首屏最关键、用户一进来就必须立即可点击的交互（如顶栏登录弹窗、紧急通知关闭按钮）。 |
| **`client:idle`** | 等页面的主文档加载完毕、**浏览器处于空闲状态时**再下载执行 | **中等优先级**：重要但不需要争抢首屏带宽的组件（如侧边栏小工具、站内实时搜索框）。 |
| **`client:visible`** | 用户滚动页面，**该组件进入屏幕视野时**才开始下载并执行 | **极致性能优化**：放在首屏下方的长内容（如页面底部的评论区、图片轮播画廊、数据图表）。不滚到那，就 0 流量消耗！ |
| **`client:media="(query)"`** | 仅在满足特定的 CSS 媒体查询时才加载水合 | **响应式按需加载**：例如仅在手机窄屏端生效的侧滑抽屉菜单（`(max-width: 50em)`），在电脑大屏上完全不加载对应 JS。 |

---

## 3. 动手实操：创建 Preact 交互小岛

现在让我们跟随官方教程第六单元，一步一步为我们的博客首页添加一个能够随机切换问候语的交互小岛！

### 第一步：添加 Preact 官方集成
Astro 官方提供了一条极其强大的命令，可以全自动帮你完成框架的依赖安装与配置接入：

在终端中运行：

```bash
npx astro add preact
```

终端会询问你是否确认安装 `@astrojs/preact` 以及修改 `astro.config.mjs`，一路按 `y` 确认回车。
完成之后，打开你的 `astro.config.mjs`，你会看到它已经被自动注入了集成声明：

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [preact()],
});
```

### 第二步：编写 Preact 问候组件 `Greeting.jsx`
在 `src/components/` 目录下新建 `Greeting.jsx` 文件（路径：`src/components/Greeting.jsx`）：

```jsx
// src/components/Greeting.jsx
import { useState } from 'preact/hooks';

export default function Greeting({ messages }) {
  // 随机挑选一条问候语
  const randomMessage = () => messages[(Math.floor(Math.random() * messages.length))];
  // 使用 useState 记录当前展示的问候语
  const [greeting, setGreeting] = useState(messages[0]);

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
      <h3>{greeting}！感谢你的访问！</h3>
      <button onClick={() => setGreeting(randomMessage())} style={{ padding: '0.5rem 1rem', background: '#4c1d95', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        换一句新的问候语
      </button>
    </div>
  );
}
```

### 第三步：体验“默认零 JS”的反直觉现象
现在，打开 `src/pages/index.astro`，在其中引入并直接调用 `<Greeting />`：

```html
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Greeting from '../components/Greeting.jsx';
const pageTitle = "首页";
---

<BaseLayout pageTitle={pageTitle}>
  <h2>我超棒的博客副标题</h2>

  <!-- 注意：这里我们故意没有加任何 client:* 指令！ -->
  <Greeting messages={["嗨", "你好", "很高兴见到你", "欢迎光临"]} />
</BaseLayout>
```

保存后切回浏览器访问首页：
你会看到问候语组件完整地渲染在页面上。但是，**当你用鼠标疯狂点击“换一句新的问候语”按钮时，你会发现它完全没有反应！**

打开浏览器开发者工具检查网络（Network）：**没有任何 Preact 的 JavaScript 代码被加载！**
这正是 Astro 最硬核的地方：因为你没有加指令，Astro 把这个 Preact 组件当成普通的 HTML 模板，在服务端算完后生成了纯静态 HTML，根本没把 JS 运行时发给浏览器！

### 第四步：注入灵魂：添加 `client:load` 指令
现在，我们把这行代码修改为带有水合指令的版本：

```html
<Greeting client:load messages={["嗨", "你好", "很高兴见到你", "欢迎光临"]} />
```

保存后再次切回浏览器：
- 页面瞬间加载完毕；
- 点击按钮，上面的问候语立即流畅地在“嗨”、“你好”、“很高兴见到你”之间随机切换！
- 检查控制台网络，只有这个单独的小岛加载了轻量的 Preact 运行时（仅几 KB），全站其余部分依然保持绝对零 JS！

---

## 4. 本关小结

1. **群岛哲学**：绝大部分页面是静态 HTML 海洋，局部动态区域是独立的 UI 小岛。
2. **多技术栈兼容**：在同一个 Astro 网站里，你可以按需使用 React、Vue、Preact 或 Svelte，随心所欲。
3. **按需水合开关**：组件默认 0 JS，使用 `client:load`、`client:idle`、`client:visible` 精确掌控运行时的下载时机，将 Web 性能压榨到极致。

到目前为止，我们的博客已经具备了完整的页面、样式、布局、动态路由和交互小岛。
但在实际维护几十甚至几百篇博客文章时，有一个巨大的安全隐患正在悄悄酝酿：如果某篇文章的 frontmatter 漏写了标题，或者把日期拼错了，整站构建会不会突然崩溃？
下一关，我们将学习现代 Astro 最具杀伤力的数据基石——**类型安全的内容集合（Content Collections）**！
