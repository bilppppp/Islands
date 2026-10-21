---
title: "条件分支与循环控制"
slug: "control-flow-tools"
description: "掌握 Python 核心流程控制语句：if/elif/else 条件分支与 4 空格缩进，for 循环遍历序列，range() 算术级数生成器，以及 break、continue、else 循环子句与 match 模式匹配。"
order: 4
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/controlflow.md
agentInstructions: |
  能力：学员能够熟练使用 if/elif/else 编写分支判断，掌握 Python 严格的 4 空格缩进与冒号规范，掌握 for 循环遍历序列与 range() 生成算术序列，理解 break、continue 以及循环的 else 子句行为，并了解 match 模式匹配基础。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/controlflow.md 的「if 语句」「for 语句」「range() 函数」「break 和 continue 语句」「循环的 else 子句」「pass 语句」与「match 语句」。原始文档：https://docs.python.org/zh-cn/3/tutorial/controlflow.html 。
  前置与易错点：Python 的 for 循环不是计数器循环，而是原生遍历任意序列的元素；range(10) 生成 0 到 9 十个数字，绝不包含 10；循环的 else 子句只在循环自然结束、未被 break 打断时触发；比较相等使用 ==，单等号 = 是赋值。
  活动：流程分支与循环推导。给定列表 `words = ['cat', 'window', 'defenestrate']`。请学员写出一段循环代码：使用 `for w in words:` 遍历单词，配合 `if len(w) > 5:` 打印出长单词及其长度；或者请学员预测执行 `for i in range(2, 8, 2):` 时依次打印出的数字。
  完成条件：学员写出了循环分支代码或正确预测了 range 的生成序列，并收到教师针对循环逻辑与缩进格式的反馈。
---

## 认识流程控制（Control Flow）

在真实的软件系统中，程序不能只是一条道走到黑，它必须具备“思考与判断”的能力（遇到不同条件走不同路径），以及“高效重复执行”的能力（批量遍历海量数据）。Python 提供了直观且功能完备的**流程控制工具集**。

## 1. if 语句：条件分支

最基础的决策工具是 **`if` 语句**：

```python
x = int(input("Please enter an integer: "))

if x < 0:
    x = 0
    print('Negative changed to zero')
elif x == 0:
    print('Zero')
elif x == 1:
    print('Single')
else:
    print('More')
```

### 核心要素：
- `if`：检查第一个条件；
- `elif`：是 "else if" 的缩写，可有零个或多个，用于避免过深的多层嵌套缩进；
- `else`：可选的兜底分支，在前面所有条件都不满足时执行；
- **强制缩进规则**：每一个分支判断行必须以英文冒号 `:` 结尾；冒号下方属于该分支的代码块必须统一向右缩进（官方标准是 4 个空格）。缩进对齐的代码属于同一个逻辑块，不再需要其他语言中的大括号 `{}`。

## 2. for 语句：原生序列遍历

Python 的 **`for` 语句**与 C 或 Java 等语言非常不同。它不依赖手工维护的下标递增计数器，而是**直接在列表、字符串等任意序列的元素上迭代**，按照它们在序列中出现的顺序依次取出：

官方教程展示了度量一组单词长度的经典例子：

```python
# 度量一些字符串：
words = ['cat', 'window', 'defenestrate']

for w in words:
    print(w, len(w))
```

输出：

```text
cat 3
window 6
defenestrate 12
```

注意：在迭代遍历某个集合的同时，如果还要直接从该集合中删除或添加元素，极易引发难以排查的逻辑错误。官方教程推荐的最佳实践是：**迭代该集合的一个副本（如 `users.copy()`），或者在循环中将结果收集到一个全新集合中**。

## 3. range() 函数：算术序列生成器

如果你需要遍历一个数字序列，或者固定重复执行某段操作多次，内置的 **`range()` 函数**是最佳利器：

```python
for i in range(5):
    print(i)
```

输出：

```text
0
1
2
3
4
```

### range() 的核心规则：
1. **左闭右开**：生成的序列绝不会包括给定的终止值，`range(10)` 生成从 `0` 到 `9` 共 10 个整数，恰好对应长度为 10 的列表的所有合法索引；
2. **灵活参数**：
   - 指定起点和终点：`list(range(5, 10))` 得到 `[5, 6, 7, 8, 9]`；
   - 指定步长（递增或负数递减）：`list(range(0, 10, 3))` 得到 `[0, 3, 6, 9]`，`list(range(-10, -100, -30))` 得到 `[-10, -40, -70]`；
3. **配合 len() 迭代序列下标**：
   ```python
   a = ['Mary', 'had', 'a', 'little', 'lamb']
   for i in range(len(a)):
       print(i, a[i])
   ```
4. **可迭代对象（iterable）特性**：
   直接打印 `range(10)` 并不会显示一个大列表，而是一个 `range(0, 10)` 对象。它只在被循环遍历时才会按需逐个产生条目，这种节省内存的对象被称为**可迭代对象（iterable）**。像 `sum(range(4))` 这样接受可迭代对象的内置函数可以直接对其求和得到 `6`。

## 4. break 与 continue 语句

在循环运行途中，我们可以改变执行流程：
- **`break`**：立刻跳出最近的一层 `for` 或 `while` 循环；
- **`continue`**：跳过当前这一轮迭代的剩余语句，直接开始下一轮循环。

## 5. 循环的 else 子句

Python 的循环带有一个非常独特且实用的设计——**循环可以带 `else` 子句**！

```python
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(n, 'equals', x, '*', n//x)
            break
    else:
        # 内部循环遍历完毕，未曾遭遇 break
        print(n, 'is a prime number')
```

**理解关键**：循环的 `else` 子句只有在**整个循环正常执行完毕且未被 `break` 打断时**才会执行。如果循环中途触发了 `break`，`else` 就会被直接跳过。它常用于在遍历搜索数据时执行“未找到”的兜底逻辑。

## 6. pass 语句

`pass` 语句不执行任何动作。在语法上需要一条语句，但程序暂时不需要执行任何操作时，可以用它作为占位符：

```python
while True:
    pass  # 无限循环，等待键盘中断 Ctrl+C
```

## 7. match 语句：模式匹配初探

Python 3.10 引入了现代模式匹配 **`match` 语句**。它不仅可以替代传统的 `switch/case`，还能解构解包数据：

```python
def http_error(status):
    match status:
        case 400:
            return "Bad request"
        case 404:
            return "Not found"
        case 418:
            return "I'm a teapot"
        case _:
            # 单下划线 _ 是通配符，必定匹配成功
            return "Something's wrong with the internet"
```

你可以使用 `|` 将多个字面值组合在一起（如 `case 401 | 403 | 404:`），还可以匹配元组或类的属性。

掌握了条件与循环，我们已经能够控制复杂的执行逻辑。下一关，我们将学习如何将一段逻辑封装为可重复调用的**自定义函数**！
