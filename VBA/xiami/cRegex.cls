VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "cRegex"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit
'----------------正则
'如果不开启全局,将只匹配单个
Private oRegE As Object
'([hH][tT]{2}[pP]://|[hH][tT]{2}[pP][sS]://|[wW]{3}.|[wW][aA][pP].|[fF][tT][pP].|[fF][iI][lL][eE].)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|] 匹配网址

Private Sub Class_Initialize()
    Set oRegE = CreateObject("VBScript.RegExp")
End Sub

Private Sub Class_Terminate()
    Set oRegE = Nothing
End Sub
'--------------------------------------------类

'-----------执行
Friend Function ReplaceText(ByVal strText As String, ByVal sPattern As String, ByVal rpText As String, Optional ByVal IsGlobal As Boolean = True, Optional ByVal IgnoreC As Boolean = True) As String
    If isReady(strText, sPattern) = False Then Exit Function
    With oRegE
        .Pattern = sPattern
        .Global = IsGlobal
        .IgnoreCase = IgnoreC
        ReplaceText = .Replace(strText, rpText)
    End With
End Function

Friend Function sMatch(ByVal strText As String, ByVal sPattern As String, Optional ByVal IsGlobal As Boolean = True, Optional ByVal IgnoreC As Boolean = True) As String
    '--------------------------获取单个匹配值
    Dim matches As Object
    Dim match  As Object
    
    If isReady(strText, sPattern) = False Then Exit Function
    With oRegE
        .Pattern = sPattern
        .Global = IsGlobal
        .IgnoreCase = IgnoreC
        Set matches = .Execute(strText)
        For Each match In matches
            sMatch = match.Value: Exit For
        Next
    End With
    Set matches = Nothing
End Function

Friend Function xMatch(ByVal strText As String, ByVal sPattern As String, Optional ByVal IsGlobal As Boolean = True, Optional ByVal IgnoreC As Boolean = True) As String()
    Dim i As Long
    Dim matches As Object
    Dim match As Object
    Dim arr() As String
    '-------------获取多个匹配值
    If isReady(strText, sPattern) = False Then Exit Function
    With oRegE
        .Pattern = sPattern
        .Global = IsGlobal
        .IgnoreCase = IgnoreC
        Set matches = .Execute(strText)
    End With
    i = matches.Count - 1
    If i < 0 Then Exit Function
    ReDim xMatch(i)
    ReDim arr(i)
    i = 0
    For Each match In matches
        arr(i) = match.Value: i = i + 1
    Next
    xMatch = arr
    Set matches = Nothing
End Function

Friend Function xSubmatch(ByVal strText As String, ByVal sPattern As String, Optional ByVal IsGlobal As Boolean = True, Optional ByVal IgnoreC As Boolean = True) As String()
    Dim i As Long, p As Long, n As Long, m As Integer, j As Integer
    Dim matches As Object
    Dim match As Object
    Dim arr() As String
    '-------------获取多个子项匹配值, sPattern中需要匹配的子项, 可以用括号括起
    'sPartten="songID":+[\d]{6,} 换成("songID"):+([\d]{6,})
    If isReady(strText, sPattern) = False Then Exit Function
    With oRegE
        .Pattern = sPattern
        .Global = IsGlobal
        .IgnoreCase = IgnoreC
        Set matches = .Execute(strText)
    End With
    n = matches.Count - 1
    If n < 0 Then Exit Function
    ReDim arr(n, 0)
    ReDim xSubmatch(n, 0) '一维数组不能再次redim为二维
    j = 0
    For Each match In matches
        p = match.SubMatches.Count - 1
        If p > m Then m = p: ReDim Preserve arr(n, m): ReDim Preserve xSubmatch(n, m)
        For i = 0 To p
            arr(j, i) = match.SubMatches(i)
        Next
        j = j + 1
    Next
    xSubmatch = arr
    Set matches = Nothing
End Function

Friend Function cTest(ByVal strText As String, ByVal sPattern As String, Optional ByVal IsGlobal As Boolean = True, Optional ByVal IgnoreC As Boolean = True) As Boolean
    '----检查是否有匹配值
    If isReady(strText, sPattern) = False Then Exit Function
    With oRegE
        .Pattern = sPattern
        .Global = IsGlobal
        .IgnoreCase = IgnoreC
        cTest = .Test(strText)
    End With
End Function

Private Function isReady(ByVal strText As String, ByVal sPattern As String) As Boolean '检查输入的内容
    isReady = True
    If Len(Trim(strText)) = 0 Or Len(sPattern) = 0 Then isReady = False
End Function

