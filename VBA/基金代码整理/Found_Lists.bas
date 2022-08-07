Attribute VB_Name = "Found_Lists"
Option Explicit
Dim IsReady As Boolean
Dim oHtmlDom

Sub Get_eastmoney_FundLists() '��ȡ�����Ƹ������б�
    Dim i As Byte
    Dim k As Long, m As Long, p As Long, n As Long
    Dim sResult As String
    Dim oRegx As New cRegex
    Dim arr() As String
    Dim artTemp() As String
    Dim dic As Object
    Dim strTemp As String
    Const tUrl As String = "http://fund.eastmoney.com/js/fundcode_search.js"
    
    On Error GoTo errhandle
    IsReady = True
    Data_Update.Show 0
    sResult = HTTP_GetData("GET", tUrl)
    If IsReady = False Then Unload Info_window: MsgBox "��ȡ����ʧ��", vbCritical, "Warning": Exit Sub
    arr = oRegx.xMatch(sResult, Chr(34) & "(.*?)" & Chr(34))
    m = UBound(arr)
    n = (m + 1) / 5
    m = n - 1
    ReDim arrTemp(m, 4)
    Set dic = CreateObject("Scripting.Dictionary")
    dic.CompareMode = 0
    For k = 0 To m
        For i = 0 To 4
            strTemp = Replace(arr(p), Chr(34), "")
            arrTemp(k, i) = strTemp
            If i = 3 Then
                If dic.Exists(strTemp) = False Then dic.Add strTemp, 1 Else dic(strTemp) = dic(strTemp) + 1 'ͳ�Ƹ����������͵�����
            End If
            p = p + 1
        Next
    Next
    With ThisWorkbook.Sheets("Fund_Lists")
        .Name = "Fund_Lists"
        .Range("b7:i20000").ClearContents
        .Cells(4, 3) = n
        p = dic.Count - 1
        m = 7
        strTemp = ""
        For i = 0 To p '------�ֵ�Ҳ�Ǵ�0��ʼ
            strTemp = strTemp & dic.keys()(i) & ", "
            .Cells(m, 7) = dic.keys()(i) & ":"
            .Cells(m, 8) = dic.Items()(i)
            m = m + 1
        Next
        .Cells(5, 3) = Left$(strTemp, Len(strTemp) - 2)
        .Range("b7:b" & n + 6).NumberFormatLocal = "@" '�Ƚ��������(����000001�������ݵ�)�ĸ�ʽ����Ϊ�ı���, ��Ȼ���ݻᱻExcel�̵�
        .Cells(7, 2).Resize(n, 5) = arrTemp
        .Cells(2, 3) = Now
        .Columns.AutoFit
    End With
    Erase arr
    Erase arrTemp
    Set dic = Nothing
    Set oRegx = Nothing
    Data_Update.Label1.Caption = "���ݸ��³ɹ�!" & vbCr & "����ʱ��:" & Now & vbCr & "ץȡ����:" & n & "��"
    Exit Sub
errhandle:
    Set dic = Nothing
    Set oRegx = Nothing
    Unload Data_Update: MsgBox "��ȡ����ʧ��", vbCritical, "Warning"
End Sub

