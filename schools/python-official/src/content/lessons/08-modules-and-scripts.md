---
title: "模块与脚本执行架构"
slug: "modules-and-scripts"
description: "掌握将 Python 代码组织为 .py 模块与脚本、使用 import 与 from 导入、理解 sys.path 搜索路径及 if __name__ == '__main__' 执行入口保护。"
order: 8
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/modules.md
agentInstructions: |
  能力：学员能够理解模块（module）的概念，使用文本编辑器创建以 .py 为扩展名的模块文件，使用 import、from...import 以及 as 别名导入函数与变量，理解模块私有符号表，掌握 sys.path 搜索路径，并精通 if __name__ == '__main__': 保护机制。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/modules.md 的各小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/modules.html 。
  前置与易错点：退出 Python 解释器后定义的函数与变量会全部丢失，因此工程代码必须保存在 .py 文件中；直接以脚本运行文件时，__name__ 变量被设置为 '__main__'；作为模块导入时，__name__ 则是该模块的文件名；应避免使用 from module import *，以免污染当前命名空间。
  活动：模块设计与入口分析。官方教程通过创建 `fibo.py` 展示了模块导入与脚本运行。请学员回答：如果我们有一个文件叫 `text_tool.py`，里面定义了函数 `clean_text()`，在同一个目录下的另一个脚本中该如何导入并调用它？如果在 `text_tool.py` 末尾加上了 `if __name__ == '__main__':`，这段保护语句的作用是什么？
  完成条件：学员写出了 import 或 from 导入语法，并解释了 __name__ 保护块的作用，收到教师关于模块化与脚本架构的反馈。
---

## 为什么需要模块（Modules）？

当你使用 `quit()` 退出 Python 交互模式后，之前你在 `>>>` 中敲过的所有变量、计算结果与自定义函数，**都会瞬间灰飞烟灭**！

随着程序越来越复杂，你不可能每次都重新敲一遍代码。为了让代码能够被**永久保存、随时编辑修改，并能被其他不同的程序反复调用**，我们需要将代码写进纯文本文件中——这就是编写**脚本（script）**与**模块（module）**。

## 1. 什么是模块？

**模块就是一个以 `.py` 为扩展名的纯文本文件**。该文件的基本名字就是模块的名字。

例如，官方教程让我们用文本编辑器在当前工作目录下创建一个名为 `fibo.py` 的文件，并在里面写入我们在前面学到的斐波那契函数：

```python
# fibo.py 斐波那契数列模块文件

def fib(n):
    """打印小于 n 的斐波那契数列"""
    a, b = 0, 1
    while a < n:
        print(a, end=' ')
        a, b = b, a + b
    print()

def fib2(n):
    """返回小于 n 的斐波那契数列列表"""
    result = []
    a, b = 0, 1
    while a < n:
        result.append(a)
        a, b = b, a + b
    return result
```

## 2. 导入模块的方式

在 `fibo.py` 所在的同级目录下启动 Python 解释器，我们就可以通过 **`import` 语句**将这个模块引入当前环境：

### 方式一：直接 import 模块名
```python
>>> import fibo
```
此操作不会把 `fibo` 中定义的函数直接扔进当前的全局变量中，而是将模块名字 `fibo` 引入当前命名空间。你可以通过 `模块名.函数名` 的形式清晰调用它：

```python
>>> fibo.fib(1000)
0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987
>>> fibo.fib2(100)
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
>>> fibo.__name__
'fibo'
```

### 方式二：from 模块名 import 函数名
如果你频繁使用某个特定函数，不想每次都前置输入 `fibo.`，可以直接从模块中提取该函数：

```python
>>> from fibo import fib, fib2
>>> fib(500)
0 1 1 2 3 5 8 13 21 34 55 89 144 233 377
```

### 方式三：使用 as 设置别名
为了避免名称过长或同名冲突，可以在导入时使用 `as` 关键字绑定自定义别名：

```python
>>> import fibo as fb
>>> fb.fib(500)

>>> from fibo import fib2 as fib_list
>>> fib_list(50)
```

> **注意：避免使用 `from module import *`**
> 星号 `*` 导入会把该模块中所有不以下划线开头的名称一股脑全倒进当前环境，这极易意外覆盖掉你之前定义过的同名变量，导致令人抓狂的暗病。除了临时在交互式终端里少敲几个字，在正式脚本中严禁滥用星号导入！

## 3. 黄金模式：以脚本方式执行模块

很多时候，我们希望一个 `.py` 文件既能像普通程序一样在命令行直接被执行，又能作为模块被别的程序安全地 `import` 引用。

官方教程给出了一个被全球 Python 开发者奉为圭臬的经典结构——在文件末尾添加：

```python
if __name__ == "__main__":
    import sys
    fib(int(sys.argv[1]))
```

### 底层原理拆解：
每一个 Python 模块在加载时，解释器都会在内部自动为它维护一个全局隐式变量 **`__name__`**：
1. **当直接以脚本方式运行该文件时**（例如在终端执行 `python fibo.py 50`）：
   Python 会将当前文件的 `__name__` 赋值为字符串 `"__main__"`。因此，`if __name__ == "__main__":` 条件成立，它下方的命令行解析与运行测试逻辑就会被触发！
2. **当该文件被别人通过 `import fibo` 导入时**：
   此时它的 `__name__` 依然保持模块自己的名字 `'fibo'`，而不是 `"__main__"`。因此，该 `if` 分支内部的代码完全不会被执行！别人可以放心地复用你定义的函数，不会产生任何多余的副效应。

## 4. 模块搜索路径（sys.path）

当你写下 `import foo` 时，Python 解释器究竟去哪里寻找 `foo.py` 呢？

解释器会按照以下顺序在 **`sys.path`** 变量所指定的目录列表中逐一检索：
1. **当前运行脚本所在的目录**（或交互提示符启动时的当前目录）；
2. 操作系统环境变量 **`PYTHONPATH`** 所包含的目录；
3. Python 安装时的**默认标准库与第三方包目录**（如 `site-packages`）。

`sys.path` 是一个普通的 Python 字符串列表，在运行时你可以通过 `sys.path.append('/your/custom/dir')` 动态添加新的搜索路径。

此外，为了加速后续加载，Python 会把编译后的字节码自动缓存到同目录下的 **`__pycache__`** 文件夹中（以 `.pyc` 格式存放）。

## 5. dir() 函数：自省利器

内置函数 **`dir()`** 可以列出一个模块所定义的所有符号名称（包括函数、变量与导入的模块）：

```python
>>> import fibo
>>> dir(fibo)
['__name__', 'fib', 'fib2']
```

如果不传任何参数，`dir()` 会列出当前交互作用域内所有已经被定义的变量与函数名。

掌握了模块化架构与 `if __name__ == '__main__':` 守护机制，我们的代码就具备了工程级复用的骨架。在下一关中，我们将学习如何让程序与外部世界交流——**输入输出格式化与本地文件读写**！
