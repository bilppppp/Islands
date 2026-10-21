# Python 官方教程系统学习课程

## 目标与可观察的能力

本课程的学习目标是：**零基础读者按 Python 官方教程的目录学。学完意味着教程正文从第 1 章到第 12 章都学过：解释器、数字和字符串、列表和字典等数据结构、分支和循环、函数、模块、输入输出、错误处理、类、教程里的标准库例子、虚拟环境。学完能独立写一个小脚本：读入一段文字，用列表或字典整理，用函数处理，把结果写进文件，出错时看得懂是哪一类报错，并且知道怎样把脚本放进一个虚拟环境。第 13 章和附录只作为学完之后去哪，不单独铺成很多关。**

完成本课程后，初学者将具备以下可观察的完整系统能力：

1. **唤出与掌控解释器**（第 1-2 章）：说出 Python 解释器的作用，熟练在终端中启动交互模式并辨识主提示符 `>>>` 与多行次要提示符 `...`，掌握 `quit()` 与 EOF 退出方式，理解 `sys.argv` 命令行参数列表与源文件 UTF-8 字符编码。
2. **算术运算与字符串切片**（第 3 章上）：像使用计算器一样熟练运用 `+`, `-`, `*`, `/`（除法返回 float）, `//`, `%`, `**`；掌握变量赋值 `=` 与 `NameError` 成因；掌握单双引号界定、转义字符 `\` 与原始字符串 `r'...'`；精通基于下标的从 0 开始正向索引与从 -1 开始负向索引；精通 `[start:stop]` 左闭右开范围切片与 `len()` 函数；掌握字符串不可变性（immutable）与拼接组合。
3. **列表操作与初涉循环**（第 3 章下）：熟练创建方括号列表容器，运用索引与切片访问；深刻理解列表可变性（mutable）并能用 `cubes[3] = 64` 原地修改；掌握 `list.append()` 动态追加与切片清空；掌握多重赋值与 `while` 循环语法，能走查斐波那契数列生成过程。
4. **分支判断与循环控制**（第 4 章上）：掌握 `if`、`elif`、`else` 决策分支结构，严格遵守冒号 `:` 与 4 空格缩进（indentation）规范；掌握 `for` 原生遍历序列与 `range()` 算术级数生成器的左闭右开规则；掌握 `break`、`continue` 以及循环未被中断时触发的 `else` 子句；掌握占位符 `pass` 与 `match` 模式匹配基础。
5. **函数封装与参数机制**（第 4 章下）：掌握 `def` 关键字定义函数、形参与实参、局部作用域；规范撰写首行三引号文档字符串（docstring）；深刻区分 `return` 返回值与 `print()` 屏幕打印；掌握默认值参数并规避“可变默认参数在调用间共享”的经典陷阱；掌握关键字参数、`*args` 元组与 `**kwargs` 字典解包，以及单行 `lambda` 表达式。
6. **深入列表与列表推导式**（第 5 章上）：熟练运用 `append`, `extend`, `insert`, `remove`, `pop`, `sort`, `reverse`, `copy` 等列表核心方法；理解原地修改方法返回 `None` 的原则；掌握列表用作后进先出（LIFO）堆栈的操作；精通声明式列表推导式 `[expr for x in seq if cond]` 与嵌套推导式；掌握 `del` 按索引或切片删除的规则。
7. **元组、集合与字典结构**（第 5 章下）：掌握不可变元组（tuple）的打包与序列解包，掌握单元素元组逗号写法；掌握集合（set）的去重功能与数学集合运算（`&`, `|`, `-`, `^`）；精通字典（dict）的键值对映射，理解键的不可变性要求与字典推导式；熟练使用 `d.items()`、`enumerate()`、`zip()` 等高效循环技巧。
8. **模块化架构与脚本保护**（第 6 章）：理解将代码保存为 `.py` 文件的必要性；掌握 `import`、`from ... import` 与 `as` 别名导入语法；理解 `sys.path` 模块搜索路径与 `__pycache__` 字节码缓存；深刻掌握 `if __name__ == '__main__':` 守护机制，使文件既能作为独立脚本运行又可被安全导入。
9. **文本格式化与文件读写**（第 7 章）：熟练运用 f-strings 格式化字符串；掌握 `open()` 的打开模式（`'r'`, `'w'`, `'a'`）；熟练运用 `with open(...) as f:` 黄金法则确保文件自动安全关闭；掌握文件对象的逐行高效遍历与 `f.write()`；熟练使用 `json.dumps/loads` 与 `json.dump/load` 处理通用结构化数据。
10. **错误和异常捕获防御**（第 8 章）：清晰辨析句法错误（SyntaxError）与运行时异常（Exception）；熟练使用 `try...except` 结构捕获特定异常（如 `FileNotFoundError`, `ValueError`, `ZeroDivisionError`）；掌握多重异常元组捕获与 `as` 绑定错误对象；掌握无异常时执行的 `else` 子句与必定执行的 `finally` 清理子句；掌握 `raise` 主动触发异常。
11. **面向对象与类机制**（第 9 章）：掌握面向对象封装思想，使用 `class` 定义类；掌握 `__init__()` 构造方法绑定实例属性；深刻理解实例方法首形参 `self` 指向当前调用对象实例的引用本质；清晰区分类变量（所有实例共享）与实例变量（各自独立）；了解类的单继承语法与 `yield` 生成器函数。
12. **标准库核心系统接口**（第 10 章）：体会“自带电池”哲学；掌握 `os` 目录与系统交互、`shutil` 高级文件管理；掌握 `glob.glob()` 文件名通配符模式匹配；掌握 `sys.argv` 命令行参数提取；掌握 `math` 运算、`random` 随机抽样、`urllib.request` 网络数据获取、`datetime` 日期计算与 `zlib` 数据压缩。
13. **标准库专业工程工具**（第 11 章）：掌握 `pprint` 与 `reprlib` 美化排版输出；掌握 `string.Template` 安全字符串模板；掌握 `logging` 模块的多级别日志分流（DEBUG 到 CRITICAL）；掌握 `collections.deque` 双端队列在两端插入弹出的高吞吐性能；掌握 `decimal.Decimal` 彻底解决二进制浮点误差并进行精确财务计算。
14. **虚拟环境与综合脚本工程化**（第 12-13 章）：深刻理解虚拟环境（venv）隔离第三方依赖包的必要性；熟练掌握使用 `python3 -m venv .venv` 创建虚拟环境；熟练掌握不同操作系统下的激活命令（Windows `.venv\Scripts\activate.bat`、macOS/Linux `source .venv/bin/activate`）与 `deactivate` 退出；掌握 `pip install`、`pip list`、`pip freeze > requirements.txt` 依赖管理；在虚拟环境中运行并验证一个综合了全套知识的完整小脚本；了解第 13 章与官方标准库后续进阶资源。

完成指的是学员在交互对话中参与了每关设计的预测、改写或解答活动并收到反馈，不是评分，也不代表已经完成了真实教学或线上进度同步。

## 前提与学员背景假设

- **学员背景**：零基础，此前没有写过程序。
- **概念按需引入**：不假定学员提前懂得终端、解释器、类、虚拟环境或包管理。所有前置知识在对应关卡的前一至两段中用直白通俗的语言当场讲清，不另设额外前置课。
- **免本地环境强制依赖**：课文中提供了详尽的官方安装步骤（官网下载、勾选 Add python.exe to PATH、终端调用等），但通关完成条件绝不绑死在本地安装上，均可在对话里完成。

## 学习路线设计

| 顺序 | 关卡 Slug | 对应教程章节 | 为什么有这一关 | 依赖关系 | 互动小活动 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `appetite-and-interpreter` | 第 1-2 章 | 建立 Python 语言认知，掌握解释器唤出、交互提示符 `>>>` 与退出、传参与 UTF-8 编码。 | 无 | 说明启动和退出解释器的命令，或解释次要提示符 `...` 出现的原因。 |
| 2 | `numbers-and-strings` | 第 3 章上 | 掌握基础计算器运算、变量赋值、字符串界定、转义、不可变性与正负索引及范围切片。 | 第 1 关的解释器交互 | 给定 `'Python'` 字符串，推导指定索引字符与 `[0:2]` 切片结果。 |
| 3 | `lists-and-first-steps` | 第 3 章下 | 掌握列表容器、索引切片、就地修改与 append 追加，初涉多重赋值与 while 循环。 | 第 2 关的索引切片规则 | 修正列表中拼写错误的元素并 append 新条目，或走查斐波那契 while 循环输出。 |
| 4 | `control-flow-tools` | 第 4 章上 | 赋予程序决策能力，掌握 if 分支与 4 空格缩进，掌握 for 原生序列遍历、range() 与 break/continue/else。 | 第 2、3 关的序列概念 | 编写 `for...if` 筛选长单词逻辑，或预测 `range(2, 8, 2)` 生成序列。 |
| 5 | `defining-functions` | 第 4 章下 | 逻辑封装核心：掌握 def 语法、docstring 规范、return 与 print 的区别、默认参数与解包。 | 前 4 关全部语句 | 编写带 docstring 和 return 的单词过滤函数，或辨析可变默认参数陷阱。 |
| 6 | `lists-deep-dive` | 第 5 章上 | 数据结构进阶：全面掌握列表方法、LIFO 堆栈操作、列表推导式与 del 语句。 | 第 3 关列表基础与第 4 关循环 | 编写过滤长单词的列表推导式，或指出堆栈入栈出栈对应的方法。 |
| 7 | `tuples-sets-and-dicts` | 第 5 章下 | 掌握不可变元组与解包、集合去重与数学运算、字典键值映射与 items() 等遍历技巧。 | 前 6 关数据容器 | 编写使用 `items()` 遍历成绩字典的代码，或说明集合去重的原理。 |
| 8 | `modules-and-scripts` | 第 6 章 | 代码持久化：掌握 .py 脚本文件创建、import 导入语法、sys.path 搜索与 `__name__ == '__main__'`。 | 前 7 关全部语法 | 解释模块导入语法，并说明 `if __name__ == '__main__':` 守护语句的作用。 |
| 9 | `input-output-and-files` | 第 7 章 | 数据持久化：掌握 f-strings 格式化、`open()` 模式、`with open` 安全文件读写与 JSON 序列化。 | 第 8 关的脚本架构 | 编写使用 `with open` 向文件写入格式化文本的代码，或说明 with 的优势。 |
| 10 | `errors-and-exceptions` | 第 8 章 | 提升代码健壮性：辨析句法错误与运行时异常，掌握 try...except 捕获、else/finally 与 raise。 | 第 9 关的文件读写异常 | 编写 try...except 优雅捕获 `FileNotFoundError` 的代码，或解释 else 执行时机。 |
| 11 | `classes-and-objects` | 第 9 章 | 面向对象建模：掌握 class 语法、`__init__()` 构造方法、`self` 实例引用与类变量差异。 | 前 10 关综合基础 | 编写一个简单的 `WordCounter` 类并实现获取单词总数的方法。 |
| 12 | `standard-library-overview` | 第 10 章 | 体会自带电池：掌握 os、glob 通配符、sys.argv 传参、math、random、urllib 与 datetime。 | 前 11 关基础 | 指出如何从 `sys.argv` 提取两个文件名参数，或写出 glob 查找文件。 |
| 13 | `standard-library-part2` | 第 11 章 | 工程级标准库：掌握 pprint 排版、Template 模板、logging 日志分流、deque 高速队列与 Decimal 精确计算。 | 第 12 关标准库基础 | 指出财务金钱计算与复杂嵌套字典排版应该分别选用哪个标准库模块。 |
| 14 | `virtual-environments-and-script` | 第 12-13 章 | 解决依赖冲突并实现全流程闭环：掌握 venv 创建激活、pip 包管理、综合脚本实战与后续进阶。 | 前 13 关全部内容 | 说出虚拟环境跨平台激活命令，并在综合实战小脚本中指出修改筛选阈值的位置。 |

## 深度与风格设定对课程的影响

- **课程深度（系统掌握 / systematic）**：完整覆盖 Python 官方教程第 1 章至第 12 章的全部目录结构，不仅讲授入门语法，更涵盖了函数参数机制（默认值陷阱、解包）、高级数据结构（堆栈、推导式、集合运算、字典）、面向对象核心（self、构造方法、类变量 vs 实例变量）、异常防御（try/except/else/finally）、核心工程标准库（os, sys, glob, logging, deque, Decimal）以及现代开发标配的虚拟环境（venv 与 pip）。
- **学员背景（零基础）**：所有专业术语（如 interpreter, indexing, slicing, mutable, docstring, namespace, self, venv）在首次出现时均保留英文原词，并紧跟生动形象的中文比喻与原理剖析。
- **教学风格（一步一步的具体例子与完整官方步骤）**：严格保持 Python 官方教程的权威经典案例（如 50-5*6, 'Python' 边界切片, cubes 立方数, cat/window/defenestrate 遍历, fib/fib2 斐波那契演化, fibo.py 模块, ask_ok 默认参数, ComplexNumber 类等），并在最后一关提供完整贯通各章知识的实战脚本 `text_analyzer.py`。
- **教学模式（simple）**：简洁聚焦核心认知与预测反馈，不设无关的迂回提问。

## 来源存证与阅读账本（Source Ledger）

### 抓取与派生情况说明
本次材料准备由 `siteone-crawler 2.5.1` 工具针对文档入口 `https://docs.python.org/zh-cn/3/tutorial/index.html` 以及前缀 `/zh-cn/3/tutorial` 执行了抓取。工具成功抓取并保存了 **17 个文档页面**（记录于 `provenance.json`），**未发生抓取失败或退回单页的情况**。抓取得到的 `.md` 文件是 Markdown 派生阅读文本，不是原始 HTML；抓取时保存的原始 HTML 仅包含入口响应 `entry.html`。本地材料中没有随附 PNG/JPG 图片文件，课程内容完全基于经核对的官方派生文档与代码规范编写。

