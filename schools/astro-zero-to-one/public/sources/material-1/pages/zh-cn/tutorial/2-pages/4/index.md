<!-- source: https://docs.astro.build/zh-cn/tutorial/2-pages/4/ -->
<!-- retrieved: 2026-10-19; tool: siteone-crawler 2.5.1; scope: siteone-domain -->

# 给你的「关于」页面添加样式

现在你已经有了一个关于自己的页面，是时候来美化它了！

准备好…

- 在单页面中设置样式
- 使用 CSS 变量

## 为单页面应用样式

[Section titled “为单页面应用样式”](#为单页面应用样式)

使用 Astro 的 `<style></style>` 标签，你可以为页面上的元素设置样式。你还可以通过给这些标签添加**属性**和**指令**，获得更多的样式设置方式。
1. 复制以下代码并将其粘贴到 `src/pages/about.astro` 中：
src/pages/about.astro
```
<html lang="zh-cn"> <head> <meta charset ="utf-8" /> <meta name="viewport" content="width=device-width" /> <title>{pageTitle}</title> <style> h1 { color: purple; font-size: 4rem; } </style> </head>
```
在你的浏览器预览中检查这三个页面。
如果你无法通过肉眼判断颜色，你可以打开浏览器开发工具检查`<h1>`标题元素，并验证其应用的文本颜色。

- 页面标题是哪种颜色：
- 首页的页面标题颜色是什么？
        - 关于页面的页面标题颜色是什么？
        - 博客页面的页面标题颜色是什么？
    - 标题文字最大的是哪个页面？
2. 将类名 `skill` 添加到关于页面中生成的 `<li>` 元素上，以便你可以为其添加样式。你的代码现在应该如下所示：
src/pages/about.astro
```
<p>我的技能：</p><ul> {skills.map((skill) => <li class="skill">{skill}</li>)}</ul>
```
3. 将以下代码添加到现有的样式标签中：
src/pages/about.astro
```
<style> h1 { color: purple; font-size: 4rem; } .skill { color: green; font-weight: bold; }</style>
```
4. 再次在浏览器中查看你的关于页面，使用肉眼观察或者浏览器检测工具来验证每个技能列表中的项目现在是否为绿色和加粗。

Astro 的 `<style>` 标签还可以使用 `define:vars={ {...} }` 指令引用 `frontmatter` 中的任何变量。你可以**在代码围栏中定义变量，然后在样式标签中将其用作 CSS 变量使用**。
1. 通过在 `src/pages/about.astro` 的 `frontmatter` 中添加以下内容，定义一个名为 `skillColor` 的变量：
src/pages/about.astro
```
---const pageTitle = "关于我";
const identity = { firstName: "莎拉", country: "加拿大", occupation: "技术撰稿人", hobbies: ["摄影", "观鸟", "棒球"],};
const skills = ["HTML", "CSS", "JavaScript", "React", "Astro", "Writing Docs"];
const happy = true;const finished = false;const goal = 3;
const skillColor = "crimson";---
```
2. 在下面的已有的 `<style>` 标签中更新代码，先定义 `skillColor` 变量，然后在双括号中使用它作为 CSS 变量。
src/pages/about.astro
```
<style define:vars={{skillColor}}> h1 { color: purple; font-size: 4rem; } .skill { color: green; color: var(--skillColor); font-weight: bold; }</style>
```
3. 在浏览器预览中查看“关于”页面。你应该看到技能现在是深红色，由传递给 `define:vars` 指令的 `skillColor` 变量设置。

[Section titled “动手试一试 - 定义 CSS 变量”](#动手试一试---定义-css-变量)
1. 在你的关于页面上更新 `<style>` 标签，使其与下面的标签匹配。
src/pages/about.astro
```
<style define:vars={{skillColor, fontWeight, textCase}}> h1 { color: purple; font-size: 4rem; } .skill { color: var(--skillColor); font-weight: var(--fontWeight); text-transform: var(--textCase); }</style>
```html
2. 在你的 frontmatter 脚本中添加任何缺失的变量定义，以便你的新 `<style>` 标签成功地将这些样式应用到你的技能列表中：
- 文字颜色为深红色
    - 文本是粗体
    - 列表项全部大写（全部大写字母）

✅ 给我看下代码！✅

src/pages/about.astro

```
---const pageTitle = "关于我";
const identity = {  firstName: "莎拉",  country: "加拿大",  occupation: "技术撰稿人",  hobbies: ["摄影", "观鸟", "棒球"],};
const skills = ["HTML", "CSS", "JavaScript", "React", "Astro", "Writing Docs"];
const happy = true;const finished = false;const goal = 3;
const skillColor = "crimson";const fontWeight = "bold";const textCase = "uppercase";---
```
## 任务清单
### 相关资源
- [Astro 和 JSX 间的差异比较](../../../../zh-cn/reference/astro-syntax/index.md#astro-和-jsx-间的差异)
- [Astro `<style>` 标签](../../../../zh-cn/guides/styling/index.md#在-astro-进行设计)
- [Astro 里的 CSS 变量](../../../../zh-cn/guides/styling/index.md#css-变量)

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
