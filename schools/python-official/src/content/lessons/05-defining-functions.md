---
title: "函数定义与参数机制"
slug: "defining-functions"
description: "深入掌握 def 语法定义函数、文档字符串规范、局部作用域与 return 语句，掌握默认参数陷阱、关键字参数、解包及 Lambda 表达式。"
order: 5
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/controlflow.md
agentInstructions: |
  能力：学员能够熟练使用 def 关键字定义函数，撰写 docstring 文档字符串，深刻区分 return 返回值与 print 屏幕输出，掌握默认值参数并规避“可变默认参数在调用间共享”的经典陷阱，掌握关键字参数与 *args、**kwargs 解包机制。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/controlflow.md 的「定义函数」与「函数定义详解」各小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/controlflow.html 。
  前置与易错点：函数内部创建的变量属于局部变量；print() 只是显示文字，函数若无 return 语句默认返回 None；默认值参数只在函数定义时求值一次，如果默认值是可变对象（如列表 L=[]），多次调用会累积共享该列表，推荐写法是用 L=None 并在函数体内判断。
  活动：函数设计与参数辨析。官方教程展示了打印数列的 `fib(n)` 到返回列表的 `fib2(n)` 的演进。请学员编写一个函数 `def filter_words(words, min_len=4):`，要求返回包含所有长度大于等于 `min_len` 的单词的新列表，并写出包含文档字符串的完整函数代码；或者请学员解释 `def append_to(item, target=[]):` 为什么在多次调用时会产生预期之外的累积。
  完成条件：学员写出了带 return 的过滤函数，或解释了可变默认参数的陷阱原理，并收到教师关于函数封装与参数机制的反馈。
---

## 为什么要定义函数（Function）？

当程序规模变大时，如果一段重复的计算逻辑在代码各处复制粘贴，一旦需要修改就会引发灾难性的维护成本。**函数（function）**是编程中最重要的抽象工具：**它将一段具有明确输入与输出的独立逻辑封装在一起，起一个名字，供随时调用**。

## 1. 使用 def 关键字定义函数

在 Python 中，使用关键字 **`def`**（define 的缩写）来创建函数：

```python
def fib(n):
    """Print a Fibonacci series less than n."""
    a, b = 0, 1
    while a < n:
        print(a, end=' ')
        a, b = b, a + b
    print()

# 调用我们定义的函数：
fib(2000)
```

输出：

```text
0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597
```

### 核心解构：
1. **函数签名**：`def fib(n):`，以 `def` 开头，后跟函数名和圆括号内的**形参列表（parameters）**，行末紧跟冒号；
2. **函数体缩进**：冒号下方属于函数内部的所有语句必须统一向右缩进 4 个空格；
3. **文档字符串（docstring）**：函数内部的第一条语句如果是一个多行字符串 `"""..."""`，它会被自动识别为文档字符串。它是对该函数功能、参数与返回值的权威说明，可以通过 `help(fib)` 或开发工具直接查阅，编写清晰的 docstring 是专业开发者的标志性习惯；
4. **函数也是第一类对象**：函数名 `fib` 实际上指向了一个可调用的函数对象。你可以把它赋值给其他变量（如 `f = fib`），然后使用 `f(100)` 来调用它。

## 2. 关键心智模型：print() 与 return 的根本差异

初学者经常混淆“屏幕打印”与“函数返回”：
- **`print()`**：纯粹是向屏幕输出字符给人眼阅读。外层的调用代码根本“拿不到”这个值；
- **`return`**：是把计算生成的数据“交还”给调用方。外部可以用变量承接这个结果，并进行后续存储或二次计算；
- **没有 return 的函数**：如果函数执行完毕没有遇到任何 `return` 语句，Python 会默认默默返回内置特殊对象 **`None`**（表示“空”）。

官方教程通过对比 `fib(n)` 与 `fib2(n)` 深刻阐明了这一点：

```python
def fib2(n):
    """Return a list containing the Fibonacci series up to n."""
    result = []
    a, b = 0, 1
    while a < n:
        result.append(a)
        a, b = b, a + b
    return result

# 调用它并用变量接收返回值：
f100 = fib2(100)
print(f100)
```

输出：

```text
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
```

此时，`f100` 是一个真正的列表对象，你可以对它求 `len(f100)` 或进行切片筛选。

## 3. 函数参数详解

Python 拥有极其灵活多样的传参机制：

### 默认值参数（Default Argument Values）
可以为形参指定默认值，调用时如果省略该参数，则自动采用默认值：

```python
def ask_ok(prompt, retries=4, reminder='Please try again!'):
    while True:
        reply = input(prompt)
        if reply in {'y', 'ye', 'yes'}:
            return True
        if reply in {'n', 'no', 'nop', 'nope'}:
            return False
        retries = retries - 1
        if retries < 0:
            raise ValueError('invalid user response')
        print(reminder)
```

> **重要陷阱：可变默认参数只在函数定义时求值一次！**
> 如果默认值是一个可变对象（如列表 `L=[]`），后续多次调用会共享并累积同一个列表：
> ```python
> def f(a, L=[]):
>     L.append(a)
>     return L
> print(f(1))  # [1]
> print(f(2))  # [1, 2] -- 发生了累积！
> ```
> **官方推荐的安全写法**：默认值设为 `None`，并在函数体内动态创建新列表：
> ```python
> def f(a, L=None):
>     if L is None:
>         L = []
>     L.append(a)
>     return L
> ```

### 关键字参数（Keyword Arguments）
调用函数时，可以通过 `形参名=值` 的方式明确指定实参，无需死记位置顺序：

```python
def parrot(voltage, state='a stiff', action='voom', type='Norwegian Blue'):
    print("-- This parrot wouldn't", action, end=' ')
    print("if you put", voltage, "volts through it.")

# 合法调用方式：
parrot(1000)                                  # 1 个位置参数
parrot(voltage=1000)                          # 1 个关键字参数
parrot(voltage=1000000, action='VOOOOOM')     # 2 个关键字参数
parrot('a thousand', state='pushing up daisies') # 位置参数必须在关键字参数之前
```

### 任意实参列表：*args 与 **kwargs
- **`*args`**：将多余传入的位置参数打包为一个**元组（tuple）**；
- **`**kwargs`**：将多余传入的关键字参数打包为一个**字典（dict）**：

```python
def cheeseshop(kind, *arguments, **keywords):
    print("-- Do you have any", kind, "?")
    for arg in arguments:
        print(arg)
    for kw in keywords:
        print(kw, ":", keywords[kw])
```

### 解包实参列表（Unpacking Argument Lists）
如果你手头已经有一个列表或元组，想把它解开当成独立的位置参数传给函数，可以在前面加一个星号 `*`；如果是一个字典，可以使用两个星号 `**` 解包为关键字参数：

```python
args = [3, 6]
list(range(*args))  # 等价于 range(3, 6)
```

### Lambda 表达式
可以使用 `lambda` 关键字创建小巧的单行匿名函数，常用于排序键值：

```python
pairs = [(1, 'one'), (2, 'two'), (3, 'three'), (4, 'four')]
pairs.sort(key=lambda pair: pair[1])
```

掌握了函数及其传参体系，我们已经能够将代码组织得井井有条。下一关，我们将深入 Python 丰富的数据结构，掌握堆栈、队列、推导式与字典的高效用法！
