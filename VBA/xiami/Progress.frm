VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Progress 
   Caption         =   "���ؽ���"
   ClientHeight    =   2850
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   11145
   OleObjectBlob   =   "Progress.frx":0000
   StartUpPosition =   1  '����������
End
Attribute VB_Name = "Progress"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
'����64λoffice�޷�ʹ�ý�����, ����ʹ������labelαװ�ɽ�������ʹ��

Private Sub CommandButton1_Click()
    Unload Me
End Sub

Private Sub CommandButton2_Click()
    If MsgBox("��������ǰ����,�Ƿ�ȷ��Ҫֹͣ?", vbQuestion + vbYesNo, "Tip") = vbNo Then Exit Sub
    StopFlag = True
    isRunning = False
    Me.Label1.Caption = "���������ѱ�ֹͣ"
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = vbFormControlMenu Then Cancel = isRunning 'cancel=true���޷��رմ���
End Sub

Private Sub UserForm_Terminate()
    StopFlag = False
End Sub
