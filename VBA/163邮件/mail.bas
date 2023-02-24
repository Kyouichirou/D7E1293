Attribute VB_Name = "mail"
Option Explicit
'Private Declare Function timeGetTime Lib "winmm.dll" () As Long '时间api可以精确到毫秒
'Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#If Win64 And VBA7 Then
    Private Declare PtrSafe Function timeGetTime Lib "winmm.dll" () As Long '时间api可以精确到毫秒
 Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
    Private Declare Function timeGetTime Lib "winmm.dll" () As Long '时间api可以精确到毫秒
 Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#End If

'登陆邮箱
'参数 un, 邮箱账号; pw, 邮箱密码
Sub main1()
Application.ScreenUpdating = False
If Sheet1.Range("c2") = "" Or Sheet1.Range("c4") = "" Then MsgBox "请在下载范围和邮件是否下载选择相应下拉选项。": Exit Sub
Sheet1.Unprotect ""
Sheet1.Range("a6:g30").ClearContents

Dim isunread As Boolean, isdownattach As Boolean


If Sheet1.Range("c2") = "未读" Then
isunread = True
Else
isunread = False
End If

If Sheet1.Range("c4") = "是" Then
isdownattach = True

Else
isdownattach = False
End If



main "", ""
get_mail Sheet1.Range("c3").text, isunread, isdownattach, True
   
   
    Rows("6:30").Select
    Range("B6").Activate
    Selection.RowHeight = 22.5
   Sheet1.Range("b6").Select
   Sheet1.Protect ""
    MsgBox "完成"
  Application.ScreenUpdating = True
End Sub

Function main(ByVal un As String, ByVal pw As String) As Boolean
    Dim timestamp As String, tk As String, rtid As String, cookie As String, reg As Object, utid As String
    Dim c As String, l As String, sid As String, t As Long
    
    rtid = get_rtid()
    c = get_Cookie(rtid, cookie)
    
    If (Len(c) = 0) Then MsgBox "初始化失败", vbCritical, "警告": Exit Function
    
    cookie = cookie + c
    tk = get_tk(un, cookie, rtid)
    
    If (Len(tk) = 0) Then
        MsgBox "获取tk值失败", vbCritical, "警告"
        Exit Function
    End If
    
    Set reg = CreateObject("VBScript.RegExp")
    tk = get_match(reg, "\w{5,}", tk)
    
    If (Len(tk) = 0) Then MsgBox "获取tk值失败", vbCritical, "警告": Exit Function
    
    t = timeGetTime
    
    Do While timeGetTime - t < 1500
        DoEvents
        Sleep 25
    Loop
    
    l = Log(un, pw, rtid, tk, cookie)
    
    If Len(l) = 0 Then MsgBox "登录邮箱失败", vbCritical, "警告": Exit Function
    
    cookie = cookie + "starttime=;" + l
    
    cookie = Enter(cookie, reg, sid)
    
    If (Len(cookie) > 0) Then
        main = True
        ThisWorkbook.Sheets("setting").Cells(3, 1).Value = sid
       writeCookie cookie
'      MsgBox "登陆邮箱成功", vbInformation, "提示"
    Else
'        MsgBox "登陆邮箱失败", vbCritical, "提示"
    End If
End Function

