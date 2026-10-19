# astro-zero-to-one：沿官方中文文档入门与基础的零基础学习路线

本路线专为“完全没有接触过现代前端框架的初学者”量身打造。学习材料严格源自 Astro 官方中文文档站 `https://docs.astro.build/zh-cn/getting-started/` 抓取的权威材料。课程大纲不另起一套结构，完全沿着官方的入门向导、官方构建博客教程（Tutorial）以及核心概念与基础指南（Concepts & Basics）顺流而下，所有术语随文解释，代码示例与官方博客教程完全对齐。

初始教学模式为 `simple`。课程深度是系统掌握官方入门和基础，不另起一套大纲；切换教学模式（如 `immersive`）仅改变提问和互动节奏，不删减知识点。

---

## 目标、基础与教学设计考量

- **学习者基础**：读者是尚未接触过 React、Vue、Next.js 等现代前端框架的零基础初学者。我们不预设任何前端工程化黑话（如虚拟 DOM、Hooks、单页应用客户端水合、构建工具 HMR 等）。每个新概念在首次出现时，均在正文中以大白话回答三件事：
  1. 它是什么（本质定义与直觉比喻）；
  2. 为什么需要它（解决了纯 HTML 或手工开发的什么痛点）；
  3. 在项目里的哪个文件能看到（具体代码位置）。
- **课程顺序与示例忠实性**：
  - 课程体系完全契合官方中文文档的教学脉络：从核心理念（内容驱动、服务端优先、默认 0 JS）出发，经由环境安装、工程目录约定、页面与文件路由、组件语法、局部样式、可复用 UI 零件、布局与插槽体系、原生客户端脚本、动态路由与聚合、群岛水合指令，最后以类型安全的内容集合和生产打包部署收官。
  - 所有代码示例直接采用官方构建博客教程中的实际场景与文件（如 `about.astro`、`blog.astro`、`posts/post-1.md`、`BaseLayout.astro`、`MarkdownPostLayout.astro`、`Greeting.jsx`、`ThemeIcon.astro`、`src/content.config.ts`），不生搬硬套非官方例子。
- **关卡数量决定依据**：
  - 坚决不为了凑成特定的关卡数（如原先的 10 关）而生硬合并知识点。
  - 官方教程在第三单元和第六单元中，特别将“无需前端框架的原生 `<script>` 交互”作为关键知识点；在第六单元将“内容集合”作为重构核心。本课程将它们各自作为独立完整的关卡，拓展至 12 关，保证步骤详尽完备、节奏自然递进。

---

## 十二关核心路线图

