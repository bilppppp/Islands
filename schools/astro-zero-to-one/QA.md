# Astro Zero-to-One School：课程设计与生成架构问答录 (Q&A)

本文件整理记录了关于 `astro-zero-to-one` 示例学校在材料选取、大纲设计、关卡编排与生成执行上的核心决策依据。

---

## 目录
- [Q1: 构建与生成时用了 Pi 么？用了 retry 么？](#q1-构建与生成时用了-pi-么用了-retry-么)
- [Q2: 抓取的 471 个官方中文文档页面，哪些作为源进入了课程？入选理由是什么？](#q2-抓取的-471-个官方中文文档页面哪些作为源进入了课程入选理由是什么)
- [Q3: 哪些内容被主动舍弃？为什么没有把整站 471 个页面都塞进课程？](#q3-哪些内容被主动舍弃为什么没有把整站-471-个页面都塞进课程)
- [Q4: 课程顺序为什么与 Astro 官方中文文档高度一致？](#q4-课程顺序为什么与-astro-官方中文文档高度一致)
- [Q5: 为什么最终决定设立 12 个关卡？相比旧版 10 关做了哪些修正？](#q5-为什么最终决定设立-12-个关卡相比旧版-10-关做了哪些修正)

---

## Q1: 构建与生成时用了 Pi 么？用了 retry 么？

### 答：完全没有调用 Pi，也完全没有使用 retry 命令。

本次示例学校的重构与重做过程：
1. **删除旧目录**：在开始之前，仅删除了旧版的 `schools/astro-zero-to-one` 目录，不触碰其他 School，不改动 `school-kit`、生成协议或共享样式，不从 `island-preview` 复制文件。
2. **准备材料与骨架**：运行命令：
   ```sh
   npm run school -- create "..." --source https://docs.astro.build/zh-cn/getting-started/ ... --prepare-only
   ```
   该命令通过 `--prepare-only` 显式跳过 Pi，由脚手架下载抓取官方文档站（471 页），安装最新的岛屿页面（island chrome），并生成 `GENERATION.md`。
3. **模型自主生成**：由当前 Coding Agent 自身模型直接阅读抓取到的材料与官方教程文本，严格遵循 `generation/protocol.md` 生成协议，独立编写了 `school.config.ts`（更新 `publicName` 和 `shortName`）、`COURSE.md`、本份 `QA.md`、12 篇完整关卡正文（`src/content/lessons/*.md`）以及 `public/activities/` 中的辅助脚本与组件代码片段。
4. **编译与检验**：运行：
   ```sh
   npm run school -- finish astro-zero-to-one
   ```
   `finish` 命令在本地执行 `validateGeneration` 静态校验并直接调用 `astro build` 完成打包，全程没有调用任何 Pi 进程，也未执行 `retry`。

---

## Q2: 抓取的 471 个官方中文文档页面，哪些作为源进入了课程？入选理由是什么？

### 答：在抓取的 471 个官方中文文档页面中，精选了 43 个核心源文档参与课程生成，覆盖了官方核心概念、基础指南与教程全线。

入选的核心文档清单及教学理由如下：

| 官方文档相对路径 | 对应教学关卡 | 入选理由（面向零基础初学者视角） |
| :--- | :--- | :--- |
| `getting-started/index.md` | 大纲与导读 | **入口指引**：官方中文文档的主导航体系，明确从入门、教程到基础概念的学习路径。 |
| `concepts/why-astro/index.md` | 第 1 关 | **第一心智**：初学者没有框架概念，必须先用白话讲清楚为什么不用纯 HTML、为什么 SPA 过于沉重，确立“内容驱动、服务器优先、默认 0 JS”的核心心智模型。 |
| `install-and-setup/index.md` | 第 2 关 | **工程起点**：明确 Node.js 偶数版本支持要求，学习使用 `npm create astro@latest` 官方命令行向导建项。 |
| `basics/project-structure/index.md` | 第 2 关 | **目录分工**：初学者最易放错文件，必须理清唯一路由目录 `src/pages/`、自由组件目录 `src/components/` 与原样复制目录 `public/` 的物理边界。 |
| `basics/astro-pages/index.md` | 第 3 关 | **页面映射**：理解基于文件系统的路由机制，搞懂为什么文件放在哪网址就在哪。 |
| `tutorial/1-setup/*` (共 5 页) | 第 2、3、12 关 | **官方教程第一单元**：涵盖环境准备、第一次编辑 `index.astro`、Git 版本控制与 Netlify 部署。 |
| `tutorial/2-pages/*` (共 5 页) | 第 3、4、5 关 | **官方教程第二单元**：从创建 `about.astro`、`blog.astro`，到 Markdown 文章 `post-1/2/3.md`，再到变量插值、条件渲染、单页 `<style>` 局部作用域和全局 `global.css`。 |
| `basics/astro-components/index.md` | 第 4、6 关 | **组件基石**：拆解 `.astro` 单文件的双代码块结构，理解代码栅栏（`---`）在服务端执行、绝不泄漏到浏览器的特性，掌握 `Astro.props` 属性接收。 |
| `reference/astro-syntax/index.md` | 第 4 关 | **模板语法**：掌握类 JSX 表达式插值、原生 `class` 属性（无需写 `className`）、`.map()` 列表渲染。 |
| `guides/styling/index.md` | 第 5 关 | **视觉隔离**：消除传统 CSS 全局命名冲突痛点，掌握 Astro 默认 Scoped 作用域编译（`data-astro-cid-*`）与 `define:vars` 注入动态样式。 |
| `guides/images/index.md` | 第 5 关 | **资源优化**：理解图片存放在 `src/assets/` 与使用 `<Image />` 组件防 CLS 布局偏移及自动转 WebP 的必要性。 |
| `tutorial/3-components/*` (共 4 页) | 第 6、8 关 | **官方教程第三单元**：抽离 `Navigation.astro` 导航组件、`Footer.astro` 与 `Social.astro` 传参，制作汉堡菜单与原生 `<script>` 客户端轻量交互。 |
| `basics/layouts/index.md` | 第 7 关 | **外壳复用**：解决每个页面重复写 `<!doctype html>` 的痛点，掌握布局（Layout）与 `<slot />` 默认及具名插槽体系。 |
| `tutorial/4-layouts/*` (共 3 页) | 第 7 关 | **官方教程第四单元**：封装 `BaseLayout.astro`，为博客文章定制 `MarkdownPostLayout.astro`，并实现两全其美的高阶布局嵌套。 |
| `guides/routing/index.md` | 第 3、9 关 | **路由系统**：深入掌握静态路由映射规则、动态参数 `[tag].astro` 命名以及 `getStaticPaths()` 批量构建引擎。 |
| `tutorial/5-astro-api/*` (共 4 页) | 第 9 关 | **官方教程第五单元**：使用 `import.meta.glob` 自动读取文章存档，利用 `[tag].astro` 批量生成动态分类标签页与标签云索引页。 |
| `concepts/islands/index.md` | 第 10 关 | **架构灵魂**：解答“在默认 0 JS 下如何做复杂交互”的疑问，理解静态 HTML 海洋与局部动态 UI 小岛。 |
| `guides/framework-components/index.md` | 第 10 关 | **生态集成**：理解为什么可以在同一个项目里集成 React/Preact/Vue，以及为什么默认依然没有客户端 JS。 |
| `reference/directives-reference/index.md` | 第 10 关 | **水合控制**：掌握客户端水合指令（`client:load` / `client:idle` / `client:visible` / `client:media`）的加载时机与性能权衡。 |
| `tutorial/6-islands/*` (共 4 页) | 第 8、10、11 关 | **官方教程第六单元**：Preact 问候语交互小岛、无岛屿的原生深色模式切换、以及向类型安全内容集合的重构跃迁。 |
| `guides/content-collections/index.md` | 第 11 关 | **数据中枢**：通过 `src/content.config.ts`、Zod Schema 校验与 `getCollection()`、`render()` 函数，彻底杜绝文章属性拼写错误。 |
| `develop-and-build/index.md` | 第 12 关 | **生命周期**：理清 `dev`（实时监听）、`build`（打包输出到 `dist/`）与 `preview`（静态预览）的底层差异。 |
| `guides/deploy/index.md` | 第 12 关 | **上线交付**：完成全链路闭环，掌握统一的生产发布契约（构建命令 `npm run build` + 输出目录 `dist`），部署到全球静态平台。 |

所有入选的派生文档均已保存在 `public/sources/material-1/` 下，完全支持教师 Agent 本地 HTTP 随时查阅。

---

## Q3: 哪些内容被主动舍弃？为什么没有把整站 471 个页面都塞进课程？

### 答：舍弃了约 420 个非初学者主干的边缘参考、商业 CMS 插件和底层规范文档，避免初学者遭遇“认知过载”。

具体舍弃的类别与理由：
1. **舍弃 70+ 个底层错误代码参考（`reference/errors/*`）**：
   - 例如 `actions-cant-be-loaded`、`csssyntax-error`、`get-entry-deprecation-error` 等。
   - *舍弃理由*：这是日常遇到特殊 bug 时的排错字典，不属于零基础框架学习的主干知识。入门阶段强灌错误代码会导致严重挫败感。
2. **舍弃 40+ 个外部第三方 CMS 商业集成（`guides/cms/*`）**：
   - 例如 Strapi、Sanity、Storyblok、WordPress、Contentful 等。
   - *舍弃理由*：属于外部第三方专有平台的商业服务对接，并非 Astro 框架自身的核心技术与通用语法。
3. **舍弃 35+ 个高级 SSR / 边缘计算适配器（`guides/on-demand-rendering` 等）**：
   - 例如 Node Cluster 守护进程、Netlify Edge Functions、Cloudflare Workers SSR 运行时。
   - *舍弃理由*：Astro 首先是内容驱动的静态多页框架。零基础初学者必须先建立扎实通透的 SSG（静态生成）与群岛水合心智；一开始引入复杂的 Node 后端运行时会导致认知混乱。
4. **舍弃微观实验性特性与容器底层规范（`reference/experimental-flags/*`）**：
   - 例如实验性增量构建、底层解析器 API 等。
   - *舍弃理由*：不稳定且微观，属于框架核心开发者的关注点，不适合通用学习路径。
5. **舍弃历史升级指南（`upgrade-to/*`）**：
   - 例如 v3、v4 升级到新版的兼容性补丁文档。
   - *舍弃理由*：针对旧项目维护者的补丁，对全新从零学起的新人毫无价值。
6. **舍弃进阶大型专题指南（国际化 i18n、身份验证 Auth、测试等）**：
   - *舍弃理由*：属于特定商业系统的高阶选修课，初学阶段应高度聚焦于将博客与文档站完整做出来的核心闭环。

---

## Q4: 课程顺序为什么与 Astro 官方中文文档高度一致？

### 答：官方文档的教学组织经过了数十万开发者的检验，高度符合认知心理学中的“从直觉到抽象、从简单到进阶”规律。

本课程严格遵循官方 Getting Started -> 教程单元 -> 核心概念的脉络，其逻辑链条如下：

```text
1. 建立心智 (Why Astro)
   ▼ 为什么需要 Astro？解决纯 HTML 重复劳动与 SPA 臃肿的痛点。
2. 安装环境与工程结构 (Setup & Project Structure)
   ▼ 装好 Node.js，运行向导，认识 src/pages 与 public 两个关键目录。
3. 页面与路由 (Pages & Routing)
   ▼ 写 index.astro，写 Markdown 文章，体验文件变成网址，用 <a> 链接起来。
4. 组件语法 (Components & Syntax)
   ▼ 发现页面不能只会展示静态字，打开 .astro 双代码块，学变量、三元运算与 .map 列表。
5. 样式与图片 (Styles & Assets)
   ▼ 页面需要美化，体验默认 Scoped CSS 绝不互相污染，学习 define:vars 与图片优化。
6. 可复用组件 (Reusable Components & Props)
   ▼ 导航和页脚每个页面都手写一遍太累了，拆成 Navigation 与 Social，用 Astro.props 传参。
7. 布局与插槽 (Layouts & Slots)
   ▼ 发现 <html><head> 外壳还在重复，封装 BaseLayout 与 MarkdownPostLayout，用 <slot /> 承接正文。
8. 客户端原生交互 (Client Scripts)
   ▼ 移动端菜单需要点击展开，不需要装框架，直接写原生 <script> 标签与深色模式切换。
9. 动态路由与批量生成 (Dynamic Routes & Astro API)
   ▼ 文章多了不能手动建 100 个文件，用 [tag].astro 与 getStaticPaths 批量自动派发页面。
10. 群岛架构与水合指令 (Islands & Client Directives)
   ▼ 确实需要复杂交互时，接入 Preact 交互组件，通过 client:load 等指令按需水合。
11. 类型安全内容集合 (Content Collections)
   ▼ 文章多容易拼错 frontmatter 字段，重构到 src/blog/，用 Zod 模式在构建期铁血质检。
12. 工程闭环与生产部署 (Build & Deploy)
   ▼ 搞清楚 dev、build、preview 边界，掌握部署两项契约，将 dist 静态目录发布上线！
```

这种顺序保证了**每一个新概念的出现，都是为了解决前一步留下来的真实痛点**，完全杜绝了脱离场景空谈概念的弊病。

---

## Q5: 为什么最终决定设立 12 个关卡？相比旧版 10 关做了哪些修正？

### 答：设立 12 个关卡是遵循官方完整学习路径的自然推导结果，坚决不为凑特定数字而删减合并关键知识点。

在旧版课程中，为了凑成 10 关，存在两处严重的“知识压缩与混淆”：
1. **轻量交互与组件复用被混淆**：
   旧版课程没有把官方教程重点讲授的“原生客户端 `<script>` 交互”作为独立单元，导致零基础初学者产生误解，以为在 Astro 中只要做交互就必须装 React/Preact，完全忽视了原生 `<script>` 结合 CSS 实现汉堡菜单与深色模式切换的极简魅力。
2. **内容集合演进与动态路由被过早捆绑**：
   旧版课程把 `getStaticPaths` 与 `content.config.ts` 强行挤在一起。但官方教程是先通过 `import.meta.glob` 讲清楚动态路由和标签页的原理，然后在第六单元作为高阶内容重构到内容集合。如果混在一起，初学者既要理解动态参数，又要理解 Zod 模式校验，认知负荷瞬间超载。

### 本次 12 关的修正与深化点：
- **新增第 8 关：客户端原生交互（`client-scripts-and-interaction`）**：
  单独用一整关完整演示移动端汉堡折叠菜单（`Hamburger.astro`）与昼夜模式切换器（`ThemeIcon.astro`），彻底讲透“组件脚本（服务端执行）”与“客户端脚本（浏览器执行）”的本质差异，传达 Astro“无需框架也能走很远”的朴素理念。
- **拆分并深化第 9 关与第 11 关**：
  - 第 9 关专注解决**动态路由与数据聚合**：纯粹用 `[tag].astro`、`getStaticPaths` 和 `import.meta.glob` 跑通标签页与索引页；
  - 第 11 关专注攻克**现代内容集合与模式安全**：专门讲述从松散文件到 `src/content.config.ts` 的演进，体验 Zod 模式防御与 `render(post)` 现代 API。
- **每关结构详尽可执行**：
  每关步骤全量展开，新术语全部以“它是什么、为什么需要、在哪个文件看到”三要素白话解释，代码示例直接采用官方构建博客教程的上下文，真正让零基础小白能一步一步照着做完。