'获取邮件,
'keyword, 关键词;
'isunread, 未读邮件;
'isdownattach, 是否下载附件;
'iscontent, 是否同时获取邮件正文的内容;
'rIndex,写入表格的位置;
Function get_mail(Optional ByVal keyword As String, Optional ByVal isunread As Boolean, Optional ByVal isdownattach As Boolean, _
Optional ByVal iscontent As Boolean, Optional ByVal rindex As Long = 6, Optional ByVal sP As Long = 0, Optional ByVal eP As Long = 20) As Boolean
    Dim arr() As String, cookie As String, sid As String, bI As Long
    
    
    

    
    
    cookie = get_Cookie_fromText()
    sid = ThisWorkbook.Sheets("setting").Cells(3, 1).Value
    
    If (Len(cookie) = 0 Or Len(sid) = 0) Then MsgBox "输入内容有误", vbInformation, "提示": Exit Function
    
    bI = rindex
    If (isunread = True) Then
        arr = get_unRead_mail(cookie, sid, sP, eP, keyword, rindex)
    Else
        arr = read_All(cookie, sid, sP, eP, keyword, rindex)
    End If
    On Error Resume Next
    Dim i As Long, k As Long
    i = UBound(arr)
    If (Err.Number > 0) Then Exit Function
    Dim tp As Long
    If (isdownattach = True) Then
        Dim at() As String, m As Long
        For k = 1 To i
            If arr(k, 6) = "true" And Sheet1.Cells(k + 5, 8) = "是" Then
                at = read_Detail(cookie, sid, arr(k, 1))
                m = UBound(at)
                If (Err.Number > 0) Then
                    Debug.Print (arr(k, 1) + "下载附件失败")
                Else
                    For tp = 1 To m
                       down_Attachment cookie, sid, arr(k, 1), at(tp, 2), at(tp, 1)

                    Next
                End If
            End If
        Next
    End If
    
    If (iscontent = True) Then
        Dim html As String
        For k = 1 To i
            html = read_Mail(cookie, arr(k, 1), sid)
            If (Len(html) > 0) Then ThisWorkbook.Sheets("mail").Cells(bI, 7).Value = parse_Mail(html)
            bI = bI + 1
        Next
    End If
'    MsgBox "读取邮件成功", vbInformation, "提示"
End Function

'读取未读邮件
'参数: sid, 邮箱id; sP, 读取邮件的起始编号; eP, 读取邮件的数量上限; keyword, 是否包含关键词
Function get_unRead_mail(ByVal cookie As String, ByVal sid As String, ByVal sP As Long, ByVal eP As Long, ByVal keyword As String, ByVal rindex As Long) As String()
    Dim url As String, ref As String, ce As New cEncode_Decode, pdata As String, sxml As String, dq As String
    
    url = "https://mail.163.com/js6/s?sid=" + sid + "&func=mbox:listMessages"
    ref = "https://mail.163.com/js6/main.jsp?sid=" + sid + "&df=mail163_letter"
    
    dq = ChrW$(34)
    
    pdata = "<?xml version=" + dq + "1.0" + dq + _
    "?><object><object name=" + dq + "filter" + dq + "><object name=" + dq + "flags" + dq + _
    "><boolean name=" + dq + "read" + dq + ">false</boolean></object></object><string name=" + dq + "order" + dq + _
    ">date</string><boolean name=" + dq + "desc" + dq + ">true</boolean><array name=" + dq + "fids" + dq + _
    "><int>1</int><int>3</int><int>18</int><int>259</int><int>257</int><int>261</int><int>258</int><int>260</int></array><int name=" + dq + "limit" + dq + _
    ">" + CStr(eP) + "</int><int name=" + dq + "start" + dq + ">" + CStr(sP) + "</int><boolean name=" + dq + "skipLockedFolders" + dq + _
    ">true</boolean><boolean name=" + dq + "returnTag" + dq + _
    ">true</boolean><boolean name=" + dq + "returnTotal" + dq + _
    ">true</boolean></object>"
    
    pdata = "var=" + ce.Url_EncodeComponent(pdata)
    
    sxml = HTTP_GetData("POST", url, ref, sPostData:=pdata, sCookie:=cookie, _
    isNoCache:=True, acLang:="zh-CN;en-US,en;q=0.9", acType:="application/xml", cHost:="mail.163.com", _
    isKeeplive:=True, oRig:="https://mail.163.com")
    
    If (Len(sxml) = 0) Then MsgBox "读取未读邮件失败", vbInformation, "提示": Exit Function
    get_unRead_mail = xml.string_To_xml(sxml, rindex, keyword, eP)
End Function