Function Fund_History(ByVal fID As String, ByVal dMode As String, ByVal wb As Workbook) As Boolean '����_�ǵ���ʷ
    '7��,1����, 3����, ����, 1��
    Const tUrl As String = "https://fund.xueqiu.com/dj/open/fund/growth/"
    Dim sResult As String
    Dim sUrl As String
    Dim arr() As String
    Dim arrTemp() As String
    Dim arrNet() As Double
    Dim arrD() As Double, arrP() As Double
    Dim oRegx As New cRegex
    Dim i As Integer, k As Integer, j As Byte, m As Integer, n As Integer, p As Integer
    Dim idown As Integer, iup As Integer, ikeep As Integer '�ǵ�
    Dim iMax As Double, iMin As Double '���, ��Сֵ
    Dim strTemp As String
    Dim x As Double
    Dim rUrl As String
    Dim iColumn As Byte
    Dim iav As Double
    Dim arrPD() As Double
    
    On Error GoTo errhandle
    Fund_History = True
    rUrl = "https://xueqiu.com/S/F" & fID
    sUrl = tUrl & fID & "?day=" & dMode
    IsReady = True
    sResult = HTTP_GetData("GET", sUrl, rUrl)
    If IsReady = False Then GoTo errhandle
    If Len(sResult) < 50 Then GoTo errhandle 'ѩ������ݲ�����
    arr = oRegx.xMatch(sResult, Chr(34) & "(\-?\d.*?)" & Chr(34))
    k = UBound(arr)
    m = (k + 1) / 5 '��������
    k = m - 1
    ReDim arrTemp(k, 3)
    ReDim arrNet(k)
    ReDim arrPD(k)
    For i = 0 To k
        For j = 0 To 4
            If j < 3 Then
                strTemp = Replace(arr(p), Chr(34), "")
                arrTemp(i, j) = strTemp
                If j = 2 Then
                    x = CDbl(strTemp)
                    arrPD(i) = x
                    If x > 0 Then
                        ReDim Preserve arrP(iup)
                        arrP(iup) = x
                        iup = iup + 1
                        strTemp = "UP"
                    ElseIf x < 0 Then
                        ReDim Preserve arrD(idown)
                        arrD(idown) = x
                        idown = idown + 1
                        strTemp = "Down"
                    Else
                        ikeep = ikeep + 1
                        strTemp = "Keep"
                    End If
                    arrTemp(i, 3) = strTemp
                ElseIf j = 1 Then
                    arrNet(i) = CDbl(strTemp)
                End If
            End If
            p = p + 1
        Next
    Next
    Select Case dMode
        Case "7": iColumn = 6
        Case "30": iColumn = 8
        Case "90": iColumn = 10
    End Select
    If dMode <> "180" Then
        With wb.Sheets("Essential")
            .Cells(4, iColumn) = m '��������
            .Cells(5, iColumn) = iup '����
            .Cells(6, iColumn) = idown '�µ�
            .Cells(7, iColumn) = ikeep 'ƽ��
            .Cells(8, iColumn) = Format(iup / m, "0.00") 'ռ��
            .Cells(9, iColumn) = Format(idown / m, "0.00")
            .Cells(10, iColumn) = Format(ikeep / m, "0.00")
            .Cells(10, iColumn).Resize(7, 1).NumberFormatLocal = "0.0000"
            iMin = wb.Application.WorksheetFunction.Min(arrNet) '��С
            iMax = wb.Application.WorksheetFunction.Max(arrNet) '���
            iav = wb.Application.WorksheetFunction.Average(arrNet) 'ƽ��
            .Cells(16, iColumn) = iav
            .Cells(17, iColumn) = wb.Application.WorksheetFunction.StDev(arrNet) '��׼��
            .Cells(18, iColumn) = wb.Application.WorksheetFunction.Var(arrNet) '����
            If iup > 0 Then
                .Cells(14, iColumn) = wb.Application.WorksheetFunction.Average(arrD)
            Else
                .Cells(14, iColumn) = "-"
            End If
            If idown > 0 Then
                .Cells(15, iColumn) = wb.Application.WorksheetFunction.Average(arrP)
            Else
                .Cells(15, iColumn) = "-"
            End If
            .Cells(17, iColumn).NumberFormatLocal = "0.00000000"
            .Cells(18, iColumn).NumberFormatLocal = "0.00000000"
            .Cells(13, iColumn) = iMax - iMin
            .Cells(11, iColumn) = iMax
            .Cells(12, iColumn) = iMin
            .Cells(4, iColumn).Resize(15).HorizontalAlignment = xlLeft
        End With
    End If
    With wb.Sheets(dMode)
        .Cells(2, 2) = "��7���ǵ�����"
        .Cells(3, 2) = "������Դ:"
        .Cells(3, 3) = "ѩ��"
        .Cells(4, 2) = "��������ʱ��:"
        .Cells(4, 3) = Now
        .Cells(5, 2).Resize(1, 3) = Array("����", "��ֵ", "�ǵ�����")
        .Cells(6, 2).Resize(m, 4) = arrTemp
        .Cells(6, 3).Resize(m, 1) = wb.Application.Transpose(arrNet) '���ǵ��ⲿ�ֵ��ı���������
        .Cells(6, 4).Resize(m, 1) = wb.Application.Transpose(arrPD)
        '--------------------��30���ͼ
        If dMode = "30" Then
            For j = 6 To m + 5
                .Cells(j, 6) = iav
            Next
            CreatChart wb, Fund_ID, Fund_Name, m
            .Cells(6, 6).Resize(m, 1).ClearContents
        End If
        .Cells(6, 3).Resize(m, 2).NumberFormatLocal = "0.0000"
        .Columns.AutoFit
    End With
    Set oRegx = Nothing
    Erase arr
    Erase arrTemp
    Exit Function
errhandle:
    Set oRegx = Nothing
    Erase arr
    Erase arrTemp
    Fund_History = False
End Function

