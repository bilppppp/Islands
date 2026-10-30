<!-- source: https://docs.python.org/zh-cn/3/tutorial/venv.html -->
<!-- retrieved: 2026-10-21; tool: siteone-crawler 2.5.1; prefix: /zh-cn/3/tutorial -->

# 12. 虚拟环境和包¶(virtual-environments-and-packages "Link to this heading")

## 12.1. 概述¶(introduction "Link to this heading")

Python 应用程序通常会使用不在标准库内的软件包和模块。应用程序有时需要特定版本的库，因为应用程序可能需要已修复某个特定错误的库版本，或者应用程序可能是使用了某个库的旧版接口编写的。

这意味着一个 Python 安装可能无法满足每个应用程序的要求。如果应用程序A需要特定模块的1.0版本但应用程序B需要2.0版本，则需求存在冲突，安装版本1.0或2.0将导致某一个应用程序无法运行。

这个问题的解决方案是创建一个 [virtual environment](../glossary.md#term-virtual-environment)，一个目录树，其中安装有特定 Python 版本，以及许多其他包。

然后，不同的应用将可以使用不同的虚拟环境。 要解决先前需求相冲突的例子，应用程序 A 可以拥有自己的安装了 1.0 版本的虚拟环境，而应用程序 B 则拥有安装了 2.0 版本的另一个虚拟环境。 如果应用程序 B 要求将某个库升级到 3.0 版本，也不会影响应用程序 A 的环境。

## 12.2. 创建虚拟环境¶(creating-virtual-environments "Link to this heading")

用于创建和管理虚拟环境的模块是 [`venv`](../library/venv.md#module-venv "venv: Creation of virtual environments.")。 `venv` 将安装运行命令所使用的 Python 版本（即 [`--version`](../using/cmdline.md#cmdoption-version) 选项所报告的版本）。 例如，使用 `python3.12` 执行命令将会安装 3.12 版。

要创建虚拟环境，请确定要放置它的目录，并将 [`venv`](../library/venv.md#module-venv "venv: Creation of virtual environments.") 模块作为脚本运行目录路径:

```bash
python -m venv tutorial-env
```
这将创建 `tutorial-env` 目录，如果它不存在的话，并在其中创建包含 Python 解释器副本和各种支持文件的目录。

虚拟环境的常用目录位置是 `.venv`。 这个名称通常会令该目录在你的终端中保持隐藏，从而避免需要对所在目录进行额外解释的一般名称。 它还能防止与某些工具所支持的 `.env` 环境变量定义文件发生冲突。

创建虚拟环境后，您可以激活它。

在Windows上，运行:

```
tutorial-env\Scripts\activate
```
在Unix或MacOS上，运行:

```
source tutorial-env/bin/activate
```
（这个脚本是为bash shell编写的。如果你使用 **csh** 或 **fish** shell，你应该改用 `activate.csh` 或 `activate.fish` 脚本。）

激活虚拟环境将改变你所用终端的提示符，以显示你正在使用的虚拟环境，并修改环境以使 `python` 命令所运行的将是已安装的特定 Python 版本。 例如：

```
$ source ~/envs/tutorial-env/bin/activate
(tutorial-env) $ python
Python 3.5.1 (default, May  6 2016, 10:59:36)
  ...
>>> import sys
>>> sys.path
['', '/usr/local/lib/python35.zip', ...,
'~/envs/tutorial-env/lib/python3.5/site-packages']
>>>
```
请注意激活的虚拟环境不会以任何方式改变 `PYTHONPATH` 变量。 这在该路径包括对虚拟环境所使用的 Python 版本不兼容的代码的引用时可能导致非预期的结果。 最佳实践是执行 bash 命令 `unset PYTHONPATH` 或你所使用的 shell 的等价命令。

要撤销激活一个虚拟环境，请输入:

```
deactivate
```
到终端。

## 12.3. 使用pip管理包¶(managing-packages-with-pip "Link to this heading")

你可以使用一个名为 **pip** 的程序来安装、升级和移除软件包。 默认情况下 `pip` 将从 [Python Package Index](https://pypi.org/) 安装软件包。 你可以在你的 web 浏览器中查看 Python Package Index。

`pip` 有许多子命令: "install", "uninstall", "freeze" 等等。 （请在 [安装 Python 模块](../installing/index.md#installing-index) 指南页查看完整的 `pip` 文档。）

您可以通过指定包的名称来安装最新版本的包：

```bash
(tutorial-env) $ python -m pip install novas
Collecting novas
  Downloading novas-3.1.1.3.tar.gz (136kB)
Installing collected packages: novas
  Running setup.py install for novas
Successfully installed novas-3.1.1.3
```
您还可以通过提供包名称后跟 `==` 和版本号来安装特定版本的包：

```bash
(tutorial-env) $ python -m pip install requests==2.6.0
Collecting requests==2.6.0
  Using cached requests-2.6.0-py2.py3-none-any.whl
Installing collected packages: requests
Successfully installed requests-2.6.0
```
如果你重新运行这个命令，`pip` 会注意到已经安装了所请求的版本因而不做任何事。 你可以提供不同的版本号来获取相应版本，或者你可以运行 `python -m pip install --upgrade` 以将软件包升级到最新版本:

```bash
(tutorial-env) $ python -m pip install --upgrade requests
Collecting requests
Installing collected packages: requests
  Found existing installation: requests 2.6.0
    Uninstalling requests-2.6.0:
      Successfully uninstalled requests-2.6.0
Successfully installed requests-2.7.0
```
`python -m pip uninstall` 后跟一个或多个要从虚拟环境中删除的包所对应的名称。

`python -m pip show` 将显示有关某个特定包的信息:

```bash
(tutorial-env) $ python -m pip show requests
---
Metadata-Version: 2.0
Name: requests
Version: 2.7.0
Summary: Python HTTP for Humans.
Home-page: http://python-requests.org
Author: Kenneth Reitz
Author-email: me@kennethreitz.com
License: Apache 2.0
Location: /Users/akuchling/envs/tutorial-env/lib/python3.4/site-packages
Requires:
```
`python -m pip list` 将显示所有在虚拟环境中安装的包:

```bash
(tutorial-env) $ python -m pip list
novas (3.1.1.3)
numpy (1.9.2)
pip (7.0.3)
requests (2.7.0)
setuptools (16.0)
```
`python -m pip freeze` 将产生一个类似的已安装包列表，但其输出会使用 `python -m pip install` 所期望的格式。 一个常见的约定是将此列表放在 `requirements.txt` 文件中:

```bash
(tutorial-env) $ python -m pip freeze > requirements.txt
(tutorial-env) $ cat requirements.txt
novas==3.1.1.3
numpy==1.9.2
requests==2.7.0
```
然后可以将 `requirements.txt` 提交给版本控制并作为应用程序的一部分提供。然后用户可以使用 `install -r` 安装所有必需的包：

```bash
(tutorial-env) $ python -m pip install -r requirements.txt
Collecting novas==3.1.1.3 (from -r requirements.txt (line 1))
  ...
Collecting numpy==1.9.2 (from -r requirements.txt (line 2))
  ...
Collecting requests==2.7.0 (from -r requirements.txt (line 3))
  ...
Installing collected packages: novas, numpy, requests
  Running setup.py install for novas
Successfully installed novas-3.1.1.3 numpy-1.9.2 requests-2.7.0
```
`pip` 有更多的选项。 有关 `pip` 的完整文档请查阅 [安装 Python 模块](../installing/index.md#installing-index) 指南。 当你编写了一个软件包并希望将其放在 Python Package Index 中时，请查阅 [Python packaging user guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/)。

### 目录(../contents.html)

- [12. 虚拟环境和包](#)
- [12.1. 概述](#introduction)
    - [12.2. 创建虚拟环境](#creating-virtual-environments)
    - [12.3. 使用pip管理包](#managing-packages-with-pip)

#### 上一主题

[11. 标准库概览 --- 第二部分](../../../zh-cn/3/tutorial/stdlib2.md "上一章")

#### 下一主题

[13. 接下来？](../../../zh-cn/3/tutorial/whatnow.md "下一章")

### 当前页

- [报告代码错误](../bugs.md)
- [改进本页面](../improve-page-nojs.md)
- [显示源码](https://github.com/python/cpython/blob/3.15/Doc/tutorial/venv.rst?plain=1)
- [显示翻译源](https://github.com/python/python-docs-zh-cn/blob/3.15/tutorial/venv.po?plain=1)

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
- [下一页](../../../zh-cn/3/tutorial/whatnow.md "13. 接下来？") \|
- [上一页](../../../zh-cn/3/tutorial/stdlib2.md "11. 标准库概览 --- 第二部分") \|
- ![Python logo](data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)
- [Python](https://www.python.org/) »
- [3.15.0 Documentation](../index.md) »
- [Python 教程](../../../zh-cn/3/tutorial/index.md) »
- 12. 虚拟环境和包
- \|
- \|