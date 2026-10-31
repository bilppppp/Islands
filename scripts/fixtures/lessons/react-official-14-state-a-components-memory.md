---
title: "State：组件的记忆与 useState Hook"
slug: "state-a-components-memory"
description: "理解为什么普通 JavaScript 局部变量无法胜任动态界面。掌握 useState Hook 的声明、Setter 函数调用机制、Hook 顶层调用铁律以及组件状态的私有独立性。"
order: 14
quiz: false
agentOnly: true
sources:
  - material-1/pages/learn/state-a-components-memory.md
agentInstructions: |
  教学目标：
  1. 深刻理解普通局部变量在 React 组件中无法保留数据、且无法触发重新渲染的根本原因。
  2. 熟练掌握 useState 的返回值解构：[stateVariable, setFunction]。
  3. 牢记 Hook 的调用规范：只能在函数组件顶层调用，绝不能写在条件、循环或嵌套函数中。
  4. 理解 State 是组件实例私有且完全隔离的（渲染两次同个组件，拥有两份互不干扰的状态）。
  5. 教学活动：让学员看一段尝试用 let index = 0 来记录相册索引的代码，解释为什么点击“下一张”时界面纹丝不动；随后引导其使用 useState 重构，成功切换画廊图片。
  6. 完成条件：学员能用白话讲清普通局部变量与 State 变量的根本差异，并准确写出 useState 的解构声明与点击触发 setter 的完整调用。
---

# State：组件的记忆与 useState Hook

在很多界面中，我们需要记住一些随时间或操作变化的数据。比如：画廊正在展示第几张照片、购物车里加入了多少件商品、输入框里打进去了什么文本。

在 React 中，组件特有的这种随时间变化并驱动界面更新的数据记忆，被称为 **State（状态）**。

---

## 1. 为什么普通局部变量在 React 里行不通？

来看一个展示雕塑艺术品的画廊画板。假设我们希望点击“下一张”按钮切换雕塑：

```jsx
// ❌ 无法工作的尝试！
import { sculptureList } from './data.js';

export default function Gallery() {
  let index = 0; // 一个普通的局部变量

  function handleClick() {
    index = index + 1; // 尝试改变变量
    console.log('当前索引:', index);
  }

  let sculpture = sculptureList[index];
  return (
    <>
      <button onClick={handleClick}>下一张</button>
      <h2>{sculpture.name}</h2>
      <img src={sculpture.url} alt={sculpture.alt} />
    </>
  );
}
```

如果你运行这段代码并点击按钮：
控制台里的 `index` 确实在从 1 变成 2、3，**但是屏幕上的雕塑名字和图片完全纹丝不动**！

### 为什么普通变量无法驱动界面更新？
原因有两个：
1. **局部变量无法在两次渲染之间保存数据**：每次 React 渲染该组件时，它都会从头到尾重新执行一次函数，`index` 会被重置回 `0`；
2. **更改局部变量不会触发重新渲染**：React 根本不知道你暗地里改了一个局部变量，因此它不会重新绘制屏幕。

---

## 2. useState Hook 登场：赋予组件记忆力

为了让组件能在渲染之间持久保留数据，并能在数据改变时主动命令 React 重新渲染界面，我们需要从 React 中引入 **`useState`**：

```jsx
import { useState } from 'react';
```

修改我们的画廊组件：
```jsx
import { useState } from 'react';
import { sculptureList } from './data.js';

export default function Gallery() {
  // 声明一个状态变量 index，以及一个更新它的函数 setIndex
  const [index, setIndex] = useState(0);

  function handleClick() {
    setIndex(index + 1); // 触发重新渲染！
  }

  let sculpture = sculptureList[index];
  return (
    <>
      <button onClick={handleClick}>下一张</button>
      <h2>{sculpture.name} (第 {index + 1} 件，共 {sculptureList.length} 件)</h2>
      <img src={sculpture.url} alt={sculpture.alt} />
    </>
  );
}
```

