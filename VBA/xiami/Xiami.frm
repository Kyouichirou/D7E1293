VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Xiami 
   Caption         =   "Xiami_Music_Downloader"
   ClientHeight    =   7740
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   15840
   OleObjectBlob   =   "Xiami.frx":0000
   ShowModal       =   0   'False
   StartUpPosition =   1  '����������
End
Attribute VB_Name = "xiami"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
#If VBA7 Then
    Private Declare PtrSafe Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
    Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
    Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
    Private Declare Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
#End If
Dim arrSearch() As String '���������Ľ��
Dim arrCollect() As String
Dim iCHK1 As Byte, iCHK2 As Byte, iCHK3 As Byte, iCHK4 As Byte
Dim iOpt As Byte
Dim dMode As Byte
Dim sFlag As Boolean
Dim tKey As String
Dim NewM As Boolean, iNewM As Boolean
Dim eCount As Byte

Private Sub CommandButton12_Click()
    OpenFileLocation bPath
End Sub

Private Sub TextBox1_KeyDown(ByVal KeyCode As MSForms.ReturnInteger, ByVal Shift As Integer)
    If KeyCode = 13 Then Search
End Sub

Private Sub CommandButton1_Click() '����
    Search
End Sub

Private Sub Search()
 Dim arr() As String
    Dim Key As String
    Dim i As Byte, k As Byte, m As Byte, p As Byte
    
    If Len(xmCookie) = 0 Then
        MsgShow "ʹ��ǰ,��������Cookie", "Tip", 1200
        Exit Sub
    End If
    Key = Me.TextBox1.Text
    Key = Trim$(Key)
    If Len(Key) = 0 Then Exit Sub
    If Len(tKey) = 0 Then
        tKey = Key
    Else
        If tKey = Key Then
            If MsgBox("����������ǰ��һ���Ƿ����", vbYesNo + vbQuestion, "Tip") = vbNo Then Exit Sub
        End If
    End If
    If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    If InStr(1, Key, "http", vbBinaryCompare) > 0 Then
        If InStr(1, Key, "https://www.xiami.com/collect/", vbBinaryCompare) > 0 Then
            Open_Collection True
            Exit Sub
        Else
            MsgShow "�������������", "Tip", 1200: Exit Sub
        End If
    End If
    enCookie = True
    isSec = False
    Me.Label4.Caption = "����������..."
    Me.Repaint
    arr = Xiami_Search(Key)
    If enCookie = False Or isSec = True Then
        ThisWorkbook.Sheets("Temp").Cells(3, 2) = ""
        With Me
            .TextBox2.Enabled = True
            .CommandButton2.Enabled = True
            .CommandButton7.Enabled = True
            .TextBox2.Text = "cookie�ѹ���"
        End With
        eCount = eCount + 1
        If eCount > 2 Then MsgBox "�����Ѿ�����Ϻ�׻�����֤����, ���������ֶ���ȡcookie", vbInformation + vbOKOnly, "Tip"
    End If
    If SafeArrayGetDim(arr) = 0 Then MsgShow "δ��ȡ����Ч��Ϣ", "Tip", 1200: Me.Label4.Caption = "": Exit Sub
    i = UBound(arr)
    k = UBound(arr, 2)
    ReDim arrSearch(i, k)
    arrSearch = arr
    m = 0
    With Me.ListBox1
        .Clear
        For p = 0 To i
            If Len(arr(p, 4)) = 0 Then Exit For
            .AddItem
            .List(p, 0) = arr(p, 5) '����
            .List(p, 1) = arr(p, 2) 'ר��
            .List(p, 2) = arr(p, 6) '����
            .List(p, 3) = msToMinute(arr(p, 7)) '����
        Next
    End With
    Me.Label4.Caption = ""
    MsgShow "��ȡ����������" & CStr(p) & "��", "Tip", 1200
    Erase arr
    dMode = 0
    eCount = 0
    Me.OptionButton2.Enabled = False
End Sub

Private Sub CommandButton10_Click() 'ǿ��ˢ�»�ȡcookie
    Const tUrl As String = "https://www.xiami.com/"
    Dim strx As String
    If MsgBox("�Ƿ�ǿ�ƻ�ȡCookie", vbQuestion + vbYesNo, "Question") = vbNo Then Exit Sub
    If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    Me.Label4.Caption = "����������..."
    Me.Repaint
    strx = Cookie_Generator(tUrl)
    If Len(strx) = 0 Then MsgShow "δ��ȡ��cookie,���ֶ�", "Tip", 1500: Me.Label4.Caption = "": Exit Sub
    ThisWorkbook.Sheets("Temp").Cells(3, 2).Value = strx
    xmCookie = strx
    Dim crg As New cRegex
    strx = crg.sMatch(strx, "xm_sg_tk=.*?;")
    strx = Split(strx, "=")(1)
    tkCookie = Left$(strx, Len(strx) - 1)
    Me.CommandButton3.Enabled = True
    Me.CommandButton2.Enabled = False
    Set crg = Nothing
    With Me
        .TextBox2.Text = strx
        .CommandButton3.Enabled = True
        .CommandButton2.Enabled = False
        .CommandButton7.Enabled = False
    End With
    MsgShow "Cookieˢ�³ɹ�", "Tip", 1200
    Me.Label4.Caption = ""
