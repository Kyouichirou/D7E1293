Attribute VB_Name = "Security_Check"
Option Explicit
'获取/提交验证码
'此站点居于IP判断验证码的有效性
'一次获取, 可以使用几个小时(大概超过3个小时)

Function get_check_code(ByVal pNumber As String) As Boolean
    Dim pdata As String
    Const r As String = "https://www.chdtp.com/pages/xtgl/chcode/visitorCheckChcode.jsp"
    Const url As String = "https://www.chdtp.com/webs/getVisitorChcodeAction.action"
    Dim result As String
    
    pdata = "ywlx=05&sjhm=" + pNumber
    result = HTTP_Request.HTTP_GetData("POST", url, r, sPostData:=pdata)
    If (result = "sendsucc") Then
        get_check_code = True
    Else
        Debug.Print (result)
    End If
End Function

Function set_security_code(ByVal pNumber As String, ByVal code As String) As Boolean
    Const r As String = "https://www.chdtp.com/pages/xtgl/chcode/visitorCheckChcode.jsp"
    Const url As String = "https://www.chdtp.com/webs/checkVisitorChcodeAction.action"
    Dim pdata As String
    Dim result As String
    
    pdata = "securitycode=" + code + "&ywlx=05&sjhm=" + pNumber
    result = HTTP_Request.HTTP_GetData("POST", url, r, sPostData:=pdata)
    If (result = "checksucc") Then
        set_security_code = True
    Else
        Debug.Print (result)
    End If
End Function
