---
title: "类与面向对象编程"
slug: "classes-and-objects"
description: "理解名称空间与作用域，掌握 class 语法定义类、__init__() 构造方法与实例属性、self 核心机制与类继承基础。"
order: 11
quiz: false
agentOnly: true
sources:
  - material-1/pages/zh-cn/3/tutorial/classes.md
agentInstructions: |
  能力：学员能够理解面向对象编程（OOP）的心智模型，使用 class 关键字定义类，掌握 __init__() 构造方法为新实例绑定属性，深刻理解实例方法第一个参数 self 的引用本质，区分类变量与实例变量，并了解单继承与生成器（yield）。
  来源参考：阅读 {origin}/sources/material-1/pages/zh-cn/3/tutorial/classes.md 的「名称和作用域」「初识类」「继承」「私有变量」与「生成器」小节。原始文档：https://docs.python.org/zh-cn/3/tutorial/classes.html 。
  前置与易错点：类是模具（图纸），实例对象是按图纸铸造出来的具体实体；方法的第一个形参约定俗成为 self，它指向当前正在调用该方法的具体实例对象本身；类变量是所有实例共享的，实例变量是每个对象各自独立的，若把可变对象（如列表）设为类变量会导致所有实例互相串味。
  活动：类的定义与实例化。请学员编写一个简单的 `WordCounter` 类：在 `__init__(self, text)` 中接收一段文本字符串并用 `.split()` 拆分成单词列表保存在 `self.words` 中；并添加一个方法 `get_count(self)` 返回该文本的单词总数 `len(self.words)`。学员写出类代码并展示如何实例化 `wc = WordCounter('hello world')` 并调用 `wc.get_count()`。
  完成条件：学员写出了包含 __init__ 和实例方法的类定义代码，并说明了 self 的含义，收到教师针对面向对象封装与实例状态绑定的反馈。
---

## 现实世界的建模工具：类与面向对象

在之前的课程中，我们处理数据的方式通常是：用一个列表装名字，用一个字典装成绩，再写几个外部函数去接收并处理它们。这种“数据是数据，函数是函数”的模式在处理规模庞大的系统时容易出现状态分散、关系混乱的问题。

**面向对象编程（Object-Oriented Programming，简称 OOP）**提供了一种更符合人类心智模型的方案：**把「属于某个实体的数据（属性 Attribute）」与「能对这些数据执行的操作（方法 Method）」紧密绑定封装在一个整体中**。

在 Python 官方教程第 9 章中，我们将系统学习**类（Classes）**的核心机制。

## 1. 概念基石：类与实例

为了彻底理解面向对象，请记住这个生动的比喻：
- **类（Class）**：就像一张**汽车的设计图纸**或**烘焙饼干的模具**。它定义了汽车应该有哪些零件（属性），以及汽车能够执行哪些动作（方法）；
- **实例（Instance / Object）**：则是根据这张图纸真正生产出来的一辆**具体汽车**，或者用模具压烤出的一块**真实饼干**。

图纸只有一个，但你可以根据图纸制造出成百上千辆独立的汽车，每辆车可以有不同的车牌号和颜色。

## 2. 初识类定义：class 关键字

在 Python 中，使用 **`class` 关键字**来定义一个类：

```python
class MyClass:
    """一个简单的类示例"""
    i = 12345

    def f(self):
        return 'hello world'
```

### 类对象支持两种操作：
1. **属性引用**：`MyClass.i` 读取类变量，`MyClass.f` 读取函数对象；
2. **实例化（Instantiation）**：通过“类名后跟圆括号”的形式，像调用函数一样创建实例对象：
   ```python
   x = MyClass()
   ```
   此时，`x` 就是 `MyClass` 的一个具体实例。

## 3. 构造方法：\_\_init\_\_() 与实例属性

在创建实例时，我们往往需要传入初始数据为新对象定制专属的状态。这时就要用到 Python 的特殊方法 **`__init__()`（初始化构造方法）**：

