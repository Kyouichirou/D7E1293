Attribute VB_Name = "c_module"
Option Explicit
'获取html, 1-4分别对应不同的页面, 对应sheet1-4
Function get_html(ByVal index As String, ByVal page As Long, Optional ByVal sType As String) As String
    Select Case index
        Case "竞争性谈判公告"
            get_html = CA.getData(page, sType)
        Case "询价公告"
            get_html = CA.getData(page, sType)
        Case "单一来源公示"
            get_html = PA.getData(page)
        Case "招标公告"
            get_html = BA.getData(page)
        Case "中标公示"
            get_html = B_A.getData(page)
    End Select
End Function

'写入表格
Private Sub write_Header(ByRef sh As Worksheet, ByVal zone As String, ByVal url As String, ByVal page As String)
    Const h As String = "https://www.chdtp.com/pages/wzglS/homepage/index.jsp"
    
    With sh
        .Cells(2, 2).Value = "抓取数据源:"
        .Hyperlinks.Add Anchor:=.Cells(2, 3), Address:=h, TextToDisplay:="中国华电集团电子商务平台"
        .Cells(3, 2).Value = "抓取数据区域:"
        .Hyperlinks.Add Anchor:=.Cells(3, 3), Address:=url, TextToDisplay:=zone
        .Cells(4, 2).Value = "抓取页码:"
        .Cells(4, 3).NumberFormatLocal = "@"
        .Cells(4, 3).Value = page
        .Cells(4, 3).HorizontalAlignment = xlLeft
        .Cells(5, 2).Value = "抓取数据时间:"
        .Cells(5, 3).Value = Format(Now, "yyyy/mm/dd/hh:mm:ss")
    End With
End Sub

Private Function write_data(ByVal index As String, ByRef sh As Worksheet, ByRef html As String, ByRef reg As Object, ByRef rowIndex As Long) As Boolean
    Select Case index
        Case "竞争性谈判公告"
            write_data = CA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "询价公告"
            write_data = CA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "单一来源公示"
            write_data = PA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "招标公告"
            write_data = BA.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
        Case "中标公示"
            write_data = B_A.extract_data(sh, HTTP_Request.WriteHtml(html), reg, rowIndex)
    End Select
End Function

Private Sub header(ByRef sh As Worksheet, ByVal index As String, ByVal page As String)
    Select Case index
        Case "竞争性谈判公告"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "询价公告"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "单一来源公示"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/cgxx/caigou.jsp", page
        Case "招标公告"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/zbgg/zhaobiaoList.jsp", page
        Case "中标公示"
            write_Header sh, index, "https://www.chdtp.com/pages/wzglS/zbhxrgs/zbhxrgs.jsp", page
    End Select
End Sub

'提取链接id
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

'提取链接id
Function get_title_id(ByRef reg As Object, ByRef href As String) As String
    Const sPattern As String = "'.+\.html'"
    get_title_id = get_match(reg, sPattern, href)
End Function

'获取链接
Function get_href(item) As String
    Dim a As Object
    Set a = item.getElementsByTagName("a")
    If (a.Length = 0) Then Exit Function
    get_href = a(0).href
End Function

'数据以table形式存储
Function get_table(ByRef dom As Object) As Object
    Dim tables As Object
    
    Set tables = dom.getElementsByTagName("table")
    If (tables.Length = 0) Then Exit Function
    Set get_table = tables(1).getElementsByTagName("td")
End Function

'如果没有爬取到数据, 则删除新生成的表格
Private Sub dele_table(sh)
    ThisWorkbook.Application.DisplayAlerts = False
    sh.Delete
    ThisWorkbook.Application.DisplayAlerts = True
End Sub

'爬取多页数据, 不过出于反爬的考虑, 每次限制5页, 约100条数据
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
                result = result + "p" + CStr(i) + ": 抓取成功" + vbCr
                f = True
            Else
                result = result + "p" + CStr(i) + ": 抓取失败" + vbCr
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

'单页爬取
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
            MsgBox "未获取到表格", vbInformation, cname
        Else
            If (mode = True) Then header sh, index, CStr(page)
            sh.Columns.AutoFit
            Assistant.EnEvents
            MsgBox "抓取数据成功", vbInformation, cname
        End If
    Else
        If (mode = True) Then dele_table sh
        MsgBox "获取数据失败", vbInformation, cname
    End If
    Set sh = Nothing
End Sub
