VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "cWinHttpRQ"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = False
Option Explicit
Private WithEvents winHttpRq As WinHttp.WinHttpRequest
Attribute winHttpRq.VB_VarHelpID = -1
Private tUrl As String
Private sFilepath As String
Private intx As Integer
Private eFlag As Boolean
Private sFlag As Boolean
Private irst As Byte
Private oStream As Object
Private arrBack() As String
Private xd_mode As Byte
Private isReady As Boolean
#If VBA7 Then
    Private Declare PtrSafe Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
#Else
    Private Declare Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
#End If

Private Sub Class_Initialize()
    eFlag = False
    sFlag = False
    isReady = False
    irst = 0
    Set winHttpRq = CreateObject("winhttp.winhttprequest.5.1")
    Set oStream = CreateObject("ADODB.Stream")
End Sub

Private Sub Class_Terminate()
    Set winHttpRq = Nothing
    Set oStream = Nothing
    If intx = 0 And xd_mode = 0 Then Erase arrBack
End Sub

Friend Property Let Down_Mode(ByVal d_mode As Byte)
    xd_mode = d_mode
End Property

Friend Property Let Url(ByVal sUrl As String)
    tUrl = sUrl
End Property

Friend Property Let backUrl(ByRef arrb() As String) '如果下载失败就从备份链接继续下载
    arrBack = arrb
End Property

Friend Property Let saveFilePath(ByVal sFP As String)
    sFilepath = sFP
End Property

Friend Property Let Index(ByVal i As Integer)
    intx = i
End Property

Friend Property Get IsOK() As Boolean '成功执行
    IsOK = sFlag
End Property

Friend Property Get IsErr() As Boolean '成功执行
    IsErr = eFlag
End Property
'-----------------------------------------------------------class

Private Sub winHttpRq_OnError(ByVal ErrorNumber As Long, ByVal ErrorDescription As String)
   Restart
End Sub

Private Sub winHttpRq_OnResponseDataAvailable(Data() As Byte)
    isReady = True
End Sub

Private Sub winHttpRq_OnResponseFinished()
    If isReady = True Then DataTreat Else Restart
End Sub

Friend Sub Download() '下载文件
    HTTP_GetData "GET", tUrl
End Sub

Friend Sub reDownload(ByVal sUrl As String) '下载文件
    HTTP_GetData "GET", tUrl
End Sub

Private Sub DataTreat(Optional ByVal Cookie As String)
    Dim bResult() As Byte
    bResult = winHttpRq.responseBody
    sFlag = Byte2File(bResult)
End Sub

Private Sub Restart() '重试
    Dim i As Byte, k As Byte
    If irst < 5 Then
'        winHttpRq.abort
        If SafeArrayGetDim(arrBack) = 0 Then
            Download
        Else
            i = UBound(arrBack)
Redo:
            If irst > i Then k = i Else k = irst
            If InStr(1, arrBack(k), "http", vbBinaryCompare) > 0 Then
                reDownload arrBack(k) '失败重试
            Else
                irst = irst + 1
                If irst > i Then eFlag = True: Exit Sub
            GoTo Redo
            End If
        End If
        irst = irst + 1
    Else
        eFlag = True
    End If
End Sub

