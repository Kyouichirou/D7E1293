VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "cDownload"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit
'Private Const ExePath As String = "C:\Users\adobe\Documents\cUrl_32\bin\curl.exe"
'Private wsh As Object
Private ExePath As String
Private arrIndex() As Long
Private dIndex As Integer
Private dCount As Integer
Private isReady As Boolean

Private Sub Class_Initialize()
'    Set wsh = CreateObject("WScript.Shell") 'run方法无法返回pid
     isReady = True
     ExePath = ThisWorkbook.Sheets("Temp").Cells(4, 2).Value
     If Len(ExePath) = 0 Then isReady = False
End Sub

Private Sub Class_Terminate()
'    Set wsh = Nothing
    Erase arrIndex
    dIndex = 0
    dCount = 0
    ExePath = ""
    isReady = False
End Sub

Friend Property Get isPrepare() As Boolean '成功执行
    isPrepare = isReady
End Property

Friend Sub mDownload(ByVal Url As String, ByVal savePath As String)
    Dim sPath As String
    sPath = """" & ExePath & """"
    Url = """" & Url & """"
    savePath = """" & savePath & """" '----------------------------------------增加双引号不能完全消除干扰
    arrIndex(dIndex) = Shell(ExePath & " -o " & savePath & " " & Url, vbHide) '异步执行/返回pid判断程序运行状态 '需要注意命令字符串当中的符号造成的干扰, 如双引号,单引号等
End Sub

Friend Property Let mListcount(ByVal i As Integer)
    dCount = i
End Property

Friend Property Let mIndex(ByVal i As Integer)
    dIndex = i
End Property

Friend Property Get List_Index(ByVal i As Integer) As Long '成功执行
    List_Index = arrIndex(i)
End Property

Friend Sub Array_Initial()
    ReDim arrIndex(dCount)
End Sub