| 关卡 / slug | 对应官方教学阶段与核心教学重点 | 依赖关系与可观察产出 |
| :--- | :--- | :--- |
| **1 / why-astro-and-server-first** | 官方核心概念（Why Astro）：建立“内容驱动、服务端优先、默认零 JS”的心智模型，理解与 SPA 的本质区别 | 无课程内前置；能对比纯 HTML、SPA 与 Astro，对 3 种典型场景完成技术选型辨析 |
| **2 / project-setup-and-structure** | 官方入门向导（Setup）：Node.js 偶数版本要求、`npm create astro@latest` 向导、`package.json` 四大核心脚本与目录分工 | 依赖关卡 1；能准确区分 `src/pages/`、`src/components/` 与 `public/` 的目录职责并正确归类文件 |
| **3 / astro-pages-and-markdown** | 官方页面与教程第二单元：基于文件的路由规则、Markdown 自动转换为 HTML、根绝对路径导航与 404 页面 | 依赖关卡 2；能手动推导 4 个文件路径对应的浏览器 URL，并指出相对路径死链隐患 |
| **4 / astro-components-and-syntax** | 官方组件与语法参考：.astro 单文件双代码块、代码栅栏（`---`）服务端执行安全、变量插值、三元/逻辑与条件渲染及 `.map()` 列表渲染 | 依赖关卡 2、3；能推导含有 frontmatter 计算和列表映射的组件最终生成的纯 HTML 结构 |
| **5 / scoped-styles-and-assets** | 官方样式指南与资源处理：默认 Scoped 作用域 CSS（`data-astro-cid-*`）、`define:vars` 注入 CSS 变量、`global.css` 与 `<Image />` 防 CLS | 依赖关卡 3、4；能分析样式隔离边界，为图片选择正确的目录与组件 |
| **6 / reusable-components-and-props** | 官方教程第三单元：抽取可复用 UI 零件（`Navigation.astro`、`Footer.astro`）、`Astro.props` 父子传参（`Social.astro`）与组件组合 | 依赖关卡 4、5；能设计通用的组件 Props 接口，并推导组件嵌套调用后的 DOM 结构 |
| **7 / layouts-and-slots** | 官方布局基础与教程第四单元：通用外壳封装（`BaseLayout.astro`）、`<slot />` 默认与具名插槽、Markdown 博客专用布局（`MarkdownPostLayout.astro`）与两全其美嵌套 | 依赖关卡 4、6；能推导带有 frontmatter 的 Markdown 文章在嵌套布局下装配完成的完整 DOM |
| **8 / client-scripts-and-interaction** | 官方教程轻量交互与原生脚本：无需框架的客户端 `<script>`、移动端响应式汉堡菜单（`Hamburger.astro`）与 `ThemeIcon.astro` 昼夜模式切换 | 依赖关卡 4、6；能准确辨析组件脚本与客户端脚本的执行环境与生命周期 |
| **9 / dynamic-routes-and-astro-api** | 官方路由指南与教程第五单元：`import.meta.glob` 自动读取文章列表、`[tag].astro` 动态参数语法、`getStaticPaths()` 批量派发工单与标签云索引页 | 依赖关卡 3、7；能根据多篇文章的 tags 数组推导出 `getStaticPaths()` 自动生成的静态路由清单 |
| **10 / islands-and-client-directives** | 官方核心架构（Islands）与教程第六单元：群岛架构哲学、UI 框架（Preact）集成、默认 0 JS 原理与四大客户端水合指令（`client:load/idle/visible/media`） | 依赖关卡 1、4；能针对不同交互紧急度的组件匹配最佳水合指令，解释不加指令点击无反应的原因 |
| **11 / content-collections** | 官方内容集合指南与教程扩展：`src/content.config.ts`、Zod Schema 严格类型模式校验、`getCollection()` 查询与 `render()` 解析渲染 | 依赖关卡 7、9；能根据模式定义诊断 frontmatter 错误，写出类型安全的内容消费管道 |
| **12 / develop-build-and-deploy** | 官方工程闭环与部署指南：深刻辨析 `dev` 本地热更新、`build` 编译打包至 `dist/` 与 `preview` 静态预览的边界，跨平台发布契约 | 依赖前 11 关；能排查 preview 模式修改源码不生效的问题，熟练运用部署两项契约上线网站 |

---

## 视觉查验与媒介记录（Visual Reading Ledger）

- **抓取媒介特性**：本次抓取由 `siteone-crawler 2.5.1` 执行，源文档中的外链图片和 SVG 图表在抓取导出的派生 Markdown 中均表现为文本引用或占位形式（如 `data:image/gif;base64,...`），无本地独立的架构图图片文件。
- **视觉查验说明**：在课程编写前，查验了 `materials/material-1/entry.html` 原始入口响应体与各个派生 Markdown 文档，确认了文档导航体系与代码块。为了让学习者在无图形界面的终端与对话环境中也能获得直观的物理直觉，本课程在关键关卡（如关卡 1 的 SPA vs Astro 流水线、关卡 8 的脚本执行环境对比、关卡 10 的群岛架构海洋图景、关卡 11 的内容集合数据管道、关卡 12 的全景知识大厦）均手工绘制了清晰、规范的纯文本 ASCII 结构图与思维导图。

---

## 来源账本（Source Ledger）

本课程所引用的材料于 2026-10-19 抓取自 Astro 官方中文文档入口 `https://docs.astro.build/zh-cn/getting-started/`，共抓取 471 个文档页面。
- `entry.html`：入口页原始响应体。
- `provenance.json`：完整的来源追溯依据与源 URL 映射表。
- `pages/`：爬虫导出的派生阅读 Markdown 文本。
- 本课程实际精选阅读并复制至站点本地目录 `public/sources/material-1/` 的核心派生文档清单如下：

