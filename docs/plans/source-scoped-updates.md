# 来源差分更新

这份记录停在本地分支上，不进公开的 `island`。阶段一、二已在本分支提交（`1181f98`、`655e0d8`）。阶段二缺口已在 `a6b6a67` 修过。阶段三模板在本分支实现，第一门 `python-official` 已在 `https://python-official.learnislands.com` 上线。阶段四聚合站在本分支实现，尚未部署到主域名。

## 目标

对外要有一个课程站。站上的课有完整学习路径，按类别分开。七年级六门上册只作示例，留在原来的子域名，不进聚合站。真正上站的是下面这份清单。此前设想的 22 门课不作数。`astro-zero-to-one` 是 Astro 文档示例，不是清单里的 Astro Blog Tutorial。

来源会变。文档站和 GitHub 仓库一样：某几页或某几个文件变了，只处理依据它们写成的那几关。地址、关卡 slug 和已记下的进度留在原地。

指纹变化只进入复核，不直接改课文。依赖图只能找到写明的依据，不能证明没写上的文件无关。

## 已经定下的边界

- 聚合页是独立静态站，不招生、不存进度。每门公开课构建时写 `/catalog.json`。聚合页只登记这些地址。分类来自清单的 `group`。首页只放分类木牌，分类页是 `/topics/[group]/`，课程介绍页是 `/courses/[name]/`。正文留在子域名。
- 进度按 slug 记在该校私有 R2。重新部署同一 Worker 不清空桶。
- `retry` 会整门重写。Git 来源的 commit 变了，它会拒绝并要求新建 School。不能把它当更新命令。
- `supplement` 会原地覆盖原材料，也不能当更新命令。
- 克隆是 `git clone --depth 1`，只记整仓一次 commit。`provenance.json` 只有 URL 和字数。`COURSE.md` 的来源账本是人读表格。
- 爬下来的 Markdown 开头有 `<!-- retrieved: 日期 -->`。直接对文件做 SHA256，每次重抓都会变。正文指纹要先去掉日期戳并压空白，并记下提取器版本。提取器升级不能伪装成上游更新。
- 现有 Astro 示例课的 12 关没有机器可读的来源路径。账本是「教学主张 → 页面」，教程部分还有通配。映射要核对后写入，不能靠关键词猜测。
- 新增或删除的页面先记账，不自动重排学习路径。抓取失败、没抓到、确认删除要分开记。
- 完成条件整个换掉时，新 slug 和旧关说明页成对出现。旧进度留在旧 slug，不转移到新关。退役关不计入「还剩几关」和「是否学完」。
- 没修订的关卡继续指向原来的来源副本。修订过的关才指向新快照。
- 受影响关卡超过一半，或入口、索引、前置关系变了，报告写成路线评审。不批量改写，也不自动新建学校。
- 聚合页只在公开标题、介绍、关卡列表或登记变化时重建。抓取时间和内部来源版本不进入公开内容指纹。
- 课文规范地址留在子域名。公开课要有绝对 canonical、自己的 sitemap、robots 里的 Sitemap 行。主域名站点地图只列主域名上真正生成的页。不把课文正文抄到聚合页。实验课 `noindex`。
- 四个角色只是皮肤，不进入更新判定，不进教师提示词，不推断学习习惯。
- 七年级六门示例不登记，也不通过扫描 `schools/` 自动纳入。

## 阶段一：只读差分

不生成新课，不改课文，不上聚合站，不改 `retry` 和 `supplement`。用 `schools/astro-zero-to-one` 验证。

先按 `COURSE.md` 核对，给 12 关补上 frontmatter。对不上的记为未确认。

```yaml
sources:
  - material-1/pages/zh-cn/basics/layouts/index.md
```

新增并提交：

- `schools/astro-zero-to-one/source-state/baseline.json`：每个被引用文件的原始字节 SHA256、正文指纹、提取器版本。Git 来源另记 `snapshotCommit`。文件最后一次修改提交确认不了就写 `unknown`。
- `schools/astro-zero-to-one/source-state/lesson-deps.json`：由各关 `sources` 生成。一关对应哪些文件、支撑哪条主张、映射是否已核对。

每次检查写 `evidence/updates/<run-id>/changes.json`。不覆盖 `materials/material-1` 和 `public/sources/`。文档站抓到 `materials/material-1.snapshots/<日期>/`。Git 仓用 `git fetch --depth 1` 后，只对已引用路径做 `git diff --name-status`。

