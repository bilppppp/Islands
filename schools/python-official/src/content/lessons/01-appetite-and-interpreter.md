---
title: "解释器唤出与交互环境"
slug: "appetite-and-interpreter"
description: "了解 Python 语言特色，掌握在终端中启动解释器交互模式、传参机制、退出方式及源文件 UTF-8 字符编码规范。"
order: 1
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/appetite.md
  - material-1/pages/zh-cn/3/tutorial/interpreter.md
agentInstructions: |
  能力：学员能够说出 Python 解释器（interpreter）的作用，辨识交互模式主提示符 >>> 与次要提示符 ...，掌握退出解释器的命令 quit() 与快捷键，并理解脚本参数传递与 UTF-8 文件编码。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/appetite.md 与 {origin}/sources/material-1/pages/zh-cn/3/tutorial/interpreter.md 的「唤出解释器」「传入参数」「交互模式」与「源文件字符编码」。原始文档：https://docs.python.org/zh-cn/3/tutorial/interpreter.html 。
  前置与易错点：初学者无需懂汇编或编译原理底层。明确终端命令行（terminal）与 Python 交互提示符 >>> 的分界：python3 命令是在系统命令行里敲的，而 quit() 是在 Python 的 >>> 提示符下敲的。
  活动：请学员说出在终端中进入 Python 交互模式的命令是什么；如果此时屏幕显示 >>>，要安全退出回操作系统终端，可以输入什么命令或按什么快捷键。或者向学员展示一段带有 >>> 和 ... 的简单 if 缩进代码，请学员解释为什么第二行提示符会变成三个点。
  完成条件：学员说出启动命令、退出方式或正确解释了主次提示符的区别，并收到教师的对应反馈。不要求学员必须已在本地电脑跑通安装。
---

## 课前甜点：为什么选择 Python？

如果你曾经写过很长的 Shell 脚本或者批处理文件，可能会发现它们虽然擅长调用外部命令，但在处理复杂的数值运算、数据结构或图形界面时非常吃力；而 C、C++ 或 Java 虽然执行性能极高，但编写起来需要经历漫长的编译、链接过程，即使写一个简单的小工具也需要繁琐的样板代码。

**Python** 正好填补了这一空白：
- 它是一门**高级编程语言（high-level programming language）**，语法极其清晰、优雅且贴近人类的英语自然思维；
- 它是**解释型语言（interpreted language）**，无需事先手动编译，代码由解释器逐行翻译并即刻执行，极大地加快了编写与调试效率；
- 它拥有丰富强大的**标准库（standard library）**与第三方生态，被形象地称为“自带电池（batteries included）”。

## 安装 Python 与环境准备

如果你想在自己的电脑上安装并使用 Python，可以遵循官方推荐流程：

1. **访问官网**：打开浏览器前往 Python 官方下载页面 `https://www.python.org/downloads/`；
2. **下载安装程序（Installer）**：系统会自动推荐适合你电脑操作系统的版本（Windows、macOS 或 Linux）；
3. **Windows 安装重要选项**：双击运行 `.exe` 安装程序时，**务必在第一个界面的底部勾选「Add python.exe to PATH」复选框**（这会把 Python 命令路径写入系统环境变量，让你能在任意终端路径直接调用 `python`），随后点击 **Install Now**；
4. **macOS / Linux**：macOS 可通过下载 `.pkg` 双击完成安装，或者使用 Homebrew 执行 `brew install python`；多数 Linux 系统已经预装了 Python 3，也可使用包管理器命令 `sudo apt install python3` 安装。

> 提示：本课程所有关卡的互动活动均可在与 AI 教师的对话中完成。即便你手头暂时没有电脑或未安装环境，也完全可以顺畅学完全部内容！

## 唤出 Python 解释器

在操作系统的**终端（terminal）**（Windows 上的 CMD 或 PowerShell，macOS 上的 Terminal 终端）中，键入以下命令并回车，即可启动 Python 解释器：

```bash
python3
```

*(在 Windows 机器上，如果你安装了启动器，也可以输入 `py`)*

此时，终端会打印出解释器的欢迎与版本信息，最后停在三个大于号前：

```text
Python 3.13.0 (main, Oct 2026, 12:00:00)
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

### 两种提示符的区别
- **主提示符（primary prompt）`>>>`**：表示解释器空闲，正在等待你输入第一条指令；
- **次要提示符（secondary prompt）`...`**：当你输入需要换行编写的多行复合结构（例如 `if` 语句或函数）时，解释器会自动在后续行显示三个点 `...`，提示你继续输入属于同一代码块的缩进内容。

输入完毕后，输入一个空行（直接回车）即可让解释器开始执行整段代码：

```python
>>> the_world_is_flat = True
>>> if the_world_is_flat:
...     print("Be careful not to fall off!")
...
Be careful not to fall off!
```

这种敲一行代码立刻反馈结果的工作状态，就是**交互模式（interactive mode）**。

## 退出解释器

要结束交互模式并退回到操作系统的系统终端，有以下两种方式：

1. **命令退出**：输入内置函数：
   ```python
   quit()
   ```
2. **键盘文件结束符（EOF）**：
   - 在 Unix / macOS 下：按下键盘快捷键 `Ctrl-D`；
   - 在 Windows 下：按下快捷键 `Ctrl-Z`，然后按回车。

## 命令行参数与运行选项

解释器除了可以直接交互，还可以执行外部脚本或命令：
- **执行命令语句**：`python -c command [arg] ...`，这会直接执行 *command* 里的 Python 语句，建议用双引号将语句括起来；
- **执行模块**：`python -m module [arg] ...`，这会把 *module* 作为脚本来运行（例如后续要学的 `python -m venv .venv`）；
- **参数传递（Argument Passing）**：当以脚本方式运行时，脚本名和后续参数会被转化为一个字符串列表，存放在 `sys` 模块的 `sys.argv` 变量中。执行 `import sys` 即可访问它（`sys.argv[0]` 即为脚本文件名）。

## 源文件的字符编码

在默认情况下，Python 源代码文件的字符编码都是 **UTF-8**。UTF-8 能够无障碍支持包括中文、英文、符号在内的世界上绝大多数自然语言字符，你可以放心地在字符串、变量名以及注释中书写中文。

如果因为特殊系统原因需要声明其他编码，可以在源码文件的第一行（如果有 UNIX shebang 行 `#!/usr/bin/env python3` 则写在第二行）添加特殊的魔法注释：

```python
# -*- coding: cp1252 -*-
```

掌握了解释器的启动、交互提示符与退出方式，我们就迈出了 Python 世界的第一步。接下来，我们将正式进入 Python 的语法核心——数字与字符串。
