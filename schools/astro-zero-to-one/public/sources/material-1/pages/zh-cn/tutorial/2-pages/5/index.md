<!-- source: https://docs.astro.build/zh-cn/tutorial/2-pages/5/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 应用全局样式

现在你已经给关于页面添加了样式，是时候为网站的其余页面添加一些全局样式吧！

准备好…

- 应用全局样式

## 添加全局样式

[Section titled “添加全局样式”](#添加全局样式)

你已经看到 Astro 的 `<style>` 标签**默认是有作用域**的，意味着它只能影响到当前文件中的元素。

有几种方法可以在 Astro 中定义全局样式，但在本教程中，你将创建并引入 `global.css` 文件到你的所有页面。样式文件和 `<style>` 标签的组合使你可以控制全局的样式，并可以将某些特定样式准确地应用到你想要的位置。
1. 在 `src/styles/global.css` 创建一个新文件（你需要先创建一个`styles`文件夹）。
2. 把下面代码复制到你新创建的文件 `global.css` 中：
src/styles/global.css
```
html { background-color: #f1f5f9; font-family: sans-serif;}
body { margin: 0 auto; width: 100%; max-width: 80ch; padding: 1rem; line-height: 1.5;}
   * {  box-sizing: border-box;}
h1 { margin: 1rem 0; font-size: 2.5rem;}
```
3. 将下面的 `import` 语句添加到 `about.astro` 文件的 frontmatter 中：
src/pages/about.astro
```
---import '../styles/global.css';
const pageTitle = "关于我";
const identity = { firstName: "莎拉", country: "加拿大", occupation: "技术撰稿人", hobbies: ["摄影", "观鸟", "棒球"],};
const skills = ["HTML", "CSS", "JavaScript", "React", "Astro", "Writing Docs"];
const happy = true;const finished = false;const goal = 3;
const skillColor = "crimson";const fontWeight = "bold";const textCase = "uppercase";---
```
4. 检查你的浏览器中的关于页面，现在你应该可以看到新样式已经被应用了！

## 动手试一试 - 引入全局 CSS 文件

[Section titled “动手试一试 - 引入全局 CSS 文件”](#动手试一试---引入全局-css-文件)

把引入代码行添加到项目中的每个`.astro`文件中，以便将全局样式应用到网站的每个页面。

✅ 给我看下代码！✅

将以下引入代码添加到另外两个页面文件中：`src/pages/index.astro` 和 `src/pages/blog.astro`。

src/pages/index.astro

```
---import '../styles/global.css';---
```
使用静态或动态的 HTML 元素给你的关于页面添加或改变任何你想要的内容。在页面中的 frontmatter 里写一些 JavaScript 代码来给你的 HTML 提供可以使用的值。当你对此页面感到满意时，请在继续下一课之前将你的更改提交到 GitHub。

### 代码分析

你的关于页面现在引入了 `global.css` 文件，同时使用了 `<style>` 标签。
- 两种设置样式的方法是否都在页面中被应用了？
- 是否有任何样式冲突，如果有哪一个会被应用？
- 描述`global.css`和`<style>`如何协同工作。
- 你会如何选择在页面中引入 `global.css` 文件还是使用 `<style>` 标签？

## 任务清单
### 相关资源
- [Astro 和 JSX 间的差异比较](../../../../zh-cn/reference/astro-syntax/index.md#astro-和-jsx-间的差异)
- [Astro `<style>` 标签](../../../../zh-cn/guides/styling/index.md#在-astro-进行设计)
- [Astro 里的 CSS 变量](../../../../zh-cn/guides/styling/index.md#css-变量)

Tutorials

## Learn Astro with Coding in Public

150\+ video lessons

[Get 20% off](https://learnastro.dev/?code=ASTRO_PROMO)

| [贡献](../../../../zh-cn/contribute/index.md) | [社区](https://astro.build/chat) | [赞助](https://opencollective.com/astrodotbuild) |

---

[跳转到内容](#_top)

[Astro](https://astro.build/)
[Docs](../../../../zh-cn/getting-started/index.md)

| [GitHub](https://github.com/withastro/astro) | [Discord](https://astro.build/chat) |

![Scrimba](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

![](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)

## Learn Astro with James Q Quick

Build your first site with 35 interactive Scrimba lessons

[Get 20% off](https://scrimba.com/intro-to-astro-c00ar0fi5u?via=astro)