命令：

```bash
npm run school -- sources astro-zero-to-one --baseline
npm run school -- sources astro-zero-to-one --check
npm run school -- sources astro-zero-to-one --check --source 本地候选目录
```

改动落在 `scripts/school.mjs`、`scripts/materials.mjs`，并新增 `scripts/source-state.mjs` 和测试。`generation/protocol.md` 把 `sources` 列为 frontmatter 字段。`validateGeneration` 对以后的新课要求这个字段。现有课在补齐前用过渡开关放行。

验收：

1. 同一材料连跑两次，变化项和候选关卡都是零。课文、slug、顺序、公开来源副本和进度目录都不动。
2. 在快照里改一页，只列出引用它的关，并写明依据。
3. 改没被引用的页，只记来源变化。
4. 改共同来源，列出所有相关关卡。
5. 新增、确认删除、没抓到、抓取失败分开记。
6. 只改日期戳的页算未变。
7. 浅克隆确认不了文件最后一次修改提交时，不写出虚假的提交号。

## 阶段二：局部修订

`npm run school -- update NAME` 拆成三步：

```bash
npm run school -- update astro-zero-to-one --plan
npm run school -- update astro-zero-to-one --prepare-only --plan-id PLAN_ID
npm run school -- update astro-zero-to-one --apply --plan-id PLAN_ID
```

计划绑定当时的快照和课程文件指纹。课程若在检查后又被改过，旧计划拒绝应用。同一计划重复应用不产生额外改动。生成和应用都不部署。

每一项变化只允许四种判定：无教学影响、局部修订、需要重排路线、暂无法判断。后两种不改课文。局部修订只许改计划点名的关卡，slug、顺序和完成条件语义保持不变。

来源副本改为 `public/sources/snapshots/<snapshot-id>/`。现有副本保留。最近看见的来源版本，和每一关实际采用的版本，分开记录。一次扫描完成，不等于整门课已经更新。

新建课程协议在 [`../../generation/protocol.md`](../../generation/protocol.md)，局部修订协议独立在 [`../../generation/update.md`](../../generation/update.md)（由 `scripts/source-update.mjs` 读取）。`scripts/generate.mjs` 用允许修改的文件清单检查。应用前停止该校开发服务，再跑现有的 `finish NAME`。没有真实教师对话和网页进度同步时，不把构建通过写成教学闭环。

## 公开课清单

2026-10-20 定下。先做前 10 门。后 30 门留到前 10 门按同一套公开课模板走通之后。不扫描 `schools/` 自动纳入，也不把实验课和七年级六门写进登记。

`group` 用下面六个方向。前 10 门里，Python、TypeScript 归语言，React、Astro 归 Web，Docker 归开发工具与部署，Claude Code、Codex CLI、n8n、Pi Agent 归 AI Agent，Godot 单独归游戏。后 30 门的方向按原表。

### 先做（10）

| # | School | 官方教程 / 文档 | group |
| --- | --- | --- | --- |
| 1 | Python | Python Tutorial | 编程语言、后端与开发环境 |
| 2 | React | React Learn | Web 前端开发 |
| 3 | TypeScript | TypeScript Handbook | 编程语言、后端与开发环境 |
| 4 | Docker | Docker Get Started | 开发工具、云平台与部署 |
| 5 | Claude Code | Claude Code Docs | AI Agent 与本地 AI |
| 6 | Codex CLI | Codex CLI Docs | AI Agent 与本地 AI |
| 7 | Astro | Astro Blog Tutorial | Web 前端开发 |
| 8 | n8n | n8n First Workflow | AI Agent 与本地 AI |
| 9 | Pi Agent | Pi Documentation | AI Agent 与本地 AI |
| 10 | Godot | Godot Step by Step | 游戏开发 |

### 后期：开发工具、云平台与部署（11）

| # | School | 官方教程 / 文档 |
| --- | --- | --- |
| 11 | Git | Pro Git |
| 12 | GitHub | GitHub Hello World |
| 13 | GitHub Actions | Actions Tutorials |
| 14 | Cloudflare Workers | Workers Tutorials |
| 15 | Cloudflare Pages | Pages Tutorials |
| 16 | Vercel | Vercel Documentation |
| 17 | Netlify | Netlify Documentation |
| 18 | Kubernetes | Kubernetes Tutorials |
| 19 | Supabase | Supabase Getting Started |
| 20 | Prisma | Prisma Docs |
| 21 | PostgreSQL | PostgreSQL Tutorial |