'读取全部邮件
'参数: sid, 邮箱id; sP, 读取邮件的起始编号; eP, 读取邮件的数量上限
Function read_All(ByVal cookie As String, ByVal sid As String, ByVal sP As Long, ByVal eP As Long, ByVal keyword As String, ByVal rindex As Long) As String()
    Dim url As String, ref As String, pdata As String, sxml As String, dq As String, ce As New cEncode_Decode
    
    url = "https://mail.163.com/js6/s?sid=" + sid + "&func=mbox:listMessages"
    ref = "https://mail.163.com/js6/main.jsp?sid=" + sid + "&df=mail163_letter"
    
    dq = ChrW$(34)
    
    pdata = "<?xml version=" + dq + "1.0" + dq + _
    "?><object><int name=" + dq + "fid" + dq + ">1</int><string name=" + dq + "order" + dq + _
    ">date</string><boolean name=" + dq + "desc" + dq + ">true</boolean><int name=" + dq + "limit" + dq + _
    ">" + CStr(eP) + "</int><int name=" + dq + "start" + dq + ">" + CStr(sP) + "</int><boolean name=" + dq + "skipLockedFolders" + dq + _
    ">false</boolean><string name=" + dq + "topFlag" + dq + ">top</string><boolean name=" + dq + "returnTag" + dq + _
    ">true</boolean><boolean name=" + dq + "returnTotal" + dq + ">true</boolean></object>"
    
    pdata = "var=" + ce.Url_EncodeComponent(pdata)
    
    sxml = HTTP_GetData("POST", url, ref, sPostData:=pdata, sCookie:=cookie, _
    isNoCache:=True, acLang:="zh-CN;en-US,en;q=0.9", acType:="application/xml", cHost:="mail.163.com", _
    isKeeplive:=True, oRig:="https://mail.163.com")
    
    If (Len(sxml) = 0) Then MsgBox "读取未读邮件失败", vbInformation, "提示": Exit Function
    read_All = xml.string_To_xml(sxml, rindex, keyword, eP)
End Function

'读取单一邮件的具体信息, 如附件名称, 附件id等
'正文中的富媒体文件也将以附件的形式出现
'参数: sid, 邮箱id; mid, 邮件id
Function read_Detail(ByVal cookie As String, ByVal sid As String, ByVal mid As String) As String()
    Dim url As String, sxml As String, dq As String
    Dim pdata As String, ref As String, ce As New cEncode_Decode
    
    dq = ChrW$(34)
    
    pdata = "<?xml version=" + dq + "1.0" + dq + "?><object><string name=" + _
            dq + "id" + dq + ">" + mid + "</string><boolean name=" + _
            dq + "header" + dq + ">true</boolean><boolean name=" + _
            dq + "returnImageInfo" + dq + ">true</boolean><boolean name=" + _
            dq + "returnAntispamInfo" + dq + ">true</boolean><boolean name=" + _
            dq + "autoName" + dq + ">true</boolean><object name=" + dq + "returnHeaders" + dq + _
            "><string name=" + dq + "Resent-From" + dq + ">A</string><string name=" + _
            dq + "Sender" + dq + ">A</string><string name=" + dq + "List-Unsubscribe" + dq + _
            ">A</string><string name=" + dq + "Reply-To" + dq + ">A</string><string name=" + dq + "From" + dq + _
            "></string></object><boolean name=" + dq + "supportTNEF" + dq + ">true</boolean></object>"
    url = "https://mail.163.com/js6/s?sid=" + sid + "&func=mbox:readMessage"
    ref = "https://mail.163.com/js6/main.jsp?sid=" + sid + "&df=mail163_letter"
    
    pdata = "var=" + ce.Url_EncodeComponent(pdata)
    
    sxml = HTTP_GetData("POST", url, ref, sPostData:=pdata, sCookie:=cookie, _
    isNoCache:=True, acLang:="zh-CN;en-US,en;q=0.9", acType:="application/xml", cHost:="mail.163.com", _
    isKeeplive:=True)
    If (Len(sxml) = 0) Then Debug.Print ("读取邮件附件信息失败"): Exit Function
    read_Detail = xml.get_Attach(sxml)
End Function

