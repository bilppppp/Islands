> 方案说明：记录于 2026-10-20，为首批 10 门入门示例课的生成任务提示词模板。每门课生成时的具体格式、来源引用（`{{cite …}}`）与交互块（`predict`、`run`、`preview`、`demo`）规则均以 `create --prepare-only` 产出的 `GENERATION.md`（由 [`../../generation/protocol.md`](../../generation/protocol.md) 生成）为准。

# 前 10 门小白课：交给 agy 的生成提示词

一次只做一门。做完 `finish` 并确认构建通过后，再开始下一门。不要十门并行抓取。

仓库路径末尾有一个空格，命令里必须加引号：

```sh
cd "/Users/gravity/Desktop/AI/Agent-native Learning School "
```

每门都走直接 Agent 路径：`--prepare-only` 准备材料和骨架，读 `schools/<name>/GENERATION.md` 写课程，再 `npm run school -- finish <name>`。不要省略 `--prepare-only` 去走 Pi。不要 `retry`。不要部署，不要 push，不要 commit。不要改 `scripts/`、`generation/`、`school-kit/`、其他 School，也不要跑 `update`。

共同约束：

- 读者是零基础小白。`--depth 入门`，`--background "零基础，没有用过这个工具"`，`--style "一步一步的具体例子"`，`--mode simple`，`--language zh`。
- 课文用中文。官方术语、命令、类型名、按钮名保留原文，并在第一次出现时用中文说清它是什么。
- 不假设学员已经会这门课的前置工具。缺的前置就在当关用一两段讲清楚，不另开一门课。
- 每关一个能在对话里完成的小活动。需要安装软件的步骤要写进课文，但完成条件不能只有「已经在自己电脑装好并跑通」。学员也可以靠解释官方例子、预测下一步、指出命令在做什么来过关。
- 每关 frontmatter 必须有 `sources`，路径相对 `public/sources`。只把真正读过、真正写进关卡的派生页抄进 `public/sources`。
- `school.config.ts` 只改 `publicName` 和 `shortName`。中文课的 `publicName` 以「AI 互动课程」结尾。
- 只写 `COURSE.md`、`src/content/lessons/*.md`、上面两个名称字段，以及必要的 `public/sources/` 和 `public/activities/`。
- 抓取若退回单页，在 `COURSE.md` 写明，不要把入口页说成整套文档。
- `finish` 通过只说明构建通过。不要宣称已经有教师对话或进度同步。

下面每段都是一门课的完整提示词，整段交给 agy。

---

## 1. Python

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://docs.python.org/zh-cn/3/tutorial/index.html
- 范围前缀：`/zh-cn/3/tutorial/`
- 这是 Python 官方中文教程。课的主线就是这篇教程里的入门部分：解释器、数字和字符串、列表、流程控制、函数、模块入门。类、标准库深潜、虚拟环境和打包不要做成主线，写进 `COURSE.md` 的排除项。

先在仓库根目录运行：

```sh
npm run school -- create \
  --source "https://docs.python.org/zh-cn/3/tutorial/index.html" \
  --crawl-prefix /zh-cn/3/tutorial/ \
  --goal "零基础读者能读懂并改写 Python 官方教程里的小例子：用变量、列表、分支、循环和函数完成一个小小的文本处理。" \
  --name python-tutorial \
  --depth 入门 \
  --background "零基础，没有写过程序" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4341 \
  --prepare-only
```

然后只按 `schools/python-tutorial/GENERATION.md` 写课程。`publicName` 用「Python 教程 AI 互动课程」，`shortName` 用「Python 教程」。写完运行 `npm run school -- finish python-tutorial`。失败就修课程文件后再 `finish`，不要 `retry`。

## 2. React

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://zh-hans.react.dev/learn
- 范围前缀：`/learn`
- 这是 React 官方中文「快速入门 / Learn」。只教描述界面、组件、props、state 和响应事件。Hooks 进阶、Escape Hatches 和 Server Components 写进排除项。

先运行：

```sh
npm run school -- create \
  --source "https://zh-hans.react.dev/learn" \
  --crawl-prefix /learn \
  --goal "零基础读者能看懂一个 React 组件在做什么，并能改 props 和 state，让界面按自己的点击发生变化。" \
  --name react-learn \
  --depth 入门 \
  --background "会打开网页，没有写过 React；HTML 和 JavaScript 只在用到时补最少的那一点" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4342 \
  --prepare-only
```

然后只按 `schools/react-learn/GENERATION.md` 写课程。`publicName` 用「React 入门 AI 互动课程」，`shortName` 用「React 入门」。写完运行 `npm run school -- finish react-learn`。失败就修课程文件后再 `finish`，不要 `retry`。

## 3. TypeScript

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://www.typescriptlang.org/docs/handbook/intro.html
- 范围前缀：`/docs/handbook/`
- 官方手册没有可用的中文入口（`/zh/docs/handbook/intro.html` 返回 404）。课文用中文解释，代码和类型名保持英文。只教小白会碰到的部分：TypeScript 是什么、给变量和函数加类型、对象和数组、联合类型、在已有 JavaScript 上加类型。泛型进阶、装饰器、模块解析和编译配置细节写进排除项。