### 实际阅读的页面与映射账本

本课程实际精读了抓取材料中的 13 个核心页面，并将其完整复制到 `public/sources/material-1/` 下供本地 HTTP 查阅：

| 官方在线文档 URL | 本地派生阅读源路径（相对 public/sources） | 对应的核心章节 | 对应关卡 |
| :--- | :--- | :--- | :--- |
| `https://docs.python.org/zh-cn/3/tutorial/appetite.html` | `material-1/pages/zh-cn/3/tutorial/appetite.md` | 第 1 章 课前甜点 | 第 1 关 |
| `https://docs.python.org/zh-cn/3/tutorial/interpreter.html` | `material-1/pages/zh-cn/3/tutorial/interpreter.md` | 第 2 章 唤出解释器、交互模式、运行环境 | 第 1 关 |
| `https://docs.python.org/zh-cn/3/tutorial/introduction.html` | `material-1/pages/zh-cn/3/tutorial/introduction.md` | 第 3 章 数字、文本、列表、走向编程的第一步 | 第 2, 3 关 |
| `https://docs.python.org/zh-cn/3/tutorial/controlflow.html` | `material-1/pages/zh-cn/3/tutorial/controlflow.md` | 第 4 章 if, for, range, break, def 函数, 参数 | 第 4, 5 关 |
| `https://docs.python.org/zh-cn/3/tutorial/datastructures.html` | `material-1/pages/zh-cn/3/tutorial/datastructures.md` | 第 5 章 列表方法, 堆栈, 列表推导式, del, 元组, 集合, 字典 | 第 6, 7 关 |
| `https://docs.python.org/zh-cn/3/tutorial/modules.html` | `material-1/pages/zh-cn/3/tutorial/modules.md` | 第 6 章 模块, 脚本执行, sys.path, dir() | 第 8 关 |
| `https://docs.python.org/zh-cn/3/tutorial/inputoutput.html` | `material-1/pages/zh-cn/3/tutorial/inputoutput.md` | 第 7 章 f-strings, 文件读写, json | 第 9 关 |
| `https://docs.python.org/zh-cn/3/tutorial/errors.html` | `material-1/pages/zh-cn/3/tutorial/errors.md` | 第 8 章 语法错误, 异常处理, else, finally, raise | 第 10 关 |
| `https://docs.python.org/zh-cn/3/tutorial/classes.html` | `material-1/pages/zh-cn/3/tutorial/classes.md` | 第 9 章 作用域, class, __init__, self, 继承, 生成器 | 第 11 关 |
| `https://docs.python.org/zh-cn/3/tutorial/stdlib.html` | `material-1/pages/zh-cn/3/tutorial/stdlib.md` | 第 10 章 os, glob, sys.argv, math, random, urllib, datetime | 第 12 关 |
| `https://docs.python.org/zh-cn/3/tutorial/stdlib2.html` | `material-1/pages/zh-cn/3/tutorial/stdlib2.md` | 第 11 章 pprint, Template, logging, deque, Decimal | 第 13 关 |
| `https://docs.python.org/zh-cn/3/tutorial/venv.html` | `material-1/pages/zh-cn/3/tutorial/venv.md` | 第 12 章 虚拟环境 venv, pip 包管理 | 第 14 关 |
| `https://docs.python.org/zh-cn/3/tutorial/whatnow.html` | `material-1/pages/zh-cn/3/tutorial/whatnow.md` | 第 13 章 接下来？与进阶指引 | 第 14 关 |

除上述 13 篇派生阅读页外，`material-1/provenance.json` 与 `material-1/entry.html` 也已同步保存在 `public/sources/material-1/` 中保证来源凭证完整。

## 路线调整建议

- **若学员已有轻度编程经验（如写过 JavaScript 或 C）**：前 3 关可快速浏览语法映射，重点关注第 2 关切片机制、第 4 关循环的 else 子句、第 5 关可变默认参数陷阱、第 9 关 with 语句与第 14 关虚拟环境。
- **若学员重点探索数据分析与爬虫**：学完第 7 关（字典）与第 9 关（文件读写）后，可重点深钻第 10 关 `urllib` 与第 14 关使用 `pip install requests beautifulsoup4 pandas`。
- **若学员遇到复杂代码调试**：建议结合第 10 关异常体系与第 13 关 `logging` 模块建立生产级排错日志规范。
