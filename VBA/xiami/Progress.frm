VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Progress 
   Caption         =   "下载进度"
   ClientHeight    =   2850
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   11145
   OleObjectBlob   =   "Progress.frx":0000
   StartUpPosition =   1  '所有者中心
End
Attribute VB_Name = "Progress"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
'由于64位office无法使用进度条, 这里使用两个label伪装成进度条来使用

Private Sub CommandButton1_Click()
    Unload Me
End Sub

Private Sub CommandButton2_Click()
    If MsgBox("将放弃当前任务,是否确定要停止?", vbQuestion + vbYesNo, "Tip") = vbNo Then Exit Sub
    StopFlag = True
    isRunning = False
    Me.Label1.Caption = "下载任务已被停止"
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = vbFormControlMenu Then Cancel = isRunning 'cancel=true将无法关闭窗口
End Sub

Private Sub UserForm_Terminate()
    StopFlag = False
End Sub