Private Function CreatChart(ByVal wb As Workbook, ByVal ID As String, ByVal fname As String, ByVal iRow As Byte) As Boolean '����ͼ�� 'ByVal wb As Workbook
    Dim Shx As Shape
    Dim Cha As Chart
    Dim i As Byte
    Dim pw As Double
    Dim pl As Double
    Dim pt As Double
    Dim ph As Double
    Dim dTextx As Shape, rTextx As Shape, aTextx As Shape, avTextx As Shape
    On Error GoTo errhandle
    Set Shx = wb.Sheets("Essential").Shapes.AddChart2(201, xlColumnClustered, 880, 25, 756, 350) 'top=25,height=350,width=756�� left880
    i = iRow + 5
    Set Cha = Shx.Chart
    With Cha
        .SetSourceData Source:=wb.Sheets("30").Range("b6:c" & i) '��״ͼ
        .ApplyLayout (9) '----------------ͼ������� 'ͨ��¼�ƻ�ȡ����ֵ��6(����Ŀ����Ҫ��ͼ������)
        .SeriesCollection.NewSeries
        .FullSeriesCollection(1).Name = "��ֵ"
        .FullSeriesCollection(2).Name = "�ǵ���(%)"
        .FullSeriesCollection(2).Values = wb.Sheets("30").Range("d6:d" & i).Value '����ͼ
        .ChartType = xlColumnClustered
        .FullSeriesCollection(1).ChartType = xlColumnClustered
        .FullSeriesCollection(1).AxisGroup = 1
        .FullSeriesCollection(2).ChartType = xlLine
        .FullSeriesCollection(2).AxisGroup = 1
        .FullSeriesCollection(2).AxisGroup = 2
        .SeriesCollection.NewSeries
        .FullSeriesCollection(3).Name = "ƽ����ֵ"
        .FullSeriesCollection(3).Values = wb.Sheets("30").Range("f6:f" & i).Value '����ͼ
        .FullSeriesCollection(3).ChartType = xlLineMarkers
        .FullSeriesCollection(2).Format.Line.Weight = 1.5
        .FullSeriesCollection(3).Format.Line.Weight = 1.5
        '------------------------------------------------------����Դ
        .ChartTitle.Text = ID & "-" & fname & "-" & "30�쾻ֵ�仯" '����
        .ChartTitle.Format.TextFrame2.TextRange.Font.Size = 12
        '--------------------------------------����
        '----------ͼ��ķ��(ע�ⲻ������)
        pw = .PlotArea.Width
        pl = .PlotArea.Left
        pt = .PlotArea.Top
        ph = .PlotArea.Height
        .PlotArea.Width = 644
        .PlotArea.Left = 24
        .PlotArea.Top = 39
        .PlotArea.Height = 276 '-------��ͼ�����С����
'        .SetElement (msoElementLegendNone)
        '-----------------------------------------ͼ����ͼ����
        .FullSeriesCollection(1).ApplyDataLabels '��״ͼ��ʾ����
        '-------------------------------------------------------��״ͼ��������ʾ����
        .Axes(xlValue).AxisTitle.Format.TextFrame2.TextRange.Font.Size = 9.5
        .Axes(xlValue, xlPrimary).AxisTitle.Top = 148
        .Axes(xlValue, xlPrimary).AxisTitle.Text = "��ֵ" 'y����Ϣ
        .Axes(xlValue, xlSecondary).TickLabels.NumberFormatLocal = "#,##0.00_ "
        '------------------------------------------------------------------------Y�����
        .Axes(xlCategory, xlPrimary).AxisTitle.Text = "������" 'ChrW(9670) & "�ǵ�����(%)"
'        .Axes(xlCategory, xlPrimary).AxisTitle.Left = 658
'        .Axes(xlCategory, xlPrimary).AxisTitle.Format.TextFrame2.TextRange.Font.Fill.ForeColor.ObjectThemeColor = msoThemeColorAccent2
'        .Axes(xlCategory, xlPrimary).AxisTitle.Top = 276
''        .Axes(xlCategory).TickLabels.Font.Size = 8.5 '����x�������ֵĴ�С(¼�Ƶĺ��Ǵ��)
'        .Axes(xlCategory).AxisTitle.Format.TextFrame2.TextRange.Font.Size = 9.2
        '--------------------------------------------------------------------------------------------X�����
        Set dTextx = .Shapes.AddTextbox(msoTextOrientationHorizontal, 644, 0, 108, 16) '����ı���
        Set rTextx = .Shapes.AddTextbox(msoTextOrientationHorizontal, 0, 332, 255, 16) '����ı���
'        Set avTextx = .Shapes.AddTextbox(msoTextOrientationHorizontal, 612, 290, 108, 36)
        Set aTextx = .Shapes.AddTextbox(msoTextOrientationHorizontal, 644, 332, 108, 16) '����ı���
        '------------��������ı���
    End With
