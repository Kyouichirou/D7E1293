Attribute VB_Name = "All"
Option Explicit

Sub test()
    Dim rowIndex As Long, result As String, reg As Object
    
    rowIndex = 3
    Set reg = Assistant.get_Reg()
    Assistant.DisEvents
    Dim sh As Worksheet, i As Double
    For Each sh In Worksheets
        i = AscW(Right$(sh.name, 1))
        If (i < 65 Or i > 122) Then
            result = result + multi_get(sh.name, 1, 2, rowIndex, reg)
        End If
    Next
    ThisWorkbook.Sheets("All").Cells(1, 4).Value = Format(Now, "yyyy/mm/dd")
    ThisWorkbook.Sheets("All").Columns.AutoFit
    Assistant.EnEvents
    MsgBox "ץȡ�������", vbInformation
    Debug.Print (result)
End Sub

Function multi_get(ByVal index As String, ByVal sP As Long, ByVal eP As Long, ByRef rowIndex As Long, ByRef reg As Object) As String
    Dim i As Long, t As String, html As String, result As String
    If (index = "ѯ�۹���") Then
        t = "1"
    Else
        t = "0"
    End If
    For i = sP To eP
        html = c_module.get_html(index, i, t)
        If (Len(html) > 0) Then
            awrite_data index, ThisWorkbook.Sheets("All"), html, reg, rowIndex
            result = result + index + CStr(i) + ": �ɹ�;" + vbCr
        Else
            result = result + index + CStr(i) + "ʧ��;" + vbCr
        End If
    Next
    multi_get = result
End Function


Sub all_get()
Dim html As String, sh As Worksheet, name As String, t As String, reg As Object, rowIndex As Long, result As String

    ThisWorkbook.Sheets("All").Cells(3, 1).Resize(1000, 7).Clear
    Set reg = Assistant.get_Reg()
    rowIndex = 3
    Assistant.DisEvents
    For Each sh In Worksheets
        name = sh.name
        If (name = "ѯ�۹���") Then
            t = "1"
        Else
            t = "0"
        End If
        html = c_module.get_html(name, 1, t)
        If (Len(html) > 0) Then
            awrite_data name, ThisWorkbook.Sheets("All"), html, reg, rowIndex
            result = result + name + " : ץȡ�ɹ�" + vbCr
        Else
            If (name <> "setting" And name <> "All") Then result = result + name + " : ץȡʧ��" + vbCr
        End If
    Next
    ThisWorkbook.Sheets("All").Cells(1, 4).Value = Format(Now, "yyyy/mm/dd")
    ThisWorkbook.Sheets("All").Columns.AutoFit
    Assistant.EnEvents
    MsgBox result, vbInformation, "ץȡ�������"
End Sub

Private Function awrite_data(ByVal index As String, ByRef sh As Worksheet, ByRef html As String, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Select Case index
        Case "������̸�й���"
            awrite_data = CA_ec(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "ѯ�۹���"
            awrite_data = C_A_ec(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "��һ��Դ��ʾ"
            awrite_data = PA_ec(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "�б깫��"
            awrite_data = BA_ec(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "�б깫ʾ"
            awrite_data = B_A_ec(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
    End Select
End Function

Private Function B_A_ec(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/webs/detailNewZbhxrgsZxzxAction.action?chkedId="
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 3 - 1
    n = 0
    With sh
        For k = 0 To j
            If (n = 0) Then
                .Cells(rowIndex, 1).Value = "�б깫ʾ"
                .Cells(rowIndex, 7).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 1) Then
                href = get_href(items(k))
                .Cells(rowIndex, 3).Value = items(k).innerText
                Cells(rowIndex, 5).Value = prefix + c_module.get_company_id(reg, href) + "&cminid=51"
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, 4).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 0: rowIndex = rowIndex + 1
            End If
        Next
    End With
    B_A_ec = True
    Set items = Nothing
    Set dom = Nothing
End Function


Private Function BA_ec(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/staticPage/"
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 4 - 1
    n = 0
    With sh
        For k = 0 To j
            If (n = 0) Then
                .Cells(rowIndex, 1).Value = "�б깫��"
                .Cells(rowIndex, 7).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 1) Then
                href = c_module.get_href(items(k))
                .Cells(rowIndex, 3).Value = items(k).innerText
                .Cells(rowIndex, 5).Value = prefix + c_module.get_title_id(reg, href)
                n = n + 1
            ElseIf (n = 2) Then
                .Cells(rowIndex, 2).Value = items(k).innerText
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, 4).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 0: rowIndex = rowIndex + 1
            End If
        Next
    End With
    BA_ec = True
    Set items = Nothing
    Set dom = Nothing
End Function


Private Function CA_ec(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/staticPage/"
    Const company As String = "https://www.chdtp.com/webs/dcgglistCgxxAction.action?hyzh="
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 4 - 1
    n = 0
    With sh
        For k = 0 To j
            If (n = 0) Then
                .Cells(rowIndex, 1).Value = "������̸�б���"
                .Cells(rowIndex, 2).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 1) Then
                href = get_href(items(k))
                .Cells(rowIndex, 3).Value = items(k).innerText
                .Cells(rowIndex, 5).Value = prefix + c_module.get_title_id(reg, href)
                n = n + 1
            ElseIf (n = 2) Then
                .Cells(rowIndex, 6).Value = items(k).innerText
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, 4).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 0: rowIndex = rowIndex + 1
            End If
        Next
    End With
    CA_ec = True
    Set items = Nothing
    Set dom = Nothing
End Function

Private Function C_A_ec(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/staticPage/"
    Const company As String = "https://www.chdtp.com/webs/dcgglistCgxxAction.action?hyzh="
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 4 - 1
    n = 0
    With sh
        For k = 0 To j
            If (n = 0) Then
                .Cells(rowIndex, 1).Value = "ѯ�۹���"
                .Cells(rowIndex, 2).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 1) Then
                href = get_href(items(k))
                .Cells(rowIndex, 3).Value = items(k).innerText
                .Cells(rowIndex, 5).Value = prefix + c_module.get_title_id(reg, href)
                n = n + 1
            ElseIf (n = 2) Then
                .Cells(rowIndex, 6).Value = items(k).innerText
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, 4).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 0: rowIndex = rowIndex + 1
            End If
        Next
    End With
    C_A_ec = True
    Set items = Nothing
    Set dom = Nothing
End Function

Private Function PA_ec(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/webs/detailDygs.action?chkedId="
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 3 - 1
    n = 0
    With sh
        For k = 0 To j
            If (n = 0) Then
                .Cells(rowIndex, 1).Value = "��һ��Դ��ʾ"
                .Cells(rowIndex, 7).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 1) Then
                href = get_href(items(k))
                .Cells(rowIndex, 3).Value = items(k).innerText
                .Cells(rowIndex, 5).Value = prefix + c_module.get_company_id(reg, href)
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, 4).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 0: rowIndex = rowIndex + 1
            End If
        Next
    End With
    PA_ec = True
    Set items = Nothing
    Set dom = Nothing
End Function
