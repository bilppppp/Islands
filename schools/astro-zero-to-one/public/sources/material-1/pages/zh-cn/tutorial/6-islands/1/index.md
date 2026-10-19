<!-- source: https://docs.astro.build/zh-cn/tutorial/6-islands/1/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)

使用一个 Preact 组件来随机选择欢迎消息来欢迎访问者！

准备好…

- 在你的 Astro 项目中添加 Preact
- 在主页上包含 Astro 岛屿（Preact `.jsx` 组件）
- 使用 `client:` 指令使岛屿可交互

## 在你的 Astro 项目中添加 Preact

[Section titled “在你的 Astro 项目中添加 Preact”](#在你的-astro-项目中添加-preact)
1. 如果运行着 Astro 开发服务器，请退出以便使用终端（快捷键：Ctrl \+ C）。
2. 通过以下单个命令，为你的 Astro 项目添加使用 Preact 组件的能力：

   - [npm](#tab-panel-0-0)
   - [pnpm](#tab-panel-0-1)
   - [Yarn](#tab-panel-0-2)

终端窗口
```
npx astro add preact
```
终端窗口
```
pnpm astro add preact
```
终端窗口
```
yarn astro add preact
```
3. 按照命令行提示的说明来确认添加 Preact 到你的项目。

[Section titled “添加一个 Preact 欢迎横幅”](#添加一个-preact-欢迎横幅)

这个组件将接受一个欢迎消息的数组作为属性，并随机选择其中一条消息作为欢迎消息展示给用户。用户可以点击按钮获取新的随机消息。
1. 在 `src/components/` 目录下创建一个名为 `Greeting.jsx` 的新文件。
注意 `.jsx` 文件扩展名。这个文件将使用 Preact 编写，而不是 Astro。
2. 将以下代码添加到 `Greeting.jsx` 文件中：
src/components/Greeting.jsx
```
import { useState } from 'preact/hooks';
export default function Greeting({messages}) {
const randomMessage = () => messages[(Math.floor(Math.random() * messages.length))];
const [greeting, setGreeting] = useState(messages[0]);
return ( <div> <h3>{greeting}！感谢来访！</h3> <button onClick={() => setGreeting(randomMessage())}> 新的欢迎语 </button> </div> );}
```
3. 在你的主页 `index.astro` 中导入并使用这个组件。
src/pages/index.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';import Greeting from '../components/Greeting';const pageTitle = "首页";---<BaseLayout pageTitle={pageTitle}> <h2>我超棒的博客副标题</h2> <Greeting messages={["Hi", "Hello", "Howdy", "Hey there"]} /></BaseLayout>
```
在浏览器中预览：你应该看到一个随机的问候，但按钮不起作用！
4. 添加第二个 `<Greeting />` 组件，并加上 `client:load` 指令。
src/pages/index.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';import Greeting from '../components/Greeting';const pageTitle = "首页";---<BaseLayout pageTitle={pageTitle}> <h2>我超棒的博客副标题</h2> <Greeting messages={["Hi", "Hello", "Howdy", "Hey there"]} /> <Greeting client:load messages={["Hej", "Hallo", "Hola", "Habari"]} /></BaseLayout>
```
5. 查看你的页面并比较这两个组件。第二个按钮可工作，因为 `client:load` 指令告诉 Astro 在页面加载时将其 JavaScript 发送并重新运行到客户端上，使组件可交互。这称为**被注水的**组件。
6. 一旦明确区别后，删除未被注水的 Greeting 组件。
src/pages/index.astro
```
---import BaseLayout from '../layouts/BaseLayout.astro';import Greeting from '../components/Greeting';const pageTitle = "首页";---<BaseLayout pageTitle={pageTitle}> <h2>我超棒的博客副标题</h2> <Greeting messages={["Hi", "Hello", "Howdy", "Hey there"]} /> <Greeting client:load messages={["Hej", "Hallo", "Hola", "Habari"]} /></BaseLayout>
```
### 分析代码

还有其他的 `client:` 指令可以探索。每个指令在不同的时间将 JavaScript 发送到客户端。例如，`client:visible` 只会在组件在页面上可见时发送其 JavaScript。

考虑一个带有以下代码的 Astro 组件：

```
---import BaseLayout from '../layouts/BaseLayout.astro';import AstroBanner from '../components/AstroBanner.astro';import PreactBanner from '../components/PreactBanner';import SvelteCounter from '../components/SvelteCounter.svelte';---<BaseLayout>  <AstroBanner />  <PreactBanner />  <PreactBanner client:load />  <SvelteCounter />  <SvelteCounter client:visible /></BaseLayout>
```
1. 五个组件中哪些将成为**被注水的**岛屿，将其 JavaScript 发送到客户端？
2. 两个 `<PreactBanner />` 组件在哪些方面相同？在哪些方面不同？
3. 假设 `SvelteCounter` 组件显示一个数字，并带有一个增加数字的按钮。如果你无法看到网站的代码，只能看到发布后的页面，你如何判断哪个 `<SvelteCounter />` 组件使用了 `client:visible`？

### 检验你的知识

[Section titled “检验你的知识”](#检验你的知识)

对于以下每个组件，确定将发送到浏览器的内容：
1. `<ReactCounter client:load />`
2. `<SvelteCard />`

## 任务清单
### 相关资源
- [Astro 集成指南](../../../../zh-cn/guides/integrations/index.md)
- [在 Astro 中使用 UI 框架组件](../../../../zh-cn/guides/framework-components/index.md#使用框架组件)
- [Astro client 指令参考](../../../../zh-cn/reference/directives-reference/index.md#客户端指令)

Tutorials

![Scrimba](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
