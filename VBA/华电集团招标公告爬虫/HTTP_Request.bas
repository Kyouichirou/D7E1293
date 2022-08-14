Attribute VB_Name = "HTTP_Request"
Option Explicit

Function HTTP_GetData(ByVal sVerb As String, ByVal sUrl As String, Optional ByVal RefUrl As String = "https://www.baidu.com", _
Optional ByVal sProxy As String, Optional ByVal sCharset As String = "utf-8", Optional ByVal cCharset As Boolean = False, Optional ByVal sPostData As String = "", _
Optional ByVal cType As String = "application/x-www-form-urlencoded", Optional sCookie As String = "", _
Optional ByVal acType As String, Optional ByVal cHost As String, Optional ByVal oRig As String, _
Optional ByVal acLang As String, Optional ByVal xReqw As String, Optional ByVal acEncode As String, _
Optional ByVal rsTimeOut As Long = 3000, Optional ByVal cTimeOut As Long = 3000, Optional ByVal sTimeOut As Long = 5000, Optional ByVal rcTimeOut As Long = 3000, Optional ByVal IsSave As Boolean) As String
    Dim oWinhttpRq As Object
    Dim bResult() As Byte
    Dim strTemp  As String

    On Error GoTo ErrHandle
    Set oWinhttpRq = CreateObject("WinHttp.WinHttpRequest.5.1")
    With oWinhttpRq
        .Option(4) = &H3300 '取消证书安全提醒
        .Option(6) = 0
        .setTimeouts rsTimeOut, cTimeOut, sTimeOut, rcTimeOut
        Select Case sVerb
        Case "GET"
            .Open "GET", sUrl, False
        Case "POST"
            .Open "POST", sUrl, False
            .setRequestHeader "Content-Type", cType
        End Select
        If Len(sProxy) > 0 Then
            If LCase(sProxy) <> "localhost:8888" Then
                If InStr(sProxy, ":") > 0 And InStr(sProxy, ".") > 0 Then
                    If UBound(Split(sProxy, ".")) = 3 Then .setProxy 2, sProxy
                End If
            Else
                .setProxy 2, sProxy
            End If
        End If
        If Len(xReqw) > 0 Then .setRequestHeader "X-Requested-With", xReqw
        If Len(acEncode) > 0 Then .setRequestHeader "Accept-Encoding", acEncode
        If Len(acLang) > 0 Then .setRequestHeader "Accept-Language", acLang
        If Len(acType) > 0 Then .setRequestHeader "Accept", acType
        If Len(cHost) > 0 Then .setRequestHeader "Host", cHost
        If Len(oRig) > 0 Then .setRequestHeader "Origin", oRig
        If Len(sCookie) > 0 Then .setRequestHeader "cookie", sCookie
        .setRequestHeader "Referer", RefUrl
        .setRequestHeader "User-Agent", Random_UserAgent(False)
        If Len(sPostData) > 0 Then
            .send (sPostData)
        Else
            .send
        End If
        '判断错误代码, 来判断错误的类型
        If .Status <> 200 Then
            If (.Status = 302) Then
                MsgBox "验证过期, 请刷新验证"
            Else
                MsgBox "错误: " + CStr(.Status)
            End If
            Set oWinhttpRq = Nothing: Exit Function
        End If
        '指定字符集的类型, 一般默认utf-8即可
        If cCharset = True Then
            strTemp = .getAllResponseHeaders
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
        End If
        bResult = .responseBody
        HTTP_GetData = Byte2String(bResult, sCharset)
    End With
    Set oWinhttpRq = Nothing
    Exit Function
ErrHandle:
    If Err.Number = -2147012867 Then MsgBox "无法链接服务器", vbCritical, "Warning!"
    Set oWinhttpRq = Nothing
End Function

Private Function Byte2String(ByRef bContent() As Byte, ByVal sCharset As String) As String
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    Dim oStream As Object

    Set oStream = CreateObject("ADODB.Stream")
    With oStream
        .Open
        .Type = adTypeBinary
        .Write bContent
        .Position = 0
        .Type = adTypeText
        .Charset = sCharset
         Byte2String = .ReadText
        .Close
    End With
    Set oStream = Nothing
End Function

Private Function Random_UserAgent(ByVal IsMobile As Boolean, Optional ByVal ForceIE As Boolean = False) As String
    Dim i As Byte
    Dim UA As String

    i = RandNumx(10)
    If ForceIE = True Then
        UA = "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko"
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
    Random_UserAgent = UA
End Function

Private Function RandNumx(ByVal numx As Long) As Long
    Randomize
    RandNumx = Int((numx - 0 + 1) * Rnd + 0)
End Function
'生成dom对象
Function WriteHtml(ByRef sHtml As String) As Variant
    Dim oHtmlDom As Object
    
    Set oHtmlDom = CreateObject("htmlfile")
    With oHtmlDom
        .DesignMode = "on"
        .Write sHtml
    End With
    Set WriteHtml = oHtmlDom
End Function