先运行：

```sh
npm run school -- create \
  --source "https://www.typescriptlang.org/docs/handbook/intro.html" \
  --crawl-prefix /docs/handbook/ \
  --goal "写过很少 JavaScript 的读者能为变量、函数参数和返回值加上类型，并看懂编辑器为什么报错。" \
  --name typescript-handbook \
  --depth 入门 \
  --background "几乎没写过 JavaScript，没有用过 TypeScript" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4343 \
  --prepare-only
```

然后只按 `schools/typescript-handbook/GENERATION.md` 写课程。`publicName` 用「TypeScript 手册 AI 互动课程」，`shortName` 用「TypeScript 手册」。写完运行 `npm run school -- finish typescript-handbook`。失败就修课程文件后再 `finish`，不要 `retry`。

## 4. Docker

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://docs.docker.com/get-started/
- 范围前缀：`/get-started/`
- 官方 Get Started 是英文。课文用中文。只教镜像、容器、Dockerfile 和用一条命令跑起官方示例。Compose 生产部署、编排和镜像仓库管理写进排除项。

先运行：

```sh
npm run school -- create \
  --source "https://docs.docker.com/get-started/" \
  --crawl-prefix /get-started/ \
  --goal "零基础读者能说明镜像和容器的差别，并能读懂官方入门示例里的 Dockerfile，知道一条命令会启动什么。" \
  --name docker-get-started \
  --depth 入门 \
  --background "会用终端输入命令，没有用过 Docker" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4344 \
  --prepare-only
```

然后只按 `schools/docker-get-started/GENERATION.md` 写课程。`publicName` 用「Docker 入门 AI 互动课程」，`shortName` 用「Docker 入门」。写完运行 `npm run school -- finish docker-get-started`。失败就修课程文件后再 `finish`，不要 `retry`。

## 5. Claude Code

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档（用户明确只要入门，不要整站）：

- https://code.claude.com/docs/en/overview
- https://code.claude.com/docs/en/quickstart
- https://code.claude.com/docs/en/how-claude-code-works

英文文档，课文用中文。只教：它是什么、怎样安装并登录、第一次在终端里提出一个小任务、它如何读文件和执行命令、人怎样中途纠正。Agent SDK、GitHub Actions、企业管理和插件市场写进排除项。quickstart 若链到一篇官方 Common workflows，可以再加那一页作为 `--source`，仍然 `--no-crawl`。

先运行：

```sh
npm run school -- create \
  --source "https://code.claude.com/docs/en/overview" \
  --source "https://code.claude.com/docs/en/quickstart" \
  --source "https://code.claude.com/docs/en/how-claude-code-works" \
  --no-crawl \
  --goal "零基础读者能说明 Claude Code 在终端里怎样开始一个任务、怎样看到它要改的文件，以及怎样在不同意时让它停下来。" \
  --name claude-code \
  --depth 入门 \
  --background "会打开终端，没有用过 Claude Code" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4345 \
  --prepare-only
```

然后只按 `schools/claude-code/GENERATION.md` 写课程。`publicName` 用「Claude Code 入门 AI 互动课程」，`shortName` 用「Claude Code 入门」。写完运行 `npm run school -- finish claude-code`。失败就修课程文件后再 `finish`，不要 `retry`。

## 6. Codex CLI

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://learn.chatgpt.com/docs/codex/cli
- 同一页的旧地址 https://developers.openai.com/codex/cli 会跳到这里。抓取和引用都用跳转后的地址。
- 范围前缀：`/docs/codex/`
- 英文文档，课文用中文。只教安装、登录、在项目目录里提出第一个任务、权限和沙箱是什么、`codex exec` 和交互模式的差别。完整命令参考、IDE 扩展和云端 Codex 写进排除项。

先运行：

```sh
npm run school -- create \
  --source "https://learn.chatgpt.com/docs/codex/cli" \
  --crawl-prefix /docs/codex/ \
  --goal "零基础读者能在终端里启动 Codex CLI，说明一次任务里它能读什么、改什么，以及怎样把权限限制在当前项目。" \
  --name codex-cli \
  --depth 入门 \
  --background "会打开终端，没有用过 Codex CLI" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4346 \
  --prepare-only
```

然后只按 `schools/codex-cli/GENERATION.md` 写课程。`publicName` 用「Codex CLI 入门 AI 互动课程」，`shortName` 用「Codex CLI 入门」。写完运行 `npm run school -- finish codex-cli`。失败就修课程文件后再 `finish`，不要 `retry`。

## 7. Astro

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

这不是已有的 `astro-zero-to-one` 或 `astro-getting-started`。不要改那两门，也不要复制它们的课文。

文档：

- 入口：https://docs.astro.build/zh-cn/tutorial/0-introduction/
- 范围前缀：`/zh-cn/tutorial/`
- 这是官方中文「搭建博客教程」。按教程单元走：创建项目、页面、组件、文章、布局。部署平台的账号操作可以写成最后一关的可选步骤。不要改去教整本 Astro 参考手册。

