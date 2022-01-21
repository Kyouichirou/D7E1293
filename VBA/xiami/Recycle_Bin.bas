Attribute VB_Name = "Recycle_Bin"
Option Explicit
Private Function FileExten(ByVal srText As String, ByVal mode As Byte) As String '��Ƶ�ļ�, ͼƬ�ļ�, ����ļ�
    Dim s As String
    If mode = 1 Then '��Ƶ�ļ�
        If InStr(1, srText, "?", vbBinaryCompare) > 0 Then
            s = Split(srText, "?")(0)
            If InStr(1, s, ".", vbBinaryCompare) > 0 Then
                s = Right$(s, Len(s) - InStrRev(s, "."))
                FileExten = Trim(s)
            End If
        Else
            FileExten = "mp3" '�����������, ��ͳһ����mp3
        End If
    Else
        s = Right$(srText, Len(srText) - InStrRev(srText, "."))
        FileExten = Trim$(s)
    End If
    FileExten = "mp3"
End Function

'Private Sub WriteHtml(ByVal sHtml As String) '��ҳ����Ϣд��html file
'    'https://www.w3.org/TR/DOM-Level-2-HTML/html
'    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752574%28v%3dvs.85%29
'    '----------------------------------------https://ken3memo.hatenablog.com/entry/20090904/1252025888
'    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752573(v=vs.85)
'    Set oHtmlDom = CreateObject("htmlfile")
'    With oHtmlDom
'        .DesignMode = "on" ' �����༭ģʽ(��Ҫֱ��ʹ��.body.innerhtml=shtml,�����ᵼ��IE�������)
'        .Write sHtml ' д������
'    End With
'End Sub

'ר��ID
'ר������
'ר������
'ר������
'ר���ַ���id
'����Alias (����)
'������
'���ַ���
'������: ԭ��
'����
'����id'--------------------------��Ҫ��ȡ�⼸����Ҫ��
Private Function Json_Data_Treat(ByVal strText As String) As String() '������ȡ��json���ݵĴ���
    Dim dic As Object
    Dim sDic As Object
    Dim dDic As Object
    Dim pDic As Object
    Dim isDic As Object
    Dim item
    Dim itemx, itema
    Dim i As Byte, k As Byte, p As Byte, n As Byte, m As Byte
    Dim arr() As String
    Dim strTemp As String
    Dim ic As Integer
    Dim strT As String
    
    Set dic = JsonConverter.ParseJson(strText)
    Set sDic = dic("result")
    Set dDic = sDic("data")
    Set isDic = dDic("songs")
    n = isDic.Count - 1
    For Each item In isDic
        For Each itemx In item.Items
            If p = 0 Then m = item.Count - 1: ReDim arr(n, m): ReDim Json_Data_Treat(n, m): i = 0: k = 0: p = 1
            If IsObject(itemx) = False Then
                If IsNull(itemx) = False Then
                    strTemp = itemx
                    If Len(strTemp) > 0 Then
                        arr(i, k) = strTemp
                    Else
                        arr(i, k) = "-"
                    End If
                Else
                    arr(i, k) = "-"
                End If
                k = k + 1
            Else
                strT = item.Keys()(ic)
                If strT = "lyricInfo" Then '��ʺ���������
                    If TypeName(itemx) <> "Collection" Then
                        m = m + itemx.Count
                        ReDim Preserve arr(n, m)
                        ReDim Preserve Json_Data_Treat(n, m)
                        For Each itema In itemx.Items
                            If IsNull(itema) = False Then
                                arr(i, k) = itema
                            Else
                                arr(i, k) = "-"
                            End If
                            k = k + 1
                        Next
                    End If
                End If
            End If
        Next
        i = i + 1
        k = 0
    Next
    Json_Data_Treat = arr
    Set dic = Nothing
    Set isDic = Nothing
    Set sDic = Nothing
    Set dDic = Nothing
    Erase arr
End Function

'Private Function fExtension(ByVal sUrl As String) As String '��չ��
'    Dim strTemp As String
'    strTemp = Right$(sUrl, Len(sUrl) - InStrRev(sUrl, "."))
'    If InStr(1, ".jpg" & "/" & ".webp" & ".jpeg" & "/" & ".png" & "/" & ".trc", strTemp, vbTextCompare) > 0 Then
'        strTemp = Right$(sUrl, Len(sUrl) - InStrRev(sUrl, "."))
'    Else
'        If InStr(1, sUrl, "?", vbBinaryCompare) > 0 Then
'            strTemp = Split(sUrl, "?")(0)
'            strTemp = Right$(strTemp, Len(strTemp) - InStrRev(strTemp, "."))
'        End If
'    End If
'    fExtension = strTemp
'End Function