| 教学主张 / 核心机制 | 官方文档原始位置 | 对应本地副本文件路径 |
| :--- | :--- | :--- |
| 入门入口结构、官方导览、教程导航 | `getting-started/` | `pages/zh-cn/getting-started/index.md` |
| 内容驱动、服务器优先、默认 0 JS、MPA 心智模型 | `concepts/why-astro/` | `pages/zh-cn/concepts/why-astro/index.md` |
| 群岛架构定义、静态 HTML 海洋与交互孤岛 | `concepts/islands/` | `pages/zh-cn/concepts/islands/index.md` |
| Node.js 偶数版本要求、CLI 向导安装命令 | `install-and-setup/` | `pages/zh-cn/install-and-setup/index.md` |
| `src/pages/` 唯一保留目录、`src/` 自由目录与 `public/` 原样复制规范 | `basics/project-structure/` | `pages/zh-cn/basics/project-structure/index.md` |
| 基于文件系统的路由机制、Markdown 自动转换、站内绝对路径规范 | `basics/astro-pages/`, `guides/routing/` | `pages/zh-cn/basics/astro-pages/index.md`, `pages/zh-cn/guides/routing/index.md` |
| .astro 单文件结构、代码围栏（`---`）服务端执行、Astro.props 参数接口 | `basics/astro-components/` | `pages/zh-cn/basics/astro-components/index.md` |
| 模板表达式、原生 `class` 支持、条件渲染与 `.map()` 列表映射 | `reference/astro-syntax/` | `pages/zh-cn/reference/astro-syntax/index.md` |
| 作用域 CSS（`data-astro-cid-*`）、`define:vars` CSS 变量、全局样式导入 | `guides/styling/` | `pages/zh-cn/guides/styling/index.md` |
| 静态资源双轨制、`<Image />` 组件防 CLS 布局偏移与格式转换 | `guides/images/` | `pages/zh-cn/guides/images/index.md` |
| 布局（Layout）组件封装、`<slot />` 默认与具名插槽体系 | `basics/layouts/` | `pages/zh-cn/basics/layouts/index.md` |
| UI 框架集成、默认 0 JS 表现、客户端水合指令（`client:*`）加载时机与权衡 | `guides/framework-components/`, `reference/directives-reference/` | `pages/zh-cn/guides/framework-components/index.md`, `pages/zh-cn/reference/directives-reference/index.md` |
| 内容集合（Content Collections）、`src/content.config.ts`、Zod 模式校验、`getCollection()` 与 `render()` | `guides/content-collections/` | `pages/zh-cn/guides/content-collections/index.md` |
| `astro dev` 开发监听、`astro build` 打包输出到 `dist/`、`astro preview` 静态预览机制与通用静态部署 | `develop-and-build/`, `guides/deploy/` | `pages/zh-cn/develop-and-build/index.md`, `pages/zh-cn/guides/deploy/index.md` |
| 官方构建博客教程完整单元（Unit 0 至 Unit 6 循序渐进示例与操作步骤） | `tutorial/0-introduction/` 至 `tutorial/6-islands/` 共 26 个教学子页面 | `pages/zh-cn/tutorial/*/*/index.md` |

所有上述派生文档均已保存在 `public/sources/material-1/` 下，教师 Agent 可通过 `{origin}/sources/material-1/...` 直接以 HTTP 方式随时查阅原始材料。

---

## 主动舍弃的内容与排除说明

在爬取的 471 个页面中，我们主动舍弃了约 420 个非初学者核心路径的边缘页面，并在设计时遵循了严格的教学法取舍：

1. **排除 70+ 个底层错误代码字典（`reference/errors/*`）**：
   - 包括各类编译内部错误码（如 `actions-cant-be-loaded`、`csssyntax-error` 等）。这些是开发者遇到特定问题时的查阅字典，初学者若一开始被灌输错误代码，会严重增加认知负荷。
2. **排除 40+ 个外部第三方商业 CMS 插件（`guides/cms/*`）**：
   - 包括 Strapi、Sanity、Storyblok、WordPress 等第三方的配置。它们是外部商业生态，并非 Astro 框架自身的核心技术与语法。
3. **排除 35+ 个高级 SSR / 边缘运行时适配器（`guides/on-demand-rendering` 等）**：
   - 包括 Node Cluster 守护进程、Netlify Edge、Cloudflare Workers 等运行时。初学者必须先建立极其扎实的 SSG（静态生成）与群岛水合心智模型，过早引入 Node 容器会导致概念混淆。
4. **排除微观实验性功能与容器规范（`reference/experimental-flags/*`）**：
   - 包含实验性增量构建等不稳定特性，不属于通用标准技能。
5. **排除历史版本升级补丁（`upgrade-to/*`）**：
   - 针对 v3/v4 旧项目维护者的迁移文档，对全新初学者无意义。
6. **排除进阶国际化（i18n）与身份验证（Auth）等专题指南**：
   - 属于大型企业级项目选修课，初学入门应聚焦于建项、页面、组件、布局、样式、动态路由与岛屿核心主干。

---

## 验证范围声明

1. **结构与代码校验**：已通过 `validateGeneration` 静态结构合法性、数学公式规范性与 frontmatter 约束检查。
2. **静态构建验证**：在学校目录下运行 `npm run build`，静态路由全部成功编译生成至 `dist/` 目录。
3. **服务与接口验证**：开发服务器在本地端口启动，网站首页及 `/api/lessons` 接口均通过真实 HTTP 请求验证可用。
4. **教学闭环说明**：本报告记录了生成与构建验证。真实教学互动、身份领取与进度同步需由实际连接的教师 Agent（如具备 HTTP 与工具调用能力的 Coding Agent 或 Pi）在交互中执行。
