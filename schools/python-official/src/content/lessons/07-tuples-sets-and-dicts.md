---
title: "元组集合字典与循环技巧"
slug: "tuples-sets-and-dicts"
description: "掌握不可变元组与序列解包、无序去重集合及交并差运算、基于键值对映射的字典结构，以及 items()、enumerate()、zip() 等高效循环技巧。"
order: 7
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/datastructures.md
agentInstructions: |
  能力：学员能够熟练创建元组（tuple）并进行序列解包，使用集合（set）进行元素去重与集合运算（&, |, -），掌握字典（dict）的键值对存储、读取与字典推导式，并熟练运用 items()、enumerate()、zip() 进行遍历。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/datastructures.md 的「元组和序列」「集合」「字典」「循环的技巧」与「深入条件控制」小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/datastructures.html 。
  前置与易错点：单元素元组必须带有尾随逗号（如 t = (1,) 或 1,），否则只是普通带括号的数值；字典的键必须是不可变类型（如字符串、数字或元组），不能是列表；在字典上直接 for k in d 遍历的是键，要同时获取键和值需使用 for k, v in d.items()。
  活动：数据结构选型与字典遍历。给定一个由名字和分数组成的字典 `scores = {'Alice': 95, 'Bob': 88, 'Charlie': 92}`。请学员写出一段循环代码：使用 `for name, score in scores.items():` 遍历字典，打印出格式如 `Alice: 95分` 的文本；或者向学员提问：如果要快速去掉一个列表中的所有重复元素，最地道的 Python 做法是什么数据结构？
  完成条件：学员写出了遍历字典的代码或说出了使用 set 进行去重，并收到教师针对字典映射与集合特性的反馈。
---

## 丰富的数据结构武器库

除了列表，Python 标准库中还内置了三个极为重要的数据结构：
- **元组（Tuple）**：不可变的有序序列；
- **集合（Set）**：无序、唯一的元素集；
- **字典（Dictionary）**：基于键值对（Key-Value）的高效映射。

理解它们各自的特性与应用场景，是写出地道、高效 Python 代码的必经之路。

## 1. 元组和序列（Tuples）

元组由若干个被逗号隔开的值组成，通常使用圆括号 `(...)` 括起来：

```python
>>> t = 12345, 54321, 'hello!'
>>> t[0]
12345
>>> t
(12345, 54321, 'hello!')
```

### 元组的核心特性：不可变性（Immutable）
与列表不同，**元组一旦创建就不能对其中的单项赋值修改**：

```python
>>> t[0] = 88888
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
TypeError: 'tuple' object does not support item assignment
```

这使得元组非常适合用来存储“固定的一组属性”（如二维坐标 `(x, y)`、数据库的一行记录），并能保证数据不会被意外篡改。

> **构造单元素元组的语法细节**：
> 构造包含 0 个元素的空元组使用空圆括号 `()`；而构造**包含 1 个元素的元组时，必须在值后面加一个逗号**！
> ```python
> empty = ()
> singleton = 'hello',    # 注意末尾的逗号！
> len(singleton)          # 1
> ```
> 如果写成 `('hello')`，Python 会把它仅仅当作一个被括号括起来的普通字符串。

### 序列解包（Sequence Unpacking）
元组支持极其优雅的解包操作：等号左侧变量的数目与右侧元组元素数目相同时，元素会自动分配给各变量：

```python
>>> t = (12345, 54321, 'hello!')
>>> x, y, z = t
>>> x
12345
>>> z
'hello!'
```

在上一关中我们写过的 `a, b = 0, 1` 本质上就是先将右侧打包为一个元组，再解包赋给左侧的变量。

## 2. 集合（Sets）

**集合（set）**是由不重复元素组成的无序集合。它的两大主要用途是：
1. **自动去重（Membership testing / deduplication）**；
2. **执行数学上的集合运算**（如交集、并集、差集）。

可以使用**花括号 `{}`** 或 **`set()` 函数**来创建集合：

