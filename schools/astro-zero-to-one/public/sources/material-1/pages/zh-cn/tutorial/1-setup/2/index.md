<!-- source: https://docs.astro.build/zh-cn/tutorial/1-setup/2/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)

准备好…

- 运行 `create astro` 安装向导来创建一个新的 Astro 项目
- 以开发 \(dev\) 模式启动 Astro 服务器
- 在浏览器中查看你网站的实时预览

创建新 Astro 站点的首选方法是通过我们的 `create astro` 设置向导。
1. 在终端的命令行中，使用你首选的包管理器运行以下命令：

   - [npm](#tab-panel-0-0)
   - [pnpm](#tab-panel-0-1)
   - [Yarn](#tab-panel-0-2)

终端窗口
```
# 使用 npm 创建新项目npm create astro@latest
```
终端窗口
```
# 使用 pnpm 创建新项目pnpm create astro@latest
```
终端窗口
```
# 使用 yarn 创建新项目yarn create astro
```
2. 输入 `y` 以安装 `create-astro`。
3. 当提示你想要在哪里创建你的新项目时，输入文件夹的名称来为你的项目创建一个新目录，例如：`./tutorial`
新的 Astro 项目只能在一个完全空的文件夹中创建，因此请为你的文件夹选择一个尚不存在的名称！
4. 你会看到一个简短的入门模板列表。使用方向键（上下键）导航到 minimal（空白）模板，然后按下回车键（Enter）确认你的选择。
5. 当提示询问你是否要安装依赖项时，输入 `y`。
6. 当提示询问你是否要初始化一个新的 Git 仓库时，输入 `y`。

[Section titled “在 VS Code 中打开你的项目”](#在-vs-code-中打开你的项目)
7. 打开 VS Code。系统将提示你打开一个文件夹。选择你在安装向导期间创建的文件夹。
8. 如果这是你第一次打开 Astro 项目，你应该会看到一条通知，询问你是否要安装推荐的扩展。点击查看推荐扩展，选择 [Astro 语言支持](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)。这将为你的 Astro 代码提供语法提示和自动代码补全功能。
9. 打开 VS Code 终端，可以看到类似如下提示：
终端窗口
```
user@machine:~/tutorial$
```
按 Ctrl \+ J（macOS: Cmd ⌘ \+ J）在 VS Code 中打开终端。

你现在可以使用 VS Code 的内置的终端，而不是计算机自带的终端程序。

[Section titled “在开发模式下运行 Astro”](#在开发模式下运行-astro)

为了实时预览项目，你需要在开发 \(dev\) 模式下运行 Astro。

### 启动开发服务
10. 通过在 VS Code 的终端中输入以下命令来启动 Astro 开发服务：

    - [npm](#tab-panel-1-0)
    - [pnpm](#tab-panel-1-1)
    - [Yarn](#tab-panel-1-2)

终端窗口
```
pnpm run dev
```
终端窗口
```
yarn run dev
```
## 查看你网站的预览

[Section titled “查看你网站的预览”](#查看你网站的预览)
11. 点击终端窗口中的 `localhost` 链接，查看 Astro 网站的实时预览！
（如果端口 4321 可用，Astro 默认使用 `http://localhost`。）
以下是 Astro“初始项目”入门网站在浏览器预览中的样子：
![顶部带有 Astro 字样的空白白页。](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

当 Astro 服务器以开发模式运行时，你将**无法**在终端窗口中运行命令。相反，此窗格会在你预览站点时为你提供反馈。

你可以随时停止开发服务器并通过在终端中键入 Ctrl \+ C 返回到命令提示符。

有时开发服务器会在你工作时自行停止。如果你的实时预览停止工作，请返回终端并通过键入 `npm run dev` 重新启动开发服务器。

## 任务清单
### 相关资源
- [Visual Studio Code 入门](https://code.visualstudio.com/docs/introvideos/basics)外部链接 — 用于安装、设置和使用 VS Code 的视频教程

Tutorials

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![Scrimba](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
