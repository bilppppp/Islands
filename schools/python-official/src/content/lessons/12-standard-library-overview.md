---
title: "标准库概览：系统接口与核心工具"
slug: "standard-library-overview"
description: "探索 Python 自带电池的魅力，掌握 os 系统接口、glob 通配符、sys 命令行传参、math/random 数学计算、urllib 网络访问与 datetime 日期处理。"
order: 12
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/stdlib.md
agentInstructions: |
  能力：学员能够说出 Python“自带电池”的含义，熟练使用 os 模块进行目录与系统交互，使用 glob 进行文件模式匹配，通过 sys.argv 获取命令行参数，运用 math 和 random 进行数学计算与随机抽样，使用 urllib.request 抓取网络数据，以及使用 datetime 操作日期和时间。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/stdlib.md 的各小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/stdlib.html 。
  前置与易错点：标准库是 Python 安装后自带的庞大模块集合，使用前只需 import，完全无需额外联网 pip 安装；sys.argv 列表中第 0 个元素始终是正在运行的脚本名字本身，外部传入的第 1 个实际参数是 sys.argv[1]；os 模块用于底层系统交互，高级文件拷贝移动推荐使用 shutil 模块。
  活动：标准库工具选用与命令行解析。假设用户在终端中执行命令 `python text_cleaner.py input.txt output.txt`。请学员回答：如何在脚本内部使用 `sys` 模块拿到传入的文件名 `input.txt` 和 `output.txt`？如果想用一行代码搜索当前目录下所有的 `.txt` 文件，可以使用标准库里的哪个模块和函数？
  完成条件：学员正确指出了 sys.argv 的下标访问方法（sys.argv[1] 和 sys.argv[2]）或说出了 glob.glob('*.txt')，并收到教师针对标准库系统模块的指导反馈。
---

## 传说中的“自带电池”（Batteries Included）

在编程界，Python 最具赞誉的特色之一就是它的“**自带电池（Batteries Included）**”哲学。这意味着当你安装好 Python 解释器时，你已经免费获得了一个极其庞大、经过严格测试且跨平台兼容的**官方标准库（Standard Library）**。

无需安装任何第三方插件，只要写一行 `import 模块名`，你就能直接调用操作系统底层功能、抓取互联网网页、计算精确日期时间、压缩文件甚至执行单元测试！

在官方教程第 10 章中，我们将快速巡礼最常用的一组**系统接口与核心工具模块**。

## 1. 操作系统接口：os 与 shutil

要与当前电脑的操作系统进行交互（比如查看当前目录、执行系统命令或移动文件），使用 **`os` 模块**：

```python
>>> import os
>>> os.getcwd()      # 返回当前工作目录 (Current Working Directory)
'/Users/gravity/Desktop'
>>> os.chdir('/tmp') # 改变当前工作目录
>>> os.system('mkdir today')  # 在系统 shell 中运行命令
```

> **最佳实践提示**：
> 应该使用 `import os`，而**绝不要使用 `from os import *`**。因为 `os` 模块中包含一个名为 `open()` 的底层函数，如果盲目星号导入，它会把 Python 内置的文件读写函数 `open()` 彻底覆盖掉！

对于日常高级的日常文件和目录管理任务（如拷贝、重命名、删除整个目录树），标准库推荐使用更高层级的 **`shutil` 模块**：

```python
import shutil
shutil.copyfile('data.db', 'archive.db')
shutil.move('/src/dir', '/dst/dir')
```

## 2. 文件通配符：glob

在做批量数据或文本处理时，我们经常需要找出某个文件夹下符合特定规则的一批文件（比如“所有的 `.txt` 文件”）。**`glob` 模块**提供了基于通配符（通配符 Wildcards）的文件名查找函数：

```python
>>> import glob
>>> glob.glob('*.py')
['primes.py', 'fibo.py', 'text_analyzer.py']
```

它会返回符合模式匹配的文件名字符串列表。

## 3. 命令行参数：sys 模块