'读取邮件正文
'参数: mid, 邮件id; sid, 邮箱ID
Function read_Mail(ByVal cookie As String, ByVal mid As String, ByVal sid As String) As String
    Dim url As String, ref As String
    
    url = "https://mail.163.com/js6/read/readhtml.jsp?mid=" + mid + "&userType=undefined&font=15&color=0c8b1b"
    ref = "https://mail.163.com/js6/main.jsp?sid=" + sid + "&df=mail163_letter"
    
    read_Mail = HTTP_GetData("GET", url, ref, sCookie:=cookie, _
    isNoCache:=True, acLang:="zh-CN;en-US,en;q=0.9", acType:="application/xml", cHost:="mail.163.com", _
    isKeeplive:=True)
End Function

'下载附件
Sub down_Attachment(ByVal cookie As String, ByVal sid As String, ByVal mid As String, ByVal filename As String, ByVal id As String)
    Dim url As String, ref As String
    
    url = "https://mail.163.com/js6/read/readdata.jsp?sid=" + sid + "&mid=" + mid + "&part=" + id + "&mode=download&l=read&action=download_attach"
    ref = "https://mail.163.com/js6/main.jsp?sid=" + sid + "&df=mail163_letter"

    


    HTTP_GetData "GET", url, ref, sCookie:=cookie, dFilename:=filename
End Sub


Sub downattch()
Dim i As Integer
Dim endrow As Integer

If Sheet1.Cells(4, 3) = "是" Then
endrow = Sheet1.Range("a65536").End(xlUp).Row


If Application.WorksheetFunction.CountA(Sheet1.Range("a6:a50")) = 0 Then
MsgBox "请首先下载投标单位列表后点击下载邮件附件": Exit Sub
End If


If Application.WorksheetFunction.CountA(Sheet1.Range("h6:h" & endrow)) = 0 Then
MsgBox "请在是否下载附件处选择需要下载的邮件": Exit Sub
End If


               For i = 6 To endrow
                   If Sheet1.Cells(i, 8) = "是" Then d_Attachment Sheet1.Cells(i, 1)
                   
        
              Next
              
  Else
   MsgBox "抱歉，您没有下载投标附件的权限。": Exit Sub
 End If
 MsgBox "下载附件完成"
End Sub
'单独下载附件
'参数: mid, 邮件id
Sub d_Attachment(ByVal mid As String)
    Dim cookie As String, sid As String
    
    cookie = get_Cookie_fromText()
    sid = ThisWorkbook.Sheets("setting").Cells(3, 1).Value
    
    If (Len(cookie) = 0 Or Len(sid) = 0) Then MsgBox "输入内容有误", vbInformation, "提示": Exit Sub
    
    Dim at() As String, m As Long, tp As Long
    at = read_Detail(cookie, sid, mid)
    m = UBound(at)
    If (Err.Number > 0) Then
        Debug.Print (mid + "下载附件失败")
    Else
        For tp = 1 To m
            down_Attachment cookie, sid, mid, at(tp, 2), at(tp, 1)
        Next
    End If
End Sub

'---------------------------------------------------------------------------------------------------------------------
'解析邮件, 获取到正文内容
'参数, 邮件内容正文的html
Private Function parse_Mail(ByRef html As String) As String
    Dim ohtml As Object, content As Object
    
    Set ohtml = WriteHtml(html)
    Set content = ohtml.getElementById("content")
    If content Is Nothing Then
        Debug.Print ("未读取到邮件正文")
    Else
        parse_Mail = content.innerText
    End If
End Function

Private Function get_match(ByRef reg As Object, ByRef sPattern As String, ByRef rText As String) As String
    Dim Matches As Object
    Dim a As String

    reg.Pattern = sPattern
    Set Matches = reg.Execute(rText)
    If (Matches.Count = 0) Then Exit Function
    get_match = Matches(0).Value
End Function

