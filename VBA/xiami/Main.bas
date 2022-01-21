Attribute VB_Name = "main"
Option Explicit
Public xmCookie As String
Public tkCookie As String
Public enCookie As Boolean
Public isSec As Boolean
Dim isReady As Boolean
'Public fso As New FileSystemObject
Dim oHtmlDom As Object
#If VBA7 Then
    Private Declare PtrSafe Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
#Else
    Private Declare Function SafeArrayGetDim Lib "oleaut32.dll" (ByRef saArray() As Any) As Long
#End If
#If VBA7 Then
    Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
    Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#End If
#If VBA7 Then
    Private Declare PtrSafe Function timeGetTime Lib "winmm.dll" () As Long 'ʱ�� -����ѵ��
#Else
    Private Declare Function timeGetTime Lib "winmm.dll" () As Long 'ʱ�� -����ѵ��
#End If

Function Get_Cookie() As String
    Dim s As String
    s = HTTP_GetData("GET", "https://www.xiami.com/", ReturnRP:=2)
    If InStr(1, s, "xm_sg_tk", vbBinaryCompare) > 0 Then Get_Cookie = s
End Function

Function Get_Collection_Detail(ByVal sUrl As String, ByVal sID As String) As String() '��ȡ��ϸ��Ϣ 'ByVal sUrl As String, ByVal sID As String
    Const rUrl As String = "https://www.xiami.com/collect/"
    Dim srUrl As String
    Dim sResult As String
    Dim arr() As String
    Dim dic As Object, srDic As Object, sgDic As Object
    Dim item, itemx, itema
    Dim i As Integer, k As Integer, j As Integer, ic As Integer, m As Integer, n As Integer, p As Integer, q As Byte, a As Integer
    Dim strT As String, strTemp As String
    Dim arrx
    
    '��������̫��,��δ������, ֻȡ���е�һ������Ϣ
    '���, ����id, ����, ����, ר������, ר��ͼƬ, ����ͼƬ, ������������
    isReady = True
    srUrl = rUrl & sID
    sResult = HTTP_GetData("GET", sUrl, srUrl)
    If isReady = False Then Exit Function
    Set dic = JsonConverter.ParseJson(sResult)
    Set srDic = dic("resultObj") 'result '
    Set sgDic = srDic("songs")
    i = sgDic.Count - 1
    k = 8: a = 0
    arrx = Array("albumLogoS", "albumLogo", "albumName", "artistLogo", "songId", "songName", "artistName", "length", "listenFiles", "lyricInfo")
    ReDim arr(i, k)
    For Each item In sgDic
         If IsNull(item(arrx(8))) = False Then 'ֻ�������ļ�ʱ�Ż�ȡ��Ϣ, ��ʾ�ļ������ص�ַ��Ϊ��
            Set itemx = item(arrx(8))
            p = itemx.Count
            m = 9
            If p > q Then q = p: k = 8 + q: ReDim Preserve arr(i, k)
            For ic = 1 To p
                If IsNull(itemx.item(ic)("listenFile")) = False Then
                    strTemp = itemx.item(ic)("listenFile")
                    If Len(Trim$(strTemp)) > 0 Then arr(a, m) = strTemp: m = m + 1
                End If
            Next
            For m = 0 To 7
                If IsNull(item(arrx(m))) = False Then
                    strTemp = item(arrx(m))
                    If Len(strTemp) > 0 Then arr(a, m) = strTemp
                End If
            Next
            If IsNull(item(arrx(9))) = False Then
                Set itema = item(arrx(9))
                If IsNull(itema("lyricFile")) = False Then
                    strTemp = itema("lyricFile")
                    If Len(strTemp) > 0 Then arr(a, m) = strTemp
                End If
            End If
            a = a + 1
        End If
    Next
    If a > 0 Then
        ReDim Get_Collection_Detail(i, k)
        Get_Collection_Detail = arr
    End If
    Set dic = Nothing
    Set itema = Nothing
    Set itemx = Nothing
    Set srDic = Nothing
    Set sgDic = Nothing
    Erase arr
End Function

