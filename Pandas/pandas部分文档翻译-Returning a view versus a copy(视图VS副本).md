# pandas部分文档翻译 - 视图 OR 副本

[TOC]


## 一. 问题的起源

在使用pandas进行处理数据时, 时不时会出现一个异常的**警告**(注意这不是**错误**)

> C:\Users\Lian\AppData\Local\Temp/ipykernel_15272/2330773252.py:4: SettingWithCopyWarning: 
> A value is trying to be set on a copy of a slice from a DataFrame.
> Try using .loc[row_indexer,col_indexer] = value instead
>
> See the caveats in the documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#returning-a-view-versus-a-copy
>   tmp['c'] = tmp['a'] + tmp['b']

一开始简单查阅一下该警告的来源, 但是大部分检索信息只是简单提及该问题如何出现, 如何解决(例如使用copy), 并未提及该问题出现的具体原因所在. 由于只是简单的警告, 忽略该警告对于计算结果不产生影响, 一直没有真正探究问题所在, 终于还是遇到麻烦, 这个错误的出现的同时, 同时引发其他的错误.

开始着手了解和解决这个问题, 随手构造一个触发该警告的示例代码, 二者皆会触发上面所提及的警告提示.

```python
def test():
    x = {
        'a': [0, -2, -2, 90],
        'b': [2, 3, 4, 5]
    }
    df = pd.DataFrame(x)
    # 注意这里的取值方式
    tmp = df[df['a'] < 0]
    tmp['c'] = tmp['a'] + tmp['b']
    print(tmp)
    print(df)
    
test()
```

```python
def test():
    x = {
        'a': [0, -2, -2, 90],
        'b': [2, 3, 4, 5]
    }
    df = pd.DataFrame(x)
    # 注意这里的取值方式
    tmp = df.loc[df['a'] < 0]
    tmp['c'] = tmp['a'] + tmp['b']
    print(tmp)
    print(df)
    
test()
```

查阅大量资料的同时, 顺手翻译该警告的链接所提及的内容.

## 二. 返回一个视图(view) VS 副本(copy)

