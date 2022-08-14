Attribute VB_Name = "CA"
Option Explicit
'竞争谈判和询价, competition announcement

Function getData(ByVal page As Long, ByVal sType As String, Optional ByVal pN As Long = 20) As String
    Dim pdata As String
    Const url As String = "https://www.chdtp.com/webs/displayNewsCgxxAction.action"
    Const r As String = "https://www.chdtp.com/webs/displayNewsCgxxAction.action"
    
    pdata = "cgggtype=" + sType + "&jump=" + CStr(page - 1) + "&page.pageSize=" + CStr(pN) + "&page.currentpage=" + CStr(page)
    getData = HTTP_Request.HTTP_GetData("POST", url, r, sPostData:=pdata)
End Function

Function extract_data(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
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
    n = 2
    With sh
        For k = 0 To j
            If (n = 2) Then
                .Cells(rowIndex, n).Value = items(k).innerText
                n = n + 1
            ElseIf (n = 3) Then
                href = get_href(items(k))
                If (Len(href) = 0) Then
                    .Cells(rowIndex, n).Value = items(k).innerText
                Else
                    .Hyperlinks.Add Anchor:=.Cells(rowIndex, n), Address:= _
                    prefix + c_module.get_title_id(reg, href), TextToDisplay:= _
                    items(k).innerText
                End If
                n = n + 1
            ElseIf (n = 4) Then
                href = get_href(items(k))
                If (Len(href) = 0) Then
                    .Cells(rowIndex, n).Value = items(k).innerText
                Else
                    .Hyperlinks.Add Anchor:=.Cells(rowIndex, n), Address:= _
                    company + c_module.get_company_id(reg, href), TextToDisplay:= _
                    items(k).innerText
                End If
                n = n + 1
            Else: sdate = items(k).innerText: .Cells(rowIndex, n).Value = Mid$(sdate, 2, Len(sdate) - 2): n = 2: rowIndex = rowIndex + 1
            End If
        Next
    End With
    extract_data = True
    Set items = Nothing
    Set dom = Nothing
End Function




