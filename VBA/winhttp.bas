Function HTTP_GetData(ByVal sVerb As String, ByVal sUrl As String, Optional ByVal refUrl As String = "https://www.baidu.com", _
Optional ByVal sProxy As String, Optional ByVal sCharset As String = "utf-8", Optional ByVal sPostdata As Variant = "", _
Optional ByVal cType As String = "application/x-www-form-urlencoded", Optional sCookie As String = "", _
Optional ByVal acType As String, Optional ByVal cHost As String, Optional ByVal isRedirect As Boolean = False, Optional ByVal oRig As String, _
Optional ByVal acLang As String, Optional ByVal xReqw As String, Optional ByVal acEncode As String, _
Optional ByVal rsTimeOut As Long = 3000, Optional ByVal cTimeOut As Long = 3000, Optional ByVal sTimeOut As Long = 5000, Optional ByVal rcTimeOut As Long = 3000, _
Optional ByVal IsSave As Boolean, Optional ByVal ReturnRP As Byte, Optional ByVal isBaidu As Boolean, Optional ByVal isMobile As Boolean = False) As String
    '---------ReturnRP返回响应头 0不返回,1返回全部, 2, 获取全部的cookie,3返回单个cookie,3返回编码类型(Optional ByVal cCharset As Boolean = False)
    '--------------------------sVerb为发送的Html请求的方法,sUrl为具体的网址,sCharset为网址对应的字符集编码,sPostData为Post方法对应的发送body
    '- <form method="post" action="http://www.yuedu88.com/zb_system/cmd.php?act=search"><input type="text" name="q" id="edtSearch" size="12" /><input type="submit" value="搜索" name="btnPost" id="btnPost" /></form>
    Dim oWinHttpRQ As Object
    Dim bResult() As Byte
    Dim strTemp  As String
    '----------------------https://blog.csdn.net/tylm22733367/article/details/52596990
    '------------------------------https://msdn.microsoft.com/en-us/library/windows/desktop/aa384106(v=vs.85).aspx
    '------------------------https://docs.microsoft.com/en-us/windows/win32/winhttp/iwinhttprequest-interface
    On Error GoTo ErrHandle
    If LCase$(Left$(sUrl, 4)) <> "http" Then isReady = False: MsgBox "链接不合法", vbCritical, "Warning": Exit Function
    Set oWinHttpRQ = CreateObject("WinHttp.WinHttpRequest.5.1")
    With oWinHttpRQ
        .Option(6) = isRedirect '为 True 时，当请求页面重定向跳转时自动跳转，False 不自动跳转，截取服务端返回的302状态
        '--------------如果不设置禁用重定向,如有道词典无法有效处理post的数据,将会跳转有道翻译的首页,返回不必要的数据
        .setTimeouts rsTimeOut, cTimeOut, sTimeOut, rcTimeOut 'ResolveTimeout, ConnectTimeout, SendTimeout, ReceiveTimeout
        Select Case sVerb
        '----------Specifies the HTTP verb used for the Open method, such as "GET" or "PUT". Always use uppercase as some servers ignore lowercase HTTP verbs.
        Case "GET"
            .Open "GET", sUrl, False '---url, This must be an absolute URL.
        Case "POST"
            .Open "POST", sUrl, False
            .setRequestHeader "Content-Type", cType
        End Select
        If Len(sProxy) > 0 Then '检测格式是否满足要求
            If LCase(sProxy) <> "localhost:8888" Then
            '-------------------注意fiddler无法直接抓取whq的请求, 需要将代理设置为localhost:8888端口
                If InStr(sProxy, ":") > 0 And InStr(sProxy, ".") > 0 Then
                    If UBound(Split(sProxy, ".")) = 3 Then .SetProxy 2, sProxy 'localhost:8888----代理服务器/需要增加错误判断(并不是每一个代理都可用)
                End If
            Else
                .SetProxy 2, sProxy
            End If
        End If
        '-----------------主要应用于伪装成正常的浏览器以规避网站的反爬虫
        If Len(xReqw) > 0 Then .setRequestHeader "X-Requested-With", xReqw
        If Len(acEncode) > 0 Then .setRequestHeader "Accept-Encoding", acEncode
        If Len(acLang) > 0 Then .setRequestHeader "Accept-Language", acLang
        If Len(acType) > 0 Then .setRequestHeader "Accept", acType
        If Len(cHost) > 0 Then .setRequestHeader "Host", cHost
        If Len(oRig) > 0 Then .setRequestHeader "Origin", oRig
        If Len(sCookie) > 0 Then .setRequestHeader "Cookie", sCookie
        If isBaidu = False Then
            .setRequestHeader "Referer", refUrl '伪装从特定的url而来
            .setRequestHeader "User-Agent", Random_UserAgent(isMobile) 'Random_UserAgent '伪造浏览器的ua
        End If
        If sVerb = "POST" Then
            .Send (sPostdata)
        Else
            .Send
        End If
        '---------------这里可以根据返回的错误值来加以判断网页的访问状态,来决定是否需要重新进行访问(如:返回404,那么就不应该再继续访问,403就需要检查是否触发了网站的反爬机制,需要启用代理)
        If .Status <> 200 Then isReady = False: Set oWinHttpRQ = Nothing: Exit Function
        '------------------------------------判断网页内容的字符集的类型
        '---------一般页面多采用UTF-8编码, 如果编码不正确将会有部分的字符出现乱码
        '------------'并不是所有的响应头都会有setcookie
        If ReturnRP > 0 Then '----------获取响应头,判断编码的类型(注意部分的站点如果不加以伪装浏览器,获取的响应头的编码并不是网站的编码,可能是反爬的响应部分的编码)
            strTemp = .getAllResponseHeaders
            Select Case ReturnRP
                Case 1:
                    HTTP_GetData = .getAllResponseHeaders '获取全部的响应头
                Case 2: '------------------------全部cookie
                    Dim xCookie As Variant
                    Dim i As Byte, k As Byte
                    If InStr(1, strTemp, "set-cookie", vbTextCompare) > 0 Then
                        xCookie = Split(strTemp, "Set-Cookie:")
                        i = UBound(xCookie)
                        strTemp = ""
                        For k = 1 To i
                            If InStr(1, xCookie(k), ";", vbBinaryCompare) > 0 Then strTemp = strTemp & Trim(Split(xCookie(k), ";")(0)) & "; " '拼接在一起
                        Next
                        strTemp = Trim$(strTemp)
                        HTTP_GetData = Left$(strTemp, Len(strTemp) - 1)
                    End If
                Case 3: '----------------------------单个cookie,
                    If InStr(1, strTemp, "set-cookie", vbTextCompare) > 0 Then HTTP_GetData = .getResponseHeader("Set-Cookie") '这里如果没有set-cookie将会出现错误
                Case 4: '----------------------------------------------------------编码类型
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
            If ReturnRP <> 4 Then Set oWinHttpRQ = Nothing: Exit Function
        End If
        bResult = .responseBody '按照指定的字符编码显示
        '-获取返回的字节数组 (用于应付可能潜在的网站的编码问题造成的返回结果乱码)
        HTTP_GetData = ByteHandle(bResult, sCharset, IsSave)
    End With
    Set oWinHttpRQ = Nothing
    Exit Function
