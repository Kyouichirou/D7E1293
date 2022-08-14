VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} c_pannel 
   Caption         =   "UserForm1"
   ClientHeight    =   5205
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   12105
   OleObjectBlob   =   "c_pannel.frx":0000
   StartUpPosition =   1  '����������
End
Attribute VB_Name = "c_pannel"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Private Phone As String

Private Sub CommandButton1_Click()
    Dim sP As Long
    Dim eP As Long, sh As Worksheet
    
    sP = check_content(Me.TextBox1.Value)
    eP = check_content(Me.TextBox2.Value)
    If (sP > 0 And eP > 0 And sP < eP And eP - sP < 5) Then
        Set sh = cTable.create_Table()
        write_Table sh, Assistant.table_name(Me.Caption, CStr(sP) + "_" + CStr(eP))
       c_module.m_Capture Me.Caption, sh, Me.Caption, sP, eP, get_type()
    Else
        MsgBox ("��������")
    End If
End Sub

Private Sub CommandButton2_Click()
    Dim i As Long, sh As Worksheet
    
    i = check_content(Me.TextBox3.Value)
    If (i > 0) Then
        Set sh = cTable.create_Table()
        write_Table sh, Assistant.table_name(Me.Caption, CStr(i))
        c_module.s_Capture Me.Caption, sh, True, Me.Caption, i, get_type()
    Else
        MsgBox ("��������"): Exit Sub
    End If
    Set sh = Nothing
End Sub

Private Function check_content(text) As Long
    If (Len(text) > 0 And IsNumeric(text)) Then check_content = CLng(text)
End Function

Private Sub CommandButton3_Click()
    ThisWorkbook.Sheets(Me.Caption).Cells(3, 2).Resize(20, 4).Clear
    c_module.s_Capture Me.Caption, ThisWorkbook.Sheets(Me.Caption), False, Me.Caption, 1, get_type()
End Sub

Private Function get_type() As String
    Dim t As String
    If (Me.Caption = "ѯ�۹���") Then
        t = "1"
    Else
        t = "0"
    End If
    get_type = t
End Function

Private Function get_Phone_num() As String
    get_Phone_num = Me.TextBox4.Value
End Function

Private Sub CommandButton4_Click()
    Dim id As String
    Dim yn As VbMsgBoxResult
    
    yn = MsgBox("ֻ����֤���ڲ���Ҫˢ��, ȷ����ȡ�µ���֤��?", vbYesNo, Me.Caption)
    If (yn = vbNo) Then Exit Sub
    id = get_Phone_num()
    If (Len(id) = 11) Then
        If (Security_Check.get_check_code(id) = True) Then
            MsgBox "������֤��ɹ�, ��ע�����" + vbCr + "�յ�����3������������֤��", vbInformation
        Else
            MsgBox "������֤��ʧ��, �Ժ�������", vbInformation
        End If
    Else
        MsgBox ("������������")
    End If
    ThisWorkbook.Sheets("setting").Cells(1, 1).Value = id
End Sub

Private Sub CommandButton5_Click()
    Dim code As String, id As String
    Dim yn As VbMsgBoxResult
    
    yn = MsgBox("�Ƿ�ȷ����֤��������ȷ", vbYesNo, Me.Caption)
    If (yn = vbNo) Then Exit Sub
    id = get_Phone_num()
    code = Me.TextBox5.Value
    If (Len(code) = 6 And Len(id) = 11) Then
        If Security_Check.set_security_code(id, code) = True Then
            MsgBox "��֤�ѳɹ�ˢ��", vbInformation
        Else
            MsgBox "��֤ʧ��, ���Ժ�����", vbInformation
        End If
    Else
        MsgBox ("������������")
    End If
End Sub

Private Sub write_Table(ByRef sh As Worksheet, ByVal name As String)
    sh.name = name
    ThisWorkbook.Sheets(1).Cells(2, 2).Resize(1, 4).Copy sh.Cells(6, 2)
End Sub

Private Sub UserForm_Initialize()
    Me.TextBox4.Value = ThisWorkbook.Sheets(5).Cells(1, 1).Value
End Sub

Private Sub UserForm_Terminate()
    Phone = ""
End Sub

