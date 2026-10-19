---
title: "前期准备：开发环境安装、向导建项与工程目录分工"
slug: "project-setup-and-structure"
description: "配置 Node.js 运行环境，使用 Astro 官方向导从零创建工程项目，掌握 package.json 核心脚本与 src/pages 和 public/ 的目录分工。"
order: 2
quiz: false
agentOnly: true
agentInstructions: |
  教学目标：
  1. 指导零基础学员在本地安装并验证 Node.js 偶数版本运行环境，理解什么是终端与包管理器。
  2. 按照官方教程完整体验 `npm create astro@latest` 向导建项流程，学会使用 `npm run dev` 启动开发服务器并访问 `localhost:4321`。
  3. 建立严密的工程目录心智：透彻区分“特殊保留路由目录 `src/pages/`”、“自由组件目录 `src/components/`”与“原样复制静态目录 `public/`”。
  4. 教学活动：目录归类与文件定位。给出 4 个文件（一篇博客文章、一个导航栏组件、一张原样下载的 PDF 课件、全局样式表），让学员指出它们应该存放在项目的哪个目录下，并说明原因。
  5. 完成条件：学员能够说出 `src/pages/` 和 `public/` 的关键区别，正确归类文件，并收到反馈。
---

# 前期准备：开发环境安装、向导建项与工程目录分工

在上一关中，我们了解了 Astro 的设计哲学。从这一关开始，我们将正式进入动手实操环节！

如果你从未接触过代码工程化开发，请不要害怕。我们会把每一个用到的工具和术语拆解清楚，一步一步带你走完官方标准的项目搭建流程。

---

## 1. 必备工具与新术语白话解析

在开始之前，我们需要在电脑上准备好三个最基础的工具：

### (1) 终端（Terminal / Command Line）
- **它是什么**：电脑上的命令行黑底窗口（在 macOS/Linux 上叫 Terminal，在 Windows 上叫命令提示符或 PowerShell）。
- **为什么需要它**：现代 Web 框架需要通过运行指令来启动本地测试服务器、安装依赖代码以及执行打包构建。
- **在哪里看到**：系统自带应用程序，也可以在 VS Code 代码编辑器的顶部菜单栏通过「终端 -> 新建终端」（快捷键 `Ctrl + ~` 或 `Cmd + ~`）直接打开。

### (2) Node.js 与 npm
- **它是什么**：
  - **Node.js** 是一个能够在你的电脑上运行 JavaScript 的引擎环境。Astro 框架本身的编译程序就是用 JavaScript/TypeScript 编写的，因此必须有 Node.js 才能在你的电脑上运转。
  - **npm**（Node Package Manager）是随 Node.js 一起安装的“包管理器”。它就像一个应用商店，帮你下载和管理 Astro 以及其它开源扩展包。
