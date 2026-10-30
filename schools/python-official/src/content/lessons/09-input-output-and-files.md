---
title: "输入输出格式化与文件读写"
slug: "input-output-and-files"
description: "掌握 f-strings 格式化字符串输出、open() 函数与 with 上下文管理器安全读写文本文件，以及使用 json 模块保存和读取结构化数据。"
order: 9
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/inputoutput.md
agentInstructions: |
  能力：学员能够熟练使用格式化字符串字面值（f-strings）美化输出，掌握 open() 打开文件模式（'r', 'w', 'a'），熟练使用 with open(...) as f: 黄金法则进行安全读取与写入，并能运用 json.dumps/loads 与 json.dump/load 处理结构化数据。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/inputoutput.md 的各小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/inputoutput.html 。
  前置与易错点：使用 with open 能够在读写完毕或抛出异常时自动关闭文件句柄，避免资源泄漏；以 'w' 模式打开文件会直接清空（截断）原文件内容，追加内容需使用 'a' 模式；写入文件时 write() 接收的必须是字符串，若写入数字或列表必须先转为字符串或序列化。
  活动：文件写入与格式化代码编写。请学员编写一段代码：使用 `with open('report.txt', 'w', encoding='utf-8') as f:` 打开一个文件，使用 f-strings 向文件中写入一行格式为 `学生姓名: 张三, 得分: 98` 的文本；或者向学员提问：为什么要优先使用 with 语句而不是手工调用 f.close()？
  完成条件：学员写出了 with open 写入代码或解释了 with 自动关闭文件的安全价值，并收到教师针对文件模式与文本编码的反馈。
---

## 程序与外部世界的桥梁：输入与输出

到目前为止，我们编写的程序数据大多是“写死在代码里”的，计算结果也仅仅停留在终端屏幕上。然而，真实的生产脚本往往需要：
1. **生成格式工整的报表**；
2. **读取本地磁盘上的文本或数据文件**；
3. **将处理后的结果持久化保存到文件中**；
4. **与其他系统交换通用的结构化数据（如 JSON）**。

Python 第 7 章为我们提供了完备的**输入与输出（Input and Output）**方案。

## 1. 输出的格式化：f-strings

在 Python 3.6 之后，最现代、最推荐的格式化输出方式是**格式化字符串字面值（formatted string literals，简称 f-strings）**。

只需在字符串开头的引号前加上字母 `f` 或 `F`，并在大括号 `{...}` 内直接填入 Python 表达式或变量名，Python 就会在运行时自动求值并替换进去：

```python
>>> year = 2026
>>> event = 'Conference'
>>> f'Results of the {year} {event}'
'Results of the 2026 Conference'
```

### 高级格式修饰符
在被替换的表达式后面加上冒号 `:`，可以精确控制输出格式：
- **指定最小字段宽度与对齐**：`f'{name:10} ==> {phone:10d}'`，将文本排版为整齐的列；
- **控制浮点数小数位数**：`f'The value of pi is approximately {math.pi:.3f}.'` 会保留 3 位小数，输出 `3.142`；
- **调试利器 `=`**：`f'{x=}'` 会直接打印出 `x=42`，极为方便调试。

此外，Python 还保留了传统的 `str.format()` 方法（如 `"{} and {}".format('a', 'b')`），但在日常开发中，f-strings 更加简洁直观。

## 2. 读写文件：文件对象与 open()

要操作本地磁盘上的文件，使用内置的 **`open()` 函数**。它会返回一个文件对象：

```python
f = open('workfile.txt', 'w', encoding='utf-8')
```

### 关键参数解析：
1. **第一个参数**：文件名或文件相对/绝对路径；
2. **第二个参数（打开模式 mode）**：
   - `'r'`：**只读模式（read）**，默认值。如果文件不存在会报错 `FileNotFoundError`；
   - `'w'`：**只写模式（write）**。**极其重要**：如果文件已存在，其原有内容会被**直接彻底清空清零（截断）**；如果文件不存在则自动新建；
   - `'a'`：**追加模式（append）**。写入的数据会自动追加在文件末尾，绝不破坏原有内容；
   - `'r+'`：打开文件进行读写。