```python
class ComplexNumber:
    def __init__(self, realpart, imagpart):
        self.r = realpart
        self.i = imagpart

# 实例化并传递初始参数：
x = ComplexNumber(3.0, -4.5)
print(x.r)  # 3.0
print(x.i)  # -4.5
```

当执行 `ComplexNumber(3.0, -4.5)` 时，Python 会自动在底层创建一块新对象的内存，并自动调用该类中的 `__init__` 方法，将新建的对象以及你传入的参数送进去。

## 4. 关键灵魂：为什么每个方法都有 self？

仔细观察上面的代码，你会发现无论在 `__init__` 还是普通方法里，第一个参数总是 **`self`**！

### self 到底是什么？
- `self` 并不是 Python 的硬性保留关键字，而是一个**全社区严格遵守的约定名称**；
- **`self` 代表的就是“当前正在调用这个方法的具体实例对象本身”**！
- 当你写下 `x.f()` 时，Python 解释器在底层其实会自动将其转换为 `MyClass.f(x)`，也就是把具体的实例对象 `x` 作为第一个实参自动传给了 `self`；
- 在方法内部，所有写成 `self.name = value` 的语句，都是在将变量牢牢绑定在当前这个专属实例身上（称为**实例属性**），不同实例之间绝不互相干扰。

## 5. 类变量 vs 实例变量

官方教程特别提醒初学者务必区分**类变量**与**实例变量**：
- **实例变量（Instance variables）**：用于每个实例独有的数据，通常绑定在 `self.` 上；
- **类变量（Class variables）**：用于类的所有实例共享的属性和方法：

```python
class Dog:
    kind = 'canine'         # 类变量：所有狗都是犬科动物（所有实例共享）

    def __init__(self, name):
        self.name = name    # 实例变量：每只狗有各自专属的名字

d = Dog('Fido')
e = Dog('Buddy')
print(d.kind)  # canine
print(d.name)  # Fido
print(e.name)  # Buddy
```

> **致命陷阱：把可变对象（如列表）当作类变量**
> 如果在类体中定义 `tricks = []` 作为类变量，由于所有实例共享同一个列表，一只狗学会了打滚，所有狗的列表都会莫名其妙多出打滚！针对每个对象独有的集合，**必须在 `__init__` 中使用 `self.tricks = []` 进行独立初始化**。

## 6. 类的继承（Inheritance）

面向对象的另一大杀手锏是**继承（Inheritance）**：当你想开发一个新类，而它与现有的某个类大部分功能相同、只是需要增加或微调某些特性时，你无需从头写起，只需让新类继承原类即可：

```python
class DerivedClassName(BaseClassName):
    """派生类（子类）继承自基类（父类）"""
    pass
```

子类会自动拥有父类的全部属性和方法，并且可以重写（override）父类的方法，或者通过 `super()` 调用父类的原有逻辑。

## 7. 迭代器与生成器（Generators）

在第 9 章后半部分，官方教程介绍了 Python 内部驱动循环的底层魔法：
- **迭代器（Iterator）**：实现了 `__iter__()` 和 `__next__()` 方法的对象；
- **生成器（Generators）**：使用关键字 **`yield`** 编写的函数。它在每次遇到 `yield` 时暂停并交出当前值，下一次被迭代时从暂停处继续执行：

```python
def reverse_seq(data):
    for index in range(len(data)-1, -1, -1):
        yield data[index]

for char in reverse_seq('golf'):
    print(char, end='')  # flog
```

生成器在处理庞大数据流或超大文本时极具威力，因为它按需逐条生成，无需一次性将整个列表载入内存。

掌握了类与面向对象，我们就拥有了构建复杂系统与专业工程的结构化思维。在接下来的两关中，我们将打开 Python 令人惊叹的宝库——**标准库（Standard Library）**！