- **版本要求**：Astro 官方明确要求使用 **偶数稳定版本**（如 `v18.20.8+`、`v20.3.0+` 或 `v22.0.0+`）。不要使用奇数版本（如 v19、v21）。
- **如何检查**：在终端中输入以下命令并回车：
  ```bash
  node -v
  ```
  如果输出类似 `v22.12.0`，说明 Node.js 已就绪；如果提示 `Command 'node' not found`，请前往 [Node.js 官方网站](https://nodejs.org/) 下载并安装 LTS 长期支持版。

### (3) 代码编辑器（VS Code）
- **它是什么**：用来写代码的工具软件，推荐使用微软的 **Visual Studio Code（简称 VS Code）**。
- **推荐插件**：在 VS Code 插件市场搜索并安装官方插件 **Astro**（由 `astro-build` 提供），它会为你提供语法高亮、代码补全和错误提示。

---

## 2. 官方标准流程：使用向导创建你的第一个 Astro 项目

Astro 官方提供了一个非常友好的命令行向导工具 `create-astro`。

### 第一步：在终端中运行安装向导
打开终端，进入你平时放代码的目录，输入以下命令：

```bash
npm create astro@latest
```

### 第二步：跟随命令行提示进行选择
终端会弹出一系列交互问答，官方教程推荐初学者的选择如下：

1. **Where should we create your new project?（你想在哪里创建新项目？）**
   - 输入文件夹名字，例如：`./tutorial`
   - *注意：Astro 只能在一个全新的空文件夹中创建项目。*
2. **How would you like to start your new project?（你想如何开始新项目？）**
   - 使用键盘上下方向键选择：`Empty`（空项目 / minimal 模板）。这样可以避免预置模板中的复杂代码干扰初学者的理解。
3. **Do you plan to write TypeScript?（你打算写 TypeScript 吗？）**
   - 初学者推荐选择 `No` 或 `Yes, relaxed`（宽松模式）。
4. **Install dependencies?（是否安装依赖项？）**
   - 输入 `y`（回车），npm 会自动为你下载 Astro 所需的基础代码包到 `node_modules` 文件夹中。
5. **Initialize a new git repository?（是否初始化 Git 仓库？）**
   - 建议输入 `y`，方便后续做版本保存。

---

## 3. 启动本地开发服务器并实时预览

建项完成后，依次执行以下命令进入项目并启动开发服务：

```bash
cd ./tutorial
npm run dev
```

终端窗口会显示出绿色的运行信息：

```text
 astro  v5.x.x ready in 250 ms

 Local    http://localhost:4321/
 Network  use --host to expose
```

此时打开浏览器，在地址栏输入 `http://localhost:4321` 并回车，你就能看到 Astro 的第一个空白欢迎页面了！

> **特别提示**：当开发服务器在终端中运行时，这个终端会持续监听文件的变化。如果你修改了代码并保存，浏览器里的页面会自动瞬间刷新（这叫热更新）。如果你需要停止服务，在终端中按下 `Ctrl + C` 即可退出。再次启动依然是运行 `npm run dev`。

---

## 4. 深入剖析：Astro 项目的工程目录分工

打开 VS Code，通过「文件 -> 打开文件夹」打开刚刚创建的 `tutorial` 目录。你会看到如下的标准工程结构：

```text
tutorial/
├── public/                  <-- 原样复制的静态资源目录
│   └── favicon.svg          <-- 网站小图标
├── src/                     <-- 我们的核心源代码目录
│   └── pages/               <-- 【极其重要】唯一特殊保留路由目录
│       └── index.astro      <-- 首页组件
├── astro.config.mjs         <-- Astro 主配置文件
├── package.json             <-- 项目清单与脚本定义
└── tsconfig.json            <-- TypeScript 编译配置
```

让我们用白话彻底搞懂两个最核心的文件和两类目录：

### (1) `package.json` 中的四大核心脚本
打开 `package.json`，在 `"scripts"` 区域可以看到四个预设指令：
- `"dev": "astro dev"`：启动本地开发测试服务器，开启热更新实时预览。
- `"build": "astro build"`：编译打包整个项目，把所有组件生成为标准的静态 HTML/CSS，输出到 `dist/` 文件夹。
- `"preview": "astro preview"`：在本地启动一个静态服务器，预览刚刚 `build` 打包出来的真实产物。
- `"astro": "astro"`：执行 Astro 官方 CLI 的高级辅助命令（如添加集成插件）。

### (2) `src/pages/`：唯一的保留路由目录
这是 Astro 中**唯一具有特殊约定含义**的目录！
- 在 `src/pages/` 下创建的每一个 `.astro` 或 `.md` 文件，Astro 都会自动将其映射成一个可访问的网页 URL。
- 例如：`src/pages/index.astro` 自动对应网站首页 `http://localhost:4321/`。
- 如果你在 `src/pages/` 外随便建一个文件，它是不会自动变成网页的。

### (3) `src/` 下的其他目录（如 `components/`, `layouts/`, `styles/`）
随着项目变大，你可以在 `src/` 下自由创建文件夹：
- `src/components/`：存放可复用的 UI 积木小块（如导航栏、页脚）。
- `src/layouts/`：存放通用的页面外壳布局。
- `src/styles/`：存放全局 CSS 样式表。
- *这些目录里的文件被其他页面导入使用，绝对不会被当作独立网页暴露给浏览器。*

### (4) `public/`：原样复制的静态资源目录
- 放在 `public/` 下的文件，Astro **完全不会对其进行编译、打包或修改**，构建时直接原封不动复制到最终站点的根目录。
- 例如：`public/favicon.svg` 在浏览器中的访问地址是 `/favicon.svg`；`public/robots.txt` 访问地址是 `/robots.txt`。

---

## 5. 本关小结

1. **环境与建项**：Node.js 偶数版本支持，通过 `npm create astro@latest` 一键搭建项目。
2. **核心命令**：`npm run dev` 负责本地开发，`npm run build` 负责生产打包。
3. **目录心智**：`src/pages/` 里的文件变成网页；`src/` 其他文件夹放复用代码；`public/` 放原样输出的静态文件。

在下一关中，我们将打开 `src/pages/index.astro` 并添加更多页面，学习 Astro 的文件路由系统与 Markdown 页面支持！