'Private Function Random_IP() As String '�ڴ���ip�б��������ѡip/����Ҫ�����ж�ip�Ƿ����
'    Dim i As Integer
'    Dim arr() As String
'
'    arr = Proxy_IP
''    If isReady = False Then Random_IP = "127.0.0.1:8888": Exit Function '����/ʹ��fiddler
'    i = UBound(arr)
'    i = RandNumx(i)
'    If i = 0 Then i = 1
'    Random_IP = arr(i, 1) & ":" & arr(i, 2)
'    Set oHtmlDom = Nothing
'    Erase arr
'End Function
'--------------����(proxy)����
'----------https://docs.microsoft.com/zh-cn/windows/win32/winhttp/iwinhttprequest-setproxy
'HTTPREQUEST_PROXYSETTING_DEFAULT ��0����Default proxy setting. Equivalent to HTTPREQUEST_PROXYSETTING_PRECONFIG.
'HTTPREQUEST_PROXYSETTING_PRECONFIG��0����Indicates that the proxy settings should be obtained from the registry.
'This assumes that Proxycfg.exe has been run. If Proxycfg.exe has not been run and HTTPREQUEST_PROXYSETTING_PRECONFIG is specified, then the behavior is equivalent to HTTPREQUEST_PROXYSETTING_DIRECT.
'HTTPREQUEST_PROXYSETTING_DIRECT��1����Indicates that all HTTP and HTTPS servers should be accessed directly.
'Use this command if there is no proxy server.
'HTTPREQUEST_PROXYSETTING_PROXY��2����When HTTPREQUEST_PROXYSETTING_PROXY is specified, varProxyServer should be set to a proxy server string
'and varBypassList should be set to a domain bypass list string. This proxy configuration applies only to the current instance of the WinHttpRequest object.
'Private Function Proxy_IP() As String() '��ȡhttp����ip��ַ�б�
'    Dim sResult As String
'    Dim oHtml As Object
'    Dim objList As Object
'    Dim arr() As String
'    Dim list_item As Object, item As Object, itemx As Object
'    Dim i As Integer, k As Integer
'
'    On Error Resume Next
'    sResult = HTTP_GetData("GET", "https://www.xicidaili.com/wn/") '��վ����н�Ϊ���еķ��������(ֱ��xmlhttp���ʻ����503���󷵻�)
'    WriteHtml sResult
'    Set objList = oHtmlDom.getElementById("ip_list")
'    i = objList.Children.Length
''    If i = 0 Then isReady = False: Exit Function
'    Set oHtml = objList.Children.item(i - 1)
'    Set list_item = oHtml.getElementsByTagName("tr")
'    i = 0
'    i = list_item.Length
''    If i = 0 Then isReady = False: Exit Function
'    For Each item In list_item
'        If k = 0 Then
'            k = item.Children.Length
''            If k = 0 Then isReady = False: Exit Function
'            ReDim arr(i - 1, k - 1)
'            ReDim Proxy_IP(i - 1, k - 1)
'            k = 0: i = 0
'        End If
'        k = 0
'        For Each itemx In item.Children
'            arr(i, k) = itemx.innertext '1,ip, 2,port, 3,��ַ, 4,����, 5, http/https
'            k = k + 1
'        Next
'        i = i + 1
'    Next
'    Proxy_IP = arr
'    Set objList = Nothing
'    Set oHtml = Nothing
'    Set list_item = Nothing
'    Erase arr
'End Function

'Private Function Download(ByRef arrx() As String, ByRef arrs() As String, ByVal icx As Byte, ByVal sID As String, ByVal sName As String, ByVal sArtist As String, Optional ByVal alldown As Boolean = False) As Boolean '����ѡ��
'    Dim arr() As New cWinHttpRQ
'    Dim i As Integer, k As Integer
'    Dim iThread As Byte
'    Dim filepath As String
'    Dim bPath As String
'    Dim xarr() As String
'    Dim iOK As Byte
'
'    xarr = arrs '����ֱ��ʹ�ò���arrs, �������ִ���
'    iThread = icx - 1
'    iOK = iThread
'    bPath = ThisWorkbook.Path & "\"
'    Download = True
'    ReDim arr(iThread)
'    For i = 0 To iThread
'        If InStr(1, arrx(i), "http", vbBinaryCompare) > 0 Then
'            With arr(i)
'                .Index = i
'                If i = 0 And alldown = False Then .backUrl = xarr
'                If alldown = True Then .Down_Mode = 1
'                .Url = arrx(i)
'                filepath = bPath & CheckRname(sID & "_" & sName & "_" & sArtist & "." & fExtension(arrx(i)))
'                If oFso.fileexists(filepath) = False Then
'                    .saveFilePath = filepath
'                    .Download
'                End If
'            End With
'        End If
'    Next
'    For i = 0 To iThread
'        With arr(i)
'            Do Until .IsOK = True
'                If StopFlag = True Then GoTo stopHandle
'                If .IsErr = True Then: Download = False: If i = 0 Then iOK = iOK - 1: Exit Do
'                DoEvents
'            Loop
'        End With
'    Next
'    Erase arr
'    If iOK < iThread Then Download = False
'    Exit Function
'stopHandle:
'    Erase arr
'End Function
