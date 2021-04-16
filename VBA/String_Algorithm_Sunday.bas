'@name: String_Algorithm_Sunday
'@author: HLA
'@function description:
'字符串匹配算法_星期天算法
'在大字符的匹配中(特别是双向大字节, 如查抄100M的文本, 匹配字符串的长度超过20), 其综合速度超过内置的VBA字符串查找算法以及uStrStr api的速度
'注意这是基于textStream, 而是文本直接比对
'基于textstream的好处在于, 读取本地硬盘的txt更为方便和速度更快, 读取100M纯txt速度才是制约匹配查找整个过程的速度关键
Option Explicit

Private Function String_Algorithm_Sunday(ByRef aSource() As Byte, ByRef sFind() As Byte) As Long
    Const defBit As Byte = 255
    Dim n As Long
    Dim m As Long
    Dim mIndex() As Long
    Dim mPointer As Long, i As Long
    Dim j As Long, p As Long
    
    m = UBound(sFind)
    n = UBound(aSource)
    ReDim mIndex(defBit)
    ReDim Preserve aSource(n + 1) '补位, 防止越界(如果不预设多一位, 在匹配末端的值时会经常出现越界的问题, 如匹配 aaaabbbbbf, 匹配b1f时(不匹配末端时才出现这种情况, 若以出现越界的问题)
    String_Algorithm_Sunday = -1  '在这里设置补位, 不在在循环用判断, 因为数字大, 而且重复次数多, 耗费的总时间大于redim的时间
    '--------------------------------------------------------------------------------------------------------------------------
    p = m + 2                     '即字符串长度+1
    For i = 0 To defBit           '预先设置好所有的偏移值(即, 先预设没有匹配值, 全部偏移m+2的长度)
        mIndex(i) = p
    Next
    p = m + 1
    For i = 0 To m                '算出最右边开始算起的各个字符的位置(如果有重复, 以最新的值为基准, 覆盖掉, 这里使用字典处理太慢)
        mIndex(sFind(i)) = p - i  '出现在第1位(0), 偏移位置即为整个字符串的长度p, 最后一位,即偏移值为1
    Next
    '---------------------------------------------------------------构造偏移位置
    mPointer = 0: i = n - m + 1
    n = sFind(0)
    '----------------------------
    Do While mPointer < i                                      '这里是核心关键, 关键在于尽可能压缩判断次数, 循环次数
        If aSource(mPointer) = n Then                          'BM算法反向匹配
            For j = 1 To m
                If aSource(mPointer + j) <> sFind(j) Then
                    Exit For
                Else
                    If j = m Then String_Algorithm_Sunday = mPointer: Exit Do '放在if判断内部, 减少此判断执行的次数
                End If
            Next
        End If
        mPointer = mPointer + mIndex(aSource(mPointer + p))     '和字典相比, 这里省掉了多个步骤0,1,2.. 3
    Loop
End Function