Function Get_Collection_Link(ByVal sID As String) As String '��ȡ�赥����ʵ����
    Const rUrl = "https://www.xiami.com/"
    Const tUrl As String = "https://www.xiami.com/api/collect/getCollectStaticUrl?_q="
    Dim sKey As String
    Dim Sign As String
    Dim sResult As String
    Dim sUrl As String
    Dim srUrl As String
    Dim strTemp As String

    sKey = "{" & Chr(34) & "listId" & Chr(34) & ":" & sID & "}" '
    If Xiami_Pre_Check(sID) = True Then Exit Function
    Sign = Xiami_Sign_Generator(tkCookie, tUrl, sKey)
    '����,˫����,:����
    sKey = UTF8_URLEncoding(sKey)
    sKey = Replace(sKey, "{", "%7B")
    sKey = Replace(sKey, "}", "%7D")
    sKey = Replace(sKey, Chr(34), "%22")
    sUrl = tUrl & sKey & "&_s=" & Sign
    srUrl = rUrl & sID
    sResult = HTTP_GetData("GET", sUrl, srUrl, sCookie:=xmCookie)
    If InStr(1, sResult, "success", vbTextCompare) > 0 Then
        Dim crg As New cRegex
        strTemp = crg.sMatch(sResult, Chr(34) & "http.*?" & Chr(34))
        strTemp = Replace$(strTemp, Chr(34), "")
        Set crg = Nothing
        Get_Collection_Link = strTemp
    Else
        If InStr(1, sResult, "����", vbBinaryCompare) > 0 Then enCookie = False
        If InStr(1, sResult, "x5secdata", vbBinaryCompare) > 0 Then isSec = True
        xmCookie = "": tkCookie = ""
    End If
End Function
'------------------------------------------------------------------------------------------------�赥

Private Function Get_Download_Links(ByVal strText As String) As String()
    Dim dic As Object
    Dim sDic As Object
    Dim dDic As Object
    Dim pDic As Object
    Dim item
    Dim itemx
    Dim itema
    Dim arr() As String
    Dim k As Byte
    Dim strx As String
    
    Set dic = JsonConverter.ParseJson(strText)
    Set sDic = dic("result")
    Set dDic = sDic("data")
    For Each item In dDic.Items
        For Each itemx In item
            Set pDic = itemx("playInfos")
            For Each itema In pDic
                strx = itema("listenFile")
                If InStr(1, strx, "http", vbBinaryCompare) > 0 Then
                    ReDim Preserve arr(k)
                    arr(k) = strx
                    k = k + 1
                End If
            Next
        Next
    Next
    If k > 0 Then
        ReDim Get_Download_Links(k - 1)
        Get_Download_Links = arr
    End If
    Set dic = Nothing
    Set pDic = Nothing
    Set sDic = Nothing
    Set dDic = Nothing
End Function

Function Xiami_Song_Download_Links(ByVal sID As String) As String() '��ȡ��������������
    Dim sKey As String
    Dim Sign As String
    Dim sResult As String
    Dim sUrl As String
    Dim strTemp As String
    Dim arr() As String
    Const rUrl = "https://www.xiami.com/"
    Const tUrl As String = "https://www.xiami.com/api/song/getPlayInfo?_q="
    'Ϻ�״����¼��ް�Ȩ����Ʒ, �������404����
    
    sKey = "{" & Chr(34) & "songIds" & Chr(34) & ":[" & sID & "]}"
    If Xiami_Pre_Check(sID) = True Then Exit Function
    Sign = Xiami_Sign_Generator(tkCookie, tUrl, sKey)
    '����,˫����,:����
    sKey = UTF8_URLEncoding(sKey)
    sKey = Replace(sKey, "{", "%7B")
    sKey = Replace(sKey, "}", "%7D")
    sKey = Replace(sKey, Chr(34), "%22")
    sUrl = tUrl & sKey & "&_s=" & Sign
    sResult = HTTP_GetData("GET", sUrl, rUrl, sCookie:=xmCookie)  '�ȵ�json��ʽ������
    If InStr(1, sResult, "success", vbTextCompare) > 0 Then
        arr = Get_Download_Links(sResult)
        ReDim Xiami_Song_Download_Links(UBound(arr))
        Xiami_Song_Download_Links = arr
    Else
        If InStr(1, sResult, "����", vbBinaryCompare) > 0 Then enCookie = False
        If InStr(1, sResult, "x5secdata", vbBinaryCompare) > 0 Then isSec = True
        xmCookie = "": tkCookie = ""
    End If
End Function

