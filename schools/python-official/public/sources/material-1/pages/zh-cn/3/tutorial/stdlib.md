<!-- source: https://docs.python.org/zh-cn/3/tutorial/stdlib.html -->
<!-- retrieved: 2026-10-21; tool: siteone-crawler 2.5.1; prefix: /zh-cn/3/tutorial -->

# 10. 标准库概览¶(brief-tour-of-the-standard-library "Link to this heading")

## 10.1. 操作系统接口¶(operating-system-interface "Link to this heading")

[`os`](../library/os.md#module-os "os: Miscellaneous operating system interfaces.") 模块提供了许多与操作系统交互的函数:

```
>>> import os
>>> os.getcwd()      # 返回当前工作目录
'C:\\Python315'
>>> os.chdir('/server/accesslogs')   # 改变当前工作目录
>>> os.system('mkdir today')   # 在系统 shell 中运行 mkdir 命令
0
```
一定要使用 `import os` 而不是 `from os import *` 。这将避免内建的 [`open()`](../builtins/functions.md#open "open") 函数被 [`os.open()`](../library/os.md#os.open "os.open") 隐式替换掉，因为它们的使用方式大不相同。

内置的 [`dir()`](../builtins/functions.md#dir "dir") 和 [`help()`](../builtins/functions.md#help "help") 函数可用作交互式辅助工具，用于处理大型模块，如 [`os`](../library/os.md#module-os "os: Miscellaneous operating system interfaces."):

```
>>> import os
>>> dir(os)
<返回由模块的所有函数组成的列表>
>>> help(os)
<返回根据模块文档字符串创建的详细说明页面>
```
对于日常文件和目录管理任务，[`shutil`](../library/shutil.md#module-shutil "shutil: High-level file operations, including copying.") 模块提供了更易用的高层级接口:

```
>>> import shutil
>>> shutil.copyfile('data.db', 'archive.db')
'archive.db'
>>> shutil.move('/build/executables', 'installdir')
'installdir'
```
## 10.2. 文件通配符¶(file-wildcards "Link to this heading")

[`glob`](../library/glob.md#module-glob "glob: Unix shell style pathname pattern expansion.") 模块提供了一个在目录中使用通配符搜索创建文件列表的函数:

```
>>> import glob
>>> glob.glob('*.py')
['primes.py', 'random.py', 'quote.py']
```
## 10.3. 命令行参数¶(command-line-arguments "Link to this heading")

通用工具脚本往往需要处理命令行参数。 这些参数以列表形式存储在 [`sys`](../library/sys.md#module-sys "sys: Access system-specific parameters and functions.") 模块的 *argv* 属性中。 举例来说，让我们查看下面的 `demo.py` 文件:

```
# 文件 demo.py
import sys
print(sys.argv)
```
以下是在命令行中运行 `python demo.py one two three` 输出的结果:

```
['demo.py', 'one', 'two', 'three']
```
[`argparse`](../library/argparse.md#module-argparse "argparse: Command-line option and argument parsing library.") 模块提供了一种更复杂的机制来处理命令行参数。 以下脚本可提取一个或多个文件名并可选择要显示的行数:

```
import argparse

parser = argparse.ArgumentParser(
    prog='top',
    description='Show top lines from each file')
parser.add_argument('filenames', nargs='+')
parser.add_argument('-l', '--lines', type=int, default=10)
args = parser.parse_args()
print(args)
```
当通过 `python top.py --lines=5 alpha.txt beta.txt` 在命令行运行时，该脚本会将 `args.lines` 设为 `5` 并将 `args.filenames` 设为 `['alpha.txt', 'beta.txt']`。

## 10.4. 错误输出重定向和程序终止¶(error-output-redirection-and-program-termination "Link to this heading")

[`sys`](../library/sys.md#module-sys "sys: Access system-specific parameters and functions.") 模块还具有 *stdin* ， *stdout* 和 *stderr* 的属性。后者对于发出警告和错误消息非常有用，即使在 *stdout* 被重定向后也可以看到它们:

```
>>> sys.stderr.write('Warning, log file not found starting a new one\n')
Warning, log file not found starting a new one
```
终止脚本的最直接方法是使用 `sys.exit()` 。

## 10.5. 字符串模式匹配¶(string-pattern-matching "Link to this heading")

[`re`](../library/re.md#module-re "re: Regular expression operations.") 模块为高级字符串处理提供正则表达式工具。对于复杂的匹配和操作，正则表达式提供简洁，优化的解决方案:

```
>>> import re
>>> re.findall(r'\bf[a-z]*', 'which foot or hand fell fastest')
['foot', 'fell', 'fastest']
>>> re.sub(r'(\b[a-z]+) \1', r'\1', 'cat in the the hat')
'cat in the hat'
```
当只需要简单的功能时，首选字符串方法因为它们更容易阅读和调试:

```
>>> 'tea for too'.replace('too', 'two')
'tea for two'
```
## 10.6. 数学¶(mathematics "Link to this heading")

[`math`](../library/math.md#module-math "math: Mathematical functions \(sin\(\) etc.\).") 模块提供对用于浮点数学运算的下层 C 库函数的访问:

```
>>> import math
>>> math.cos(math.pi / 4)
0.70710678118654757
>>> math.log(1024, 2)
10.0
```
[`random`](../library/random.md#module-random "random: Generate pseudo-random numbers with various common distributions.") 模块提供了进行随机选择的工具:

```
>>> import random
>>> random.choice(['apple', 'pear', 'banana'])
'apple'
>>> random.sample(range(100), 10)   # 无放回抽样
[30, 83, 16, 4, 8, 81, 41, 50, 18, 33]
>>> random.random()    # [0.0, 1.0) 区间的随机浮点数
0.17970987693706186
>>> random.randrange(6)    # 从 range(6) 中随机选取的整数
4
```
[`statistics`](../library/statistics.md#module-statistics "statistics: Mathematical statistics functions") 模块计算数值数据的基本统计属性（均值，中位数，方差等）:

```
>>> import statistics
>>> data = [2.75, 1.75, 1.25, 0.25, 0.5, 1.25, 3.5]
>>> statistics.mean(data)
1.6071428571428572
>>> statistics.median(data)
1.25
>>> statistics.variance(data)
1.3720238095238095
```
SciPy项目 <[https://scipy.org](https://scipy.org/)> 有许多其他模块用于数值计算。

## 10.7. 互联网访问¶(internet-access "Link to this heading")

有许多模块可用于访问互联网和处理互联网协议。其中两个最简单的 [`urllib.request`](../library/urllib.request.md#module-urllib.request "urllib.request: Extensible library for opening URLs.") 用于从URL检索数据，以及 [`smtplib`](../library/smtplib.md#module-smtplib "smtplib: SMTP protocol client \(requires sockets\).") 用于发送邮件:

```perl
>>> from urllib.request import urlopen
>>> with urlopen('https://docs.python.org/3/') as response:
...     for line in response:
...         line = line.decode()             # Convert bytes to a str
...         if 'updated' in line:
...             print(line.rstrip())         # Remove trailing newline
...
      Last updated on Nov 11, 2025 (20:11 UTC).

>>> import smtplib
>>> server = smtplib.SMTP('localhost')
>>> server.sendmail('soothsayer@example.org', 'jcaesar@example.org',
... """To: jcaesar@example.org
... From: soothsayer@example.org
...
... Beware the Ides of March.
... """)
>>> server.quit()
```
（请注意，第二个示例需要在localhost上运行的邮件服务器。）

## 10.8. 日期和时间¶(dates-and-times "Link to this heading")

[`datetime`](../library/datetime.md#module-datetime "datetime: Basic date and time types.") 模块提供了以简单和复杂的方式操作日期和时间的类。虽然支持日期和时间算法，但实现的重点是有效的成员提取以进行输出格式化和操作。该模块还支持可感知时区的对象。

```
>>> # 方便地构造和格式化日期
>>> import datetime as dt
>>> now = dt.date.today()
>>> now
datetime.date(2003, 12, 2)
>>> now.strftime("%m-%d-%y. %d %b %Y is a %A on the %d day of %B.")
'12-02-03. 02 Dec 2003 is a Tuesday on the 02 day of December.'

>>> # 日期支持历法运算
>>> birthday = dt.date(1964, 7, 31)
>>> age = now - birthday
>>> age.days
14368
```
## 10.9. 数据压缩¶(data-compression "Link to this heading")

常见的数据存档和压缩格式由模块直接支持，包括：[`zlib`](../library/zlib.md#module-zlib "zlib: Low-level interface to compression and decompression routines compatible with gzip."), [`gzip`](../library/gzip.md#module-gzip "gzip: Interfaces for gzip compression and decompression using file objects."), [`bz2`](../library/bz2.md#module-bz2 "bz2: Interfaces for bzip2 compression and decompression."), [`lzma`](../library/lzma.md#module-lzma "lzma: A Python wrapper for the liblzma compression library."), [`zipfile`](../library/zipfile.md#module-zipfile "zipfile: Read and write ZIP-format archive files.") 和 [`tarfile`](../library/tarfile.md#module-tarfile "tarfile: Read and write tar-format archive files.")。:

```
>>> import zlib
>>> s = b'witch which has which witches wrist watch'
>>> len(s)
41
>>> t = zlib.compress(s)
>>> len(t)
37
>>> zlib.decompress(t)
b'witch which has which witches wrist watch'
>>> zlib.crc32(s)
226805979
```
## 10.10. 性能测量¶(performance-measurement "Link to this heading")

一些 Python 用户对了解同一问题的不同方法的相对性能产生了浓厚的兴趣。Python 提供了一种可以立即回答这些问题的测量工具。

例如，元组封包和拆包功能相比传统的交换参数可能更具吸引力。[`timeit`](../library/timeit.md#module-timeit "timeit: Measure the execution time of small code snippets.") 模块可以快速演示在运行效率方面一定的优势:

```
>>> from timeit import Timer
>>> Timer('t=a; a=b; b=t', 'a=1; b=2').timeit()
0.57535828626024577
>>> Timer('a,b = b,a', 'a=1; b=2').timeit()
0.54962537085770791
```
与 [`timeit`](../library/timeit.md#module-timeit "timeit: Measure the execution time of small code snippets.") 的精细粒度级别相反， [`profile`](../library/profile.md#module-profile "profile: Pure Python profiler \(deprecated\).（已弃用）") 和 [`pstats`](../library/pstats.md#module-pstats "pstats: Statistics object for analyzing profiler output.") 模块提供了用于在较大的代码块中识别时间关键部分的工具。

## 10.11. 质量控制¶(quality-control "Link to this heading")

开发高质量软件的一种方法是在开发过程中为每个函数编写测试，并在开发过程中经常运行这些测试。

[`doctest`](../library/doctest.md#module-doctest "doctest: Test pieces of code within docstrings.") 模块提供了一个工具，用于扫描模块并验证程序文档字符串中嵌入的测试。测试构造就像将典型调用及其结果剪切并粘贴到文档字符串一样简单。这通过向用户提供示例来改进文档，并且它允许 doctest 模块确保代码与文档保持一致:

```python
def average(values):
    """计算数字列表的算术平均值

    >>> print(average([20, 30, 70]))
    40.0
    """
    return sum(values) / len(values)

import doctest
doctest.testmod()   # 自动验证嵌入式测试
```
[`unittest`](../library/unittest.md#module-unittest "unittest: Unit testing framework for Python.") 模块不像 [`doctest`](../library/doctest.md#module-doctest "doctest: Test pieces of code within docstrings.") 模块那样易于使用，但它允许在一个单独的文件中维护更全面的测试集:

```python
import unittest

class TestStatisticalFunctions(unittest.TestCase):

    def test_average(self):
        self.assertEqual(average([20, 30, 70]), 40.0)
        self.assertEqual(round(average([1, 5, 7]), 1), 4.3)
        with self.assertRaises(ZeroDivisionError):
            average([])
        with self.assertRaises(TypeError):
            average(20, 30, 70)

unittest.main()  # 从命令行调用时会执行所有测试
```
## 10.12. 内置电池¶(batteries-included "Link to this heading")

Python 有"自带电池"的理念。通过其包的复杂和强大功能可以最好地看到这一点。例如:
- [`xmlrpc.client`](../library/xmlrpc.client.md#module-xmlrpc.client "xmlrpc.client: XML-RPC client access.") 和 [`xmlrpc.server`](../library/xmlrpc.server.md#module-xmlrpc.server "xmlrpc.server: Basic XML-RPC server implementations.") 模块使得实现远程过程调用变成了小菜一碟。 尽管存在于模块名称中，但用户不需要直接了解或处理 XML。
- [`email`](../library/email.md#module-email "email: Package supporting the parsing, manipulating, and generating email messages.") 包是一个用于管理电子邮件消息的库，包括 MIME 和其他基于 [**RFC 5322**](https://datatracker.ietf.org/doc/html/rfc5322.md) 的消息文档。 不同于实际发送和接收消息的 [`smtplib`](../library/smtplib.md#module-smtplib "smtplib: SMTP protocol client \(requires sockets\).") 和 [`poplib`](../library/poplib.md#module-poplib "poplib: POP3 protocol client \(requires sockets\).")，email 包提供用于构建或解码复杂消息结构（包括附件）以及实现互联网编码格式和标头协议的完整工具集。
- [`json`](../library/json.md#module-json "json: Encode and decode the JSON format.") 包为解析这种流行的数据交换格式提供了强大的支持。 [`csv`](../library/csv.md#module-csv "csv: Write and read tabular data to and from delimited files.") 模块支持以逗号分隔值格式直接读取和写入文件，这种格式通常为数据库和电子表格所支持。 XML 处理由 [`xml.etree.ElementTree`](../library/xml.etree.elementtree.md#module-xml.etree.ElementTree "xml.etree.ElementTree: Implementation of the ElementTree API.") ， [`xml.dom`](../library/xml.dom.md#module-xml.dom "xml.dom: Document Object Model API for Python.") 和 [`xml.sax`](../library/xml.sax.md#module-xml.sax "xml.sax: Package containing SAX2 base classes and convenience functions.") 包支持。这些模块和软件包共同大大简化了 Python 应用程序和其他工具之间的数据交换。
- [`sqlite3`](../library/sqlite3.md#module-sqlite3 "sqlite3: A DB-API 2.0 implementation using SQLite 3.x.") 模块是 SQLite 数据库库的包装器，提供了一个可以使用稍微非标准的 SQL 语法更新和访问的持久数据库。
- 国际化由许多模块支持，包括 [`gettext`](../library/gettext.md#module-gettext "gettext: Multilingual internationalization services.") ， [`locale`](../library/locale.md#module-locale "locale: Internationalization services.") ，以及 [`codecs`](../library/codecs.md#module-codecs "codecs: Encode and decode data and streams.") 包。

### 目录(../contents.html)

<details>
<summary>Menu</summary>

- [10. 标准库概览](#)
- [10.1. 操作系统接口](#operating-system-interface)
    - [10.2. 文件通配符](#file-wildcards)
    - [10.3. 命令行参数](#command-line-arguments)
    - [10.4. 错误输出重定向和程序终止](#error-output-redirection-and-program-termination)
    - [10.5. 字符串模式匹配](#string-pattern-matching)
    - [10.6. 数学](#mathematics)
    - [10.7. 互联网访问](#internet-access)
    - [10.8. 日期和时间](#dates-and-times)
    - [10.9. 数据压缩](#data-compression)
    - [10.10. 性能测量](#performance-measurement)
    - [10.11. 质量控制](#quality-control)
    - [10.12. 内置电池](#batteries-included)

</details>


#### 上一主题

[9. 类](../../../zh-cn/3/tutorial/classes.md "上一章")

#### 下一主题

[11. 标准库概览 --- 第二部分](../../../zh-cn/3/tutorial/stdlib2.md "下一章")

### 当前页

- [报告代码错误](../bugs.md)
- [改进本页面](../improve-page-nojs.md)
- [显示源码](https://github.com/python/cpython/blob/3.15/Doc/tutorial/stdlib.rst?plain=1)
- [显示翻译源](https://github.com/python/python-docs-zh-cn/blob/3.15/tutorial/stdlib.po?plain=1)

«

### 导航

© [版权](../copyright.md) 2001 Python Software Foundation.

本页面采用 Python 软件基金会许可证第 2 版授权。

文档中的示例、代码片段及其他代码内容额外采用零条款 BSD 许可证授权。

更多信息请参阅《[历史与许可](../../../license.md)》。

Python 软件基金会是一家非营利性公司。
[请进行捐赠。](https://www.python.org/psf/donations/)

最后更新于10月 20, 2026 \(09:40 UTC\) 。

[发现了错误](../../../bugs.md)？

使用[Sphinx](https://www.sphinx-doc.org/) 8.2.3 创建。

---

### 导航

- [索引](../genindex.md "总索引")
- [模块](../py-modindex.md "Python 模块索引") \|
- [下一页](../../../zh-cn/3/tutorial/stdlib2.md "11. 标准库概览 --- 第二部分") \|
- [上一页](../../../zh-cn/3/tutorial/classes.md "9. 类") \|
- ![Python logo](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
- [Python](https://www.python.org/) »
- [3.15.0 Documentation](../index.md) »
- [Python 教程](../../../zh-cn/3/tutorial/index.md) »
- 10. 标准库概览
- \|
- \|