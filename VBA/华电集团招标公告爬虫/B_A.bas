Attribute VB_Name = "B_A"
Option Explicit

Function getData(ByVal page As Long, Optional ByVal pN As Long = 20)
    Const url As String = "https://www.chdtp.com/webs/displayNewZbhxrgsZxzxAction.action"
    Const r As String = "https://www.chdtp.com/webs/displayNewZbhxrgsZxzxAction.action"
    Dim pdata As String
    
    pdata = "page.pageSize=" + CStr(pN) + "&page.currentpage=" + CStr(page)
    getData = HTTP_Request.HTTP_GetData("POST", url, r, sPostData:=pdata)
End Function

Function extract_data(ByRef sh As Worksheet, ByRef dom As Object, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
Dim i As Long, k As Long, n As Long, j As Long
    Const prefix As String = "https://www.chdtp.com/webs/detailNewZbhxrgsZxzxAction.action?chkedId="
    Dim href As String, sdate As String
    Dim items As Object
    
    Set items = c_module.get_table(dom)
    If items Is Nothing Then Exit Function
    j = items.Length - 1
    If (j < 0) Then Exit Function
    i = j / 3 - 1
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
                    prefix + c_module.get_company_id(reg, href) + "&cminid=51", TextToDisplay:= _
                    items(k).innerText
                    '×ªÎªÁ´½Ó
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


