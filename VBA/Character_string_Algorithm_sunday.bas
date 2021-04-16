'@name: Character_string_Algorithm_sunday
'@author: HLA
'description:
'字符版本sunday字符串匹配算法
'字符串版本(最快字符串版本, 比byte版本慢了10倍, mid换成数组, 差距缩小到1.5倍, 速度超越instr函数)
'直接在内存中操作字符, 而是mid取单个字符, mid函数需要将取到的字符放到新的内存地址, 这需要花费大量的时间
Option Explicit
Private Const FADF_AUTO As Long = &H1
Private Const FADF_FIXEDSIZE As Long = &H10

Private Type aSAFEARRAY1D
    cDims As Integer
    fFeatures As Integer
    cbElements As Long
    cLocks As Long
    pvData As Long
    cElements As Long
    lLbound As Long
End Type

Private Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (Destination As Any, Source As Any, ByVal Length As Long)

Function aChar_Sunday(ByRef aSource As String, ByRef sFind As String) As Long
    Dim i As Long, sLen As Long, aLen As Long, mPointer As Long
    Dim j As Long, p As Long
    Dim n As Long
    Dim Index() As Long
    Dim sArray() As Integer   '不要设置为其他(Long)类型的数据, 否则返回的数据将非常乱, 都需要 and 65535进行二次处理, 只有integer的是稳定的数据
    Dim aArray() As Integer
    Dim sSA As aSAFEARRAY1D
    Dim aSA As aSAFEARRAY1D
    Dim stmpSA As aSAFEARRAY1D
    Dim atmpSA As aSAFEARRAY1D
    Dim aiTmp As Long
    Dim siTmp As Long
    
    aChar_Sunday = -1
    sLen = Len(sFind)
    aLen = Len(aSource)
    ReDim aArray(0)
    ReDim sArray(0)
    CopyMemory siTmp, ByVal VarPtrArray(sArray), 4 '保存指针的位置
    CopyMemory aiTmp, ByVal VarPtrArray(aArray), 4
    CopyMemory stmpSA, ByVal siTmp, Len(stmpSA)    '复制原有的数组的结构成员, 用于后续的恢复操作
    CopyMemory atmpSA, ByVal aiTmp, Len(atmpSA)
    With sSA
        .cDims = 1
        .cbElements = 2                   'Integer数据类型占2个字节, Long 4个字节
        .cElements = sLen
        .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE
        .pvData = StrPtr(sFind)
    End With
    CopyMemory ByVal siTmp, sSA, Len(sSA) '获得sFind的Unicode编码的数组
    With aSA
        .cDims = 1
        .cbElements = 2
        .cElements = aLen
        .fFeatures = FADF_AUTO Or FADF_FIXEDSIZE
        .pvData = StrPtr(aSource)
    End With
    CopyMemory ByVal aiTmp, aSA, Len(aSA) '返回的都是不规则的Unicode数据, 返回的数据和定义的数组的类型有直接关系
    p = sLen + 1
    ReDim Index(Max_Char)
    For i = 0 To Max_Char
        Index(i) = p
    Next
    p = sLen
    sLen = sLen - 1: aLen = aLen - 1 '注意, 下标, 0, 1, 数组是0, 直接字符串1
    For i = 0 To sLen
        Index(sArray(i) And Max_Char) = p - i
    Next
    mPointer = 0: i = aLen - sLen    '+ 1 不要+1, 因为aLen包含了扩充的预留的位置的长度
    '----------------------------
    n = sArray(0)
    Do While mPointer < i
        If aArray(mPointer) = n Then '可以设置大小敏感(字母的返回数据是稳定的)
            For j = 1 To sLen
                If aArray(mPointer + j) = sArray(j) Then
                    If j = sLen Then aChar_Sunday = mPointer: Exit Do
                Else
                    Exit For
                End If
            Next
        End If
        mPointer = mPointer + Index(aArray(mPointer + p) And Max_Char)          '尽管位运算很快但是还是很花时间
    Loop
    CopyMemory ByVal aiTmp, atmpSA, Len(atmpSA)
    CopyMemory ByVal siTmp, stmpSA, Len(stmpSA)                                 '恢复数组的SAFEARRAY结构成员信息,否则必然导致整个Excel崩溃
End Function