点击“下一张”，界面立刻流畅地切换出了下一位艺术家的杰作！

```jsx preview
import { useState } from 'react';

const sculptureList = [
  {
    name: 'Homenaje a la Neurocirugía',
    artist: 'Marta Colvin Andrade',
    url: 'https://i.imgur.com/Mx7dA2Y.jpg',
    alt: '雕塑：两只交叉的手托着大脑'
  },
  {
    name: 'Floralis Genérica',
    artist: 'Eduardo Catalano',
    url: 'https://i.imgur.com/ZF6s192.jpg',
    alt: '巨大的金属花雕塑'
  }
];

export default function App() {
  const [index, setIndex] = useState(0);

  function handleClick() {
    setIndex(index + 1 < sculptureList.length ? index + 1 : 0);
  }

  let sculpture = sculptureList[index];
  return (
    <div>
      <button onClick={handleClick}>下一张</button>
      <h2>{sculpture.name} (第 {index + 1} 件，共 {sculptureList.length} 件)</h2>
      <img src={sculpture.url} alt={sculpture.alt} />
    </div>
  );
}
```

---

## 3. 剖析 useState 的工作原理

```javascript
const [index, setIndex] = useState(0);
```

这一行代码包含了三个关键角色：
1. **初始值 `useState(0)`**：告诉 React，“这个状态在组件刚诞生（初次挂载）时的起始值是 `0`”；
2. **状态变量 `index`**：保存着本次渲染中该状态的当前数值；
3. **Setter 函数 `setIndex`**：这是一个专门用来修改该状态并**通知 React 重新渲染组件**的函数。

### 渲染发生的内部步骤：
- **初次渲染**：调用 `useState(0)`，React 返回 `[0, setIndex]`，页面展示第 0 张雕塑；
- **用户点击**：触发 `setIndex(index + 1)`，即 `setIndex(1)`。React 记住了：“这个画廊的索引现在是 1 了，我需要重新渲染一次”；
- **第二次渲染**：React 再次调用 `Gallery()` 函数。此时，React 已经记住了之前的状态，于是 `useState` 返回 `[1, setIndex]`；组件根据 `index = 1` 计算出新雕塑并更新屏幕！

---

## 4. 什么是 Hook？Hook 的使用铁律

在 React 中，所有以 **`use`** 开头的函数（如 `useState`、`useEffect`、`useContext`）都被称为 **Hook（钩子）**。它们是让你能够“钩入” React 底层特性的特殊函数。

Hook 拥有极其严格的调用规则：
> **核心铁律**：**只能在组件函数的顶层无条件调用 Hook！**
> 绝对不要在 `if` 条件分支、`for` 循环或嵌套函数中调用 Hook。

```jsx
// ❌ 严重错误！不能在条件语句中调用 Hook
if (something) {
  const [data, setData] = useState(null);
}

// ✅ 正确：永远在组件最上方无条件声明
const [data, setData] = useState(null);
if (something) {
  // ...
}
```
这是因为 React 在底层依赖稳定的**调用顺序（Call Order）**来识别哪个状态对应哪个变量。如果中途某个 Hook 因 if 条件被跳过，后续所有的状态映射都会全线崩溃！

---

## 5. State 是相互隔离且私有的

如果你在同一个页面上渲染两次 `<Gallery />`：

```jsx
export default function App() {
  return (
    <div>
      <Gallery />
      <Gallery />
    </div>
  );
}
```

你在第一个画廊里不断点击“下一张”，第二个画廊会不会跟着翻页？
**绝对不会！**
每一个被渲染出来的组件实例，都在 React 内部独享属于自己的一份私有状态。它们彼此之间完全隔离、互不干扰。

---

## 总结

- 普通局部变量不能保留数据，也不能触发渲染；
- `const [state, setState] = useState(initialValue)` 赋予组件记忆并驱动视图更新；
- 只能在组件最顶层无条件调用 Hook，不能嵌套在条件或循环中；
- 同一个组件的多个实例各自拥有完全独立的私有 State。
