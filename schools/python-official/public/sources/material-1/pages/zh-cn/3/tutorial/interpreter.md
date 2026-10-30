<!-- source: https://docs.python.org/zh-cn/3/tutorial/interpreter.html -->
<!-- retrieved: 2026-10-21; tool: siteone-crawler 2.5.1; prefix: /zh-cn/3/tutorial -->

# 2. 使用 Python 的解释器¶(using-the-python-interpreter "Link to this heading")

## 2.1. 唤出解释器¶(invoking-the-interpreter "Link to this heading")

在可用的机器上 Python 解释器通常被安装为 `/usr/local/bin/python3.15`；将 `/usr/local/bin` 加入你的 Unix shell 搜索路径就可以通过键入以下命令来启动它：

```
python3.15
```
这样，就可以在 shell 中运行 Python 了 [\[1\]](#id2) 。因为可以选择安装目录，解释器也有可能安装在别的位置；如果还不明白，就去问问身边的 Python 大神或系统管理员。（例如，常见备选路径还有 `/usr/local/python`。）

在 Windows 机器上当你从 [Microsoft Store](../using/windows.md#windows-store) 安装 Python 之后，`python3.15` 命令将可使用。 如果你安装了 [py.exe 启动器](../using/windows.md#launcher)，你将可以使用 `py` 命令。 请参阅 [Python 安装管理器](../using/windows.md#setting-envvars) 了解其他启动 Python 的方式。

在主提示符中，输入文件结束符 \(Unix 里是 Control-D，Windows 里是 Control-Z\)，就会退出解释器，退出状态码为 0。 如果不能退出，还可以输入这个命令: `quit()`。

在大多数系统上解释器的行编辑特性包括交互式编辑、历史替换和代码补全等。 检测命令行编辑是否受支持的最快速的方式是在 Python 提示符下键入一个单词，然后按左方向键 \(或 Control-b\)。 如果光标移动了，说明你可进行命令行编辑；请参阅附录 [交互式编辑和编辑历史](../../../zh-cn/3/tutorial/interactive.md#tut-interacting) 了解相关功能键的介绍。 如果没有任何反应，或者显示 `^[[D` 或 `^B` 之类的字符序列，则说明命令行编辑不可用；你只能使用退格键删除当前行的字符。

解释器的操作方式类似 Unix Shell：用与 tty 设备关联的标准输入调用时，可以交互式地读取和执行命令；以文件名参数，或标准输入文件调用时，则读取并执行文件中的 *脚本*。

另一种启动解释器的方式是 `python -c command [arg] ...`，这将执行 *command* 中的语句，相当于 shell 的 [`-c`](../using/cmdline.md#cmdoption-c) 选项。 由于 Python 语句经常包含空格或其他会被 shell 特殊对待的字符，通常建议用引号将整个 *command* 括起来。

Python 模块也可以当作脚本使用。输入：`python -m module [arg] ...`，会执行 *module* 的源文件，这跟在命令行把路径写全了一样。

在交互模式下运行脚本文件，只要在脚本名称参数前，加上选项 [`-i`](../using/cmdline.md#cmdoption-i) 就可以了。

命令行的所有选项详见 [命令行与环境](../using/cmdline.md#using-on-general)。

### 2.1.1. 传入参数¶(argument-passing "Link to this heading")

解释器读取命令行参数，把脚本名与其他参数转化为字符串列表存到 `sys` 模块的 `argv` 变量里。执行 `import sys`，可以导入这个模块，并访问该列表。该列表最少有一个元素；未给定输入参数时，`sys.argv[0]` 是空字符串。给定脚本名是 `'-'` （标准输入）时，`sys.argv[0]` 是 `'-'`。使用 [`-c`](../using/cmdline.md#cmdoption-c)*command* 时，`sys.argv[0]` 是 `'-c'`。如果使用选项 [`-m`](../using/cmdline.md#cmdoption-m)*module*，`sys.argv[0]` 就是包含目录的模块全名。解释器不处理 `-c` *command* 或 `-m` *module* 之后的选项，而是直接留在 `sys.argv` 中由命令或模块来处理。

### 2.1.2. 交互模式¶(interactive-mode "Link to this heading")

在终端输入并执行指令时，解释器在 *交互模式* 中运行。在这种模式中，会显示 *主提示符*，提示输入下一条指令，主提示符通常用三个大于号 \(`>>>`\) 表示；输入连续行时，显示 *次要提示符*，默认是三个点 \(`...`\)。 进入解释器时，首先显示欢迎信息、版本信息、版权声明，然后才是提示符：

```
$ python3.15
Python 3.15 (default, May 7 2025, 15:46:04)
[GCC 10.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```
输入多行结构的语句时，要用连续行。以 [`if`](../reference/compound_stmts.md#if) 为例：

```
>>> the_world_is_flat = True
>>> if the_world_is_flat:
...     print("Be careful not to fall off!")
...
Be careful not to fall off!
```
交互模式的内容详见 [交互模式](../../../zh-cn/3/tutorial/appendix.md#tut-interac)。

## 2.2. 解释器的运行环境¶(the-interpreter-and-its-environment "Link to this heading")

### 2.2.1. 源文件的字符编码¶(source-code-encoding "Link to this heading")

默认情况下，Python 源码文件的编码是 UTF-8。这种编码支持世界上大多数语言的字符，可以用于字符串字面值、变量、函数名及注释 —— 尽管标准库只用常规的 ASCII 字符作为变量名或函数名，可移植代码都应遵守此约定。要正确显示这些字符，编辑器必须能识别 UTF-8 编码，而且必须使用支持文件中所有字符的字体。

如果不使用默认编码，则要声明文件的编码，文件的 *第一* 行要写成特殊注释。句法如下：

```
# -*- coding: encoding -*-
```
其中，*encoding* 可以是 Python 支持的任意一种 [`codecs`](../library/codecs.md#module-codecs "codecs: Encode and decode data and streams.")。

比如，声明使用 Windows-1252 编码，源码文件要写成：

```
# -*- coding: cp1252 -*-
```
*第一行* 的规则也有一种例外情况，源码以 [UNIX "shebang" 行](../../../zh-cn/3/tutorial/appendix.md#tut-scripts) 开头。此时，编码声明要写在文件的第二行。例如：

```
#!/usr/bin/env python3
# -*- coding: cp1252 -*-
```
备注

\[[1](#id1)\]

Unix 系统中，为了不与同时安装的 Python 2.x 冲突，Python 3.x 解释器默认安装的执行文件名不是 `python`。

### 目录(../contents.html)

- [2. 使用 Python 的解释器](#)
- [2.1. 唤出解释器](#invoking-the-interpreter)
- [2.1.1. 传入参数](#argument-passing)
        - [2.1.2. 交互模式](#interactive-mode)
    - [2.2. 解释器的运行环境](#the-interpreter-and-its-environment)

- [2.2.1. 源文件的字符编码](#source-code-encoding)

#### 上一主题

[1. 课前甜点](../../../zh-cn/3/tutorial/appetite.md "上一章")

#### 下一主题

[3. Python 速览](../../../zh-cn/3/tutorial/introduction.md "下一章")

### 当前页

- [报告代码错误](../bugs.md)
- [改进本页面](../improve-page-nojs.md)
- [显示源码](https://github.com/python/cpython/blob/3.15/Doc/tutorial/interpreter.rst?plain=1)
- [显示翻译源](https://github.com/python/python-docs-zh-cn/blob/3.15/tutorial/interpreter.po?plain=1)

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
- [下一页](../../../zh-cn/3/tutorial/introduction.md "3. Python 速览") \|
- [上一页](../../../zh-cn/3/tutorial/appetite.md "1. 课前甜点") \|
- ![Python logo](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
- [Python](https://www.python.org/) »
- [3.15.0 Documentation](../index.md) »
- [Python 教程](../../../zh-cn/3/tutorial/index.md) »
- 2. 使用 Python 的解释器
- \|
- \|