很多生产脚本需要通过命令行接受用户传入的参数，例如：
```bash
python script.py data.txt --verbose
```

这些参数会被解释器自动解析并存放在 **`sys.argv` 列表**中：

```python
import sys
print(sys.argv)
```

如果在终端运行 `python demo.py one two three`，`sys.argv` 的值会是：
```python
['demo.py', 'one', 'two', 'three']
```
- `sys.argv[0]`：始终是当前被执行的**脚本名字**；
- `sys.argv[1]`、`sys.argv[2]`...：依次是命令行后方传入的具体参数。

此外，`sys` 模块还提供了 `sys.stderr.write('错误信息\n')` 用于向标准错误流输出告警，以及 `sys.exit(0)` 用于随时安全终止程序。

## 4. 字符串模式匹配：re 模块

对于复杂的文本提取、校验（如验证邮箱、手机号或提取特定规律的单词），标准库提供了功能强大的**正则表达式（regular expressions）模块 `re`**：

```python
>>> import re
>>> re.findall(r'\bf[a-z]*', 'which foot or hand fell fastest')
['foot', 'fell', 'fastest']
>>> re.sub(r'(\b[a-z]+) \1', r'\1', 'cat in the the hat')
'cat in the hat'
```

如果仅仅是简单的字符串查找与替换，优先使用上一关学过的字符串原生方法（如 `'word' in text` 或 `text.replace()`），因为它们更加直观且性能更优。

## 5. 数学计算与随机抽样：math 与 random

### math 模块：基础数学运算
底层 C 语言精度的浮点数学库：
```python
>>> import math
>>> math.cos(math.pi / 4)
0.7071067811865476
>>> math.log(1024, 2)
10.0
```

### random 模块：随机数与概率工具
用于生成随机数、随机洗牌和概率抽样：
```python
>>> import random
>>> random.choice(['apple', 'pear', 'banana'])  # 随机挑一个
'apple'
>>> random.sample(range(100), 10)               # 不重复随机采样 10 个
[30, 83, 16, 4, 8, 81, 41, 50, 18, 33]
>>> random.random()                             # 生成 [0.0, 1.0) 随机浮点数
0.17970987693706186
```

## 6. 互联网访问：urllib.request

在 Python 中，访问互联网上的网址并抓取网页数据，甚至不需要安装任何外部库。使用内置的 **`urllib.request` 模块**即可直接打开 URL：

```python
from urllib.request import urlopen
with urlopen('http://worldtimeapi.org/api/timezone/etc/UTC.txt') as response:
    for line in response:
        line = line.decode('utf-8')  # 将接收到的二进制字节解码为字符串
        if 'datetime' in line:
            print(line.rstrip())
```

## 7. 日期与时间：datetime 模块

处理现实中的年月日、小时、分钟和时区，使用 **`datetime` 模块**。它提供了大量专门支持日期算术（加减天数）与格式化的对象：

```python
>>> from datetime import date
>>> now = date.today()
>>> now
datetime.date(2026, 10, 21)
>>> now.strftime("%m-%d-%y. %d %b %Y is a %A on the %d day of %B.")
'10-21-26. 21 Oct 2026 is a Wednesday on the 21 day of October.'

>>> # 计算生日差距：
>>> birthday = date(1964, 7, 31)
>>> age = now - birthday
>>> age.days
22727
```

## 8. 数据压缩：zlib 模块

在处理大型日志或网络传输时，常用的数据打包与解压缩格式由 **`zlib` 模块**直接提供支持：

```python
>>> import zlib
>>> s = b'witch which has which witches wrist watch'
>>> len(s)
41
>>> t = zlib.compress(s)
>>> len(t)
37
>>> zlib.decompress(t)
b'witch which has which witches wrist watch'
```

此外，标准库中还有 `gzip`、`bz2`、`zipfile` 和 `tarfile` 支持所有主流压缩包的处理。

看完了这组基础系统工具，你是不是已经深刻体会到了 Python 为什么能被称为“全能胶水语言”？在下一关中，我们将探索第 11 章——标准库中更专业的高级工具集！