先运行：

```sh
npm run school -- create \
  --source "https://docs.astro.build/zh-cn/tutorial/0-introduction/" \
  --crawl-prefix /zh-cn/tutorial/ \
  --goal "零基础读者能跟着官方博客教程做出有页面、有一篇 Markdown 文章、有布局的 Astro 小站，并说清页面文件和组件分别放在哪里。" \
  --name astro-blog \
  --depth 入门 \
  --background "会用浏览器，没有写过 Astro；HTML 只在用到时补最少的那一点" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4347 \
  --prepare-only
```

然后只按 `schools/astro-blog/GENERATION.md` 写课程。`publicName` 用「Astro 博客教程 AI 互动课程」，`shortName` 用「Astro 博客教程」。写完运行 `npm run school -- finish astro-blog`。失败就修课程文件后再 `finish`，不要 `retry`。

## 8. n8n

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://docs.n8n.io/build-your-first-workflow/
- 范围前缀：`/build-your-first-workflow`
- 英文文档，课文用中文。课就按这篇「第一个工作流」拆开：工作流从什么触发、节点怎样把数据传给下一个节点、怎样看一次执行结果。不要爬集成节点大全，也不要做成 AI Agent 专课。材料如果只有这一页，就按页内步骤分关，并在 `COURSE.md` 写明范围。

先运行：

```sh
npm run school -- create \
  --source "https://docs.n8n.io/build-your-first-workflow/" \
  --crawl-prefix /build-your-first-workflow \
  --goal "零基础读者能看懂 n8n 里一个工作流怎样开始、数据怎样从一个节点流到下一个节点，并能在官方天气例子里指出每一步在做什么。" \
  --name n8n-first-workflow \
  --depth 入门 \
  --background "会用浏览器，没有搭过自动化工作流" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4348 \
  --prepare-only
```

然后只按 `schools/n8n-first-workflow/GENERATION.md` 写课程。`publicName` 用「n8n 第一个工作流 AI 互动课程」，`shortName` 用「n8n 第一个工作流」。写完运行 `npm run school -- finish n8n-first-workflow`。失败就修课程文件后再 `finish`，不要 `retry`。

## 9. Pi

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://pi.dev/docs/latest/quickstart
- 文档目录：https://pi.dev/docs/latest
- 范围前缀：`/docs/latest/`
- 英文文档，课文用中文。只读并写入这些部分：Quickstart、Using Pi、Providers 里一种登录方式、Sessions、Skills。SDK、RPC、TUI 组件和自定义 provider 实现写进排除项。

先运行：

```sh
npm run school -- create \
  --source "https://pi.dev/docs/latest/quickstart" \
  --crawl-prefix /docs/latest/ \
  --max-pages 80 \
  --goal "零基础读者能安装并登录 Pi，在一个文件夹里开始第一次会话，并说清技能和会话分别是做什么的。" \
  --name pi-agent \
  --depth 入门 \
  --background "会打开终端，没有用过 Pi" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4349 \
  --prepare-only
```

然后只按 `schools/pi-agent/GENERATION.md` 写课程。`publicName` 用「Pi 入门 AI 互动课程」，`shortName` 用「Pi 入门」。写完运行 `npm run school -- finish pi-agent`。失败就修课程文件后再 `finish`，不要 `retry`。

## 10. Godot

在仓库 `/Users/gravity/Desktop/AI/Agent-native Learning School `（路径末尾有空格）为小白新建一门 School，不要部署、提交或改其他目录。

文档：

- 入口：https://docs.godotengine.org/zh-cn/4.x/getting_started/step_by_step/index.html
- 范围前缀：`/zh-cn/4.x/getting_started/`
- 官方中文入门。主线只做 Step by step：节点和场景、实例、第一段 GDScript、输入、信号。Introduction 里只取「Godot 是什么、编辑器先看哪里」。Your first 2D game 整章不要写进这门课，在 `COURSE.md` 写成下一步。只用 GDScript，不教 C#。官方原文假设读者已有编程基础；这门课的读者是小白，所以缩进、函数和「脚本挂在节点上」要在当关讲清楚。

先运行：

```sh
npm run school -- create \
  --source "https://docs.godotengine.org/zh-cn/4.x/getting_started/step_by_step/index.html" \
  --crawl-prefix /zh-cn/4.x/getting_started/ \
  --goal "零基础读者能在 Godot 里说出节点和场景的差别，读懂一段让精灵转动的 GDScript，并说明信号是节点之间在传递什么。" \
  --name godot-step-by-step \
  --depth 入门 \
  --background "没有写过游戏，也没有用过 Godot" \
  --style "一步一步的具体例子" \
  --mode simple \
  --language zh \
  --port 4350 \
  --prepare-only
```

然后只按 `schools/godot-step-by-step/GENERATION.md` 写课程。`publicName` 用「Godot 逐步入门 AI 互动课程」，`shortName` 用「Godot 逐步入门」。写完运行 `npm run school -- finish godot-step-by-step`。失败就修课程文件后再 `finish`，不要 `retry`。
