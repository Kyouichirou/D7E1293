# Python进阶

## Document Element

@author: HLA

@HomePage: [GitHub](https://github.com/Kyouichirou)

@version: 1.0.0.1

@description: Python一些不是很常用的功能和实现方式

## 1. [contextlib](https://docs.python.org/zh-cn/3/library/contextlib.html)

suppress, 用于处理异常

```python
import os
from contextlib import suppress

with suppress(FileNotFoundError): 
    os.remove('file')
# 相当于
try:
    os.remove('file')
except:
    pass
```

改进版本, 改成直接使用 @装饰器

```python	
import os
from contextlib import ContextDecorator

# 自定义实现suppress, 可以直接使用@装饰器

class suppress(ContextDecorator):
    def __init__(self, *exceptions):
        print(0)
        self._exceptions = exceptions

    def __enter__(self):
        print(1)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(3)
        # 这里必须返回TRUE
        return exc_type is not None and issubclass(exc_type, self._exceptions)


@suppress(FileNotFoundError)
def test_exception():
    print(2)
    os.remove('test.txt')


test_exception()
```

## 2. [binascii](https://docs.python.org/zh-cn/3/library/binascii.html)

二进制和 ASCII 码互转, 用于在某些socket和服务器的通信.

| 函数                                      | 描述                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| a2b_uu(string)                            | 将以ascii编码的一行数据转化为二进制,并且返回二进制数据.      |
| b2a_uu(data)                              | 将二进制数据转化为一行以ascii编码的字符,date的最大长度为45.  |
| a2b_base64(string)                        | 将一块base64的数据转换为二进制数据,并返回该二进制数据        |
| b2a_base64(string)                        | 与上面相反                                                   |
| a2b_qp(string[, header])                  | quoted-printable data->bin,并返回                            |
| b2a_qp(data[, quotetabs, istext, header]) | 与上面相反                                                   |
| a2b_hqx(string)                           | binhex4格式化的ASCII数据转换为二进制,没有做RLE解压.          |
| b2a_hqx(data)                             | 与上相反                                                     |
| rledecode_hqx(data)                       | 按照binhex4标准,对data执行RLE解压                            |
| rlecode_hqx(data)                         | 对data执行binhex方式的压缩,并返回结果                        |
| crc_hqx(data, crc)                        | 计算data的binhex4的crc值                                     |
| crc32(data[, crc])                        | 根据crc,计算crc32(32位检验和数据,然后将结果&0xffffffff(为了在所有Python版本中生成相同的结果,具体不清楚,求指导…) |
| b2a_hex(data)                             | 返回二进制数据的16进制的表现形式                             |
| a2b_hex(data)                             | 与上面相反                                                   |
| hexlify(data)                             | 返回二进制数据的16进制的表现形式                             |
| unhexlify(hexstr)                         | 与上面相反                                                   |

## 3. [types](https://docs.python.org/zh-cn/3/library/types.html)

错误处理相关

### 3. 1 TracebackType

> The type of traceback objects such as found in sys.exc_traceback

```python
import types
import sys

a = b = c = None

try:
    1 / 0
except:
    a, b, c = sys.exc_info()
    print(a)
    print(b)
    print(c)

if type(c) == types.TracebackType:
    # 执行这部分
    print("c is a TracebackType")
else:
    print("c is not a TracebackType")
```

## 5. [match语句](https://docs.python.org/zh-cn/3/reference/compound_stmts.html#the-match-statement)

3.10版本引入这个关键字

相当于其他语言的switch, case语句

## 6.[textwrap](https://docs.python.org/zh-cn/3/library/textwrap.html)

文本自动换行与填充, 文本的格式化输出

```python
import textwrap

text = "Hello  world!"

print(len(text))
print(textwrap.shorten(text, width=12))

sample_text = '''
    The textwrap module can be used to format text for output in
    situations where pretty-printing is desired.  It offers
    programmatic functionality similar to the paragraph wrapping
    or filling features found in many text editors.
    '''
print(textwrap.fill(sample_text, width=50))
```

## 7.[difflib](https://docs.python.org/zh-cn/3/library/difflib.html)

文本的比较, 相似度等

```python
import difflib

text1 = """Lorem ipsum dolor sit amet, consectetuer adipiscing
elit. Integer eu lacus accumsan arcu fermentum euismod. Donec
pulvinar porttitor tellus. Aliquam venenatis. Donec facilisis
pharetra tortor.  In nec mauris eget magna consequat
convalis. Nam sed sem vitae odio pellentesque interdum. Sed
consequat viverra nisl. Suspendisse arcu metus, blandit quis,
rhoncus ac, pharetra eget, velit. Mauris urna. Morbi nonummy
molestie orci. Praesent nisi elit, fringilla ac, suscipit non,
tristique vel, mauris. Curabitur vel lorem id nisl porta
adipiscing. Suspendisse eu lectus. In nunc. Duis vulputate
tristique enim. Donec quis lectus a justo imperdiet tempus."""

text1_lines = text1.splitlines()

text2 = """Lorem ipsum dolor sit amet, consectetuer adipiscing
elit. Integer eu lacus accumsan arcu fermentum euismod. Donec
pulvinar, porttitor tellus. Aliquam venenatis. Donec facilisis
pharetra tortor. In nec mauris eget magna consequat
convalis. Nam cras vitae mi vitae odio pellentesque interdum. Sed
consequat viverra nisl. Suspendisse arcu metus, blandit quis,
rhoncus ac, pharetra eget, velit. Mauris urna. Morbi nonummy
molestie orci. Praesent nisi elit, fringilla ac, suscipit non,
tristique vel, mauris. Curabitur vel lorem id nisl porta
adipiscing. Duis vulputate tristique enim. Donec quis lectus a
justo imperdiet tempus.  Suspendisse eu lectus. In nunc."""

text2_lines = text2.splitlines()

d = difflib.Differ()

diff = d.compare(text1_lines, text2_lines)

print('\n'.join(diff))

# SequenceMatcher, 用于比较两个字符串的相似度

print(difflib.SequenceMatcher(None, 'abce-125585665', 'abjcjk-158555222').quick_ratio())

```

## 8. [importlib](https://docs.python.org/zh-cn/3/library/importlib.html)

包的导入, 更加灵活

```python
import importlib
import random


def is_even_number(num):
    return True if (num % 2) == 0 else False


if __name__ == "__main__":
    number = random.randint(1, 100)
    module = None
    if is_even_number(number):
        # 绝对路劲
        module = importlib.import_module('func.foo')
    else:
        # 相对路径
        module = importlib.import_module('func.bar', package="func")

    module.main()
```

## 9. [typing](https://docs.python.org/zh-cn/3/library/typing.html)

[类型注释](https://blog.csdn.net/jeffery0207/article/details/93734942)相关

```python
from typing import NewType

UserId = NewType("UserId", int)
def get_user_name(user_id: UserId) -> str:
    pass

# 可以通过类型检查
user_a = get_user_name(UserId(42351))
# 不能够通过类型检查
user_b = get_user_name(-1)
```

## 10. [collections](https://docs.python.org/zh-cn/3/library/collections.html)

更为易用和强大的各类容器, 但是需要注意其中的部分功能在高版本的python以常规方式实现, 如有序字典(常规字典已经是有序的了)


| 支持        | 含义                                                         |
| ----------- | ------------------------------------------------------------ |
| namedtuple | 创建命名元组子类的工厂函数, 生成可以使用名字来访问元素内容的tuple子类 |
| deque       | 类似列表(list)的容器, 实现了在两端快速添加(append)和弹出(pop) |
| ChainMap    | 类似字典(dict)的容器类, 将多个映射集合到一个视图里面         |
| Counter     | 字典的子类, 提供了可哈希对象的计数功能                       |
| OrderedDict | 字典的子类, 保存了他们被添加的顺序, 有序字典                 |
| defaultdict | 字典的子类, 提供了一个工厂函数, 为字典查询提供一个默认值     |
| UserDict    | 封装了字典对象, 简化了字典子类化                             |
| UserList    | 封装了列表对象, 简化了列表子类化                             |
| UserString  | 封装了字符串对象, 简化了字符串子类化(中文版翻译有误) |

## 11. [itertools](https://docs.python.org/zh-cn/3/library/itertools.html)

迭代器函数

| 迭代器                                                       | 实参                 | 结果                                  |
| :----------------------------------------------------------- | :------------------- | :------------------------------------ |
| [`product()`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.product) | p, q, ... [repeat=1] | 笛卡尔积，相当于嵌套的for循环         |
| [`permutations()`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.permutations) | p[, r]               | 长度r元组，所有可能的排列，无重复元素 |
| [`combinations()`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.combinations) | p, r                 | 长度r元组，有序，无重复元素           |
| [`combinations_with_replacement()`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.combinations_with_replacement) | p, r                 | 长度r元组，有序，元素可重复           |

product, 笛卡尔积

```python
from itertools import product
# 生成所有的组合adm, adn.....cdm,...cfn
for x, y, z in product(['a', 'b', 'c'], ['d', 'e', 'f'], ['m', 'n']):
    print(x, y, z)
```

## 列表生成器差异(重要)

理解异步的关键

yield

yield from

## class类

### 装饰器

#### @property

属性相关, 读取, 设置

```python
class Test:
    def __init__(self):
        self.abc = 1

    # def __getattr__(self, item):
    #     print(2, item)
    #     return self.abc
	# 读取
    @property
    def cde(self):
        # print(2)
        return self.abc
	
    # 设置
    @cde.setter
    def cde(self, value):
        print(value)
        self.abc = value

    # def __getattribute__(self, item):
    #     print(1, item)
    #     return self.__dict__[item]  # super().__getattribute__(item)


t = Test()
t.cde = 3
print(t.cde)
print(t.abc)
```

#### @classmethod

类方法

```python
class Test:
    _abc = 1

    def __init__(self):
        self.abc = 1

    @classmethod
    def func(cls):
        print(cls._abc)
    
# 不需要实例化, 直接调用
Test.func()
```

#### @staticmethod

静态方法

```python
class Test:
    _abc = 1

    def __init__(self):
        self.abc = 1

    @classmethod
    def func(cls):
        print(cls._abc)

    @staticmethod
    def test_func():
        print('abc')

# 不需要实例化, 直接调用
Test.test_func()
```

###  [\_\_slots\_\_](https://docs.python.org/zh-cn/3/reference/datamodel.html?highlight=__slots__#object.__slots__)

槽, 用于控制class内存的消耗, 多数情况上用不到, 因为这限制了代码使用的灵活性, 因为每次修改class, 可能需要修改槽的内容.

```python
from pympler.asizeof import asizesof

# pympler一个调试工具
# https://pypi.org/project/Pympler/
# Pympler is a development tool to measure, monitor and analyze the memory behavior of Python objects # in a running Python application.
# 支持 Python 3.6, 3.7, 3.8, 3.9, 3.10 on Linux, Windows and MacOS X

class Test:
    __slots__ = ('_a', '_b', '_c')

    def __init__(self, a, b, c):
        self._a = a
        self._b = b
        self._c = c


def test():
    t = Test(1, 1, 1)
    print(asizesof(t))


if __name__ == '__main__':
    test()
```

一个简单的测试, 加slots和不加, 前后的差异很大, 加88, 不加352, 相差4倍.

### 单例模式

单例模式, 顾名思义, 单一, 在程序(内存)中, 某对象只存在一个实例(地址)的存在.

使用场景:

- 数据库接口

- 日志接口

- 配置接口

- .....

#### 单例的实现

```python
# 有很多其他的实现方式, 但是很多代码无法通过多线程的测试
class Test:
    _instance= None
    def __new__(cls, *args, **kwargs):
        if _instance:
            cls._instance = super(Test, cls).__new__(cls, *args, **kwargs)
        return cls._instance
```

多线程下的测试

```python
ass Test:
    _instance = None
    file = ''

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            # cls.file = 'abc'
            cls._instance = super(Test, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    @classmethod
    def f(cls):
        print('test', cls.file)

    @classmethod
    def __setattr__(cls, key, value):
        cls.file = value


def task(a):
    obj = Test()
    print(obj)
    # 测试, 内存地址是没有发生变化的
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>
    # <__main__.Test object at 0x000001DBB06F3790>

for i in range(15):
    t = threading.Thread(target=task, args=(i,))
    t.start()
```

#### 类单例模式的属性赋值

```python
# self的属性是可以直接通过外部赋值
class Test:
    def __init__(self):
        self.key = ''

    def func(self):
        print(self.key)
	    # abc

t = Test()
t.key = 'abc'
t.func()

class Test:
    _instance= None
    file = ''
    def __new__(cls, *args, **kwargs):
        if _instance:
            cls._instance = super(Test, cls).__new__(cls, *args, **kwargs)
        return cls._instance
    
    @classmethod
    def __setattr__(cls, key, value):
        # 必须通过setattr对cls的外部属性进行赋值
        # 和self.key = value直接赋值的方式所差异
        if key == 'file':
            cls.file = value
    
   def func(cls):
       print(cls.file)
       # 不加__setattr__, 打印结果为空
       # 加__setattr__, 打印结果为 'abc'
# 假如直接以这种形式(不加 __setattr__), print(cls.file)为空
t = Test()
t.file = 'abc'
t.func()

```

## 继承

继承



### 属性

JavaScript在元编程上提供了Object, Proxy, Reflect三种方式实现, python也提供类似的方式来实现.

#### 设置属性

\_\_setattr\_\_

使用场景: 

- 当某个属性被赋值, 则触发某种操作

- 限制某些属性的赋值

```python
def __setattr__(self, key, value):
    # 用于捕获对对象的属性进行赋值的操作
    pass

# 注意和上述的单例模式的属性赋值相比较, self模式下, 直接导致代码的崩溃
class Test:
    def __init__(self):
        self.key = ''

    def func(self):
        print(self.key)
	
    def __setattr__(self, key, value):
        if key == 'key':
            # 陷入无限递归死循环
            self.key = value
            # 正确的赋值方式
            self.__dict__[key] = value


t = Test()
t.key = 'abc'
t.func()
```

#### 读取属性

\_\_getattr\_\_

\_\_getattr\_\_, 这是读取**不存在**的属性时触发

\_\_getattribute\_\_

```python
def __getattribute__(self, item):
    # 调用对象属性返回的方式
    # 和设置属性一样, 直接读取也是会导致陷入死循环
    # self.__dict__[item], 这种方式读取也不行
    return super().__getattribute__(item)
```

#### 删除属性

\_\_delattr\_\_

### with的实现

```python
# 常见的with的使用, 用于保证打开的文件可以被自动关闭
with open(file) as f:
    pass

class Test:
    def __init__(self):
        print('init class')
        pass
    
    def __enter__(self):
        print('enter class')
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print('exit classs')
        pass

with Test() as t
	pass
    
```

### 关于抽象类

```python
# 在<流畅python>一书中, 作者谨慎推荐使用相关的方法
# 作者建议: 是否需要在代码中使用相关的约束
# 就如同__slot__一样
from abc import ABCMeta,abstractmethod

class Airer(metaclass=ABCMeta):
    @abstractmethod
    def airfly(self):
        pass
```



## 装饰器

应用场景

- 简化代码结构, 增强代码的复用性



### 不传递参数

```python
import time

# 一个简单的装饰器-计时器
# 需要注意的是, 这种装饰器会导致func的名称发生变化
def decoration(func):
    def wrapper(*args, **kwargs):
        s = time.time()
        func(*args, **kwargs)
        print(time.time() - s)

    return wrapper


@decoration
def test():
    time.sleep(0.2)


test()
```



### 传递参数



### 类作为装饰器



## subprocess

```python
import subprocess
import json
from pprint import pprint

file = r'C:\Users\Lian\Downloads\test.MOV'
exe = r"C:\Users\Lian\portable_software\ffmpeg\bin\ffprobe.exe"

cmd = f'{exe} -show_format -show_streams -of json "{file}"'
# shell=True, 
p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
'''
class subprocess.Popen( args, 
  bufsize=0, 
  executable=None,
  stdin=None,
  stdout=None, 
  stderr=None, 
  preexec_fn=None, 
  close_fds=False, 
  shell=False, 
  cwd=None, 
  env=None, 
  universal_newlines=False, 
  startupinfo=None, 
  creationflags=0)
  
'''
out, err = p.communicate()
```

## win32

```python
# 这两个模块都是源于: pip install pywin32
import win32api
import win32con

win32api.MessageBox(0, 'test', 'tips', win32con.MB_OK)
```

## json

json.dumps()对象转为字符串, 和JavaScript的JSON.stringify()有所差异

```python
import json

json.dumps([1,2,3])
# [1, 2, 3], 数字之间是存在空格的
json.dumps([1,2,3], separators=(',', ':'))
# [1,2,3]
```

javascript版本

```javascript

JSON.stringify([1, 2, 3]);
// [1,2,3], 不存在空格
```

## 具名元组

```python
from collections import namedtuple
# 生成一个City类
City = namedtuple("City", "name country polulation coordinates")
# 实例化
tokyo = City("Tokyo", 'JP', '36.93', ('35.68','139,69'))

print(tokyo)
# City(name='Tokyo', country='JP', polulation='36.93', coordinates=('35.68', '139,69'))

print(tokyo.name)
# Tokyo

# 打印字段名
print(City._fields)
('name', 'country', 'polulation', 'coordinates')

# 生成新实例
LatLong = namedtuple('LatLong', 'lat long')
Xiamen_tuple = ('Xiemen', 'China', '40,54', LatLong(24.26,118.03))
Xiamen = City._make(Xiamen_tuple)

print(Xiamen)
# City(name='Xiemen', country='China', polulation='40,54', coordinates=(24.26, 118.03))

# 将具名元组转为OrderDict
Xiamen_dict = Xiamen._asdict()
print(Xiamen_dict)
# OrderedDict([('name', 'Xiemen'), ('country', 'China'), ('polulation', '40,54'), ('coordinates', LatLong(lat=24.26, long=118.03))])
```

## tkinker

canvas无法直接将其中的内容直接转为图片保存, 有别于JavaScript的canvas是一个图像绘制和处理的中转站, tkinker只能作为图像绘制的画布.