'    With avTextx
'        .TextFrame2.TextRange.Font.Size = 9
'        .TextFrame2.TextRange.Font.Fill.ForeColor.ObjectThemeColor = msoThemeColorBackground1
'        .TextFrame2.TextRange.Font.Fill.ForeColor.Brightness = -0.349999994
'        .TextFrame.Characters.Text = ChrW(9679) & "ƽ����ֵ" & vbCr & "1.0845"
'        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignRight '�ı��������Ҷ���
'    End With
    With dTextx 'ʱ��
        .TextFrame.Characters.Text = "EndDate: " & wb.Sheets("30").Cells(i, 2).Value '�ı���д����Ϣ
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignRight '�ı��������Ҷ���
        .TextFrame2.TextRange.Font.Size = 10
    End With
    With rTextx '��Դ
        .TextFrame.Characters.Text = "Resource: Xueqiu" '�ı���д����ϢWallstreet Journal
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignLeft '�ı�������������
        .TextFrame2.TextRange.Font.Size = 10
    End With
    With aTextx '����
        .TextFrame.Characters.Text = "Drawing By: HLA" '�ı���д����Ϣ
        .TextFrame2.TextRange.ParagraphFormat.Alignment = msoAlignRight '�ı��������Ҷ���
        .TextFrame2.TextRange.Font.Size = 10
    End With
    '-------------------------�ı������
    wb.Sheets("Essential").ChartObjects(1).Placement = xlFreeFloating 'ͼ���λ�ò�����Ϊ���������仯
    With Shx.Line
        .Visible = msoTrue
        .ForeColor.ObjectThemeColor = msoThemeColorAccent1
        .ForeColor.TintAndShade = 0
        .ForeColor.Brightness = 0
    End With
   '-----------------------------�߿����
    Set dTextx = Nothing
    Set aTextx = Nothing
    Set rTextx = Nothing
'    Set avTextx = Nothing
    Set Shx = Nothing
    Set Cha = Nothing
errhandle:
    CreatChart = False
    Set dTextx = Nothing
    Set aTextx = Nothing
    Set rTextx = Nothing
'    Set avTextx = Nothing
    Set Shx = Nothing
    Set Cha = Nothing
End Function

Function sFund_Profile(ByVal ID As String) As String() 'ͬ��˳ -��Ҫ
    Const tUrl As String = "http://fund.10jqka.com.cn/"
    Const pUrl As String = "http://fund.10jqka.com.cn/data/client/myfund/"
    Dim sUrl As String
    Dim sResult As String
    Dim arr() As String
    Dim arrTemp() As String
    Dim oRegx As New cRegex
    Dim i As Integer, k As Integer, p As Byte, m As Byte, j As Byte
    Dim arrx, strTemp As String
    
    On Error Resume Next
    IsReady = True
    sUrl = pUrl & ID
    sResult = HTTP_GetData("GET", sUrl, tUrl)
    If IsReady = False Then Exit Function
    arr = oRegx.xSubmatch(sResult, Chr(34) & "(.*?)" & Chr(34) & ":\s?" & Chr(34) & "(.*?)" & Chr(34))
    Set oRegx = Nothing
    k = 19
    m = UBound(arr)
    ReDim arrTemp(k)
    ReDim sFund_Profile(k)
    If m = 62 Then
        arrx = Array(0, 1, 3, 4, 5, 6, 13, 14, 15, 16, 17, 20, 21, 35, 36, 37, 38, 39, 40, 58) '��Ҫ������
        For i = 0 To k
            strTemp = arr(arrx(i), 1)
            If InStr(strTemp, "\u") > 0 Then strTemp = Unicode2Character(strTemp) '�����еĺ���ΪUnicode�ַ�
            arrTemp(i) = strTemp
        Next
    Else
        arrx = Array("enddate", "net", "totalnet", "ranges", "rate", "name", "fundtype", "clrq", "manager", "orgname", "sgstat", "shstat", "nowyear", "week", "week", "tmonth", "year", "hyear", "asset")
        arrTemp(0) = arr(0, 1)
        For j = 0 To 18
            For i = 1 To m
                If Replace(arr(i, 0), Chr(34), "") = arrx(j) Then
                    strTemp = arr(i, 1)
                    If InStr(strTemp, "\u") > 0 Then strTemp = Unicode2Character(strTemp) '�����еĺ���ΪUnicode�ַ�
                    arrTemp(j + 1) = strTemp
                    Exit For
                End If
            Next
        Next
    End If
    sFund_Profile = arrTemp
End Function
 