Private Function get_Cookie(ByVal rtid As String, ByRef cookie As String) As String
    Dim url As String, ref As String
    Dim mgid As String, eurl As String, rpText As String
    
    cookie = "utid=" + get_rtid() + ";"
    
    mgid = Get_Timestamp() + "." + get_rand_num(4)
    
    url = "https://dl.reg.163.com/dl/ini?pd=mail163&pkid=CvViHzl&pkht=mail.163.com&channel=0&topURL=https://mail.163.com/&rtid=" + rtid + "&nocache=" + Get_Timestamp()
    
    ref = "https://dl.reg.163.com/webzj/v1.0.1/pub/index_dl2_new.html?cd=%2F%2Fmimg.127.net" + _
    "%2Fp%2Ffreemail%2Findex%2Funified%2Fstatic%2F2020%2F%2Fcss%2F&cf=urs.163.4944934a.css&MGID=" + mgid + "&wdaId=&pkid=CvViHzl&product=mail163"
    
    get_Cookie = HTTP_GetData("GET", url, ref, ReturnRP:=2, sCookie:=cookie, cType:="application/json", _
    cHost:="dl.reg.163.com", isKeeplive:=True, rpText:=rpText, acType:="*/*")
    If (InStr(1, rpText, "201", vbBinaryCompare) = 0) Then get_Cookie = ""  'acEncode:="gzip, deflate"
End Function

Private Sub writeCookie(ByRef cookie As String)
    ThisWorkbook.Sheets("cookie").Cells(1, 1).Value = cookie
End Sub

Private Function get_Cookie_fromText() As String
    get_Cookie_fromText = ThisWorkbook.Sheets("cookie").Cells(1, 1).Value
End Function

Private Function get_tk(ByVal un As String, ByVal cookie As String, ByVal rtid As String) As String
    Dim url As String, mgid As String, ref As String, rpText As String, ced As New cEncode_Decode
    
    url = "https://dl.reg.163.com/dl/gt?un=" + ced.Url_EncodeComponent(un) + "&pkid=CvViHzl&pd=mail163&channel=0&topURL=" + _
    "https%3A%2F%2Fmail.163.com%2F" + "&rtid=" + rtid + "&nocache=" + Get_Timestamp()
    
    mgid = Get_Timestamp() + "." + get_rand_num(4)
    
    ref = "https://dl.reg.163.com/webzj/v1.0.1/pub/index_dl2_new.html?cd=%2F%2Fmimg.127.net" + _
    "%2Fp%2Ffreemail%2Findex%2Funified%2Fstatic%2F2020%2F%2Fcss%2F&cf=urs.163.4944934a.css&MGID=" + mgid + "&wdaId=&pkid=CvViHzl&product=mail163"

    rpText = HTTP_GetData("GET", url, ref, sCookie:=cookie, _
    cType:="application/json", cHost:="dl.reg.163.com", acType:="*/*")
    
    get_tk = rpText
    'If (InStr(1, rpText, dq + "201" + dq, vbBinaryCompare) = 0) Then get_tk = ""
End Function

Private Function get_rtid() As String
    Dim js As String, dq As String
    
    dq = ChrW$(34)
    
    js = "function createUtid() {" + _
            "var e = " + dq + "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" + dq + ", t = 32, i = [];" + _
            "for (; t-- > 0; ) i[t] = e.charAt(Math.random() * e.length);" + _
            "return i.join(" + dq + dq + ");" + _
        "}"
    js = js + "createUtid();"
    get_rtid = CreateObject("htmlfile").parentwindow.eval(js)
End Function

Private Function Get_Timestamp() As String
    Get_Timestamp = CreateObject("htmlfile").parentwindow.eval("new Date().getTime()")
End Function

Private Function rsa_encrypt(ByVal pw As String) As String
    Dim sResult As String, dq As String
    
    dq = ChrW$(34)
    sResult = ThisWorkbook.Sheets("code").Cells(1, 1).Value
    sResult = sResult + "encrypt2(" + dq + pw + dq + ");"
    rsa_encrypt = CreateObject("htmlfile").parentwindow.eval(sResult)
End Function