```python
>>> basket = {'apple', 'orange', 'apple', 'pear', 'orange', 'banana'}
>>> print(basket)  # 自动去除所有重复元素
{'orange', 'banana', 'pear', 'apple'}
>>> 'orange' in basket  # 极速的成员测试
True
```

> **注意**：创建空集合必须使用 `set()`，而不能使用 `{}`，因为 `{}` 被保留用来创建空字典！

### 强大的数学集合运算：
```python
>>> a = set('abracadabra')
>>> b = set('alacazam')
>>> a                                  # a 中独一无二的字母
{'a', 'r', 'b', 'c', 'd'}
>>> a - b                              # 差集：在 a 中但不在 b 中的字母
{'r', 'd', 'b'}
>>> a | b                              # 并集：在 a 或 b 中的所有字母
{'a', 'c', 'r', 'd', 'b', 'm', 'z', 'l'}
>>> a & b                              # 交集：同时在 a 和 b 中的字母
{'a', 'c'}
>>> a ^ b                              # 对称差分：在 a 或 b 中但不同时在两者的字母
{'r', 'd', 'b', 'm', 'z', 'l'}
```

集合同样支持推导式：`{x for x in 'abracadabra' if x not in 'abc'}`。

## 3. 字典（Dictionaries）

在文本处理、日志分析和配置管理中，**字典（dictionary，缩写为 `dict`）**是最不可或缺的超级工具。

字典是**基于键值对（Key-Value pairs）的映射类型**。你可以把它想象成一本真正的英汉字典：通过“英文单词（键 Key）”，能够瞬间查出对应的“中文解释（值 Value）”。

字典在大括号 `{}` 内用冒号分割键与值，各个键值对之间用逗号隔开：

```python
>>> tel = {'jack': 4098, 'sape': 4139}
>>> tel['guido'] = 4127     # 新增或修改键值
>>> tel
{'jack': 4098, 'sape': 4139, 'guido': 4127}
>>> tel['jack']             # 通过键读取对应的值
4098
>>> del tel['sape']         # 删除指定键值对
>>> list(tel)               # 获取所有键组成的列表
['jack', 'guido']
>>> 'guido' in tel          # 检查键是否存在于字典中
True
```

### 字典的键（Key）要求：
**字典的键必须是不可变（immutable）类型**！字符串和数字总是可以作为键；如果元组中只包含字符串、数字或元组，该元组也可以作为键。但**列表绝对不能作为键**，因为列表可以通过修改其元素而发生变化。

### 字典推导式（Dict Comprehensions）：
类似于列表推导式，我们可以使用字典推导式高效创建字典：

```python
>>> {x: x**2 for x in (2, 4, 6)}
{2: 4, 4: 16, 6: 36}
```

## 4. 循环技巧（Looping Techniques）

Python 为多种数据结构提供了优雅的遍历函数：

### 遍历字典：items() 方法
当在字典中循环时，使用 **`d.items()`** 可以同时取出每一个键和它对应的值：

```python
knights = {'gallahad': 'the pure', 'robin': 'the brave'}
for k, v in knights.items():
    print(k, ':', v)
```

输出：
```text
gallahad : the pure
robin : the brave
```

### 遍历序列带上下标：enumerate() 函数
当你遍历一个序列同时需要知道当前元素的从零开始的位置索引时，使用 **`enumerate()`**：

```python
for i, v in enumerate(['tic', 'tac', 'toe']):
    print(i, v)
```

### 同时遍历多个序列：zip() 函数
要同时在两个或多个序列上配对循环，使用 **`zip()`**：

```python
questions = ['name', 'quest', 'favorite color']
answers = ['lancelot', 'the holy grail', 'blue']
for q, a in zip(questions, answers):
    print(f'What is your {q}? It is {a}.')
```

### 逆向与排序遍历
- `reversed(seq)`：在不破坏原列表的前提下逆向循环；
- `sorted(seq)`：在不改变原列表的前提下返回排序后的新迭代序列。

至此，列表、元组、集合与字典这四位核心数据结构大将已悉数登场。在下一关中，我们将学习如何把代码从单一交互环境转移到正式的 `.py` 脚本文件中，掌握 Python 的**模块系统**！