Function Fund_Position(ByVal ID As String, ByVal wb As Workbook) As Boolean '����ֲ����
    Dim date1 As Date, date2 As Date, d1 As Byte, d2 As Byte
    Dim strTemp As String
    Dim sResult As String
    Dim sUrl As String
    Dim oList As Object, oTitle As Object
    Dim i As Integer, k As Integer, imode As Byte, j As Byte, p As Byte
    Dim item As Object, itemx As Object, itema As Object
    Dim arrTemp() As String, arrTemp1() As String
    Const tUrl As String = "http://fund.10jqka.com.cn/"
    
    On Error GoTo errhandle
    Fund_Position = True
    sUrl = tUrl & ID & "/portfolioindex.html" '��ȡ�ֲ���� html
    IsReady = True
    sResult = HTTP_GetData("GET", sUrl, tUrl)
    If IsReady = False Then Fund_Position = False: Exit Function
    WriteHtml sResult
    Set oTitle = oHtmlDom.getelementsbyclassname("o-title") '�Ȼ�ø��µ���������
    '--------������ڲ����,��ô�ͻ�ȡ���µ�����, ��ȡ�زֹ�,ծȯ
    For Each item In oTitle
        strTemp = item.innertext
        If InStr(strTemp, "�زֹ�") > 0 Then
            If InStr(strTemp, "���ݸ���") > 0 Then date1 = CDate(Trim(Split(strTemp, " ")(1))): d1 = 1
        ElseIf InStr(strTemp, "�ز�ծ") > 0 Then
            If InStr(strTemp, "���ݸ���") > 0 Then date2 = CDate(Trim(Split(strTemp, " ")(1))): d2 = 1
        End If
    Next
    If d1 > 0 And d2 > 0 Then '������1��ֵ
        If date1 > date2 Then
            imode = 1
        ElseIf date1 = date2 Then '��ȡ˫��ֵ
            imode = 3
        Else
            imode = 2
        End If
    ElseIf d1 = 0 And d2 > 0 Then '��ȡ����ֵ
        imode = 2
    ElseIf d1 > 0 And d2 = 0 Then '��ȡ����ֵ
        imode = 1
    Else
        Exit Function
    End If
    Set oTitle = Nothing
    '--------------------------��ȡ���ݸ���ʱ������
    Set oList = oHtmlDom.getelementsbyclassname("s-list") '���3��Ԫ��,�زֹ�,�ز�ծ,����
    i = 0: k = 0: j = 0
    Select Case imode
        Case 1:
        For Each item In oList.item(0).Children
            If p > 0 Then
                For Each itemx In item.Children
                    arrTemp(i, k) = itemx.innertext
                    k = k + 1
                Next
                i = i + 1
                k = 0
            Else
                p = 1
                k = oList.item(0).Children.Length - 2
                ReDim arrTemp(k, 5)
                ReDim Found_Position(k, 5)
                k = 0
            End If
        Next
        Case 2:
        For Each item In oList.item(1).Children
            If p > 0 Then
                For Each itemx In item.Children
                    arrTemp(i, k) = itemx.innertext
                    k = k + 1
                Next
                i = i + 1
                k = 0
            Else
                p = 1
                k = oList.item(1).Children.Length - 2
                ReDim arrTemp(k, 5)
                ReDim Found_Position(k, 5)
                k = 0
            End If
        Next
        Case 3:
        k = oList.item(0).Children.Length - 2
        ReDim arrTemp(k, 5)
        k = oList.item(1).Children.Length - 1
        ReDim arrTemp1(k, 5)
        k = 0
        For Each item In oList
            If p = 2 Then Exit For
            For Each itemx In item.Children
                If j > 0 Then
                    For Each itema In itemx.Children
                        If p = 0 Then
                            arrTemp(i, k) = itema.innertext
                        Else
                            arrTemp1(i, k) = itema.innertext
                        End If
                        k = k + 1
                    Next
                    k = 0
                    i = i + 1
                End If
                j = 1
            Next
            i = 0
            j = 0
            p = p + 1
        Next
    End Select
    With wb.Sheets("Essential")
        Select Case imode
            Case 1:
                .Cells(25, 3) = date1
                .Cells(28, 2).Resize(UBound(arrTemp) + 1, 6) = arrTemp
            Case 2:
                .Cells(41, 3) = date2
                .Cells(43, 2).Resize(UBound(arrTemp) + 1, 6) = arrTemp
            Case 3:
                .Cells(25, 3) = date1
                .Cells(28, 2).Resize(UBound(arrTemp) + 1, 6) = arrTemp
                .Cells(41, 3) = date2
                .Cells(43, 2).Resize(UBound(arrTemp1) + 1, 6) = arrTemp1
        End Select
    End With
    Set oList = Nothing
    Set oHtmlDom = Nothing
    Exit Function
errhandle:
    Fund_Position = False
    Set oList = Nothing
    Set oHtmlDom = Nothing
End Function

