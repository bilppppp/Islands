---
title: "错误和异常捕获处理"
slug: "errors-and-exceptions"
description: "区分句法错误与运行时异常，精通 try...except 异常捕获架构、多重异常处理、else 与 finally 清理保障以及 raise 触发异常。"
order: 10
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/errors.md
agentInstructions: |
  能力：学员能够清晰辨析句法错误（SyntaxError）与运行时异常（Exception）的区别，熟练使用 try...except 结构捕获特定异常（如 FileNotFoundError, ValueError, ZeroDivisionError），掌握捕获多个异常的元组语法与 as 绑定错误对象，理解 else 与 finally 子句的执行时机，并能使用 raise 触发异常。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/errors.md 的各小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/errors.html 。
  前置与易错点：SyntaxError 是代码写错了语法在解析阶段就会直接被拦截，无法用 try...except 捕获；而运行时异常（如文件不存在、除以零）是运行到该语句时才发生的，必须用 try...except 进行防御；finally 块内的代码无论发生什么都会百分之百执行；不要盲目写光秃秃的 except: 吞掉所有异常，这会导致严重的隐藏 Bug。
  活动：异常诊断与防御性代码编写。请学员编写一段防御性代码：尝试使用 `with open('unknown.txt', 'r', encoding='utf-8') as f:` 读取一个可能不存在的文件，使用 `try...except FileNotFoundError:` 捕获文件未找到错误，并在捕获后优雅打印一条友好的中文提示信息；或者请学员说出如果在 try 块中发生了异常，else 子句是否还会执行。
  完成条件：学员写出了 try...except 捕获文件异常的代码或正确解释了 else/finally 的执行时机，并收到教师针对异常体系与稳健性设计的反馈。
---

## 程序的稳健之道：面对错误

在编程的世界里，无论你多么细心，程序总会遇到各种意外情况：
- 用户在要求输入年龄的地方输入了英文字母；
- 程序试图打开一个被用户删除或改名的文件；
- 试图进行数学上的除以零；
- 访问了一个不存在的字典键。

如果程序一旦遇到错误就直接崩溃退出，这在生产环境中是不可接受的。Python 官方教程第 8 章为我们系统讲解了**错误和异常（Errors and Exceptions）**的应对机制。

## 1. 句法错误 vs 运行时异常

Python 中至少有两种截然不同的错误：

### 句法错误（Syntax Errors）
也被称为解析错误（parsing error）。它是指代码在语法结构上违反了 Python 的规定（比如漏写了冒号 `:`，括号没有闭合，或者多敲了非法符号）：

```python
>>> while True print('Hello world')
  File "<stdin>", line 1
    while True print('Hello world')
               ^^^^^
SyntaxError: invalid syntax
```

解释器在运行任何一行代码之前，就会对语法进行扫描解析。一旦发现句法错误，程序**甚至连启动都无法启动**。

### 运行时异常（Exceptions）
即使语句在语法上完全合规，但在**实际运行求值时**，依然可能由于环境或数据原因引发错误。这种在运行期间被检测到的错误被称为**异常（Exception）**：

- `ZeroDivisionError: division by zero`（除以零）；
- `NameError: name 'spam' is not defined`（访问未定义的变量）；
- `TypeError: can only concatenate str (not "int") to str`（类型不匹配）；
- `FileNotFoundError: [Errno 2] No such file or directory`（文件不存在）；
- `IndexError: list index out of range`（下标越界）；
- `KeyError: 'foo'`（字典中不存在该键）。

## 2. 捕获与处理异常：try...except 语句

为了防止异常导致整个程序非正常崩溃中断，我们使用 **`try...except` 语句**来主动捕获并妥善处理它们：

```python
while True:
    try:
        x = int(input("Please enter a number: "))
        break
    except ValueError:
        print("Oops! That was no valid number. Try again...")
```

### 执行流程拆解：
1. 首先执行 `try` 缩进块中的语句；
2. 如果 `try` 块内**没有发生任何异常**，`except` 分支就会被完全忽略，程序顺利往下走；
3. 如果 `try` 块执行到某一行发生异常（例如输入了字母导致 `int()` 抛出 `ValueError`），`try` 块中剩余的代码会被**立即跳过**，Python 会去匹配相应的 `except` 分支；
4. 如果发生的异常类型与 `except` 后面声明的异常名字匹配，就执行该 `except` 块中的补救代码；
5. 如果发生的异常在所有 `except` 中都没有被捕获，这个异常就会继续向外层抛出，最终导致程序报错终止并打印堆栈轨迹。

### 捕获多个异常与捕获错误对象
一个 `try` 语句可以有多个 `except` 子句，分别应对不同类型的异常；也可以把多个异常类型写成一个**元组（tuple）**合并处理：

```python
try:
    with open('data.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    value = int(content)
except (FileNotFoundError, PermissionError):
    print("文件不存在或没有权限读取！")
except ValueError:
    print("文件内容无法转换为有效整数！")
except OSError as err:
    # 使用 as 关键字将异常对象绑定到变量，打印官方底层错误信息
    print(f"OS error: {err}")
```

> **注意：不要写光秃秃的 `except:`**
> 如果写没有任何类型的裸 `except:`，它会连用户按下 `Ctrl+C` 想要中断程序的键盘信号都一起强行吞掉，这会严重掩盖真实的程序 Bug。务必明确指定要捕获的异常类型！

## 3. else 与 finally 子句

`try...except` 还可以附带另外两个强大的子句：

### 1. `else` 子句（可选）
`else` 必须跟在所有 `except` 子句之后。它只在 **`try` 块没有发生任何异常时**才会执行：

```python
for arg in sys.argv[1:]:
    try:
        f = open(arg, 'r', encoding='utf-8')
    except OSError:
        print('cannot open', arg)
    else:
        print(arg, 'has', len(f.readlines()), 'lines')
        f.close()
```

将仅需在正常情况下执行的代码放在 `else` 块中，可以避免在 `try` 块中放过多语句而意外捕获到非预期的异常。

### 2. `finally` 清理子句（可选）
`finally` 放在整个异常处理结构的最末尾。**无论前面是否发生异常、是否捕获成功，甚至即使前面执行了 `return`、`break` 语句，`finally` 块中的代码都必定会被百分之百执行**：

```python
def divide(x, y):
    try:
        result = x / y
    except ZeroDivisionError:
        print("division by zero!")
    else:
        print("result is", result)
    finally:
        print("executing finally clause")

divide(2, 1)
# 输出:
# result is 2.0
# executing finally clause

divide(2, 0)
# 输出:
# division by zero!
# executing finally clause
```

`finally` 常用于必须关闭的网络连接、释放锁或临时文件清理等兜底收尾工作。

## 4. 主动抛出异常：raise 语句

不仅解释器会自动抛出异常，你在编写自己的逻辑时，一旦发现传入的数据不符合业务规则，也可以使用 **`raise` 语句**主动抛出一个异常：

```python
def validate_age(age):
    if age < 0:
        raise ValueError("年龄不能为负数！")
    return age
```

还可以定义自己的专用异常类，只需让它继承自标准库的 `Exception` 类即可。

学会了错误与异常的捕获和防御，我们的代码就具备了抵御意外风浪的坚固护甲。在下一关中，我们将探索现代编程中最为重要的范式之一——**类与面向对象编程**！