3. **第三个参数（encoding）**：**在处理文本文件时，强烈建议显式声明 `encoding="utf-8"`**，这样能彻底杜绝跨平台（Windows/macOS/Linux）因默认编码不同而导致的乱码问题。

## 3. 黄金法则：使用 with 语句管理文件

如果使用手动的 `f = open(...)`，你必须在写完后显式调用 `f.close()`。一旦中途代码抛出异常报错，程序退出时 `f.close()` 就可能没有被执行，从而导致文件锁死或数据缓冲区丢失。

官方教程给出的**绝对最佳实践**是使用 **`with` 上下文管理器语句**：

```python
with open('workfile.txt', 'r', encoding='utf-8') as f:
    read_data = f.read()

# 离开 with 缩进块后，Python 会百分之百确保文件已被自动安全关闭！
print(f.closed)  # True
```

`with` 语句保证了即使在读写文件过程中遭遇意外报错中断，操作系统底层的文件资源也会被立刻妥善释放关闭。

## 4. 读写文件常用操作

### 读取文本文件：
- **`f.read(size)`**：读取整个文件为一个大字符串。如果文件极其庞大，可以传入 `size` 限制每次读取的字节数；
- **`f.readline()`**：从文件中读取单独的一行，末尾保留换行符 `\n`。读到文件末尾时返回空字符串 `''`；
- **最高效、最内存友好的逐行遍历**：**直接对文件对象使用 `for` 循环**！

```python
with open('data.txt', 'r', encoding='utf-8') as f:
    for line in f:
        print(line, end='')
```

这种做法不会一次性把整个大文件塞入内存，而是按需流式逐行读取。

### 写入文本文件：
- **`f.write(string)`**：将一个字符串写入文件，并返回写入的字符数；
- **注意**：如果要写入数字、列表或字典，必须先将它们转为字符串（例如通过 `f.write(str(number))` 或 f-strings），否则会引发 `TypeError`！

```python
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write('第一行分析报告\n')
    f.write(f'计算总得分: {100}\n')
```

## 5. 使用 json 保存和读取结构化数据

很多时候我们内存里有一个嵌套丰富的列表或字典，直接用纯字符串写入文件很难在读取时还原数据结构。

**JSON（JavaScript Object Notation）**是目前互联网与软件工程中最通用的轻量级数据交换格式。Python 内置的 **`json` 模块**可以轻松实现数据结构与文本之间的转换：

### 内存中的字符串转换：dumps 与 loads
- **`json.dumps(obj)`**：将 Python 对象（如列表、字典）序列化为标准的 JSON 格式字符串；
- **`json.loads(json_string)`**：将 JSON 字符串反序列化还原为原生的 Python 列表或字典：

```python
>>> import json
>>> data = [1, 'simple', 'list']
>>> json_str = json.dumps(data)
>>> json_str
'[1, "simple", "list"]'
>>> json.loads(json_str)
[1, 'simple', 'list']
```

### 直接与文件对接：dump 与 load
- **`json.dump(obj, f)`**：直接将 Python 对象序列化并写入打开的文件中；
- **`json.load(f)`**：直接从文件中读取 JSON 文本并还原为 Python 对象：

```python
# 将字典持久化存入磁盘：
user_info = {'name': 'Alice', 'role': 'admin', 'tags': ['python', 'ai']}
with open('user.json', 'w', encoding='utf-8') as f:
    json.dump(user_info, f, indent=2)

# 从磁盘文件读取并恢复字典：
with open('user.json', 'r', encoding='utf-8') as f:
    loaded_user = json.load(f)
print(loaded_user['name'])  # Alice
```

掌握了文件读写与 JSON 结构化存储，我们的程序就能够与外部磁盘文件无缝协作。然而，在读写外部文件或处理用户输入时，意外报错在所难免。下一关，我们将学习如何优雅地捕获并处理**错误与异常**！
