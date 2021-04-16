Option Explicit
'@name c_big_String_Builder
'@author: HLA
'@update: N/A
'@function description:
'查找, 指定位置插入字符串, 拼接, 等长字符串拼接
'轻量级大字符串构建 , 一段长度为38的字符串, 连续拼接10万次, 消耗的时间高达120+s, 而此方法仅需要0.0xs
'dim s as string * x, x的长度有所限制(256 *256), 定长的字符串
'在文本处理中, 大字符串的处理非常消耗时间
'需要注意的是在VBA中使用API是非常危险的操作, 特别是内存操纵的, 很容易触发Excel的崩溃, 产生的错误会突破Excel的文件保护机制, 导致数据的丢失
Private TextBuffer() As String
Private TextIndex As Long
Private Text_Buffer_Size As Long
Private cString As String
'拼接时(join), 指定的间隔符
Public Enum SeparatorType
    Nulls = 0
    Enter = 1
    NewLine = 2
    Enter_NLine = 3
    Dash = 4      '横杠
    Comma = 5     '逗号
    Semicolon = 6 '分号
    Blank = 7     '空格
    sTab = 8      'Tab键
End Enum
#If VB7 Then
    Private Declare PtrSafe Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (Destination As Any, Source As Any, ByVal Length As LongPtr) '这两个api最好搭配使用, 否则很容易出现错误
    Private Declare PtrSafe Sub RtlZeroMemory Lib "kernel32" (ByVal Destination As Long, ByVal Length As Long)
    Private Declare PtrSafe Function VarPtrArray Lib "msvbvm60.dll" Alias "VarPtr" (ByRef Ptr() As Any) As Long
#Else
    Private Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (Destination As Any, Source As Any, ByVal Length As Long)
    Private Declare Sub RtlZeroMemory Lib "kernel32" (ByVal Destination As Long, ByVal Length As Long)
    Private Declare Function VarPtrArray Lib "msvbvm60.dll" Alias "VarPtr" (ByRef Ptr() As Any) As Long
#End If

Private Sub Class_Initialize()
    TextIndex = 0
    Text_Buffer_Size = 4096
End Sub

Private Sub Class_Terminate()
    TextIndex = 0
    Text_Buffer_Size = 0
    Erase TextBuffer
    cString = vbNullString
End Sub

Friend Property Let BuffSize(ByVal bSize As Long) ' 如果字符串拼接数量特别大, 最好自定义
    If bSize > 0 Then Text_Buffer_Size = bSize
End Property

Friend Sub SwapString(ByRef aString As String, ByRef bString As String) '快速交换字符串, 用于需要作交换处理的大字符串
    Dim sPtr As Long, aPtr As Long, bPtr As Long
    
    sPtr = StrPtr(aString)
    aPtr = VarPtr(aString): bPtr = VarPtr(bString)
    CopyMemory ByVal aPtr, ByVal bPtr, 4
    CopyMemory ByVal bPtr, sPtr, 4
End Sub

Friend Sub cString_Initial()
    ReDim TextBuffer(Text_Buffer_Size)
End Sub

Friend Property Get Get_cString() As String
    Get_cString = cString
End Property

Friend Property Get string_Length() As Long
    string_Length = Len(cString)
End Property

Friend Sub Append(ByRef sText As String) '放置进临时数组
    If Text_Buffer_Size < TextIndex Then
        Text_Buffer_Size = 2 * TextIndex
        ReDim Preserve TextBuffer(1 To Text_Buffer_Size)
    End If
    TextBuffer(TextIndex) = sText
    TextIndex = TextIndex + 1
End Sub

Friend Sub Combine_String(Optional ByVal sDelimiter As String, Optional ByVal Separator As SeparatorType) '拼接
    Dim cSeparator As String
    If LenB(sDelimiter) = 0 Then cSeparator = Type_Separator(Separator) Else cSeparator = sDelimiter
    If Text_Buffer_Size > TextIndex Then ReDim Preserve TextBuffer(TextIndex - 1)
    cString = Join(TextBuffer, cSeparator)
End Sub

Private Function Type_Separator(ByVal iType As Byte) As String '间隔符
    Dim strTemp As String
    Select Case iType
        Case 0: strTemp = vbNullString
        Case 1: strTemp = vbCr
        Case 2: strTemp = vbNewLine
        Case 3: strTemp = vbCrLf
        Case 4: strTemp = ChrW$(45)
        Case 5: strTemp = ChrW$(44)
        Case 6: strTemp = ChrW$(59)
        Case 7: strTemp = ChrW$(32)
        Case 8: strTemp = vbTab
    End Select
    Type_Separator = strTemp
End Function

Friend Sub Clear(Optional ByVal bSize As Long) '重置
    cString = vbNullString
    TextIndex = 0
    If bSize > 0 Then Text_Buffer_Size = bSize
    ReDim TextBuffer(Text_Buffer_Size)
End Sub

Friend Function Text_Find(ByVal strKey As String, Optional ByVal IgnoreC As Boolean = False) As Long '或者调用正则来查找
    Dim i As Long
    
    If IgnoreC = True Then
        i = InStr(1, strKey, cString, vbBinaryCompare)
        If i = 0 Then
            strKey = LCase$(strKey)
            i = InStr(1, strKey, strTemp, vbBinaryCompare)
        End If
    Else
        i = InStr(1, strKey, cString, vbBinaryCompare)
    End If
    Text_Find = i
End Function

Friend Sub InsertText(ByRef sText As String, ByVal sIndex As Long) '在字符串某个位置中插入字符串
    Dim i As Long
    
    If TextIndex = 0 Then Exit Sub
    If Text_Buffer_Size = 0 Then Exit Sub
    If sIndex >= Text_Buffer_Size Then
        Text_Buffer_Size = Text_Buffer_Size + 1: ReDim Preserve TextBuffer(Text_Buffer_Size)
        TextBuffer(Text_Buffer_Size) = sText
    Else
        If sIndex >= TextIndex Then
            TextBuffer(TextIndex) = sText
        Else
            For i = sIndex To TextIndex
                TextBuffer(i + 1) = TextBuffer(i)
            Next
            TextBuffer(sIndex) = sText
        End If
    End If
    TextIndex = TextIndex + 1
End Sub

Friend Sub Same_String_Connect(ByRef cText As String) '定长拼接, 长度相同的字符串拼接, 由于预先使用space划出完整的内存块, 拼接的速度比数组更快
    Dim i As Long
    Dim k As Long
    Dim cLength As Long
    
    cLength = Len(cText)
    If cLength = 0 Then Exit Sub
    If Text_Buffer_Size < 2 Then Exit Sub
    cString = Space$(cLength * (Text_Buffer_Size))
    k = 1
    For i = 1 To Text_Buffer_Size
        Mid$(cString, k, cLength) = cText: k = 1 + i * cLength
    Next
End Sub