Sub kdkkf()
'Dim fl As TextStream
'Dim fso As New FileSystemObject
'Dim arr() As String
'
'Dim i As Integer
'Dim sf As String
'xmCookie = ""
'If Len(xmCookie) = 0 Then
'Set fl = fso.OpenTextFile("C:\Users\adobe\Desktop\p.txt", ForReading, False, TristateUseDefault)
'xmCookie = fl.ReadAll
'fl.Close
'Set fl = Nothing
'Set fso = Nothing
'End If
'tkCookie = "8ad28de6c73e9eb9c9d465a35e6e6b6b_1587553092746"
'Xiami_Search "�������"
'arr = Xiami_Song_Download_Link("391208")
'
'Dim arrvar() As New cWinHttpRQ
'i = UBound(arr)
'ReDim arrvar(i)
'
'For i = 0 To i
'With arrvar(i)
'    .Index = i
'    .Url = arr(i)
'    sf = ThisWorkbook.Path & "\" & CStr(i) & "." & FileExten(arr(i), 1)
'    .saveFilePath = sf
'    .Download
'    Do Until .IsOK = True
'    If .IsErr = True Then Exit Do
'        DoEvents
'    Loop
'End With
'
'Next
'
'Erase arrvar
'If SafeArrayGetDim(arr) = 0 Then MsgBox 2
End Sub

Function Get_Search_Detail(ByVal strText As String) As String() '��ȡ��ϸ��Ϣ 'ByVal sUrl As String, ByVal sID As String
    Dim srUrl As String
    Dim sResult As String
    Dim arr() As String
    Dim dic As Object, srDic As Object, sgDic As Object
    Dim item, itema, aDic As Object
    Dim i As Integer, k As Integer, j As Integer, ic As Integer, m As Integer, n As Integer, p As Integer, q As Byte, a As Byte, b As Byte
    Dim strTemp As String
    Dim arrx
    
    Set dic = JsonConverter.ParseJson(strText)
    Set srDic = dic("result") 'result 'resultObj
    Set aDic = srDic("data")
    Set sgDic = aDic("songs")
    i = sgDic.Count - 1
    k = 8: a = 0
    arrx = Array("albumLogoS", "albumLogo", "albumName", "artistLogo", "songId", "songName", "artistName", "length", "lyricInfo", "songStatus") '
    ReDim arr(i, k)
    For Each item In sgDic
        If item(arrx(9)) = 0 Then '��ʾ���׸��״̬���ڿ���
            For m = 0 To 7
                If IsNull(item(arrx(m))) = False Then
                    strTemp = item(arrx(m))
                    If Len(strTemp) > 0 Then arr(a, m) = strTemp
                End If
            Next
            If IsNull(item(arrx(8))) = False Then
                Set itema = item(arrx(8))
                If IsNull(itema("lyricFile")) = False Then
                    strTemp = itema("lyricFile")
                    If Len(strTemp) > 0 Then arr(a, m) = strTemp
                End If
            End If
            a = a + 1
        End If
    Next
    If a > 0 Then
        ReDim Get_Search_Detail(i, k)
        Get_Search_Detail = arr
    End If
    Set dic = Nothing
    Set aDic = Nothing
    Set itema = Nothing
    Set srDic = Nothing
    Set sgDic = Nothing
    Erase arr
End Function

'��������songstatus:7����2,���޷�����, ֻ��0 ��ʱ���������
Function Xiami_Search(ByVal Keyword As String, Optional ByVal sType As Byte = 0) As String() '��������, ��������,ר������,�赥����
    Const sUrl As String = "https://www.xiami.com/api/search/searchSongs?_q="
    Const arUrl As String = "https://www.xiami.com/api/search/searchArtists?_q="
    Const alUrl As String = "https://www.xiami.com/api/search/searchAlbums?_q="
    Const cUrl As String = "https://www.xiami.com/api/search/searchCollects?_q"
    Dim sKey As String
    Dim Sign As String
    Dim sResult As String
    Dim tUrl As String
    Dim arr() As String
    'ע��ʹ�õ�ת�뷽ʽ,https://www.cnblogs.com/qlqwjy/p/9934706.html
    'encodeURIComponent
    'encodeURI
    'application.encodeurlʵ������encodeurlcomponent����
    Select Case sType
        Case 1: tUrl = arUrl
        Case 2: tUrl = cUrl
        Case 3: tUrl = alUrl
        Case Else: tUrl = sUrl
    End Select
    If Xiami_Pre_Check(Keyword) = True Then Exit Function
    sKey = "{" & Chr(34) & "key" & Chr(34) & ":" & Chr(34) & Keyword & Chr(34) & "," & Chr(34) & "pagingVO" & Chr(34) & ":{" & Chr(34) & "page" & Chr(34) & ":1," & Chr(34) & "pageSize" & Chr(34) & ":30}}"
    Sign = Xiami_Sign_Generator(tkCookie, tUrl, sKey)
    '����,˫����,:����
    sKey = UTF8_URLEncoding(sKey)
    sKey = Replace(sKey, "{", "%7B")
    sKey = Replace(sKey, "}", "%7D")
    sKey = Replace(sKey, Chr(34), "%22")
    tUrl = tUrl & sKey & "&_s=" & Sign
    sResult = HTTP_GetData("GET", tUrl, "https://www.xiami.com/", sCookie:=xmCookie) '�ȵ�json��ʽ������
    If InStr(1, Left$(sResult, 30), "success", vbTextCompare) = 0 Then
        If InStr(1, sResult, "����", vbBinaryCompare) > 0 Then enCookie = False
        If InStr(1, sResult, "x5secdata", vbBinaryCompare) > 0 Then isSec = True
        xmCookie = "": tkCookie = "" '�ж�Ŀǰ��cookie�Ƿ񻹿���
        Exit Function '�ж�������Ч���ݷ���
    End If
    arr = Get_Search_Detail(sResult)
    Xiami_Search = arr
    Erase arr
