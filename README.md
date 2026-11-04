# Islands

Islands 把学习材料和学习目标做成一所独立网站（School）。网站发给学生一串身份并记住进度；关卡上的提示词交给 Coding Agent，就可以按课程讲解、问答和练习，下次用同一身份接着学。课程深度决定学什么，教学模式决定互动节奏。Pi 是默认的生成和教学入口；具备文件读写、终端和 HTTP 访问能力的 Coding Agent 也可以建校或授课。使用方式上的变化记在 [CHANGELOG.md](CHANGELOG.md)。

## 可以打开的课程

六门七年级课程已经发布。打开后选择简单或沉浸模式，点「选择身份」选定角色，再点「开始学习」领取一串「形容词-名词-四位数字」的身份。进度写在网站上。

| 课程 | 地址 |
| --- | --- |
| 七年级语文 | [yuwen.learnislands.com](https://yuwen.learnislands.com) |
| 七年级数学 | [shuxue.learnislands.com](https://shuxue.learnislands.com) |
| 七年级英语 | [yingyu.learnislands.com](https://yingyu.learnislands.com) |
| 七年级生物 | [shengwu.learnislands.com](https://shengwu.learnislands.com) |
| 七年级地理 | [dili.learnislands.com](https://dili.learnislands.com) |
| 七年级历史 | [lishi.learnislands.com](https://lishi.learnislands.com) |

七年级语文首页：

![七年级语文首页，左侧是单元列表，右侧可以选择教学模式并开始学习](docs/images/yuwen.png)

七年级数学首页：

![七年级数学首页，左侧是各关列表，右侧说明学完上册的目标](docs/images/shuxue.png)

七年级英语首页：

![七年级英语首页，左侧是各单元，右侧说明词汇和句型按教材原文学习](docs/images/yingyu.png)

仓库里的完整生成示例是 [astro-zero-to-one](schools/astro-zero-to-one/)。它从 [Astro 中文入门文档](https://docs.astro.build/zh-cn/getting-started/) 生成，面向还没有接触过框架的学习者，使用岛屿页面，共 12 关。[课程设计问答](schools/astro-zero-to-one/QA.md) 说明了抓到的页面里哪些进入了课程，以及为什么没有把全部材料写进课程。较早的七年级数学页面留在 [schools/math-grade7](schools/math-grade7/)。

## 核心能力

- **材料直接变成课程网站。** 来源可以是 GitHub 仓库、公开网页或文档、论文 PDF，以及本地文件或目录。深度、已有基础和学习偏好可以用自然语言说明。
- **用 Agent 创建，也用 Agent 上课。** 把下面的提示词交给支持终端工具的 Coding Agent 即可。当前 Agent 按协议写课程时不必安装 Pi；默认 CLI 的自动生成和 `teach` 会调用 Pi。
- **进度留在网站上。** 完成当关互动后，教师通过进度 API 记下进度。教学模式可以在网页或对话里切换，不必重新生成课程。关卡完成表示参与了当关互动并得到反馈。学生身份是轻量标识，没有账号和权限系统。
- **文档站可以一次取多页。** HTTP(S) HTML 文档会自动判断是否抓取，默认跟随同站链接，最多 500 页。写入课程的仍是生成时选中的页面。数学公式会在关卡页面中排版显示。
- **同一份学校目录可以四处运行：** 本机、自有服务器、Vercel、Cloudflare Workers。

## 岛屿页面

新建 School 默认使用岛屿页面（卡片、按钮与进度组件来自 [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)）。生成课程的 Agent 只写关卡正文，不改页面。

关卡在首页排成一条路：已经完成的在上面，当前这一关展开，后面的关有锁的样子，但仍然可以打开。进入一关后，课文保持 Markdown，铺在羊皮纸上；关卡内支持预测揭晓卡、可运行代码块、实时预览与可操作演示。若关卡正文标了来源句，自读页上会有虚线下划线，悬停或聚焦可看到保存文件里的那一句原文。注册时先选战士、巫师、牧师或游侠（仅改变身份卡形象与完课印章），再领取学习身份。

## 快速开始

复制下面任意一段，发给支持终端工具的 Coding Agent。无需先记 CLI，也无需手写配置或安装 Skill。Agent 会定位项目、检查环境并启动网站。你在网页领取身份后，把关卡上的启动 Prompt 交给教师 Agent。

### 首次使用：让 Agent 克隆项目

按需替换学习来源、目标和偏好：

```text
请在当前可写工作区克隆 https://github.com/bilppppp/Islands.git；如果已有该仓库，请复用它，不要覆盖现有文件。
阅读仓库的 README.md 和 AGENT_GUIDE.md，按照现有工具创建并启动一所新的独立 School。
学习来源：https://github.com/facebook/react
学习目标：理解组件为什么会重新渲染，能解释状态更新与父子组件的关系，并用小例子检验理解。
我熟悉 JavaScript，但不熟悉 React 源码。希望从基础直觉逐步深入到相关实现机制；教学先用简单模式，偏好预测与代码观察。
请选择一个未占用的 School 名称，保留已有课程和进度。完成后给我实际可访问的网站地址、课程文件位置，以及在我使用的 Agent 中开始学习和下次续学的方法。
如果缺少运行环境、模型认证或来源不可访问，请明确说明需要我补充什么；不要声称未完成的生成或教学已经成功。
```

### 已克隆：让 Agent 使用本地项目

把 `<本地仓库绝对路径>` 换成你的路径（路径里可以有空格）：

```text
请使用本地仓库 <本地仓库绝对路径> 中的 Islands，先阅读 README.md 和 AGENT_GUIDE.md。
利用现有工具为 https://arxiv.org/abs/1706.03762 创建并启动一所新的独立 School，不要覆盖已有 School。
我的目标是理解 Transformer 架构和 Attention 的关键计算。我已熟悉基础神经网络，希望深入理解组件关系、公式推导与简单数值实验；教学先用沉浸模式，允许中途调整节奏。
完成后给我实际可访问的网站地址、可编辑的课程位置，以及在我使用的 Agent 中开始学习和恢复进度的步骤。未指定的设置使用项目默认值。
```

未说明的设置使用默认值：系统深度、基础按需了解、中文、简单（Simple）模式。沉浸（Immersive）模式只改变提问节奏，不删减课程内容。

Agent 执行细节见 [AGENT_GUIDE.md](AGENT_GUIDE.md)。维护本仓库代码见 [AGENTS.md](AGENTS.md)。

### 打开网站学习

1. 打开启动后的网址，选择简单或沉浸模式，点「选择身份」选定角色，再点「开始学习」领取学习身份。
2. 进入关卡，复制启动 Prompt 交给教师 Agent。使用 Pi 时，可粘贴进会话，或运行 `npm run school -- teach NAME --student 网页身份`。其他 Agent 加 `--prompt-only`，只生成通用提示词。已部署的学校加上 `--origin https://学校地址`（不能与 `--port` 同时使用）。
3. 按提示问答、推演或做实验。在网页上切换模式后，教师下一轮会读到新设置；对话里也可以直接要求放慢或展开推导。
4. 教师记下进度后，当前页面会更新。另一台设备重新打开页面或刷新后看到新进度。新对话带上同一身份即可续学。

教师需要能读取 HTTP、调用 REST，并遵守站点 `/llms.txt`。课程和材料通过关卡 API 与 `/sources/` 访问，进度接口见 `/api/openapi.json`。只有 Pi 需要阅读 `/harness/pi.txt`。

## CLI

需要 Node.js 22.12+（开发测试使用 24.16）、Python 3、Git、curl。PDF 提取还需当前 Python 能导入 `pypdf`。

```sh
npm run school -- setup
python3 -m pip install pypdf
```

默认由 Pi 根据自然语言创建并生成课程：

```sh
npm run school -- create "学习 https://github.com/sindresorhus/p-limit，理解异步并发限制，深入源码，教学先用简单模式"
npm run school -- start my-school
```

也可以直接传参数，无需模型解析请求：

```sh
npm run school -- create --source https://github.com/sindresorhus/p-limit \
  --goal "理解异步并发限制，并能正确使用 p-limit" --name my-school \
  --depth 深入 --background "熟悉 JavaScript 和 Promise" --mode simple
```

由当前 Coding Agent 写课程时加上 `--prepare-only`。它只准备材料、网站骨架和 `schools/my-school/GENERATION.md`，不调用 Pi。Agent 写完课程后运行 `finish` 检查并构建：

```sh
npm run school -- finish my-school
npm run school -- start my-school
```

`create` 可选参数：`--source`（可多次指定）、`--goal`、`--name NAME`、`--depth "入门/系统/深入或自由描述"`、`--background "已有基础"`、`--style "偏好"`、`--mode simple|immersive`、`--language zh`、`--port PORT`、`--ref TAG`（指定 Git 分支或 Tag，并记录解析到的 commit）、`--model PROVIDER/MODEL`（或环境变量 `SCHOOL_MODEL`，仅影响默认 Pi 路径，定义在 `scripts/pi.mjs`）。不带描述或参数执行 `create` 时，交互终端只询问来源和目标。

同名 School 已存在时会报错退出，不会覆盖。中断后可查看保留的材料再运行 `npm run school -- retry NAME`（会重写课程，不重置进度）。已有学习进度时，直接编辑课程文件并保持关卡 `slug` 不变。

| 命令 | 作用 |
| --- | --- |
| `setup` | 安装模板依赖（PDF 提取另需 `pypdf`） |
| `list` | 列出已有 School |
| `create ...` | 创建 School（支持自然语言或明确参数；加 `--prepare-only` 交由当前 Agent 写课） |
| `supplement NAME [--source URL ...]` | 按同站跟随补齐已保存的网页文档，或把 `--source` 指定页面保存为新材料 |
| `finish NAME` | 检查 Agent 生成的课程并构建（不调用 Pi，实际执行 `run`/`preview` 块；可用 `node scripts/verify-lesson-blocks.mjs schools/NAME` 先行自查） |
| `start NAME [--port 4323]` | 本机启动（换端口后，页面中的 API 和提示词会使用新地址） |
| `teach NAME --student STUDENT_ID` | 启动教学。可选 `--mode immersive`、`--lesson SLUG`、`--origin https://school.example.com`（不能与 `--port` 同时使用）、`--prompt-only`（只输出通用提示词，不启动 Pi） |
| `build NAME` | 构建 School（先停止该 School 的开发服务，不要同时开发并构建） |
| `deploy NAME` | 部署到 Vercel：写入 `DEPLOY_TARGET=vercel`，连接私有 Blob，发布生产环境 |
| `deploy-cloudflare NAME` | 部署到 Cloudflare Workers：进度写入该校私有 R2，发布 `workers.dev` |
| `retry NAME` | 检查保留文件后用 Pi 重新生成课程；可能修改课程，不重置进度 |
| `sources NAME --baseline \| --check [--source 本地候选目录]` | **维护命令（新建 School 无需使用）：** 生成已引用来源基线指纹，或检查上游来源变化 |
| `update NAME --plan \| --prepare-only \| --apply` | **维护命令（新建 School 无需使用）：** 按 [generation/update.md](generation/update.md) 对已有课程执行来源差分局部修订（可选 `--source`、`--run`、`--plan-id`） |
| `catalog --check \| --build` | **维护命令（新建 School 无需使用）：** 校验公开课登记表的 `catalog.json`，或构建聚合站 |

### 多页文档站

GitHub 仓库、论文、PDF、DOCX、纯文本和本地路径按单份来源准备。HTTP(S) HTML 文档站会自动判断是否抓取，一般不必额外加参数。默认由 siteone-crawler 从入口页跟随同一域名下的链接，最多 500 页；没有明确的文档站信号时只保存入口页。导航信号不足，或给出的地址是站点首页时，会提示用 `supplement` 加上 `--crawl-prefix` 重抓，或用 `--source` 保存指定页面。

- `--crawl` 强制抓取；`--no-crawl` 只保存入口页。二者不能同时使用，也不能把 `--no-crawl` 用于 `supplement`。
- `--crawl-prefix /docs/latest` 把重新抓取限定在某个路径；Agent 判断该区域为目标文档时可以使用（用户指定时当然也用），并在 `COURSE.md` 的 selected sources 记下所用前缀和理由。
- `--max-pages N` 为 1–10000，默认 500。`--crawl-workers N` 为 1–8，默认 2。
- `npm run school -- supplement NAME` 用同样的同站跟随，补齐已保存的 HTTP HTML 来源；补齐失败时保留原材料。仓库克隆和本地文件不动。
- `npm run school -- supplement NAME --source URL [--source ...]` 在 Agent 读过入口页线索、自己判断需要哪些页面后，用它把这些页面保存为材料；需要 JS 渲染、取回内容过少的页面会报错，这时找 `.md` 版本或源码仓库。
- 抓取不足时降级为单页、记入 `crawl.fallback` 并打印说明；`supplement` 失败时保留原材料。未安装 siteone-crawler v2.5.1+ 时会自动下载到 `tools/cache`（不纳入 Git）。
- 入口页若有 GitHub 编辑或源文件链接，会提示对应仓库；若提到 `llms.txt` 或提供 Markdown 版本，也会打印线索供自行选取。只保存了入口页时，会提示可用 `supplement --source` 保存该仓库。

单页来源保留原件和提取文本；多页抓取还会保存各页文本和来源记录（`provenance.json`），供生成课程时选读。

### 课程文件

- `schools/NAME/COURSE.md`：路线、来源和深度取舍。
- `src/content/lessons/*.md`：关卡正文和教学指引（调整顺序改 frontmatter 的 `order`）。来源句引用 `{{cite …}}` 与交互块写法见 [generation/protocol.md](generation/protocol.md)，局部修订见 [generation/update.md](generation/update.md)。
- `public/sources/`、`public/activities/`：供 HTTP 读取的参考材料、标明身份的派生文本，以及练习代码。
- `school.settings.json`：创建时的配置、语言、默认教学模式和可选自定义域名。

开发服务会在课程修改后自动刷新。

## 部署

同一份 `schools/NAME` 支持四种运行方式：

| 位置 | 运行方式 | 进度存储 |
| --- | --- | --- |
| 本机 | `npm run school -- start NAME`（`DEPLOY_TARGET=dev`） | `.wrangler/`（本地 KV） |
| 自有服务器 | 在学校目录执行 `./script/serve`（`DEPLOY_TARGET=node`） | `.school-data/` |
| Vercel | `npm run school -- deploy NAME` 或 `./script/deploy-vercel`（`DEPLOY_TARGET=vercel`） | 私有 Vercel Blob |
| Cloudflare Workers | `npm run school -- deploy-cloudflare NAME` 或 `./script/deploy-cloudflare`（`DEPLOY_TARGET=cloudflare`） | 私有 Cloudflare R2 |

环境变量、自定义域名配置（`customDomain`）与脱离本仓库独立运行的步骤见 [school-kit/overlay/DEPLOYMENT.md](school-kit/overlay/DEPLOYMENT.md)（构建时同步为各校目录下的 `DEPLOYMENT.md`）。共享模板覆盖层与公开课目录规范见 [school-kit/README.md](school-kit/README.md)。

## 参考与致谢

- [School Template](https://github.com/agentschools/school-template)：网站模板的直接来源。本项目复用其课程页面、学生 Profile、课程获取和基于本地 KV 的进度接口，并在 `scripts/school.mjs` 的 `setup` 中固定了特定版本。
- [Pi School](https://github.com/agentschools/pi-school)：学习体验的主要参考，包括对话授课、问题引导，以及网站与进度的配合。本项目网站代码派生自 School Template。
- [OpenCode School](https://github.com/agentschools/opencode.school)：早期 Agent 学习网站参考。School Template 上游文档注明其架构源自该项目。
- [Pi](https://github.com/badlogic/pi-mono)（现重定向至 [earendil-works/pi](https://github.com/earendil-works/pi)）：默认的生成与教学 Harness。课程与教学协议保持 Harness 中立。
- [siteone-crawler](https://github.com/janreges/siteone-crawler)（MIT）：多页文档站的抓取工具。未安装时从官方 GitHub Release 下载到 `tools/cache`，不作为仓库文件提交。
- [animal-island-ui](https://github.com/guokaigdg/animal-island-ui)（MIT）：新建 School 的岛屿页面组件。
- 课程化组织还参考了 [codebase-to-course](https://github.com/zarazhangrui/codebase-to-course)、[Repo2NotebookLM](https://github.com/bilppppp/Repo2NotebookLM) 和 [archify](https://github.com/tt-a1i/archify)。这些项目提供了方向，没有作为运行依赖集成。

## 许可

本仓库以 [Apache License 2.0](LICENSE) 授权。`schools/` 中的网站代码派生自 School Template，原版权声明予以保留。课程引用的来源材料仍适用其各自的许可。
