Attribute VB_Name = "c_module"
Option Explicit
'��ȡhtml, 1-4�ֱ��Ӧ��ͬ��ҳ��, ��Ӧsheet1-4
Function get_html(ByVal index As String, ByVal page As Long, Optional ByVal sType As String) As String
    Select Case index
        Case "������̸�й���"
            get_html = CA.getData(page, sType)
        Case "ѯ�۹���"
            get_html = CA.getData(page, sType)
        Case "��һ��Դ��ʾ"
            get_html = PA.getData(page)
        Case "�б깫��"
            get_html = BA.getData(page)
        Case "�б깫ʾ"
            get_html = B_A.getData(page)
    End Select
End Function

'д����
Private Sub write_Header(ByRef sh As Worksheet, ByVal zone As String, ByVal url As String, ByVal page As String)
    Const h As String = "https://www.chdtp.com/pages/wzglS/homepage/index.jsp"
    
    With sh
        .Cells(2, 2).Value = "ץȡ����Դ:"
        .Hyperlinks.Add Anchor:=.Cells(2, 3), Address:=h, TextToDisplay:="�й����缯�ŵ�������ƽ̨"
        .Cells(3, 2).Value = "ץȡ��������:"
        .Hyperlinks.Add Anchor:=.Cells(3, 3), Address:=url, TextToDisplay:=zone
        .Cells(4, 2).Value = "ץȡҳ��:"
        .Cells(4, 3).NumberFormatLocal = "@"
        .Cells(4, 3).Value = page
        .Cells(4, 3).HorizontalAlignment = xlLeft
        .Cells(5, 2).Value = "ץȡ����ʱ��:"
        .Cells(5, 3).Value = Format(Now, "yyyy/mm/dd/hh:mm:ss")
    End With
End Sub

Private Function write_data(ByVal index As String, ByRef sh As Worksheet, ByRef html As String, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Select Case index
        Case "������̸�й���"
            write_data = CA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "ѯ�۹���"
            write_data = CA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "��һ��Դ��ʾ"
            write_data = PA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "�б깫��"
            write_data = BA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "�б깫ʾ"
            write_data = B_A.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
    End Select
End Function

Private Sub header(ByRef sh As Worksheet, ByVal index As String, ByVal page As String)
    Select Case index
        Case "������̸�й���"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "ѯ�۹���"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "��һ��Դ��ʾ"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "�б깫��"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/zbgg/zhaobiaoList.jsp", page
        Case "�б깫ʾ"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/zbhxrgs/zbhxrgs.jsp", page
    End Select
End Sub

'��ȡ����id
Function get_company_id(ByRef reg As Object, ByRef href As String) As String
    Const sPattern As String = "'\w+'"
    get_company_id = get_match(reg, sPattern, href)
End Function

Function get_match(ByRef reg As Object, ByRef sPattern As String, ByRef href As String) As String
    Dim Matches As Object
    Dim a As String

    reg.Pattern = sPattern
    Set Matches = reg.Execute(href)
    If (Matches.Count = 0) Then Exit Function
    a = Matches(0).Value
    get_match = Mid$(a, 2, Len(a) - 2)
End Function

'��ȡ����id
Function get_title_id(ByRef reg As Object, ByRef href As String) As String
    Const sPattern As String = "'.+\.html'"
    get_title_id = get_match(reg, sPattern, href)
End Function

'��ȡ����
Function get_href(item) As String
    Dim a As Object
    Set a = item.getElementsByTagName("a")
    If (a.Length = 0) Then Exit Function
    get_href = a(0).href
End Function

'������table��ʽ�洢
Function get_table(ByRef dom As Object) As Object
    Dim tables As Object
    
    Set tables = dom.getElementsByTagName("table")
    If (tables.Length = 0) Then Exit Function
    Set get_table = tables(1).getElementsByTagName("td")
End Function

'���û����ȡ������, ��ɾ�������ɵı��
Private Sub dele_table(sh)
    ThisWorkbook.Application.DisplayAlerts = False
    sh.Delete
    ThisWorkbook.Application.DisplayAlerts = True
End Sub

'��ȡ��ҳ����, �������ڷ����Ŀ���, ÿ������5ҳ, Լ100������
Sub m_Capture(ByVal index As String, ByRef sh As Worksheet, ByVal cname As String, ByVal sN As Long, ByVal eN As Long, Optional ByVal sType As String = "0")
    Dim i As Long
    Dim html As String, f As Boolean
    Dim rowIndex As Long, reg As Object, result As String

    Assistant.DisEvents
    rowIndex = 7
    Set reg = Assistant.get_Reg()
    For i = sN To eN
        html = get_html(index, i, sType)
        If (Len(html) > 0) Then
            If (write_data(index, sh, html, reg, rowIndex) = True) Then
                result = result + "p" + CStr(i) + ": ץȡ�ɹ�" + vbCr
                f = True
            Else
                result = result + "p" + CStr(i) + ": ץȡʧ��" + vbCr
            End If
        End If
    Next
    If (f = True) Then
        header sh, index, CStr(sN) + " - " + CStr(eN)
        sh.Columns.AutoFit
    Else
        dele_table sh
    End If
    Assistant.EnEvents
    Set sh = Nothing
    MsgBox result, vbInformation, cname
End Sub

'��ҳ��ȡ
Sub s_Capture(ByRef index As String, ByRef sh As Worksheet, ByVal mode As Boolean, ByVal cname As String, Optional ByVal page As Long = 1, Optional ByVal sType As String = "0")
    Dim html As String
    Dim rowIndex As Long
    
    html = get_html(index, page, sType)
    If (Len(html) > 0) Then
        If (mode = True) Then
            rowIndex = 7
        Else
            rowIndex = 3
        End If
        Assistant.DisEvents
        If (write_data(index, sh, html, Assistant.get_Reg(), rowIndex) = False) Then
            dele_table sh
            Assistant.EnEvents
            MsgBox "δ��ȡ�����", vbInformation, cname
        Else
            If (mode = True) Then header sh, index, CStr(page)
            sh.Columns.AutoFit
            Assistant.EnEvents
            MsgBox "ץȡ���ݳɹ�", vbInformation, cname
        End If
    Else
        If (mode = True) Then dele_table sh
        MsgBox "��ȡ����ʧ��", vbInformation, cname
    End If
    Set sh = Nothing
End Sub