Private Function HTTP_GetData(ByVal sVerb As String, ByVal sUrl As String, Optional ByVal RefUrl As String = "https://www.baidu.com", _
Optional ByVal sProxy As String, Optional ByVal sCharset As String = "utf-8", Optional ByVal sPostData As String = "", _
Optional ByVal cType As String = "application/x-www-form-urlencoded", Optional sCookie As String = "", _
Optional ByVal acType As String, Optional ByVal cHost As String, Optional ByVal isRedirect As Boolean = False, Optional ByVal oRig As String, _
Optional ByVal acLang As String, Optional ByVal xReqw As String, Optional ByVal acEncode As String, _
Optional ByVal rsTimeOut As Long = 3000, Optional ByVal cTimeOut As Long = 3000, Optional ByVal sTimeOut As Long = 5000, Optional ByVal rcTimeOut As Long = 3000, _
Optional ByVal IsSave As Boolean, Optional ByVal ReturnRP As Byte) As String
    '---------ReturnRP������Ӧͷ 0������,1����ȫ��, 2, ��ȡȫ����cookie,3���ص���cookie,3���ر�������(Optional ByVal cCharset As Boolean = False)
    '--------------------------sVerbΪ���͵�Html����ķ���,sUrlΪ�������ַ,sCharsetΪ��ַ��Ӧ���ַ�������,sPostDataΪPost������Ӧ�ķ���body
    '- <form method="post" action="http://www.yuedu88.com/zb_system/cmd.php?act=search"><input type="text" name="q" id="edtSearch" size="12" /><input type="submit" value="����" name="btnPost" id="btnPost" /></form>
    Dim oWinhttpRq As Object
    Dim bResult() As Byte
    Dim strTemp  As String
    '----------------------https://blog.csdn.net/tylm22733367/article/details/52596990
    '------------------------------https://msdn.microsoft.com/en-us/library/windows/desktop/aa384106(v=vs.85).aspx
    '------------------------https://docs.microsoft.com/en-us/windows/win32/winhttp/iwinhttprequest-interface
    On Error GoTo errhandle
    If LCase$(Left$(sUrl, 4)) <> "http" Then IsReady = False: MsgBox "���Ӳ��Ϸ�", vbCritical, "Warning": Exit Function
    Set oWinhttpRq = CreateObject("WinHttp.WinHttpRequest.5.1")
    With oWinhttpRq
        .Option(6) = isRedirect 'Ϊ True ʱ��������ҳ���ض�����תʱ�Զ���ת��False ���Զ���ת����ȡ����˷��ص�302״̬
        '--------------��������ý����ض���,���е��ʵ��޷���Ч����post������,������ת�е��������ҳ,���ز���Ҫ������
        .setTimeouts rsTimeOut, cTimeOut, sTimeOut, rcTimeOut 'ResolveTimeout, ConnectTimeout, SendTimeout, ReceiveTimeout
        Select Case sVerb
        '----------Specifies the HTTP verb used for the Open method, such as "GET" or "PUT". Always use uppercase as some servers ignore lowercase HTTP verbs.
        Case "GET"
            .Open "GET", sUrl, False '---url, This must be an absolute URL.
        Case "POST"
            .Open "POST", sUrl, False
            .setRequestHeader "Content-Type", cType
        End Select
        If Len(sProxy) > 0 Then '����ʽ�Ƿ�����Ҫ��
            If LCase(sProxy) <> "localhost:8888" Then
            '-------------------ע��fiddler�޷�ֱ��ץȡwhq������, ��Ҫ����������Ϊlocalhost:8888�˿�
                If InStr(sProxy, ":") > 0 And InStr(sProxy, ".") > 0 Then
                    If UBound(Split(sProxy, ".")) = 3 Then .setProxy 2, sProxy 'localhost:8888----���������/��Ҫ���Ӵ����ж�(������ÿһ����������)
                End If
            Else
                .setProxy 2, sProxy
            End If
        End If
        '-----------------��ҪӦ����αװ��������������Թ����վ�ķ�����
        If Len(xReqw) > 0 Then .setRequestHeader "X-Requested-With", xReqw
        If Len(acEncode) > 0 Then .setRequestHeader "Accept-Encoding", acEncode
        If Len(acLang) > 0 Then .setRequestHeader "Accept-Language", acLang
        If Len(acType) > 0 Then .setRequestHeader "Accept", acType
        If Len(cHost) > 0 Then .setRequestHeader "Host", cHost
        If Len(oRig) > 0 Then .setRequestHeader "Origin", oRig
        If Len(sCookie) > 0 Then .setRequestHeader "Cookie", sCookie
        .setRequestHeader "Referer", RefUrl 'αװ���ض���url����
        .setRequestHeader "User-Agent", Random_UserAgent(False) 'Random_UserAgent 'α���������ua
        If Len(sPostData) > 0 Then
            .send (sPostData)
        Else
            .send
        End If
        '---------------������Ը��ݷ��صĴ���ֵ�������ж���ҳ�ķ���״̬,�������Ƿ���Ҫ���½��з���(��:����404,��ô�Ͳ�Ӧ���ټ�������,403����Ҫ����Ƿ񴥷�����վ�ķ�������,��Ҫ���ô���)
        If .Status <> 200 Then IsReady = False: Set oWinhttpRq = Nothing: Exit Function
        '------------------------------------�ж���ҳ���ݵ��ַ���������
        '---------һ��ҳ������UTF-8����, ������벻��ȷ�����в��ֵ��ַ���������
        '------------'���������е���Ӧͷ������setcookie
        If ReturnRP > 0 Then '----------��ȡ��Ӧͷ,�жϱ��������(ע�ⲿ�ֵ�վ�����������αװ�����,��ȡ����Ӧͷ�ı��벢������վ�ı���,�����Ƿ�������Ӧ���ֵı���)
            strTemp = .getAllResponseHeaders
            Select Case ReturnRP
                Case 1:
                    HTTP_GetData = .getAllResponseHeaders '��ȡȫ������Ӧͷ
                Case 2: '------------------------ȫ��cookie
                    Dim xCookie As Variant
                    Dim i As Byte, k As Byte
                    If InStr(1, strTemp, "set-cookie", vbTextCompare) > 0 Then
                        xCookie = Split(strTemp, "Set-Cookie:")
                        i = UBound(xCookie)
                        strTemp = ""
                        For k = 1 To i
                            If InStr(1, xCookie(k), ";", vbBinaryCompare) > 0 Then strTemp = strTemp & Trim(Split(xCookie(k), ";")(0)) & "; " 'ƴ����һ��
                        Next
                        strTemp = Trim$(strTemp)
                        HTTP_GetData = Left$(strTemp, Len(strTemp) - 1)
                    End If
                Case 3: '----------------------------����cookie,
                    If InStr(1, strTemp, "set-cookie", vbTextCompare) > 0 Then HTTP_GetData = .getResponseHeader("Set-Cookie") '�������û��set-cookie������ִ���
                Case 4: '----------------------------------------------------------��������
                    ' -----------.getResponseHeader("Content-Type")
                    If InStr(1, strTemp, "charset=", vbTextCompare) > 0 Then
                        strTemp = Split(strTemp, "charset=")(1)
                        strTemp = LCase$(Left$(strTemp, 7))
                        If InStr(1, strTemp, "gbk", vbBinaryCompare) > 0 Then
                            sCharset = "gb2312"
                        ElseIf InStr(1, strTemp, "gb2312", vbBinaryCompare) > 0 Then
                            sCharset = "gb2312"
                        ElseIf InStr(1, strTemp, "unicode", vbBinaryCompare) > 0 Then
                            sCharset = "unicode"
                        ElseIf InStr(1, strTemp, "utf-8", vbBinaryCompare) > 0 Then
                            sCharset = "utf-8"
                        Else
                            sCharset = "utf-8"
                        End If
                    End If
            End Select
            If ReturnRP <> 4 Then Set oWinhttpRq = Nothing: Exit Function
        End If
        bResult = .responseBody '����ָ�����ַ�������ʾ
        '-��ȡ���ص��ֽ����� (����Ӧ������Ǳ�ڵ���վ�ı���������ɵķ��ؽ������)
        HTTP_GetData = ByteHandle(bResult, sCharset, IsSave)
    End With
    Set oWinhttpRq = Nothing
    Exit Function