Private Function Log(ByVal un As String, ByVal pw As String, ByVal rtid As String, ByVal tk As String, ByVal cookie As String) As String
    Const url As String = "https://dl.reg.163.com/dl/l"
    Dim pdata As String, mgid As String, ref As String, time As String, rpText As String, dq As String
    
    mgid = Get_Timestamp() + "." + get_rand_num(4)
    
    ref = "https://dl.reg.163.com/webzj/v1.0.1/pub/index_dl2_new.html?cd=%2F%2Fmimg.127.net" + _
    "%2Fp%2Ffreemail%2Findex%2Funified%2Fstatic%2F2020%2F%2Fcss%2F&cf=urs.163.4944934a.css&MGID=" + mgid + "&wdaId=&pkid=CvViHzl&product=mail163"
    
    dq = ChrW$(34)
    
    pdata = "{" + dq + "un" + dq + ":" + dq + un + dq + "," + _
    dq + "pw" + dq + ":" + dq + rsa_encrypt(pw) + dq + "," + dq + "pd" + dq + ":" + dq + "mail163" + dq + "," + _
    dq + "l" + dq + ":" + "0," + dq + "d" + dq + ":10," + dq + "t" + dq + ":" + Get_Timestamp() + "," + _
    dq + "pkid" + dq + ":" + dq + "CvViHzl" + dq + "," + dq + "domains" + dq + ":" + dq + dq + "," + dq + "tk" + dq + ":" + _
    dq + tk + dq + "," + dq + "pwdKeyUp" + dq + ":1," + dq + _
    "channel" + dq + ":0," + dq + "topURL" + dq + ":" + dq + "https://mail.163.com/" + dq + "," + _
    dq + "rtid" + dq + ":" + dq + rtid + dq + "}"
    
    Log = HTTP_GetData("POST", url, ref, sCookie:=cookie, cType:="application/json", sPostData:=pdata, ReturnRP:=2, isKeeplive:=True, _
    isNoCache:=True, cHost:="dl.reg.163.com", acType:="*/*", _
    acLang:="zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2", rpText:=rpText, isPRA:=True, acEncode:="gzip, deflate")
End Function

Private Function Enter(ByVal cookie As String, ByRef reg As Object, ByRef sid As String) As String
    Const url As String = "https://mail.163.com/entry/cgi/ntesdoor?", ref As String = "https://mail.163.com/"
    Dim pdata As String
    Dim rpText As String, dq As String
    
    dq = ChrW$(34)
    
    pdata = "{" + _
                dq + "style" + dq + ":" + dq + "-1" + dq + "," + _
                dq + "df" + dq + ":" + dq + "mail163_letter" + dq + "," + _
                dq + "allssl" + dq + ":" + dq + "true" + dq + "," + _
                dq + "net" + dq + ":" + dq + dq + "," + _
                dq + "language" + dq + ":" + dq + "-1" + dq + "," + _
                dq + "from" + dq + ":" + dq + "web" + dq + "," + _
                dq + "race" + dq + ":" + dq + dq + "," + _
                dq + "iframe" + dq + ":" + dq + "1" + dq + "," + _
                dq + "url2" + dq + ":" + dq + "https://mail.163.com/errorpage/error163.htm" + dq + "," + _
                dq + "product" + dq + ":" + dq + "mail163" + dq + _
            "}"
            
    Enter = HTTP_GetData("POST", url, ref, sPostData:=pdata, sCookie:=cookie, _
    isKeeplive:=True, ReturnRP:=2, cHost:="mail.163.com", rpText:=rpText, RedirectURL:=True)
    
    If (InStr(1, rpText, "sid=", vbTextCompare) = 0) Then
        Enter = ""
    Else
        sid = get_match(reg, "sid=\w+", rpText)
        If (Len(sid) = 0) Then Enter = "": Exit Function
        sid = mid$(sid, 5)
        Enter = Enter + "Coremail.sid=" + sid + ";"
    End If
End Function

Private Function get_rand_num(ByVal num As Long) As String
    Dim js As String, dq As String
    
    dq = ChrW$(34)
    
    js = "function createUtid() {" + _
            "var e = " + dq + "0123456789" + dq + ", t = " + CStr(num) + ", i = [];" + _
            "for (; t-- > 0; ) i[t] = e.charAt(Math.random() * e.length);" + _
            "return i.join(" + dq + dq + ");" + _
        "}"
    js = js + "createUtid();"
    get_rand_num = CreateObject("htmlfile").parentwindow.eval(js)
End Function

