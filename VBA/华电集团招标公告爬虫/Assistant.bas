Attribute VB_Name = "Assistant"
Option Explicit

'禁用事件
Sub DisEvents()
    With ThisWorkbook.Application
        .ScreenUpdating = False
        .EnableEvents = False
        .Calculation = xlCalculationManual
    End With
End Sub

'启用事件
Sub EnEvents()
    With ThisWorkbook.Application
        .ScreenUpdating = True
        .EnableEvents = True
        .Calculation = xlCalculationAutomatic
    End With
End Sub

'时间戳
Private Function getTimestamp() As String
    getTimestamp = CStr(DateDiff("s", "01/01/1970 00:00:00", Now()))
End Function

'正则
Function get_Reg() As Object
    Set get_Reg = CreateObject("VBScript.RegExp")
End Function

Function table_name(ByVal c As String, ByVal inx As String) As String
    table_name = c + "_" + inx + "_" + getTimestamp()
End Function


Sub dkfk()
Debug.Print (AscW("z"))
End Sub
