VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit

Private Sub Workbook_BeforeClose(Cancel As Boolean)
    With ThisWorkbook.Sheets("Home")
        .ListBox1.Height = 0.5
        .TextBox1.Text = ""
    End With
    ThisWorkbook.Close savechanges:=True
End Sub

Private Sub Workbook_Open()
    With ThisWorkbook.Sheets("Home")
        .ListBox1.Height = 0.5
        .TextBox1.Text = ""
    End With
    If Len(ThisWorkbook.Sheets("Fund_Lists").Cells(2, 2).Value) = 0 Then MsgBox "欢迎使用VBA_基金全景, 第一次使用,请在联网的状态下进行数据库的更新", vbInformation + vbOKOnly, "Tip": ThisWorkbook.Sheets("Fund_Lists").Cells(2, 2).Value = 1
    If Len(ThisWorkbook.Sheets("Home").Cells(1, 1).Value) = 0 Then
         If IEVersion(True) = 0 Then MsgBox "IE浏览器版本低于9.0, 请升级浏览器,否则主要功能将无法使用", vbCritical, "Warning": Exit Sub
         If RegControl = False Then
               Alarm.Show
         Else
              ThisWorkbook.Sheets("Home").Cells(1, 1).Value = 1 '第1次启动时,检测注册表和ie浏览器
         End If
    End If
End Sub
