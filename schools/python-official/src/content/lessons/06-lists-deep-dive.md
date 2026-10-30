---
title: "深入列表与列表推导式"
slug: "lists-deep-dive"
description: "全面掌握列表核心方法，学习将列表用作堆栈与队列，精通表达力极强的列表推导式与 del 语句机制。"
order: 6
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/datastructures.md
agentInstructions: |
  能力：学员能够熟练使用列表的常用方法（append, extend, insert, remove, pop, index, count, sort, reverse），掌握列表用作后进先出（LIFO）堆栈的操作，精通列表推导式（list comprehensions）的编写与嵌套，并理解 del 语句按索引或切片删除的规则。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/datastructures.md 的「列表的更多方法」「列表用作堆栈」「列表推导式」「嵌套的列表推导式」与「del 语句」。原始文档：https://docs.python.org/zh-cn/3/tutorial/datastructures.html 。
  前置与易错点：列表方法如 sort() 和 reverse() 都是在原地修改列表，返回 None，不能写出 a = a.sort() 这样的错误代码；列表推导式 [expr for x in seq if cond] 是生成新列表的声明式语法，能大幅减少多行临时循环与 append 样板代码；del 按位置删除，pop 会返回被删掉的元素。
  活动：列表推导式编写与对比。给定一个单词列表 `words = ['hello', 'world', 'python', 'ai', 'data']`。请学员使用列表推导式写出一行代码：将所有长度大于 3 的单词转为大写（使用 `.upper()`）并组成新列表；或者请学员说出使用列表作为堆栈时，入栈（push）和出栈（pop）分别对应列表的哪两个方法。
  完成条件：学员写出了列表推导式代码，或正确指出了堆栈的 append 与 pop 方法，并收到教师针对列表原地修改与推导式执行过程的反馈。
---

## 列表进阶：常用方法全景

在前面的课程中，我们已经见识了列表的基础索引与 `append()` 追加。但在实际工程与文本清洗中，我们需要对列表执行更丰富的增、删、查、改操作。Python 为列表对象提供了极其完备的**内置方法（methods）**。

### 核心方法一览表
假设已有列表 `fruits = ['orange', 'apple', 'pear', 'banana', 'kiwi', 'apple', 'banana']`：

1. **`list.append(x)`**：在列表末尾添加一个元素。等价于 `a[len(a):] = [x]`；
2. **`list.extend(iterable)`**：通过追加可迭代对象中的所有元素来扩展列表。例如 `fruits.extend(['grape', 'peach'])`，注意它与 `append` 的区别：`append` 把整个参数作为一个单一对象塞入末尾，而 `extend` 会把参数里的元素逐个解开放进去；
3. **`list.insert(i, x)`**：在指定位置插入一个元素。`fruits.insert(0, 'mango')` 将芒果插入到列表最开头（0 号位）；
4. **`list.remove(x)`**：从列表中删除第一个值为 `x` 的条目。若找不到指定值，则引发 `ValueError`；
5. **`list.pop([i])`**：**删除指定位置的元素并返回该元素**。如果不指定参数 `i`，默认删除并返回**最后一个元素**；
6. **`list.clear()`**：清空列表中的所有元素，等价于 `del a[:]`；
7. **`list.index(x[, start[, end]])`**：返回列表中第一个值为 `x` 的元素的从零开始的下标；
8. **`list.count(x)`**：统计元素 `x` 在列表中出现的总次数；
9. **`list.sort(*, key=None, reverse=False)`**：**在原地对列表元素进行排序**；
10. **`list.reverse()`**：**在原地反转列表中的元素顺序**；
11. **`list.copy()`**：返回列表的一个浅拷贝，等价于 `a[:]`。

> **重要心智模型：原地修改返回 None**
> 像 `sort()` 和 `reverse()` 这样在原地修改列表内容的方法，它们的**返回值都是 `None`**！
> 千万不要写 `fruits = fruits.sort()`，这会把变量直接变成 `None`。

## 列表用作堆栈（Stack）

**堆栈（stack）**是计算机科学中最经典的数据结构之一，其核心原则是**后进先出（LIFO, Last-In, First-Out）**——最后放入的元素最先被取出，就像一叠叠起来的盘子。

Python 的列表方法使得将列表用作堆栈极其简单自然：
- **入栈（push）**：使用 `stack.append(x)` 将新元素压入栈顶（列表末尾）；
- **出栈（pop）**：使用 `stack.pop()` 将栈顶最后放入的元素弹出来并返回：

```python
>>> stack = [3, 4, 5]
>>> stack.append(6)
>>> stack.append(7)
>>> stack
[3, 4, 5, 6, 7]
>>> stack.pop()
7
>>> stack
[3, 4, 5, 6]
>>> stack.pop()
6
>>> stack.pop()
5
>>> stack
[3, 4]
```

由于 `append()` 和 `pop()` 都在列表末尾进行，操作效率极高。

## 列表推导式（List Comprehensions）

在日常编程中，我们经常需要创建一个新列表，里面的每个元素都是对另一个序列中各条目执行某种运算或筛选的结果。

比如，我们要计算 0 到 9 的平方数列表，传统写法是：

```python
squares = []
for x in range(10):
    squares.append(x**2)
```

这种写法不仅冗长，而且循环结束后变量 `x` 还会残留在当前作用域中。

Python 提供了极具表现力且广受欢迎的声明式语法——**列表推导式（list comprehension）**：

```python
squares = [x**2 for x in range(10)]
```

一行代码搞定！干净、优雅且执行效率更高。

### 结合 if 条件过滤
列表推导式的通用结构由方括号包围，包含一个表达式，其后紧随一个 `for` 子句，还可以有零个或多个 `for` 或 `if` 子句：

```python
# 筛选出长度大于 3 的单词，并将它们转为大写：
words = ['cat', 'window', 'dog', 'defenestrate']
long_upper_words = [w.upper() for w in words if len(w) > 3]
print(long_upper_words)
# 输出: ['WINDOW', 'DEFENESTRATE']
```

它等价于：
```python
long_upper_words = []
for w in words:
    if len(w) > 3:
        long_upper_words.append(w.upper())
```

### 多重 for 子句与平铺
列表推导式还可以在内部并列多个 `for` 子句：

```python
>>> [(x, y) for x in [1, 2, 3] for y in [3, 1, 4] if x != y]
[(1, 3), (1, 4), (2, 3), (2, 1), (2, 4), (3, 1), (3, 4)]
```

### 嵌套的列表推导式
列表推导式还可以相互嵌套，常用于矩阵变换。例如对一个 $3 \times 4$ 的矩阵进行转置（行变成列）：

```python
matrix = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
]

transposed = [[row[i] for row in matrix] for i in range(4)]
print(transposed)
# 输出: [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]]
```

## del 语句：按索引或切片删除

前面学到的 `pop()` 方法会返回被删除的值。如果你仅仅想要从列表中彻底抹除某一个条目或某一段切片，可以使用 **`del` 语句**：

```python
>>> a = [-1, 1, 66.25, 333, 333, 1234.5]
>>> del a[0]     # 删除 0 号位
>>> a
[1, 66.25, 333, 333, 1234.5]
>>> del a[2:4]   # 切片删除下标 2 和 3
>>> a
[1, 66.25, 1234.5]
>>> del a[:]     # 清空整个列表内容
>>> a
[]
```

`del` 甚至可以直接删除整个变量名：`del a`，之后再次访问 `a` 就会触发 `NameError`。

掌握了列表的高级操作与列表推导式，我们处理批量数据的效率将成倍飞跃。下一关，我们将探索 Python 的其他核心数据结构：元组、集合与字典！