End Sub

Private Sub CommandButton11_Click()
    Dim i As Integer, k As Integer
    With Me.ListBox1
        i = .ListCount
        If i = 0 Then Exit Sub
        i = i - 1
        For k = 0 To i
            If .Selected(k) = True Then .Selected(k) = False
        Next
    End With
End Sub

Private Sub CommandButton7_Click() '�Զ���ȡcookie
    Dim strx As String
    
    If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    Me.Label4.Caption = "���ݴ�����..."
    Me.Repaint
    strx = Get_Cookie
    If Len(strx) = 0 Then
        MsgBox "��ȡcookieʧ��,���ֶ���ȡ", vbInformation + vbOKOnly, "Tip": Me.Label4.Caption = "": Exit Sub
    Else
        MsgShow "��ȡCookie�ɹ�", "Tip", 1200
    End If
    ThisWorkbook.Sheets("Temp").Cells(3, 2).Value = strx
    xmCookie = strx
    Dim crg As New cRegex
    strx = crg.sMatch(strx, "xm_sg_tk=.*?;")
    strx = Split(strx, "=")(1)
    tkCookie = Left$(strx, Len(strx) - 1)
    Me.CommandButton3.Enabled = True
    Me.CommandButton2.Enabled = False
    Set crg = Nothing
    With Me
        .Label2.Caption = ""
        .TextBox2.Text = strx
        .CommandButton3.Enabled = True
        .CommandButton2.Enabled = False
        .CommandButton7.Enabled = False
    End With
End Sub

Private Sub CommandButton2_Click() 'ȷ��
    Dim strx As String
    strx = Trim(Me.TextBox2.Text)
    If Len(strx) = 0 Then MsgBox "����������Ч", vbInformation + vbQuestion, "Tip": Exit Sub
    If InStr(strx, "xm_sg_tk") = 0 Then MsgBox "����Cookie��Ч,�����»�ȡ�µ�cookie", vbInformation + vbQuestion, "Tip": Exit Sub
    xmCookie = strx
    Dim crg As New cRegex
    strx = crg.sMatch(strx, "xm_sg_tk=.*?;")
    strx = Split(strx, "=")(1)
    tkCookie = Left$(strx, Len(strx) - 1)
    With Me
        .CommandButton3.Enabled = True
        .CommandButton2.Enabled = False
        .CommandButton7.Enabled = False
        .TextBox2.Enabled = False
    End With
    Set crg = Nothing
    ThisWorkbook.Sheets("Temp").Cells(3, 2).Value = xmCookie
    MsgShow "�������", "Tip", 1200
End Sub

Private Sub CommandButton3_Click() '����
    If MsgBox("�Ƿ�����", vbQuestion + vbYesNo, "Question") = vbNo Then Exit Sub
    xmCookie = ""
    tkCookie = ""
    ThisWorkbook.Sheets("Temp").Cells(3, 2).Value = ""
    With Me
        .TextBox2.Text = ""
        .TextBox2.Enabled = True
        .CommandButton3.Enabled = False
        .CommandButton2.Enabled = True
        .CommandButton7.Enabled = True
    End With
End Sub

Private Sub CommandButton4_Click() '�򿪸赥
    Open_Collection
End Sub

Private Sub Open_Collection(Optional ByVal cmcode As Boolean)
Const sUrl As String = "https://www.xiami.com/collect/"
    Dim strID As String
    Dim xUrl As String
    Dim arr() As String
    Dim i As Integer, k As Integer, p As Integer
    
    If cmcode = False Then
        If Len(xmCookie) = 0 Then
            MsgShow "ʹ��ǰ,��������Cookie", "Tip", 1200
            Exit Sub
        End If
        If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    End If
    xUrl = Me.TextBox1.Text
    xUrl = Trim$(xUrl)
    If cmcode = False Then
        If Len(xUrl) = 0 Then Exit Sub
        If InStr(1, xUrl, sUrl, vbBinaryCompare) = 0 Then MsgBox "��������ȷ����ַ����", vbInformation, "Tip"
        If Len(tKey) = 0 Then
            tKey = xUrl
        Else
            If tKey = xUrl Then
                If MsgBox("����������ǰ��һ���Ƿ����", vbYesNo + vbQuestion, "Tip") = vbNo Then Exit Sub
            End If
        End If
    End If
    If InStr(1, xUrl, "?", vbBinaryCompare) > 0 Then
        strID = Split(xUrl, "?")(0)
        strID = Right$(strID, Len(strID) - InStrRev(strID, "/"))
    Else
        strID = Right$(xUrl, Len(xUrl) - InStrRev(xUrl, "/"))
    End If
    enCookie = True
    isSec = False
    Me.Label4.Caption = "���ݴ�����..."
    Me.Repaint 'https://docs.microsoft.com/zh-cn/office/vba/api/access.form.repaint
    '----------------------------------------------------------��������һ��, �����޷�ˢ����ʾ
    xUrl = Get_Collection_Link(strID) '��ö�Ӧ�ľ�̬����
    If enCookie = False Or isSec = True Then
        Me.TextBox2.Text = "cookie�ѹ���"
        ThisWorkbook.Sheets("Temp").Cells(3, 2) = ""
        Me.CommandButton2.Enabled = True
        Me.CommandButton7.Enabled = True
        Me.TextBox2.Enabled = True
        If eCount > 2 Then MsgBox "�����Ѿ�����Ϻ�׻�����֤����, ���������ֶ���ȡcookie", vbInformation + vbOKOnly, "Tip"
    End If
    If Len(xUrl) = 0 Then MsgBox "δ��ȡ����Ч����", vbCritical + vbInformation, "Tip": Me.Label4.Caption = "": Exit Sub
    arr = Get_Collection_Detail(xUrl, strID)
    If SafeArrayGetDim(arr) = 0 Then MsgBox "δ��ȡ����Ч����", vbCritical + vbInformation, "Tip": Me.Label4.Caption = "": Exit Sub
    i = UBound(arr)
    k = UBound(arr, 2)
    ReDim arrCollect(i, k)
    arrCollect = arr
    With Me.ListBox1
        .Clear
        For p = 0 To i
            .AddItem
            .List(p, 0) = arr(p, 5) '����
            .List(p, 1) = arr(p, 2) 'ר��
            .List(p, 2) = arr(p, 6) '����
            .List(p, 3) = msToMinute(arr(p, 7)) '����
        Next
    End With
    MsgShow "��ȡ����������" & CStr(p) & "��", "Tip", 1200
    Erase arr
    dMode = 1
    eCount = 0
    Me.OptionButton2.Enabled = True
    Me.Label4.Caption = ""
