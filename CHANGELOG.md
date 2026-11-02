# 更新日志

这里只记使用方式上的变化。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [2026-11-02]

### 新增

- 课程检查新增提醒：当 `public/sources/` 下有未被任何一课 `sources` 列出的文件时提示核对；可在课文中使用、删除或在交付说明中说明保留理由。
- 协议与检查脚本明确划分阻断项与提醒项：结构与运行错误阻断构建，解释性检查只产生提醒，需逐条处理或在交付说明中写明理由。

### 变更

- 岛屿关卡页面样式与结构优化：目录与小节标签根据正文最浅标题层级统一生成；构建时自动移除正文开头与关卡标题重复的一级（`#`）标题；行内代码不再显示反引号；代码块顶部增加包含语言标识和复制按钮的工具栏，复制按钮不再遮挡代码；等宽字体栈补充包含制表符（box-drawing）字形的字体。
- Agent 在生成课程时可自主决定是否使用 `--crawl-prefix` 限定文档抓取路径，并在 `COURSE.md` 中记录所用前缀和理由。
- `create` 命令自动从 School 目录 slug 推导配置名称，不再要求单独指定内部名称。
- 生成规则明确 run 块输出必须由代码实际计算得出，禁止使用自写的 mock 冒充真实库或框架。
- `{{cite}}` 标记必须落在句子原本就有的词语上，替换为短词后整句仍需顺畅读通。

### 修复

- 规范化来源文本时改用线性字符扫描，处理超长连续空白字符不再卡死。
- `{{cite}}` 允许 quote 包含带反引号的行内代码。

## [2026-11-01]

### 新增

- 支持 `npm run school -- supplement NAME --source URL` 将 Agent 自行选定的网页保存为新材料；不带 `--source` 时仍执行整段重抓。
- 课程检查新增提醒：当课文行内代码中的技术词未在已保存材料中找到时给出警告。

### 变更

- 多页抓取页面过少降级为单页时，在材料元数据中记录原因并在终端打印说明与入口页线索，不再静默保存为普通单页。
- 检查来源更新时，单页 HTTP 来源通过重新拉取页面进行比对，不再触发整站爬取。

### 修复

- `{{cite}}` 标记内包含裸 URL 时不再导致整篇课文渲染为空白；构建流程同时增加防空页面保护。

## [2026-10-31]

### 新增

- 关卡正文可用 `{{cite …}}` 标出一句保存来源里的原话。自读页上该短词带虚线下划线，悬停或聚焦打开来源卡。写法见 [generation/protocol.md](generation/protocol.md)。
- 关卡支持多种交互块：`predict` 预测揭晓卡片、`numberline` 可拖动数轴、在浏览器执行代码的 `python run` / `js run` / `ts run`，以及支持全屏查看的 `html` / `jsx` / `tsx preview` 页面预览；React 课程的预览使用真实 React 19 渲染。
- 学员可将交互块上的尝试过程与结果一键复制，带回当前对话向 AI 教师请教。

### 变更

- 生成与 `finish` 会实际执行关卡中的 run/preview 块验证代码与渲染；检查项区分阻断错误与非阻断提醒；Pi 自动生成失败时最多进行两轮针对性修复。

### 修复

- 重新应用 school kit 时保留 `school.settings.json` 中配置的 Cloudflare 自定义域名（`customDomain`）。

## [2026-10-19]

### 新增

- 七年级生物、地理、历史可以分别在 [shengwu.learnislands.com](https://shengwu.learnislands.com)、[dili.learnislands.com](https://dili.learnislands.com)、[lishi.learnislands.com](https://lishi.learnislands.com) 打开。

### 变更

- 项目名称改为 Islands。网站页头和 `learnislands.com` 上的课程地址不变。
- 默认分支改为 `island`。随后已删除仓库里的 `master` 与 `feat/island-ui`；以 `island` 为准。
- 仓库里的 Astro 示例改为岛屿页面，课程从 10 关换成沿官方中文文档编排的 12 关。较早的页面仍留在 [schools/math-grade7](schools/math-grade7/)。

## [2026-10-17]

### 新增

- 新学校可以用 `npm run school -- deploy-cloudflare NAME` 部署到 Cloudflare Workers。每个学生一份 JSON，放在该校的私有 R2 桶里。
- 七年级语文、数学、英语可以分别在 [yuwen.learnislands.com](https://yuwen.learnislands.com)、[shuxue.learnislands.com](https://shuxue.learnislands.com)、[yingyu.learnislands.com](https://yingyu.learnislands.com) 打开。

### 变更

- 已打开的页面不再每秒读取进度。进入已注册页面时读一次，从后台回到前台时再读一次。当前页面写入成功后，这个页面自己更新。
- Vercel 部署仍连接私有 Blob。存储因用量被暂停时，部署脚本会停下来，不会把一次无法注册的发布当成成功。

### 移除

- 公开课程不再使用 `math.gravityai.top`。仓库里的 [schools/math-grade7](schools/math-grade7/) 仍保留较早的页面。

## [2026-10-16]

### 新增

- 岛屿首页可以拖动火箭。页头使用课程的公开名称。

## [2026-10-15]

### 新增

- 新建学校默认使用岛屿页面。注册时先选战士、巫师、牧师或游侠，再领取学习身份。角色只改变身份卡的样子。

## [2026-10-14]

### 变更

- README 改为面向建校的说明。仓库里的 Astro 示例和较早的七年级数学页面保持原样。

### 修复

- 浏览器里留下的学习身份在服务器上已经不存在时，教学模式仍按页面上的选择保存。

## [2026-10-13]

### 新增

- 同一份学校目录可以在本机、自有服务器和 Vercel 上运行。
- 多页文档站在准备材料时跟随同站链接抓取。
- 关卡里的数学公式用 KaTeX 排版。

### 变更

- 能看图的模型在写课前需要查看页面图像，避免只根据抽取文本写课程。

## [2026-10-10]

### 变更

- 收紧关卡说明，以及随教学模式变化的教学指引。

## [2026-10-09]

### 新增

- 仓库成为可复用的建校工具。Agent 阅读 README、AGENT_GUIDE 和 AGENTS 后，用现有命令创建并启动 School。界面语言跟随课程配置。
