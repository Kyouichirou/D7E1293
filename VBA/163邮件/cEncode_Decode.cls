VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "cEncode_Decode"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit
'说明
'该方法不会对 ASCII 字母和数字进行编码，也不会对这些 ASCII 标点符号进行编码： - _ . ! ~ * ' ( ) 。
'该方法的目的是对 URI 进行完整的编码，因此对以下在 URI 中具有特殊含义的 ASCII 标点符号，encodeURI() 函数是不会进行转义的：;/?:@&=+$,#
'提示：如果 URI 组件中含有分隔符，比如 ? 和 #，则应当使用 encodeURIComponent() 方法分别对各组件进行编码。
Private oWin As Object
Private ohtml As Object

Private Sub Class_Initialize()
    Set ohtml = CreateObject("htmlfile")
    Set oWin = ohtml.parentwindow
End Sub

Private Sub Class_Terminate()
    Set ohtml = Nothing
    Set oWin = Nothing
End Sub

Friend Function Url_Encode(ByVal strText As String) As String
    Url_Encode = Excute(strText, 1)
End Function

Friend Function Url_EncodeComponent(ByVal strText As String) As String
    Url_EncodeComponent = Excute(strText, 2)
End Function

Friend Function Url_Decode(ByVal strText As String) As String
    Url_Decode = Excute(strText, 3)
End Function

Friend Function Url_decodeComponent(ByVal strText As String) As String
    Url_decodeComponent = Excute(strText, 4)
End Function

Private Function Excute(ByVal strText As String, ByVal i As Byte) As String
    Dim sCode As String, sMethod As String
    
    strText = Trim$(strText)
    If LenB(strText) = 0 Then Exit Function
    strText = Replace$(strText, ChrW$(10), "", 1, , vbBinaryCompare) '换行符会对执行造成影响
    strText = Replace$(strText, ChrW$(13), "", 1, , vbBinaryCompare)
    Select Case i
        Case 1: sMethod = "encodeURI"
        Case 2: sMethod = "encodeURIComponent"
        Case 3: sMethod = "decodeURI"
        Case 4: sMethod = "decodeURIComponent"
        Case Else: Exit Function
    End Select
    sCode = "var str=" & ChrW$(39) & strText & ChrW$(39) & ";"
    sCode = sCode & "var sResult = " & sMethod & "(str);"
    oWin.eval sCode
    Excute = oWin.sResult
End Function