### 后期：Web 前端开发（5）

| # | School | 官方教程 / 文档 |
| --- | --- | --- |
| 22 | HTML / CSS / JavaScript | MDN Learn Web Development |
| 23 | Vue | Vue Interactive Tutorial |
| 24 | Next.js | Learn Next.js |
| 25 | Svelte | Svelte Interactive Tutorial |
| 26 | Tailwind CSS | Tailwind Documentation |

### 后期：编程语言、后端与开发环境（6）

| # | School | 官方教程 / 文档 |
| --- | --- | --- |
| 27 | Node.js | Learn Node.js |
| 28 | FastAPI | FastAPI Tutorial |
| 29 | Django | Django First App Tutorial |
| 30 | Rust | The Rust Programming Language |
| 31 | Go | A Tour of Go |
| 32 | uv | uv Getting Started |

### 后期：AI Agent 与本地 AI（4）

| # | School | 官方教程 / 文档 |
| --- | --- | --- |
| 33 | OpenCode | OpenCode Docs |
| 34 | Ollama | Ollama Quickstart |
| 35 | MCP | MCP Introduction |
| 36 | Agent Skills | Agent Skills Specification |

### 后期：数据科学、测试及其他应用（4）

| # | School | 官方教程 / 文档 |
| --- | --- | --- |
| 37 | pandas | pandas Getting Started |
| 38 | Jupyter | Try Jupyter |
| 39 | pytest | pytest Getting Started |
| 40 | Playwright | Playwright Introduction |

来源 URL、目录名和子域名在创建那一门时再写死。这一节只定名称、教程和 `group`。

## 阶段三：一门真正要公开的课

先做清单第 1–10 门里的一门，不一次生成 40 门。分类用上面的 `group`。不把 `astro-zero-to-one` 和七年级六门算作公开课。

阶段一、二还不能直接拿来给这些课做热更新。应用前要先补上复核结论里那几处会改错课文或把「已采用」记假的缺口：失败、未观测和删除行不能当成局部修订；应用时要核对课文确实按计划改过；下一轮检查要认得 `snapshots/` 路径，并以该关实际采用的版本作比较；局部修订只能改挂判定为局部修订的来源；入口、索引和前置关系变化要进入路线评审。补完之前可以创建和构建一门课，不用这套 `update` 去改它。

创建仍用：

```bash
npm run school -- create --source URL --goal "明确的学习目标" --name NAME --prepare-only
npm run school -- finish NAME
```

公开课构建时写出 `/catalog.json`：课程名、绝对子域名、group、介绍、前置、成果、按顺序的关卡标题和地址。公开内容指纹只含这些。

同时补上绝对 canonical、该校 sitemap、robots 里的 Sitemap 行。实验课输出 `noindex`。这些改在 `school-kit`，再用现有应用脚本铺到学校。Island 页面的 SEO 改动维护在 `school-kit/island/layouts/Base.astro`。

正文标题和关卡列表没变时，catalog 指纹不变。部署沿用原来的 Worker 和 R2 绑定，不迁移进度。apex 与 www 的 TLS，以及 www 到 apex 的 301，是上线验收项，不在这一阶段里顺手做。

## 阶段四：聚合站

至少一门正式课按阶段三上线之后再做。新增独立的聚合站。登记里只有各课的 `catalog.json` 地址。

```bash
npm run school -- catalog --check
npm run school -- catalog --build
```

首页是分类木牌。分类页 `/topics/[group]/`。介绍页 `/courses/[name]/`，写清适合谁、学什么、完整路径，并链到子域名。获取失败不当成下架：这次发布停住，线上留着上一份成功的站点。

没有招生和进度接口。主域名 sitemap 只列真实生成的主域名页面。

## 先做的一件事

阶段二缺口已在 `a6b6a67` 修过。阶段三模板在本分支实现，第一门 `python-official` 已在 `https://python-official.learnislands.com` 上线。阶段四聚合站在本分支实现，尚未部署到主域名。它有完整官方教程，文档也比 Claude Code、Codex CLI、Pi、n8n 稳。那四门留在前 10 门里，等更新流程补上再创建。