End Sub

Private Sub CommandButton5_Click() 'ȫ������
    Dim i As Integer
    Dim ic As Integer
    Dim sUrl As String
    Dim arrd() As String
    Dim arrdx(12) As String
    Dim arrDL_Record(5) As String  '��¼���ص���Ϣ
    Dim m As Byte, n As Byte, k As Integer, j As Integer
    Dim strTemp As String, strPre As String, iP As Byte
    Dim barr() As String
    Dim yesno As Variant, ald As Boolean
    Dim dCount As Integer
    
    yesno = MsgBox("ȫ��������Ҫ�ϳ�ʱ��,�Ƿ����?", vbInformation + vbYesNo, "Tip")
    If yesno = vbNo Then Exit Sub
    i = Me.ListBox1.ListCount
    If i = 0 Then Exit Sub
    If Len(xmCookie) = 0 Then
        MsgShow "ʹ��ǰ,��������Cookie", "Tip", 1200
        Exit Sub
    End If
    If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    StopFlag = False
    sFlag = True
    i = i - 1
    isRunning = True
    If i > 1 Then
        With Me
            .Frame1.Enabled = False
            .Frame1.Enabled = False
            .TextBox1.Enabled = False
            .CommandButton1.Enabled = False
            .CommandButton3.Enabled = False
            .CommandButton4.Enabled = False
            .CommandButton5.Enabled = False
            .CommandButton6.Enabled = False
            .CommandButton8.Enabled = False
            .CommandButton9.Enabled = False
            .CommandButton10.Enabled = False
            .CommandButton11.Enabled = False
        End With
        With Progress
            .CommandButton1.Enabled = False
            .CommandButton2.Enabled = True
            .Show 0
        End With
    Else
        Me.Label4.Caption = "���ݴ�����..."
        Me.Repaint
    End If
    '----------------------------------------------------------------------
    If dMode = 1 Then '�������������������Ѿ�����, ����Ҫ��ȥ��ȡ
        m = UBound(arrCollect, 2)
        ReDim barr(m - 9)
        For k = 0 To i
            If StopFlag = True Then Exit For
            ic = 0
            strTemp = ""
            strPre = ""
            ald = False
            Progress.Label1.Caption = "��������:" & arrCollect(k, 5)
            For n = 9 To m
                If Len(arrCollect(k, n)) = 0 Then Exit For
                barr(n - 9) = arrCollect(k, n)   '�ڻ�ȡ����ʱ�Ѿ�����Ƿ�Ϊ����, ����Ҫ�ٴμ��
                Select Case iOpt
                    Case 1:
                        If InStr(arrCollect(k, n), ".mp3") = 0 Then arrdx(ic) = arrCollect(k, n): ic = ic + 1
                    Case 2:
                        If InStr(arrCollect(k, n), "s740.") = 0 Then arrdx(ic) = arrCollect(k, n): ic = ic + 1
                    Case 3:
                        arrdx(ic) = arrCollect(k, n)
                        ic = ic + 1
                        '-----------------------------------------���ض��׸�
                    Case Else:
                        If InStr(1, arrCollect(k, n), "s740.", vbBinaryCompare) > 0 Then 'ֻ����1��
                            If ic = 0 Then
                                strTemp = arrCollect(k, n)
                                arrdx(ic) = strTemp
                                ic = ic + 1
                            End If
                        ElseIf InStr(1, arrCollect(k, n), "s320.", vbBinaryCompare) Then
                            If Len(strPre) = 0 And iP < 3 Then strPre = arrCollect(k, n): iP = 3 '��ȷ����ýϺõ�����
                        ElseIf InStr(1, arrCollect(k, n), "s192.", vbBinaryCompare) Then
                            If Len(strPre) = 0 And iP < 2 Then strPre = arrCollect(k, n): iP = 2
                        ElseIf InStr(1, arrCollect(k, n), "s128.", vbBinaryCompare) Then
                            If Len(strPre) = 0 Then strPre = arrCollect(k, n)
                        End If
                End Select
            Next
            If iOpt = 0 Then
                If Len(strTemp) = 0 Then
                    If Len(strPre) = 0 Then GoTo NextHandle1
                    arrdx(ic) = strPre
                    ic = ic + 1
                End If
            End If
            If ic = 0 Then
                GoTo NextHandle1
            ElseIf ic > 1 Then
                ald = True
            End If
            If iCHK1 > 0 Then
                sUrl = arrCollect(k, 1)
                If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר������
            End If
            If iCHK2 > 0 Then
                sUrl = arrCollect(k, 0)
                If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר����ͼ
            End If
            If iCHK3 > 0 Then
                sUrl = arrCollect(k, 8)
                If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '���
            End If
            If iCHK4 > 0 Then
                sUrl = arrCollect(k, 3)
                If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '����ͼƬ
            End If
            '----------------------------------------------��¼��Ϣ
            arrDL_Record(0) = arrCollect(k, 4) '����id,����,ר��,����,����״̬, ʱ��
            arrDL_Record(1) = arrCollect(k, 5)
            arrDL_Record(2) = arrCollect(k, 2)
            arrDL_Record(3) = arrCollect(k, 6)
            arrDL_Record(5) = Now
            If ald = False Then
                If Curl_Downlaod(arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
            Else
                Curl_Downlaod arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald
                arrDL_Record(4) = "-"
            End If
'            If Download(arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
            WriteRecord arrDL_Record '����д����
            dCount = dCount + 1
NextHandle1:
            If i > 1 Then Progress.Label4.Width = Int((k / i) * 305) + 1
        Next
    Else
        For k = 0 To i
            If StopFlag = True Then Exit For
            arrd = Xiami_Song_Download_Links(arrSearch(k, 4)) '��ȡ����
            If SafeArrayGetDim(arrd) <> 0 Then
                Progress.Label1.Caption = "��������:" & arrSearch(k, 5)
                barr = arrd
                ic = 0
                ald = False
                j = UBound(arrd)
                ald = False
                iP = 0: strTemp = "": strPre = ""
                For m = 0 To j
                    Select Case iOpt
                        Case 1:
                            If InStr(arrd(m), ".mp3") = 0 Then
                                arrdx(ic) = arrd(m)
                                ic = ic + 1
                            End If
                        Case 2:
                            If InStr(arrd(m), "s740.") = 0 Then
                                arrdx(ic) = arrd(m)
                                ic = ic + 1
                            End If
                        Case 3:
                            arrdx(ic) = arrd(m)
                            ic = ic + 1
                        Case Else:
                            If InStr(1, arrd(m), "s740.", vbBinaryCompare) > 0 Then
                                If ic = 0 Then
                                    strTemp = arrd(m)
                                    arrdx(ic) = strTemp
                                    ic = ic + 1
                                    Exit For
                                End If
                                ElseIf InStr(1, arrd(m), "s320.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 And iP < 3 Then strPre = arrd(m): iP = 3
                                ElseIf InStr(1, arrd(m), "s192.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 And iP < 2 Then strPre = arrd(m): iP = 2
                                ElseIf InStr(1, arrd(m), "s128.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 Then strPre = arrd(m)
                            End If
                    End Select
                Next
                If iOpt = 0 Then
                    If Len(strTemp) = 0 Then
                        If Len(strPre) = 0 Then GoTo NextHandle0
                        arrdx(ic) = strPre
                        ic = ic + 1
                    End If
                End If
                If ic = 0 Then
                    GoTo NextHandle0
                ElseIf ic > 1 Then
                    ald = True
                End If
                '---------------------------------------------------�����������ӵĻ�ȡ
                If iCHK1 > 0 Then
                    sUrl = arrSearch(k, 1)
                    If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר������
                End If
                If iCHK2 > 0 Then
                    sUrl = arrSearch(k, 0)
                    If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר����ͼ
                End If
                If iCHK3 > 0 Then
                    sUrl = arrSearch(k, 8)
                    If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '���
                End If
                If iCHK4 > 0 Then
                    sUrl = arrSearch(k, 3)
                    If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '����ͼƬ
                End If
                '----------------------------------------------��¼��Ϣ
                arrDL_Record(0) = arrSearch(k, 4) '����id,����,ר��,����,����״̬
                arrDL_Record(1) = arrSearch(k, 5)
                arrDL_Record(2) = arrSearch(k, 2)
                arrDL_Record(3) = arrSearch(k, 6)
                arrDL_Record(5) = Now
                If ald = False Then
                    If Curl_Downlaod(arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                Else
                    Curl_Downlaod arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald
                    arrDL_Record(4) = "-"
                End If
'                If Download(arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                WriteRecord arrDL_Record '����д����
                dCount = dCount + 1
            End If
NextHandle0:
            If i > 1 Then Progress.Label4.Width = Int((k / i) * 305) + 1
        Next
    End If
    ThisWorkbook.Sheets("Download_List").Columns.AutoFit
    If i > 1 Then
        With Me
            .Frame1.Enabled = True
            .Frame1.Enabled = True
            .TextBox1.Enabled = True
            .CommandButton1.Enabled = True
            .CommandButton3.Enabled = True
            .CommandButton4.Enabled = True
            .CommandButton5.Enabled = True
            .CommandButton6.Enabled = True
            .CommandButton8.Enabled = True
            .CommandButton9.Enabled = True
            .CommandButton10.Enabled = True
            .CommandButton11.Enabled = True
        End With
        With Progress
            .CommandButton2.Enabled = False
            If StopFlag = False Then .Label1.Caption = "�������"
            .CommandButton1.Enabled = True
        End With
    Else
        Me.Label4.Caption = ""
    End If
    isRunning = False
    sFlag = False
    If dCount = 0 Then
        MsgShow "δ��ȡ�������ļ�", "Tip", 1500
    Else
        If StopFlag = True Then
            MsgShow "����������ֹͣ", "Tip", 1200
        Else
            MsgShow "�������", "Tip", 1200
        End If
    End If
End Sub

Private Sub CommandButton6_Click() '����ѡ��
    Dim i As Integer
    Dim ic As Integer
    Dim sUrl As String
    Dim arrd() As String
    Dim arrdx(12) As String
    Dim arrDL_Record(5) As String  '��¼���ص���Ϣ
    Dim m As Byte, n As Byte, k As Integer, j As Integer
    Dim strTemp As String, strPre As String, iP As Byte
    Dim barr() As String
    Dim ald As Boolean, ix As Integer, ipg As Integer
    Dim dCount As Integer
    
    i = Me.ListBox1.ListCount
    If i = 0 Then Exit Sub
    i = i - 1
    For k = 0 To i
        If Me.ListBox1.Selected(k) = True Then ix = ix + 1
    Next
    If ix = 0 Then Exit Sub
    If IsNetConnectOnline = False Then MsgBox "���粻����", vbCritical + vbInformation, "Warning": Exit Sub
    '-------------��ǰ������Ҫ���ص�����
    isRunning = True
    If ix > 2 Then
        With Me
            .Frame1.Enabled = False
            .Frame1.Enabled = False
            .TextBox1.Enabled = False
            .CommandButton1.Enabled = False
            .CommandButton3.Enabled = False
            .CommandButton4.Enabled = False
            .CommandButton5.Enabled = False
            .CommandButton6.Enabled = False
            .CommandButton8.Enabled = False
            .CommandButton9.Enabled = False
            .CommandButton10.Enabled = False
            .CommandButton11.Enabled = False
        End With
        With Progress
            .CommandButton1.Enabled = False
            .CommandButton2.Enabled = True
            .Show 0
        End With
        ipg = 1
    Else
        Me.Label4.Caption = "���ݴ�����..."
        Me.Repaint
    End If
    StopFlag = False
    sFlag = True
    If dMode = 1 Then '�赥-�Ѿ���������������
        m = UBound(arrCollect, 2)
        ReDim barr(m - 9)
        With Me.ListBox1
            For k = 0 To i
                If .Selected(k) = True Then
                    If ix > 2 Then Progress.Label1 = "��������:" & arrCollect(k, 5)
                    If StopFlag = True Then Exit For: If ix > 2 Then Unload Progress
                    ic = 0
                    strTemp = ""
                    strPre = ""
                    ald = False
                    iP = 0
                    For n = 9 To m
                        If Len(arrCollect(k, n)) = 0 Then Exit For
                        barr(n - 9) = arrCollect(k, n)
                        Select Case iOpt
                            Case 1:
                                If InStr(arrCollect(k, n), ".mp3") = 0 Then 'ֻ����mp3
                                    arrdx(ic) = arrCollect(k, n)
                                    ic = ic + 1
                                End If
                            Case 2:
                                If InStr(arrCollect(k, n), "s740.") = 0 Then 'ֻ��������
                                    arrdx(ic) = arrCollect(k, n)
                                    ic = ic + 1
                                End If
                            Case 3:                                         'ȫ������
                                arrdx(ic) = arrCollect(k, n)
                                ic = ic + 1
                            Case Else:
                                If InStr(1, arrCollect(k, n), "s740.", vbBinaryCompare) > 0 Then
                                    If ic = 0 Then
                                        strTemp = arrCollect(k, n)
                                        arrdx(ic) = strTemp
                                        ic = ic + 1
                                    End If
                                ElseIf InStr(1, arrCollect(k, n), "s320.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 And iP < 3 Then strPre = arrCollect(k, n): iP = 3
                                ElseIf InStr(1, arrCollect(k, n), "s192.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 And iP < 2 Then strPre = arrCollect(k, n): iP = 2
                                ElseIf InStr(1, arrCollect(k, n), "s128.", vbBinaryCompare) Then
                                    If Len(strPre) = 0 Then strPre = arrCollect(k, n)
                                End If
                        End Select
                    Next
                    If iOpt = 0 Then
                        If Len(strTemp) = 0 Then
                            If Len(strPre) = 0 Then GoTo NextHandle1
                            arrdx(ic) = strPre
                            ic = ic + 1
                        End If
                    End If
                    If ic = 0 Then
                        GoTo NextHandle1
                    ElseIf ic > 1 Then
                        ald = True
                    End If
                    If iCHK1 > 0 Then
                        sUrl = arrCollect(k, 1)
                        If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר������
                    End If
                    If iCHK2 > 0 Then
                        sUrl = arrCollect(k, 0)
                        If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר����ͼ
                    End If
                    If iCHK3 > 0 Then
                        sUrl = arrCollect(k, 8)
                        If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '���
                    End If
                    If iCHK4 > 0 Then
                        sUrl = arrCollect(k, 3)
                        If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '����ͼƬ
                    End If
                    '----------------------------------------------��¼��Ϣ
                    arrDL_Record(0) = arrCollect(k, 4) '����id,����,ר��,����,����״̬
                    arrDL_Record(1) = arrCollect(k, 5)
                    arrDL_Record(2) = arrCollect(k, 2)
                    arrDL_Record(3) = arrCollect(k, 6)
                    arrDL_Record(5) = Now
                    If ald = False Then
                        If Curl_Downlaod(arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                    Else
                        Curl_Downlaod arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald
                        arrDL_Record(4) = "-"
                    End If
'                    If Download(arrdx, barr, ic, arrCollect(k, 4), arrCollect(k, 5), arrCollect(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                    WriteRecord arrDL_Record '����д����
                    dCount = dCount + 1
NextHandle1:
                    If ix > 2 Then Progress.Label4.Width = Int((ipg / ix) * 305) + 1: ipg = ipg + 1 'Progress.pgbDisplay.Value = ipg:
                End If
            Next
        End With
        '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Else
        '----------------�����Ľ��-����Ӧ��id��ȡ��Ӧ������
        If Len(xmCookie) = 0 Then
            MsgShow "ʹ��ǰ,��������Cookie", "Tip", 1200
            Exit Sub
        End If
        With Me.ListBox1
            For k = 0 To i
                If .Selected(k) = True Then
                    If StopFlag = True Then Exit For: If ix > 2 Then Unload Progress
                    If ix > 2 Then Progress.Label1 = "��������:" & arrSearch(k, 5)
                    arrd = Xiami_Song_Download_Links(arrSearch(k, 4)) '��ȡ����
                    If SafeArrayGetDim(arrd) > 0 Then
                        barr = arrd
                        ic = 0
                        j = UBound(arrd)
                        ald = False
                        strTemp = ""
                        strPre = ""
                        iP = 0
                        For m = 0 To j
                            Select Case iOpt
                                Case 1:
                                    If InStr(arrd(m), ".mp3") = 0 Then
                                        arrdx(ic) = arrd(m)
                                        ic = ic + 1
                                    End If
                                Case 2:
                                    If InStr(arrd(m), "s740.") = 0 Then
                                        arrdx(ic) = arrd(m)
                                        ic = ic + 1
                                    End If
                                Case 3:
                                    arrdx(ic) = arrd(m)
                                    ic = ic + 1
                                Case Else:
                                    If InStr(1, arrd(m), "s740.", vbBinaryCompare) > 0 Then
                                        If ic = 0 Then
                                            strTemp = arrd(m)
                                            arrdx(ic) = strTemp
                                            ic = ic + 1
                                            Exit For
                                        End If
                                    ElseIf InStr(1, arrd(m), "s320.", vbBinaryCompare) Then
                                        If Len(strPre) = 0 And iP < 3 Then strPre = arrd(m): iP = 3
                                    ElseIf InStr(1, arrd(m), "s192.", vbBinaryCompare) Then
                                        If Len(strPre) = 0 And iP < 2 Then strPre = arrd(m): iP = 2
                                    ElseIf InStr(1, arrd(m), "s128.", vbBinaryCompare) Then
                                        If Len(strPre) = 0 Then strPre = arrd(m)
                                    End If
                            End Select
                        Next
                        If iOpt = 0 Then
                            If Len(strTemp) = 0 Then
                                If Len(strPre) = 0 Then GoTo NextHandle1
                                arrdx(ic) = strPre
                                ic = ic + 1
                            End If
                        End If
                        If ic = 0 Then
                            GoTo NextHandle1
                        ElseIf ic > 1 Then
                            ald = True
                        End If
                        If iCHK1 > 0 Then
                            sUrl = arrSearch(k, 1)
                            If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר������
                        End If
                        If iCHK2 > 0 Then
                            sUrl = arrSearch(k, 0)
                            If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 'ר����ͼ
                        End If
                        If iCHK3 > 0 Then
                            sUrl = arrSearch(k, 8)
                            If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '���
                        End If
                        If iCHK4 > 0 Then
                            sUrl = arrSearch(k, 3)
                            If InStr(1, sUrl, "http", vbBinaryCompare) > 0 Then arrdx(ic) = sUrl: ic = ic + 1 '����ͼƬ
                        End If
                        '----------------------------------------------��¼��Ϣ
                        arrDL_Record(0) = arrSearch(k, 4) '����id,����,ר��,����,����״̬
                        arrDL_Record(1) = arrSearch(k, 5)
                        arrDL_Record(2) = arrSearch(k, 2)
                        arrDL_Record(3) = arrSearch(k, 6)
                        arrDL_Record(5) = Now
                        If ald = False Then
                            If Curl_Downlaod(arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                        Else
                            Curl_Downlaod arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald
                            arrDL_Record(4) = "-"
                        End If
'                        If Download(arrdx, barr, ic, arrSearch(k, 4), arrSearch(k, 5), arrSearch(k, 6), ald) = True Then arrDL_Record(4) = "Success" Else arrDL_Record(4) = "Fail"
                        WriteRecord arrDL_Record '����д����
                        dCount = dCount + 1
                    End If
NextHandle0:
                    If ix > 2 Then Progress.Label4.Width = Int((ipg / ix) * 305) + 1: ipg = ipg + 1
                End If
            Next
        End With
    End If
    sFlag = False
    ThisWorkbook.Sheets("Download_List").Columns.AutoFit
    If ix > 2 Then
        With Me
            .Frame1.Enabled = True
            .Frame1.Enabled = True
            .TextBox1.Enabled = True
            .CommandButton1.Enabled = True
            .CommandButton3.Enabled = True
            .CommandButton4.Enabled = True
            .CommandButton5.Enabled = True
            .CommandButton6.Enabled = True
            .CommandButton8.Enabled = True
            .CommandButton9.Enabled = True
            .CommandButton10.Enabled = True
            .CommandButton11.Enabled = True
        End With
        With Progress
            .CommandButton2.Enabled = False
            If StopFlag = False Then .Label1.Caption = "�������"
            .CommandButton1.Enabled = True
        End With
    Else
        Me.Label4.Caption = ""
    End If
    isRunning = False
    If dCount = 0 Then
        MsgShow "δ��ȡ�������ļ�", "Tip", 1500
    Else
        If StopFlag = True Then
            MsgShow "����������ֹͣ", "Tip", 1200
        Else
            MsgShow "�������", "Tip", 1200
        End If
    End If
End Sub

Private Sub WriteRecord(ByRef arrx() As String) '�����ؼ�¼д����
    Dim i As Integer, k As Integer
'    k = UBound(arrx) + 1
    With ThisWorkbook.Sheets("Download_List")
        i = .[b65536].End(xlUp).Row + 1
        .Cells(i, 2).Resize(1, 6) = arrx
    End With
End Sub

Private Sub CheckBox1_Click() 'ר������
    If Me.CheckBox1.Value = True Then iCHK1 = 1 Else iCHK1 = 0
End Sub

Private Sub CheckBox2_Click() 'ר����ͼ
    If Me.CheckBox2.Value = True Then iCHK2 = 2 Else iCHK2 = 0
End Sub

Private Sub CheckBox3_Click() '���
    If Me.CheckBox3.Value = True Then iCHK3 = 3 Else iCHK3 = 0
End Sub

Private Sub CheckBox4_Click() '����ͼƬ
    If Me.CheckBox4.Value = True Then iCHK4 = 4 Else iCHK4 = 0
End Sub

Private Sub CommandButton8_Click() 'ֹͣ����
    Dim yesno As Variant
    If StopFlag = True Then Exit Sub
    If sFlag = False Then Exit Sub
    yesno = MsgBox("�Ƿ�ֹͣĿǰ������", vbQuestion + vbYesNo, "Warning")
    If yesno = vbNo Then Exit Sub
    StopFlag = True
    sFlag = False
    isRunning = False
End Sub

Private Sub CommandButton9_Click() '�������
    IECache_Clear
End Sub

Private Sub OptionButton1_Click() 'mp3
    If MsgBox("�⽫�����޷����ص��ļ�, �Ƿ����?", vbQuestion + vbYesNo, "Tip") = vbNo Then
        iOpt = 0
        Me.OptionButton4.Value = True
        Me.OptionButton1.Value = False: Exit Sub
    End If
    If Me.OptionButton1.Value = True Then iOpt = 1
End Sub

Private Sub OptionButton2_Click() '����
    If MsgBox("�⽫�����޷����ص��ļ�, �Ƿ����?", vbQuestion + vbYesNo, "Tip") = vbNo Then
        iOpt = 0
        Me.OptionButton4.Value = True
        Me.OptionButton2.Value = False: Exit Sub
    End If
    If Me.OptionButton2.Value = True Then iOpt = 2
End Sub

Private Sub OptionButton3_Click() 'ȫ��
    Dim yesno As Variant
    yesno = MsgBox("������Ҫ���ĸ�����ʱ��,�Ƿ����", vbYesNo + vbQuestion, "Tip")
    If yesno = vbNo Then iOpt = 0: Me.OptionButton4.Value = True: Me.OptionButton3.Value = False: Exit Sub
    If Me.OptionButton3.Value = True Then iOpt = 3
End Sub

Private Sub OptionButton4_Click() 'Ĭ��
    If Me.OptionButton4.Value = True Then iOpt = 0
End Sub

Private Sub TextBox1_MouseDown(ByVal Button As Integer, ByVal Shift As Integer, ByVal x As Single, ByVal y As Single) 'Ϊtextbox����Ҽ��˵�
    On Error Resume Next
    If Button = 2 And Not NewM Then
        On Error Resume Next
        With ThisWorkbook.Application
            .CommandBars("NewMenu").Delete
            .CommandBars.Add "NewMenu", msoBarPopup, False, True
            With .CommandBars("NewMenu")
                .Controls.Add msoControlButton
                .Controls(1).Caption = "����"
                .Controls(1).FaceId = 21
                .Controls(1).OnAction = "Cutx"
                .Controls.Add msoControlButton
                .Controls(2).Caption = "����"
                .Controls(2).FaceId = 19
                .Controls(2).OnAction = "Copyx"
                .Controls.Add msoControlButton
                .Controls(3).Caption = "ճ��"
                .Controls(3).FaceId = 22
                .Controls(3).OnAction = "Pastex"
                .ShowPopup
            End With
        End With
    End If
    NewM = Not NewM
End Sub

Private Sub TextBox2_MouseDown(ByVal Button As Integer, ByVal Shift As Integer, ByVal x As Single, ByVal y As Single) 'Ϊtextbox����Ҽ��˵�
    On Error Resume Next
    If Button = 2 And Not iNewM Then
        On Error Resume Next
        With ThisWorkbook.Application
            .CommandBars("NewMenu").Delete
            .CommandBars.Add "NewMenu", msoBarPopup, False, True
            With .CommandBars("NewMenu")
                .Controls.Add msoControlButton
                .Controls(1).Caption = "����"
                .Controls(1).FaceId = 21
                .Controls(1).OnAction = "Cutx"
                .Controls.Add msoControlButton
                .Controls(2).Caption = "����"
                .Controls(2).FaceId = 19
                .Controls(2).OnAction = "Copyx"
                .Controls.Add msoControlButton
                .Controls(3).Caption = "ճ��"
                .Controls(3).FaceId = 22
                .Controls(3).OnAction = "Pastex"
                .ShowPopup
            End With
        End With
    End If
    iNewM = Not iNewM
End Sub

Private Sub UserForm_Initialize()
    Dim strx As String
    iCHK1 = 0: iCHK2 = 0: iCHK3 = 0: iCHK4 = 0
    iOpt = 0: dMode = 0: eCount = 0
    sFlag = False
    StopFlag = False
    NewM = False
    isRunning = False
    On Error Resume Next
    With Me.ListBox1 '�ļ���
        .MultiSelect = fmMultiSelectMulti '��ѡ
        .ListStyle = fmListStyleOption
    End With
    Set oFso = CreateObject("Scripting.FileSystemObject")
    If oFso Is Nothing Then MsgBox "�������ش���", vbCritical + vbOKOnly, "Warning": Unload Me
    If Len(bPath) = 0 Then bPath = ThisWorkbook.path & "\music_download\"
    If oFso.FolderExists(bPath) = False Then oFso.createfolder bPath
    strx = ThisWorkbook.Sheets("Temp").Cells(4, 2).Value
    If Len(strx) > 0 Then
        If oFso.fileexists(strx) = False Then
            If Is64Bit = True Then
                strx = ThisWorkbook.path & "\cUrl_64\bin\curl.exe"
            Else
                strx = ThisWorkbook.path & "\cUrl_32\bin\curl.exe"
            End If
            If oFso.FolderExists(strx) = False Then MsgBox "�ؼ��ļ���ʧ,�����޷���������", vbCritical, "Warning": Unload Me
            ThisWorkbook.Sheets("Temp").Cells(4, 2).Value = strx
        End If
    Else
        If Is64Bit = True Then
            strx = ThisWorkbook.path & "\cUrl_64\bin\curl.exe"
        Else
            strx = ThisWorkbook.path & "\cUrl_32\bin\curl.exe"
        End If
        If oFso.fileexists(strx) = False Then MsgBox "�ؼ��ļ���ʧ,�����޷���������", vbCritical, "Warning": Unload Me
        ThisWorkbook.Sheets("Temp").Cells(4, 2).Value = strx
    End If
    strx = ThisWorkbook.Sheets("Temp").Cells(3, 2).Value
    If Len(strx) > 0 Then
        If InStr(1, strx, "xm_sg_tk", vbBinaryCompare) > 0 Then
            xmCookie = strx
            Me.TextBox2.Text = strx
            Dim crg As New cRegex
            strx = crg.sMatch(strx, "xm_sg_tk=.*?;")
            strx = Split(strx, "=")(1)
            tkCookie = Left$(strx, Len(strx) - 1)
            With Me
                .TextBox2.Enabled = False
                .CommandButton3.Enabled = True
                .CommandButton2.Enabled = False
                .CommandButton7.Enabled = False
            End With
            Set crg = Nothing
        End If
    End If
    Me.OptionButton4.Value = True
End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = vbFormControlMenu Then Cancel = isRunning
End Sub

Private Sub UserForm_Terminate()
    Set oFso = Nothing
    Erase arrCollect
    Erase arrSearch
End Sub