'--------------------------------------------------------------------------------------------------------------------
'    -��������ǻ�ȡ��һ��ֵ, �������id,��ʹ�������Ϊ����
'    Dim Regx As New cRegex
'    Dim arrTemp() As String
'    arr = Regx.xMatch(sResult, Chr(34) & "songId" & Chr(34) & ":+[\d]{6,}") '"songId":1770188126
'    Dim i As Integer
'    i = UBound(arr)
'    ReDim arrTemp(i)
'    For k = 0 To 1
'    arrTemp(i) = Trim(Split(arr(i), ":")(1))
'    Next
'    Xiami_Search = arrTemp
'    Set Regx = Nothing
'    -���߽�ƥ����ʽ�޸�Ϊ
'    sPartten=chr(40) & chr(34) & "songID" & chr(34) &chr(41) & ":"& chr(40) &"+[\d]{6,}" & chr(41)
'    ʹ��Submatch��������, ����Ҫsplit
End Function

Private Function Xiami_Pre_Check(ByVal strText As String) As Boolean '���������������������, ���cookie�Ƿ��ȡ�ɹ�
    Dim i As Byte
    If InStr(1, strText, Chr(34), vbBinaryCompare) > 0 Then
        i = 1
    ElseIf InStr(1, strText, "}", vbBinaryCompare) > 0 Then
        i = 1
    ElseIf InStr(1, strText, "{", vbBinaryCompare) > 0 Then
        i = 1
    End If
    If i = 1 Then MsgBox "���������ַ�", vbInformation, "Tips": Exit Function
    If Xiami_Cookie_Generator = False Then Xiami_Pre_Check = True: MsgBox "��ȡcookieʧ��", vbCritical + vbInformation, "Warning": Exit Function
End Function

Private Function Xiami_Cookie_Generator() As Boolean 'Ϻ������cookie��ȡ
    'ע��cookie��ʹ������,���cookieʧЧ��Ҫ���»�ȡcookie
    Const rUrl As String = "https://www.xiami.com/"
    isReady = True
    If Len(tkCookie) = 0 Then
        xmCookie = HTTP_GetData("GET", "https://www.xiami.com/", ReturnRP:=2)
        If isReady = True Then tkCookie = Split(Split(xmCookie, "; ")(2), "=")(1)
    End If
    Xiami_Cookie_Generator = isReady
End Function

Private Function Xiami_Sign_Generator(ByVal tCookie As String, ByVal pUrl As String, ByVal qStr As String) As String  'Ϻ��sign����
    '��Ҫ����cookie���ƽ�sign�ķ�ʽ���ܻ�ȡ���ӿڵ���Ϣ
    'cookie��xm_sg_tkֵ�ĵ�һ����
    '84c38dbe9481c68a787a781f8534545f_1586662991803, 84c38dbe9481c68a787a781f8534545f�ⲿ��
    '����:"_xmMain_"
    '����: ����url���� https://www.xiami.com/api/favorite/getFavorites, ��"/api/favorite/getFavorites"
    '�������ݵ�_qֵ
    'sign=getmd5hash_string(xm_sg_tk(0) &"_xmMain_"& "/api/favorite/getFavorites" & _q)
    '-------------------------��ǩ����ʽ����������Ϻ��ҳ��
    '�����������Ӳ���Ҫcookie
    Dim strText As String
    If InStr(1, tCookie, "_", vbBinaryCompare) Then tCookie = Split(tCookie, "_")(0)
    If InStr(1, pUrl, "https://www.xiami.com/", vbBinaryCompare) > 0 Then
        pUrl = Split(pUrl, "https://www.xiami.com")(1)
        If InStr(1, pUrl, "?", vbBinaryCompare) > 0 Then pUrl = Split(pUrl, "?")(0)
    End If
    strText = tCookie & "_xmMain_" & pUrl & "_" & qStr
    Xiami_Sign_Generator = LCase(GetMD5Hash_String(strText))
