<!-- source: https://docs.python.org/zh-cn/3/tutorial/stdlib2.html -->
<!-- retrieved: 2026-10-21; tool: siteone-crawler 2.5.1; prefix: /zh-cn/3/tutorial -->

# 11. 标准库概览 --- 第二部分¶(brief-tour-of-the-standard-library-part-ii "Link to this heading")

第二部分涵盖了专业编程所需要的更高级的模块。这些模块很少用在小脚本中。

## 11.1. 输出的格式化¶(output-formatting "Link to this heading")

[`reprlib`](../library/reprlib.md#module-reprlib "reprlib: Alternate repr\(\) implementation with size limits.") 模块提供了一个定制化版本的 [`repr()`](../builtins/functions.md#repr "repr") 函数，用于缩略显示大型或深层嵌套的容器对象:

```
>>> import reprlib
>>> reprlib.repr(set('supercalifragilisticexpialidocious'))
"{'a', 'c', 'd', 'e', 'f', 'g', ...}"
```
[`pprint`](../library/pprint.md#module-pprint "pprint: Data pretty printer.") 模块提供了更加复杂的打印控制，其输出的内置对象和用户自定义对象能够被解释器直接读取。当输出结果过长而需要折行时，“美化输出机制”会添加换行符和缩进，以更清楚地展示数据结构:

```
>>> import pprint
>>> t = [[[['black', 'cyan'], 'white', ['green', 'red']], [['magenta',
...     'yellow'], 'blue']]]
...
>>> pprint.pprint(t, width=30)
[[[['black', 'cyan'],
   'white',
   ['green', 'red']],
  [['magenta', 'yellow'],
   'blue']]]
```
[`textwrap`](../library/textwrap.md#module-textwrap "textwrap: Text wrapping and filling") 模块能够格式化文本段落，以适应给定的屏幕宽度:

```
>>> import textwrap
>>> doc = """The wrap() method is just like fill() except that it returns
... a list of strings instead of one big string with newlines to separate
... the wrapped lines."""
...
>>> print(textwrap.fill(doc, width=40))
The wrap() method is just like fill()
except that it returns a list of strings
instead of one big string with newlines
to separate the wrapped lines.
```
[`locale`](../library/locale.md#module-locale "locale: Internationalization services.") 模块处理与特定地域文化相关的数据格式。locale 模块的 format 函数包含一个 grouping 属性，可直接将数字格式化为带有组分隔符的样式:

```
>>> import locale
>>> locale.setlocale(locale.LC_ALL, 'English_United States.1252')
'English_United States.1252'
>>> conv = locale.localeconv()          # 获取语言区域设置的映射
>>> x = 1234567.8
>>> locale.format_string("%d", x, grouping=True)
'1,234,567'
>>> locale.format_string("%s%.*f", (conv['currency_symbol'],
...                      conv['frac_digits'], x), grouping=True)
'$1,234,567.80'
```
## 11.2. 模板¶(templating "Link to this heading")

[`string`](../library/string.md#module-string "string: Common string operations.") 模块包含一个通用的 [`Template`](../library/string.md#string.Template "string.Template") 类，具有适用于最终用户的简化语法。它允许用户在不更改应用逻辑的情况下定制自己的应用。

上述格式化操作是通过占位符实现的，占位符由 `$` 加上合法的 Python 标识符（只能包含字母、数字和下划线）构成。一旦使用花括号将占位符括起来，就可以在后面直接跟上更多的字母和数字而无需空格分割。`$$` 将被转义成单个字符 `$`:

```php
>>> from string import Template
>>> t = Template('${village}folk send $$10 to $cause.')
>>> t.substitute(village='Nottingham', cause='the ditch fund')
'Nottinghamfolk send $10 to the ditch fund.'
```
如果在字典或关键字参数中未提供某个占位符的值，那么 [`substitute()`](../library/string.md#string.Template.substitute "string.Template.substitute") 方法将抛出 [`KeyError`](../builtins/exceptions.md#KeyError "KeyError")。对于邮件合并类型的应用，用户提供的数据有可能是不完整的，此时使用 [`safe_substitute()`](../library/string.md#string.Template.safe_substitute "string.Template.safe\_substitute") 方法更加合适 —— 如果数据缺失，它会直接将占位符原样保留。

```php
>>> t = Template('Return the $item to $owner.')
>>> d = dict(item='unladen swallow')
>>> t.substitute(d)
Traceback (most recent call last):
  ...
KeyError: 'owner'
>>> t.safe_substitute(d)
'Return the unladen swallow to $owner.'
```
Template 的子类可以自定义分隔符。例如，以下是某个照片浏览器的批量重命名功能，采用了百分号作为日期、照片序号和照片格式的占位符:

```cpp
>>> import time, os.path
>>> photofiles = ['img_1074.jpg', 'img_1076.jpg', 'img_1077.jpg']
>>> class BatchRename(Template):
...     delimiter = '%'
...
>>> fmt = input('Enter rename style (%d-date %n-seqnum %f-format):  ')
Enter rename style (%d-date %n-seqnum %f-format):  Ashley_%n%f

>>> t = BatchRename(fmt)
>>> date = time.strftime('%d%b%y')
>>> for i, filename in enumerate(photofiles):
...     base, ext = os.path.splitext(filename)
...     newname = t.substitute(d=date, n=i, f=ext)
...     print('{0} --> {1}'.format(filename, newname))

img_1074.jpg --> Ashley_0.jpg
img_1076.jpg --> Ashley_1.jpg
img_1077.jpg --> Ashley_2.jpg
```
模板的另一个应用是将程序逻辑与多样的格式化输出细节分离开来。这使得对 XML 文件、纯文本报表和 HTML 网络报表使用自定义模板成为可能。

## 11.3. 操作二进制数据记录布局¶(working-with-binary-data-record-layouts "Link to this heading")

[`struct`](../library/struct.md#module-struct "struct: Interpret bytes as packed binary data.") 模块提供了 [`pack()`](../library/struct.md#struct.pack "struct.pack") 和 [`unpack()`](../library/struct.md#struct.unpack "struct.unpack") 函数，用于处理不定长度的二进制记录格式。下面的例子展示了在不使用 [`zipfile`](../library/zipfile.md#module-zipfile "zipfile: Read and write ZIP-format archive files.") 模块的情况下，如何循环遍历一个 ZIP 文件的所有头信息。Pack 代码 `"H"` 和 `"I"` 分别代表两字节和四字节无符号整数。`"<"` 代表它们是标准尺寸的小端字节序:

```
import struct

with open('myfile.zip', 'rb') as f:
    data = f.read()

start = 0
for i in range(3):                      # 显示前 3 个文件标头
    start += 14
    fields = struct.unpack('<IIIHH', data[start:start+16])
    crc32, comp_size, uncomp_size, filenamesize, extra_size = fields

    start += 16
    filename = data[start:start+filenamesize]
    start += filenamesize
    extra = data[start:start+extra_size]
    print(filename, hex(crc32), comp_size, uncomp_size)

    start += extra_size + comp_size     # 跳到下一个标头
```
## 11.4. 多线程¶(multi-threading "Link to this heading")

线程是一种对于非顺序依赖的多个任务进行解耦的技术。多线程可以提高应用的响应效率，当接收用户输入的同时，保持其他任务在后台运行。一个有关的应用场景是，将 I/O 和计算运行在两个并行的线程中。

以下代码展示了高阶的 [`threading`](../library/threading.md#module-threading "threading: Thread-based parallelism.") 模块如何在后台运行任务，且不影响主程序的继续运行:

```python
import threading, zipfile

class AsyncZip(threading.Thread):
    def __init__(self, infile, outfile):
        super().__init__()
        self.infile = infile
        self.outfile = outfile

    def run(self):
        with zipfile.ZipFile(self.outfile, 'w', zipfile.ZIP_DEFLATED) as f:
            f.write(self.infile)
        print('Finished background zip of:', self.infile)

background = AsyncZip('mydata.txt', 'myarchive.zip')
background.start()
print('The main program continues to run in foreground.')

background.join()    # 等待后台任务结束
print('Main program waited until background was done.')
```
多线程应用面临的主要挑战是，相互协调的多个线程之间需要共享数据或其他资源。为此，threading 模块提供了多个同步操作原语，包括线程锁、事件、条件变量和信号量。

尽管这些工具非常强大，但微小的设计错误却可以导致一些难以复现的问题。因此，实现多任务协作的首选方法是将所有对资源的请求集中到一个线程中，然后使用 [`queue`](../library/queue.md#module-queue "queue: A synchronized queue class.") 模块向该线程供应来自其他线程的请求。 应用程序使用 [`Queue`](../library/queue.md#queue.Queue "queue.Queue") 对象进行线程间通信和协调，更易于设计，更易读，更可靠。

## 11.5. 日志记录¶(logging "Link to this heading")

[`logging`](../library/logging.md#module-logging "logging: Flexible event logging system for applications.") 模块提供功能齐全且灵活的日志记录系统。在最简单的情况下，日志消息被发送到文件或 `sys.stderr`

```
import logging
logging.debug('Debugging information')
logging.info('Informational message')
logging.warning('Warning:config file %s not found', 'server.conf')
logging.error('Error occurred')
logging.critical('Critical error -- shutting down')
```
这会产生以下输出:

```
WARNING:root:Warning:config file server.conf not found
ERROR:root:Error occurred
CRITICAL:root:Critical error -- shutting down
```
默认情况下，信息和调试消息被压制，输出会发送到标准错误流。其他输出选项包括将消息转发到电子邮件，数据报，套接字或 HTTP 服务器。新的过滤器可以根据消息优先级选择不同的路由方式：[`DEBUG`](../library/logging.md#logging.DEBUG "logging.DEBUG")，[`INFO`](../library/logging.md#logging.INFO "logging.INFO")，[`WARNING`](../library/logging.md#logging.WARNING "logging.WARNING")，[`ERROR`](../library/logging.md#logging.ERROR "logging.ERROR")，和 [`CRITICAL`](../library/logging.md#logging.CRITICAL "logging.CRITICAL")。

## 11.6. 弱引用¶(weak-references "Link to this heading")

Python 会自动进行内存管理（对大多数对象进行引用计数并使用 [garbage collection](../glossary.md#term-garbage-collection) 来清除循环引用）。 当某个对象的最后一个引用被移除后不久就会释放其所占用的内存。

此方式对大多数应用来说都适用，但偶尔也必须在对象持续被其他对象所使用时跟踪它们。 不幸的是，跟踪它们将创建一个会令其永久化的引用。 [`weakref`](../library/weakref.md#module-weakref "weakref: Support for weak references and weak dictionaries.") 模块提供的工具可以不必创建引用就能跟踪对象。 当对象不再需要时，它将自动从一个弱引用表中被移除，并为弱引用对象触发一个回调。 典型应用包括对创建开销较大的对象进行缓存:

```python
>>> import weakref, gc
>>> class A:
...     def __init__(self, value):
...         self.value = value
...     def __repr__(self):
...         return str(self.value)
...
>>> a = A(10)                   # 创建引用
>>> d = weakref.WeakValueDictionary()
>>> d['primary'] = a            # 不创建引用
>>> d['primary']                # 如果对象仍存在则提取它
10
>>> del a                       # 移除一个引用
>>> gc.collect()                # 立即运行垃圾收集
0
>>> d['primary']                # 条目已被自动移除
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
    d['primary']                # 条目已被自动移除
  File "C:/python315/lib/weakref.py", line 46, in __getitem__
    o = self.data
KeyError: 'primary'
```
## 11.7. 用于操作列表的工具¶(tools-for-working-with-lists "Link to this heading")

许多对于数据结构的需求可以通过内置列表类型来满足。 但是，有时也会需要具有不同效费比的替代实现。

[`array`](../library/array.md#module-array "array: Space efficient arrays of uniformly typed numeric values.") 模块提供了一种 [`array`](../library/array.md#array.array "array.array") 对象，它类似于列表，但只能存储类型一致的数据且存储密度更高。 下面的例子显示了一个由存储为双字节无符号整数的数字 \(类型码 `"H"`\) 组成的元组，而不是常规 Python int 对象列表所采用的每个条目 16 字节:

```
>>> from array import array
>>> a = array('H', [4000, 10, 700, 22222])
>>> sum(a)
26932
>>> a[1:3]
array('H', [10, 700])
```
[`collections`](../library/collections.md#module-collections "collections: Container datatypes") 模块提供了一种 [`deque`](../library/collections.md#collections.deque "collections.deque") 对象，它类似于列表，但从左端添加和弹出的速度较快而在中间查找的速度较慢。 此种对象适用于实现队列和广度优先树搜索:

```
>>> from collections import deque
>>> d = deque(["task1", "task2", "task3"])
>>> d.append("task4")
>>> print("Handling", d.popleft())
Handling task1
```
```python
unsearched = deque([starting_node])
def breadth_first_search(unsearched):
    node = unsearched.popleft()
    for m in gen_moves(node):
        if is_goal(m):
            return m
        unsearched.append(m)
```
在替代的列表实现以外，标准库也提供了其他工具，例如 [`bisect`](../library/bisect.md#module-bisect "bisect: Array bisection algorithms for binary searching.") 模块具有用于操作有序列表的函数:

```
>>> import bisect
>>> scores = [(100, 'perl'), (200, 'tcl'), (400, 'lua'), (500, 'python')]
>>> bisect.insort(scores, (300, 'ruby'))
>>> scores
[(100, 'perl'), (200, 'tcl'), (300, 'ruby'), (400, 'lua'), (500, 'python')]
```
[`heapq`](../library/heapq.md#module-heapq "heapq: Heap queue algorithm \(a.k.a. priority queue\).") 模块提供了基于常规列表来实现堆的函数。 最小值的条目总是保持在位置零。 这对于需要重复访问最小元素而不希望运行完整列表排序的应用来说非常有用:

```bash
>>> from heapq import heapify, heappop, heappush
>>> data = [1, 3, 5, 7, 9, 2, 4, 6, 8, 0]
>>> heapify(data)                      # 将列表重新调整为堆顺序
>>> heappush(data, -5)                 # 添加一个新条目
>>> [heappop(data) for i in range(3)]  # 获取三个最小的条目
[-5, 0, 1]
```
## 11.8. 十进制浮点算术¶(decimal-floating-point-arithmetic "Link to this heading")

[`decimal`](../library/decimal.md#module-decimal "decimal: Implementation of the General Decimal Arithmetic Specification.") 模块提供了一种 [`Decimal`](../library/decimal.md#decimal.Decimal "decimal.Decimal") 数据类型用于十进制浮点运算。 相比内置的 [`float`](../builtins/functions.md#float "float") 二进制浮点实现，该类特别适用于
- 财务应用和其他需要精确十进制表示的用途，
- 控制精度，
- 控制四舍五入以满足法律或监管要求，
- 跟踪有效小数位，或
- 用户期望结果与手工完成的计算相匹配的应用程序。

例如，对 70 美分的电话费计算 5% 的税，使用十进制浮点数和二进制浮点数会产生不同的结果。如果结果四舍五入到最接近的分，差异会更大:

```
>>> from decimal import *
>>> round(Decimal('0.70') * Decimal('1.05'), 2)
Decimal('0.74')
>>> round(.70 * 1.05, 2)
0.73
```
[`Decimal`](../library/decimal.md#decimal.Decimal "decimal.Decimal") 表示的结果会保留尾部的零，并根据具有两个有效位的被乘数自动推出四个有效位。 Decimal 可以模拟手工运算来避免当二进制浮点数无法精确表示十进制数时会导致的问题。

精确表示特性使得 [`Decimal`](../library/decimal.md#decimal.Decimal "decimal.Decimal") 类能够执行对于二进制浮点数来说不适用的模运算和相等性检测:

```
>>> Decimal('1.00') % Decimal('.10')
Decimal('0.00')
>>> 1.00 % 0.10
0.09999999999999995

>>> sum([Decimal('0.1')]*10) == Decimal('1.0')
True
>>> 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 + 0.1 == 1.0
False
```
[`decimal`](../library/decimal.md#module-decimal "decimal: Implementation of the General Decimal Arithmetic Specification.") 模块提供了运算所需要的足够精度:

```
>>> getcontext().prec = 36
>>> Decimal(1) / Decimal(7)
Decimal('0.142857142857142857142857142857142857')
```
### 目录(../contents.html)

<details>
<summary>Menu</summary>

- [11. 标准库概览 --- 第二部分](#)
- [11.1. 输出的格式化](#output-formatting)
    - [11.2. 模板](#templating)
    - [11.3. 操作二进制数据记录布局](#working-with-binary-data-record-layouts)
    - [11.4. 多线程](#multi-threading)
    - [11.5. 日志记录](#logging)
    - [11.6. 弱引用](#weak-references)
    - [11.7. 用于操作列表的工具](#tools-for-working-with-lists)
    - [11.8. 十进制浮点算术](#decimal-floating-point-arithmetic)

</details>


#### 上一主题

[10. 标准库概览](../../../zh-cn/3/tutorial/stdlib.md "上一章")

#### 下一主题

[12. 虚拟环境和包](../../../zh-cn/3/tutorial/venv.md "下一章")

### 当前页

- [报告代码错误](../bugs.md)
- [改进本页面](../improve-page-nojs.md)
- [显示源码](https://github.com/python/cpython/blob/3.15/Doc/tutorial/stdlib2.rst?plain=1)
- [显示翻译源](https://github.com/python/python-docs-zh-cn/blob/3.15/tutorial/stdlib2.po?plain=1)

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
- [下一页](../../../zh-cn/3/tutorial/venv.md "12. 虚拟环境和包") \|
- [上一页](../../../zh-cn/3/tutorial/stdlib.md "10. 标准库概览") \|
- ![Python logo](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
- [Python](https://www.python.org/) »
- [3.15.0 Documentation](../index.md) »
- [Python 教程](../../../zh-cn/3/tutorial/index.md) »
- 11. 标准库概览 --- 第二部分
- \|
- \|