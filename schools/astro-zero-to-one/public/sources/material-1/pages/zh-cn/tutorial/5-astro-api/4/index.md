<!-- source: https://docs.astro.build/zh-cn/tutorial/5-astro-api/4/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 添加 RSS 订阅源

准备好…

- 安装 Astro 的包，用于为你的网站创建一个 RSS 订阅源
- 创建一个可以通过 RSS 订阅源阅读的订阅源

[Section titled “安装 Astro 的 RSS 包”](#安装-astro-的-rss-包)

Astro 提供了一个可自定义包，用于快速为你的网站添加一个 RSS 订阅源。

这个官方包会生成一个非 HTML 文档，其中包含有关你的所有博客文章的信息，可以被 Feedly、The Old Reader 等 **订阅源阅读器（Feed Reader）** 读取。每次重新构建你的网站时，该文档都会更新。

个人用户可以通过在订阅源阅读器中订阅你的订阅源，在你的网站上发布新博客文章时会收到通知，这使它成为一个受欢迎的博客功能。
1. 在终端中，退出 Astro 开发服务器（Ctrl \+ C），然后运行以下命令以安装 Astro 的 RSS 包。

   - [npm](#tab-panel-0-0)
   - [pnpm](#tab-panel-0-1)
   - [Yarn](#tab-panel-0-2)

终端窗口
```
npm install @astrojs/rss
```
终端窗口
```
pnpm add @astrojs/rss
```
终端窗口
```
yarn add @astrojs/rss
```
2. 重新启动开发服务器，以继续预览你的 Astro 项目。

   - [npm](#tab-panel-1-0)
   - [pnpm](#tab-panel-1-1)
   - [Yarn](#tab-panel-1-2)

终端窗口
```
npm run dev
```
终端窗口
```
pnpm run dev
```
终端窗口
```
yarn run dev
```
## 创建一个 .xml 订阅源文件

[Section titled “创建一个 .xml 订阅源文件”](#创建一个-xml-订阅源文件)
1. 在 `src/pages/` 目录下创建一个名为 `rss.xml.js` 的新文件。
2. 将以下代码复制到这个新文档中。自定义 `title` 和 `description` 属性，如果需要，可以在 `customData` 中指定不同的语言：
src/pages/rss.xml.js
```
import rss, { pagesGlobToRssItems } from '@astrojs/rss';
export async function GET(context) { return rss({ title: 'Astro Learner | Blog', description: 'My journey learning Astro', site: context.site, items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')), customData: `<language>en-us</language>`, });}
```
3. 在 Astro 的配置文件中设置 `site` 属性为你的网站自己的唯一 Netlify URL。
astro.config.mjs
```
import { defineConfig } from "astro/config";
export default defineConfig({ site: "https://example.com"});
```
4. 访问 `http://localhost/rss.xml`，验证你是否可以在页面上看到（未格式化的）文本，每个 `.md` 文件都有一个 `item`。每个 `item` 应包含博客文章的信息，例如 `title`、`url` 和 `description`。
下载一个订阅源阅读器，或者注册一个在线订阅源阅读器服务，并通过添加你自己的 Netlify URL 订阅你的网站。你也可以将此链接分享给他人，让他们订阅你的文章，并在发布新文章时收到通知。

## 任务清单

[Section titled “任务清单”](#任务清单)
### 相关资源
- [Astro 中的 RSS 项生成](../../../../zh-cn/recipes/rss/index.md#使用-glob-导入)

Tutorials

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)