errhandle:
    If Err.Number = -2147012867 Then MsgBox "�޷����ӷ�����", vbCritical, "Warning!"
    IsReady = False
    Set oWinhttpRq = Nothing
End Function
'---------------------------------------https://www.w3school.com.cn/ado/index.asp
Private Function ByteHandle(ByRef bContent() As Byte, ByVal sCharset As String, Optional ByVal IsSave As Boolean) As String
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    Dim oStream As Object
    '----------------------����adodb���ֽ�תΪ�ַ���
    Set oStream = CreateObject("ADODB.Stream")
    With oStream
        .Open
        .Type = adTypeBinary
        .Write bContent
        .Position = 0
        .Type = adTypeText
        .Charset = sCharset
         ByteHandle = .ReadText
        .Close
    End With
    Set oStream = Nothing
End Function

Private Sub WriteHtml(ByVal sHtml As String) '��ҳ����Ϣд��html file
    'https://www.w3.org/TR/DOM-Level-2-HTML/html
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752574%28v%3dvs.85%29
    '----------------------------------------https://ken3memo.hatenablog.com/entry/20090904/1252025888
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752573(v=vs.85)
    Set oHtmlDom = CreateObject("htmlfile")
    With oHtmlDom
        .DesignMode = "on" ' �����༭ģʽ(��Ҫֱ��ʹ��.body.innerhtml=shtml,�����ᵼ��IE�������)
        .Write sHtml ' д������
    End With
