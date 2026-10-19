<!-- source: https://docs.astro.build/zh-cn/tutorial/2-pages/1/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)

现在你知道 `.astro` 文件负责你网站上的页面了，是时候来一起新建一个吧！

准备好…

- 在你的网站上创建两个新页面：关于和博客
- 为你的页面添加导航链接
- 将你更新后的网站部署上线

[Section titled “创建一个新的 .astro 文件”](#创建一个新的-astro-文件)
1. 在你的代码编辑器的文件窗口中，导航到 `src/pages/` 文件夹，你会看到现有的 `index.astro` 文件。
2. 在同一文件夹中，创建一个名为 `about.astro` 的新文件。
3. 复制或重新输入 `index.astro` 的内容到你新的 `about.astro` 文件中。
你的代码编辑器可能会在这个文件的导航标签上显示一个白色的圆点。这意味着该文件还没有保存。你可以在 VS Code 的文件菜单下，启用“自动保存”，这样应该不再需要手动保存任何文件。
4. 在地址栏中的网站预览的 URL 末尾添加 `/about`，并检查你是否能在那里看到一个页面加载。\(例如：`http://localhost/about`\)

现在，你的“关于”页面看起来应该和第一页完全一样，但我们现在要更改一下！

## 编辑你的页面

编辑 HTML 内容，可以写一些有关你的信息。

要改变或添加更多的内容到你的“关于”页面，请添加更多包含内容的 HTML 标签。你可以把下面代码复制粘贴到现有的 `<body></body>` 标签之间，或者编写一些属于你自己的代码。

src/pages/about.astro

```html
<body>  <h1>我的 Astro 网站</h1>  <h1>关于我</h1>  <h2>……和我的新 Astro 网站！</h2>
  <p>我正在学习 Astro 的入门教程。这是我网站上的第二个页面，也是我自己建立的第一页面！</p>
  <p>随着我完成更多教程，该站点将更新，所以请继续查看我的旅程将如何进行吧！</p></body>
```
现在，在你的浏览器标签中再次访问 `/about` 页面，你应该可以看到你刚刚更新的内容。

## 添加导航链接

为了更容易预览你的所有页面，在你的两个页面（`index.astro` 和 `about.astro`）顶部的 `<h1>` 标签之前添加 HTML 页面导航链接。

```html
<a href="/">首页</a><a href="/about/">关于</a>
<h1>关于我</h1><h2>……和我的新 Astro 网站！</h2>
```
检查你是否可以点击这些链接，在你的网站上的页面之间来回导航。

与许多框架不同，Astro 使用标准的 HTML `<a>` 元素在页面之间进行导航（也称为 `routes`），并采用传统的页面刷新。

## 动手尝试一下：增加一个博客页面

[Section titled “动手尝试一下：增加一个博客页面”](#动手尝试一下增加一个博客页面)

在你的网站上添加第三个页面 `blog.astro`，按照[与上面相同的步骤](#%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E6%96%B0%E7%9A%84-astro-%E6%96%87%E4%BB%B6)。

\(别忘了在每个页面添加第三个页面的导航链接。\)

给我看一下步骤：
1. 在 `src/pages/blog.astro` 创建一个新文件。
2. 复制 `index.astro` 的全部内容并将其粘贴到 `blog.astro`。
3. 在每个页面的顶部[添加第三个页面的导航链接](#%E6%B7%BB%E5%8A%A0%E5%AF%BC%E8%88%AA%E9%93%BE%E6%8E%A5)：

src/pages/index.astro

```html
<body>  <a href="/">首页</a>  <a href="/about/">关于</a>  <a href="/blog/">博客</a>
  <h1>我的 Astro 网站</h1></body>
```
你现在应该有一个有三个页面的网站，这些页面都相互链接。是时候在博客页面上添加一些内容。

使用以下内容来更新 `blog.astro` 的页面：

src/pages/blog.astro

```html
<body>  <a href="/">首页</a>  <a href="/about/">关于</a>  <a href="/blog/">博客</a>
  <h1>我的 Astro 网站</h1>  <h1>我的 Astro 学习博客</h1>  <p>在这里，我将分享我的 Astro 学习之旅。</p></body>
```
通过在浏览器预览中访问所有三个页面来预览你的整个网站，并检查一下：
- 每个页面都正确地链接到所有三个页面
- 你的两个新页面都有自己的描述性标题
- 你的两个新网页都有自己的段落文字

## 将你的修改发布到网络上

如果你已经按照我们在第一单元中的设置，你可以通过 Netlify 将你的修改发布到你的在线网站上。

当你对你的网站预览满意时，**提交**你的修改到 GitHub 的在线仓库。
1. 在 VS Code 中，预览自上次提交到 GitHub 后有变化的文件。
- 进入左边菜单中的 **Source Control tab**。它应该有一个小小的数字“3”显示。
    - 你应该看到 `index.astro`、`about.astro` 和 `blog.astro` 被列为已改变的文件。
2. 在文本框中输入提交消息（例如“添加了两个新页面 - 关于和博客”），然后按 Ctrl \+ Enter \(macOS: Cmd ⌘ \+ Enter\) 将更改提交到当前工作区。
3. 单击按钮 Sync Changes 来同步到 GitHub。
4. 等待几分钟后，访问你的 Netlify URL 以验证你的更改是否已实时发布。

每次结束工作时都遵循这些步骤！你的更改将在你的 GitHub 仓库中更新。如果你已部署到 Netlify 网站，它将被重新打包并发布。

## 任务清单
### 相关资源
- [Astro 中基于文件的路由](../../../../zh-cn/basics/astro-pages/index.md#基于文件的路由)
- [Astro 页面 HTML](../../../../zh-cn/basics/astro-pages/index.md#astro-页面)

Tutorials

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