'-------------------------------------------------------------------------------------------------------------------------------------------通用
Private Function HTTP_GetData(ByVal sVerb As String, ByVal sUrl As String, Optional ByVal RefUrl As String = "https://www.baidu.com", _
Optional ByVal sProxy As String, Optional ByVal sCharset As String = "utf-8", Optional ByVal sPostData As String = "", _
Optional ByVal cType As String = "application/x-www-form-urlencoded", Optional sCookie As String = "", _
Optional ByVal acType As String, Optional ByVal cHost As String, Optional ByVal oRig As String, _
Optional ByVal acLang As String, Optional ByVal acEncode As String, _
Optional ByVal rsTimeOut As Long = 3000, Optional ByVal cTimeOut As Long = 3000, Optional ByVal sTimeOut As Long = 5000, Optional ByVal rcTimeOut As Long = 3000, Optional ByVal IsSave As Boolean) As String

    On Error GoTo ErrHandle
    With winHttpRq
        .Option(6) = 0 '为 True 时，当请求页面重定向跳转时自动跳转，False 不自动跳转，截取服务端返回的302状态
        Select Case sVerb
        Case "GET"
            .Open "GET", sUrl, True '---url, This must be an absolute URL.
        Case "POST"
            .Open "POST", sUrl, False
            .setRequestHeader "Content-Type", cType
        End Select
        If Len(sProxy) > 0 Then '检测格式是否满足要求
            If LCase(sProxy) <> "localhost:8888" Then
                If InStr(sProxy, ":") > 0 And InStr(sProxy, ".") > 0 Then
                    If UBound(Split(sProxy, ".")) = 4 Then .setProxy 2, sProxy
                End If
            Else
                .setProxy 2, sProxy
            End If
        End If
        If Len(acEncode) > 0 Then .setRequestHeader "Accept-Encoding", acEncode
        If Len(acLang) > 0 Then .setRequestHeader "Accept-Language", acLang
        If Len(acType) > 0 Then .setRequestHeader "Accept", acType
        If Len(cHost) > 0 Then .setRequestHeader "Host", cHost
        If Len(oRig) > 0 Then .setRequestHeader "Origin", oRig
        If Len(sCookie) > 0 Then .setRequestHeader "cookie", sCookie
        .setRequestHeader "Referer", RefUrl '伪装从特定的url而来
        .setRequestHeader "User-Agent", Random_UserAgent '伪造浏览器的ua
        If Len(sPostData) > 0 Then
            .send (sPostData)
        Else
            .send
        End If
        If .waitForResponse(10) = False Then Restart 'Stop: eFlag = True: Set winHttpRq = Nothing: Exit Function
        If .Status <> 200 Then Restart 'Stop: eFlag = True: Set winHttpRq = Nothing: Exit Function
    End With
    Exit Function
ErrHandle:
    If Err.Number = -2147012867 Then MsgBox "无法链接服务器", vbCritical, "Warning!"
    eFlag = True
    Set winHttpRq = Nothing
End Function
'---------------------------------------https://www.w3school.com.cn/ado/index.asp
Private Function Byte2String(ByRef bContent() As Byte, ByVal sCharset As String) As String
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    With oStream
        .Open
        .Type = adTypeBinary
        .Write bContent
        .Position = 0
        .Type = adTypeText
        .CharSet = sCharset
         Byte2String = .ReadText
        .Close
    End With
End Function

Private Function Byte2File(ByRef bContent() As Byte) As Boolean
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    
    On Error GoTo ErrHandle
    Byte2File = True
    With oStream
        .Open
        .Type = adTypeBinary
        .Write bContent
        .SaveToFile sFilepath, 2
        .Close
    End With
    Exit Function
ErrHandle:
    Byte2File = False
    eFlag = True
End Function

'-----------------------------------------------------------------------------
Private Function Random_UserAgent() As String '随机浏览器伪装
    Dim i As Byte
    Dim UA As String
    i = 2
    Select Case i
        Case 0: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0"
        Case 1: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36"
        Case 2: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36"
        Case 3: UA = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36"
        Case 4: UA = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.9 Safari/537.36"
        Case 5: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
        Case 6: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"
        Case 7: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100"
        Case 8: UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0"
        Case 9: UA = "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36"
        Case 10: UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
    End Select
    Random_UserAgent = UA
End Function

Private Function Unicode2Character(ByVal strText As String) '将Unicode转为文字
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752599(v=vs.85)
    With CreateObject("htmlfile")
        .Write "<script></script>"
        '--------------------------https://www.w3school.com.cn/jsref/jsref_unescape.asp
        '该函数的工作原理是这样的：通过找到形式为 %xx 和 %uxxxx 的字符序列（x 表示十六进制的数字），用 Unicode 字符 \u00xx 和 \uxxxx 替换这样的字符序列进行解码
        'ECMAScript v3 已从标准中删除了 unescape() 函数，并反对使用它，因此应该用 decodeURI() 和 decodeURIComponent() 取而代之。
        Unicode2Character = .parentWindow.unescape(Replace(strText, "\u", "%u"))
    End With
End Function