End Function

'---------------------------------------------------------------------------------------------
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
    On Error GoTo ErrHandle
    If LCase$(Left$(sUrl, 4)) <> "http" Then isReady = False: MsgBox "���Ӳ��Ϸ�", vbCritical, "Warning": Exit Function
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
        If .Status <> 200 Then isReady = False: Set oWinhttpRq = Nothing: Exit Function
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
        HTTP_GetData = ByteHandle(bResult, sCharset, IsSave, sUrl)
    End With
    Set oWinhttpRq = Nothing
    Exit Function
ErrHandle:
    If Err.Number = -2147012867 Then MsgBox "�޷����ӷ�����", vbCritical, "Warning!"
    isReady = False
    Set oWinhttpRq = Nothing
End Function
'---------------------------------------https://www.w3school.com.cn/ado/index.asp
Private Function ByteHandle(ByRef bContent() As Byte, ByVal sCharset As String, Optional ByVal IsSave As Boolean, _
Optional ByVal hUrl As String, Optional ByVal idname As String, Optional ByVal sName As String, Optional ByVal arname As String, Optional ByVal imode As Byte) As String
    Const adTypeBinary As Byte = 1
    Const adTypeText As Byte = 2
    Const adModeRead As Byte = 1
    Const adModeWrite As Byte = 2
    Const adModeReadWrite As Byte = 3
    Dim oStream As Object
    Dim folderpath As String
    Dim Filepath As String
    '----------------------����adodb���ֽ�תΪ�ַ���
    Set oStream = CreateObject("ADODB.Stream")
    With oStream
        .Open
        .Type = adTypeBinary
        .Write bContent
        If IsSave = True Then '��ȡ�ļ�
            If Len(bPath) = 0 Then bPath = ThisWorkbook.path & "\"
'            filepath = bPath & idname & "_" & sname & "_" & "_" & arname & "." & FileExten(hUrl, imode)
'            filepath = CheckRname(filepath)
             Filepath = bPath & "test.exe"
            .SaveToFile Filepath, 2
            .Close
            Set oStream = Nothing
            Exit Function
        End If
        .Position = 0
        .Type = adTypeText
        .CharSet = sCharset
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
        Unicode2Character = .parentWindow.unescape(Replace(strText, "\u", "%u"))
    End With
End Function

Private Function RandNumx(ByVal numx As Long) As Long '���������'https://docs.microsoft.com/zh-cn/office/vba/language/reference/user-interface-help/randomize-statement
    Randomize (Timer)
    RandNumx = Int((numx - 0 + 1) * Rnd + 0)
End Function

Function Cookie_Generator(ByVal Url As String) As String 'ͨ��ie����ȡ��cookie
    'https://docs.microsoft.com/en-us/previous-versions//aa768363(v=vs.85)?redirectedfrom=MSDN
    'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa752066%28v%3dvs.85%29
    Dim IE As Object
    Dim iCookie As String
    Dim t As Long
    Dim rt As Byte
    
    On Error Resume Next
    Set IE = CreateObject("InternetExplorer.Application")
    If IE Is Nothing Then Exit Function '��ֹ���ִ���
    With IE
        .Visible = False
        .Silent = True
Redo:
        .Navigate Url
        t = timeGetTime
        Do While .readyState <> 4 And timeGetTime - t < 4500
            DoEvents
        Loop
        .Refresh2 3 'ǿ����ջ���ˢ��,�Բ����µ�cookie
        Do While .readyState <> 4 And timeGetTime - t < 4000
            DoEvents
        Loop
        iCookie = .Document.Cookie
        If Len(iCookie) > 0 Then
            If InStr(iCookie, "xm_sg_tk") = 0 Then
                If rt < 3 Then rt = rt + 1: GoTo Redo
            Else
                Cookie_Generator = iCookie
            End If
        Else
            If rt < 3 Then rt = rt + 1: GoTo Redo
        End If
        .Quit
    End With
    Set IE = Nothing
End Function