![图示](https://img-blog.csdnimg.cn/20210312201944283.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2xpbGRu,size_16,color_FFFFFF,t_70)

*(译者注: 上图引用[csdn博客](https://blog.csdn.net/lildn/article/details/114705689), 注意上图的定义并非严谨(仅仅是理论状况)*

![例外](https://p1.meituan.net/csc/eaa00cd3568ffe8d2199ab7112f7f18a64803.jpg)

*(译者注: .loc在特定的案例中, get操作依然可能会返回副本)*

以下是官方文档所提及的内容翻译:

当在pandas对象中设置值时, 应当小心避免使用被称之为"**链式索引**"(chained indexing)的方式.


```python
dfmi = pd.DataFrame([list('abcd'),
                     list('efgh'),
                     list('ijkl'),
                     list('mnop')],
                    columns=pd.MultiIndex.from_product([['one', 'two'],
                                                        ['first', 'second']]))


dfmi
    one          two
  first second first second
0     a      b     c      d
1     e      f     g      h
2     i      j     k      l
3     m      n     o      p
```

*(译者注: 文档中构造的示例)*

对比两种访问元素的方法

```python
dfmi['one']['second']
Out[358]:
0    b
1    f
2    j
3    n
Name: second, dtype: object
```

```python
dfmi.loc[:, ('one', 'second')]
Out[359]:
0    b
1    f
2    j
3    n
Name: (one, second), dtype: object
```

这两种方法都能得到相同的结果, 哪一种是你应该使用的呢?了解这些操作的顺序, 对于理解为什么使用.loc方法要远优于方法1(链式操作)是有益的.

dfmi['one']的操作是选择(select)列的第一级, 返回一个单独索引(single_indexed)的dataframe. 然后后续的操作, dfmi_with_one['second'], 这一操作执行返回的以'second'为索引的列(series). 这些操作表明, pandas将这些操作视作单独的事件, 每次单独调用\_\_getitem__, 因此这些操作是线式的, 执行完了一个之后, 然后再执行后续的操作.

将上述的操作和.loc方法相对比, 后者一次性将传递一个元组参数给\_\_getitem__, 这允许pandas将之视作一个整体来执行. 此外, .loc操作的执行速度更快, 假如有需要的话, 同时可以对1个或者2个轴进行进行索引.

## 三. 为什么会出现赋值失败当使用链式索引时?

这个问题在上一节当中还只是一个执行效率的问题. 什么原因会触发"SettingWithCopy warning"这个警告呢? pandas通常情况下是不会触发这个警告的, 假如执行操作只是额外多消耗几毫秒时.

但是事实证明链式赋值通常会导致不可预测的结果, 要了解其中原因, 需要仔思考Python的解释器是如何知行这些代码的.

```python
dfmi.loc[:, ('one', 'second')] = value
# becomes
dfmi.loc.__setitem__((slice(None), ('one', 'second')), value)
```

处理上的差异:

```python
dfmi['one']['second'] = value
# becomes
dfmi.__getitem__('one').__setitem__('second', value)
```

看到\_\_getitem\_\_的位置没? 通常情况下, 这非常难预测返回的执行结果到底是视图还是副本(这取决于数组消耗的内存的大小, pandas不保证其结果). 因此\_\_getitem\_\_修改'dfmi'这个对象或者其他的临时对象后, 是否马上销毁掉该对象, 这是SettingWithCopy触发的原因.

*(译者注: 作者所提及的关于数组大小的问题, 就是pandas执行链式操作之后, Python的解释器会根据生成的数据大小来决定返回的结果是视图还是副本, 这一点在实践当, 这种警告的出现没有什么特定的场景, 这是因为你操作的数据很小, 没问题, 但是数据大了(但这并不完全是), 就触发警告.)*

> **注意:**

> > 你也许会好奇我们应该关心一下第一个案例中的loc属性. 但是案例一中提及的dfmi.loc只是保证其自身修改索引的行为, 所以dfmi.loc.\_\_getitem\_\_ / dfmi.loc.\_\_setitem\_\_ 的操作是在dfmi中直接进行的. 当然dfmi.loc.\_\_getitem\_\_也可能得到一个dfmi的视图或者副本.

*(译者注: 即loc并不一定得到一个视图, 也可能是副本)*

有时当没有明显的链式操作时也会触发一个SettingWithCopy警告, 这些并不是bugs, 是pandas程序的故意而为的, 旨在捕捉这种错误. 可能仅仅是pandas想警告你, 你曾经试图这样操作过.

例如:

```python
def do_something(df):
    foo = df[['bar', 'baz']]  # Is foo a view? A copy? Nobody knows!
    # ... many lines here ...
    # We don't know whether this will modify df or not!
    foo['quux'] = value
    return foo
```

## 四. 评估顺序的事项

当你使用链式索引时, 链式操作的顺序和类型部分程度决定了执行结果返回的是原始对象的切片还是切片的副本.

pandas触发SettingWithCopyWarning通常情况下是意外给一个副本进行赋值操作, 以及链式索引操作预期返回的是视图切片而实际返回的是副本.

如果你希望pandas或多或少地信任链式索引表达式赋值操作, 你可以将`mode.chained_assignment`设置为以下的其中一个值:

- `'warn'`, SettingWithCopyWarning的默认值, 只是打印出来提醒.
- `'raise'` 意味着 pandas 将会触发SettingWithCopyException, 你必须处理这个问题
- `None`, 将完全忽略警告

```python
dfb = pd.DataFrame({'a': ['one', 'one', 'two',
                          'three', 'two', 'one', 'six'],
                    'c': np.arange(7)})


# This will show the SettingWithCopyWarning
# but the frame values will be set
dfb['c'][dfb['a'].str.startswith('o')] = 42
```

然而这种在副本上的操作是不可行的

```python
pd.set_option('mode.chained_assignment','warn')
dfb[dfb['a'].str.startswith('o')]['c'] = 42
Traceback (most recent call last)
     ...
SettingWithCopyWarning:
     A value is trying to be set on a copy of a slice from a DataFrame.
     Try using .loc[row_index,col_indexer] = value instead
```

链式赋值可以突然出现在混合类型的dataframe上.

> **注意:**

>> 这些规则适用于所有的 .loc/.iloc

以下的操作建议使用.loc方式访问多个项(使用掩码)或者是使用固定索引访问单个项

```python
dfc = pd.DataFrame({'a': ['one', 'one', 'two',
                          'three', 'two', 'one', 'six'],
                    'c': np.arange(7)})


dfd = dfc.copy()

# Setting multiple items using a mask
mask = dfd['a'].str.startswith('o')

dfd.loc[mask, 'c'] = 42

dfd
Out[366]: 
       a   c
0    one  42
1    one  42
2    two   2
3  three   3
4    two   4
5    one  42
6    six   6

# Setting a single item
dfd = dfc.copy()

dfd.loc[2, 'a'] = 11

dfd
Out[369]: 
       a  c
0    one  0
1    one  1
2     11  2
3  three  3
4    two  4
5    one  5
6    six  6
```

以下操作有时会起作用, 但是并无法保证其可靠性, 建议避免使用.

```python
dfd = dfc.copy()

dfd['a'][2] = 111

dfd
Out[372]: 
       a  c
0    one  0
1    one  1
2    111  2
3  three  3
4    two  4
5    one  5
6    six  6
```

最后的这个例子没有起作用, 应当避免使用:

```python
pd.set_option('mode.chained_assignment','raise')
dfd.loc[0]['a'] = 1111
Traceback (most recent call last)
     ...
SettingWithCopyException:
     A value is trying to be set on a copy of a slice from a DataFrame.
     Try using .loc[row_index,col_indexer] = value instead
```

> **警告:**

> > 链式操作警告和异常旨在提醒用户可能的无效任务. 也许一些警告是误报, 在某些特殊情况下.

## 五. 译者后记

该问题并没有一个很好的解释, 尽管某些解释或者操作似乎看起来满足区分视图和副本, 但在stackflow和GitHub中依然有大量的问题涉及到这些内容而没有很好的解释的, 尽管其中的一些问题并不影响使用, 但是还是需要注意这些问题对于代码的健壮产生潜在的负面影响, 故而切勿忽略隐藏pandas这个警告提醒.

[pandas复制](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.copy.html)

[stackflow问题1](https://stackoverflow.com/questions/61578453/python-pandas-df-copy-ist-not-deep/61582117#61582117)

[stackflow问题2](https://stackoverflow.com/questions/46327494/python-pandas-dataframe-copydeep-false-vs-copydeep-true-vs)

[stackflow问题3](https://stackoverflow.com/questions/61578453/python-pandas-df-copy-ist-not-deep/61582117#61582117)

[GitHub issue](https://github.com/pandas-dev/pandas/issues/17406)

为了减少出现异常, 在操作上应当:

1. 减少链式索引的操作
2. 赋值操作应当以.loc/.iloc为主
3. 