End Sub

Private Function Random_IP() As String '�ڴ���ip�б��������ѡip/����Ҫ�����ж�ip�Ƿ����
    Dim i As Integer
    Dim arr() As String
    '-----------------��ѵĴ���,���������pingͨ,������ζ�ſ��������Ż�����
    IsReady = True
    arr = Proxy_IP
    If IsReady = False Then Random_IP = "127.0.0.1:8888": Exit Function '����/ʹ��fiddler
    i = UBound(arr)
    i = RandNumx(i)
    If i = 0 Then i = 1
    Random_IP = arr(i, 1) & ":" & arr(i, 2)
    Set oHtmlDom = Nothing
    Erase arr
End Function

Private Function Random_UserAgent(ByVal IsMobile As Boolean, Optional ByVal ForceIE As Boolean = False) As String '��������αװ/�ֻ�-PC
    Dim i As Byte
    Dim UA As String

    i = RandNumx(10)
    If ForceIE = True Then 'ʹ��ie
        UA = "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko" 'Mozilla/5.0(compatible;MSIE9.0;WindowsNT6.1;Trident/5.0)
    Else
        If IsMobile = True Then
            Select Case i
            Case 0: UA = "UCWEB/2.0 (MIDP-2.0; U; Adr 9.0.0) UCBrowser U2/1.0.0 Gecko/63.0 Firefox/63.0 iPhone/7.1 SearchCraft/2.8.2 baiduboxapp/3.2.5.10 BingWeb/9.1 ALiSearchApp/2.4"
            Case 1: UA = "Mozilla/5.0 (Linux; Android 7.0; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/48.0.2564.116 Mobile Safari/537.36 T7/10.3 SearchCraft/2.6.2 (Baidu; P1 7.0)"
            Case 2: UA = "MQQBrowser/26 Mozilla/5.0 (Linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
            Case 3: UA = "Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BLA-AL00 Build/HUAWEIBLA-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/8.9 Mobile Safari/537.36"
            Case 4: UA = "Mozilla/5.0 (Linux; Android 6.0.1; OPPO A57 Build/MMB29M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/63.0.3239.83 Mobile Safari/537.36 T7/10.13 baiduboxapp/10.13.0.10 (Baidu; P1 6.0.1)"
            Case 5: UA = "Mozilla/5.0 (Linux; Android 8.0; MHA-AL00 Build/HUAWEIMHA-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044304 Mobile Safari/537.36 MicroMessenger/6.7.3.1360(0x26070333) NetType/4G Language/zh_CN Process/tools"
            Case 6: UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/15.0b13894 Mobile/16D57 Safari/605.1.15"
            Case 7: UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X; zh-cn) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/16D57 Quark/3.0.6.926 Mobile"
            Case 8: UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.0 Mobile/16D57 Safari/602.1 MXiOS/5.2.20.508"
            Case 9: UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/606.4.5 (KHTML, like Gecko) Mobile/16D57 QHBrowser/317 QihooBrowser/4.0.10"
            Case 10: UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16D57 unknown BingWeb/6.9.8.1"
            End Select
        Else
            Select Case i
                Case 0: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0"
                Case 1: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36"
                Case 2: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36"
                Case 3: UA = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36"
                Case 4: UA = "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.169 Safari/537.36 OPR/44.0.2213.246"
                Case 5: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
                Case 6: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"
                Case 7: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100"
                Case 8: UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36"
                Case 9: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36"
                Case 10: UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
            End Select
        End If
    End If
    'UA = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.9 Safari/537.36"
    Random_UserAgent = UA
End Function

Private Function Unicode2Character(ByVal strText As String) '��UnicodeתΪ����
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752599(v=vs.85)
    With CreateObject("htmlfile")
        .Write "<script></script>"
        '--------------------------https://www.w3school.com.cn/jsref/jsref_unescape.asp
        '�ú����Ĺ���ԭ���������ģ�ͨ���ҵ���ʽΪ %xx �� %uxxxx ���ַ����У�x ��ʾʮ�����Ƶ����֣����� Unicode �ַ� \u00xx �� \uxxxx �滻�������ַ����н��н���
        'ECMAScript v3 �Ѵӱ�׼��ɾ���� unescape() ������������ʹ���������Ӧ���� decodeURI() �� decodeURIComponent() ȡ����֮��
        Unicode2Character = .parentwindow.unescape(Replace(strText, "\u", "%u"))
    End With
End Function

Private Function RandNumx(ByVal numx As Long) As Long '���������'https://docs.microsoft.com/zh-cn/office/vba/language/reference/user-interface-help/randomize-statement
    Randomize (Timer)
    RandNumx = Int((numx - 0 + 1) * Rnd + 0)
End Function
