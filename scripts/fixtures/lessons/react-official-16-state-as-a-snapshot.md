---
title: "State 如同一张快照：理解单次渲染中的常量状态"
slug: "state-as-a-snapshot"
description: "揭开 React 状态更新的心智模型谜团：为什么设置 State 不会立刻改变当前变量。理解渲染作为定格快照的机制，掌握时间维度上的状态一致性。"
order: 16
quiz: false
agentOnly: true
sources:
  - material-1/pages/learn/state-as-a-snapshot.md
agentInstructions: |
  教学目标：
  1. 理解“渲染快照（Snapshot）”的核心心智模型：在某一次特定的渲染执行中，所有的 props 与 state 都是不可更改的常量。
  2. 深刻解析经典连点计数器谜题：连续调用三次 setNumber(number + 1) 为什么最终只会加 1。
  3. 理解异步操作（如 setTimeout、Promise）中捕获的 state 依然属于触发当时渲染的旧快照值。
  4. 教学活动：展示一段包含 setTimeout 延迟 5 秒弹窗显示当前计数的代码，让学员在点击后迅速再次连点三次按钮，推测 5 秒后的弹窗显示的数字是点击时的数字还是最新的数字，并说明原因。
  5. 完成条件：学员能解释为什么连续三次调用 setNumber(number + 1) 最终只加了 1，明确指出当次渲染中 state 变量作为常量的快照性质。
---

# State 如同一张快照：理解单次渲染中的常量状态

初学 React 时，最容易让人百思不得其解的一个现象是：
**明明我已经调用了 `setNumber(number + 1)`，为什么紧接着打印或者再次使用 `number`，它的值居然没有变？**

为了彻底解开这个心智谜团，本关将为你揭开 React 最重要的机制之一：**State 如同一张快照（State as a Snapshot）**。

---

## 1. 经典谜题：连加三次，到底加了几？

观察下面这个计数器组件：

```jsx
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3 吗？</button>
    </>
  );
}
```

许多人第一次看到这段代码，直觉上会认为点击一次按钮，数字会从 0 变成 3。
**然而，无论你点多少次，每次点击它都只增加了 1！**

```jsx preview
import { useState } from 'react';

export default function App() {
  const [number, setNumber] = useState(0);

  return (
    <div>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3 吗？</button>
    </div>
  );
}
```

为什么？难道是 React 的 bug 吗？

---

## 2. 渲染就是给 UI 拍一张快照

要理解为什么只加了 1，我们需要看看 React 是如何调用你的组件函数的。

当 React 渲染一个组件时，它其实是在这一特定时间点上给你的组件**拍了一张静态的“照片（快照）”**。在这张照片里：
- 所有的 Props 和 State **都是固定死的常量值**；
- 所有的事件处理函数和 JSX 都是基于这一组固定值计算出来的。

### 代入数值走一遍推导：
当组件初次挂载时，`number` 的值是 `0`。
此时，React 给这次渲染拍了快照。在本次快照中，**整个组件体内的所有 `number` 变量，全都被固定为了 `0`**！

那么，那个按钮的点击事件里的代码，在当次渲染中实际上等同于：

```javascript
<button onClick={() => {
  setNumber(0 + 1);
  setNumber(0 + 1);
  setNumber(0 + 1);
}}>
```

你看！这三行代码做的事情完全一模一样：
- 第一行：“React，下一次渲染请帮我把 number 准备成 `1`”；
- 第二行：“React，下一次渲染请帮我把 number 准备成 `1`”；
- 第三行：“React，下一次渲染请帮我把 number 准备成 `1`”。

调用 `setNumber` **并不是在内存中当场修改已经存在的 `number` 变量**，而是向 React 发送了一个请求，请求为**下一次渲染**准备新值！而在当次点击函数运行期间，`number` 的快照值始终是牢不可破的 `0`。

---

## 3. 跨越时间的快照：setTimeout 实验

这个快照机制在处理异步代码（例如网络请求或定时器）时表现得尤为明显。

观察下面这个稍作修改的组件：

```jsx
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(number + 5);
        setTimeout(() => {
          alert('延迟弹窗中的数字是: ' + number);
        }, 3000);
      }}>+5 并在 3 秒后弹窗</button>
    </>
  );
}
```

### 现场实验步骤：
1. 界面当前显示 `0`；
2. 点击按钮，屏幕上的大标题立刻在下一次渲染中变成了 `5`；
3. **但 3 秒钟后，弹出来的对话框显示的数字居然依然是：`0`！**

### 为什么会这样？
因为在点击事件发生的那一刻，该函数捕获的是当时那张快照（`number = 0`）。定时器闭包牢牢记住了点击发生时的快照世界，即使 3 秒钟内页面已经经历了全新的渲染并显示了 5，过去那张快照里的变量永远保持当时的记忆。

这种“快照一致性”实际上是一个**巨大的设计优势**：它保证了你的异步回调、弹窗或网络请求不会因为中途用户的其他点击而出现数据撕裂或错乱。

---

## 总结

- 设置 State 不会就地改变当前正在运行的代码中的变量值；
- 每次渲染都是一份独立的快照，当次渲染中的 State 视同常量；
- 调用 `setState` 是在为下一次渲染排队预约新状态；
- 如果你确实需要在一个事件中多次连续更新状态并基于最新结果累加，我们需要下一关要讲的“状态更新队列与更新函数”！