ErrHandle:
    If Err.Number = -2147012867 Then MsgBox "无法链接服务器", vbCritical, "Warning!"
    isReady = False
    Set oWinHttpRQ = Nothing
End Function
'---------------------------------------https://www.w3school.com.cn/ado/index.asp
Private Function ByteHandle(ByRef bContent() As Byte, ByVal sCharset As String, Optional ByVal IsSave As Boolean) As String
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    Dim oStream As Object
    '----------------------利用adodb将字节转为字符串
    Set oStream = CreateObject("ADODB.Stream")
    With oStream
        .Open
        .type = adTypeBinary
        .Write bContent
        If IsSave = True Then '获取发音
            '-------------------------& Format(Now, "yyyymmddhhmmss") & CStr(RandNumx(10000)) & ".mp3"
            .SaveToFile ThisWorkbook.Path & "\voice.mp3", 2
            .Close
            Set oStream = Nothing
            Exit Function
        End If
        .Position = 0
        .type = adTypeText
        .CharSet = sCharset
         ByteHandle = .ReadText
        .Close
    End With
    Set oStream = Nothing
End Function

Private Sub WriteHtml(ByVal sHtml As String) '将页面信息写到html file
    'https://www.w3.org/TR/DOM-Level-2-HTML/html
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752574%28v%3dvs.85%29
    '----------------------------------------https://ken3memo.hatenablog.com/entry/20090904/1252025888
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752573(v=vs.85)
    Set oHtmlDom = CreateObject("htmlfile")
    With oHtmlDom
        .DesignMode = "on" ' 开启编辑模式(不要直接使用.body.innerhtml=shtml,这样会导致IE浏览器打开)
        .Write sHtml ' 写入数据
    End With
End Sub
