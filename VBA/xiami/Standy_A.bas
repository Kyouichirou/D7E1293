Attribute VB_Name = "Standy_A"
'Option Explicit
'
'Function DownloadFileA(ByVal Url As String, ByVal filepath As String) As Boolean '非api的方式下载文件
'    Dim arrHttp() As Variant, startpos As Long, FileName As String
'    Dim j As Integer, t As Long, xi As Variant, ThreadCount As Byte, i As Byte, p As Byte, endpos As Long
'    Dim ado As Object, ohttp As Object, Filesize As Long, strx As String, remaindersize As Long, blockSize As Long, upbound As Byte
'
'    ThreadCount = 4 '假装多线程
'    xi = Split(Url, "/")
'    FileName = xi(UBound(xi)) '获取文件名
'    FileName = CheckRname(FileName) '修正获取到的文件名(因为可能包含非法的字符)
'    If Left(filepath, 1) <> "\" Then filepath = filepath & "\" '文件存放位置
'    Set ohttp = CreateObject("msxml2.serverxmlhttp")
'    '-------------------------------------------------https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ms766431(v=vs.85)?redirectedfrom=MSDN
'    Set ado = CreateObject("adodb.stream")
'    If ohttp Is Nothing Or ado Is Nothing Then DownloadFileA = False: Exit Function
'    With ado
'        .type = 1 '返回的数据类型 adTypeBinary  =1 adTypeText  =2
'        .mode = 3
'        .Open
'    End With
'
'    With ohttp
'        .Open "Head", Url, True
'        .send
'        Do While .readyState <> 4 And j < 256 '在这里需要注意 ,要限制循环的次数,防止在这里形成死循环
'            DoEvents
'            j = j + 1
'            Sleep 25
'        Loop
'        If .readyState <> 4 Then DownloadFileA = False: GoTo 100
'        Filesize = .getResponseHeader("Content-Length") '获得文件大小
'        .abort
'    End With
'
'    strx = filepath & "TmpFile" '临时文件
'    fso.CreateTextFile(strx, True, False).Write (Space(Filesize)) '创建一个大小相同的空文件/提前占据磁盘的位置
'    ado.LoadFromFile (strx)
'    blockSize = Fix(Filesize / ThreadCount)
'    '--------------------fix函数---https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/int-fix-functions
'    remaindersize = Filesize - ThreadCount * blockSize
'    upbound = ThreadCount - 1
'
'    ReDim arrHttp(upbound) '定义包含msxml2.xmlhttp对象的数组,·成员数量便是“线程”数
'
'    For i = 0 To upbound
'        startpos = i * blockSize
'        endpos = (i + 1) * blockSize - 1
'        If i = upbound Then endpos = endpos + remaindersize
'        Set arrHttp(i) = CreateObject("msxml2.xmlhttp")
'        With arrHttp(i)
'            .Open "Get", Url, True
'            '分段下载
'            .setRequestHeader "Range", "bytes=" & startpos & "-" & endpos
'            .send
'        End With
'    Next
'
'    Do
'        t = timeGetTime
'        Do While timeGetTime - t < 300
'            DoEvents
'            Sleep 25 '不要完全使用sleep, sleep会将整个进程都挂起
'        Loop
'        For i = 0 To upbound
'            If arrHttp(i).readyState = 4 Then
'                '每个模块下载完毕就将其写入临时文件的相应位置
'                ado.Position = i * blockSize
'                ado.Write arrHttp(i).responseBody
'                arrHttp(i).abort
'                p = p + 1
'            End If
'        Next
'        If p = ThreadCount Then Exit Do
'    Loop
'    filepath = filepath & FileName
'    If fso.fileexists(filepath) Then fso.DeleteFile (filepath)
'    fso.DeleteFile (strx)
'    ado.SaveToFile (filepath)
'    '--------------------------https://docs.microsoft.com/en-us/office/client-developer/access/desktop-database-reference/savetofile-method-ado?redirectedfrom=MSDN
'    DownloadFileA = True
'100
'    Set otthp = Nothing
'    Set ado = Nothing
'End Function
'

'Sub lldl()
'
'    Dim strOutput As String, Jsfilepath As String
'    Dim WshShell As Object, WshShellExec As Object
'    '-------------------------------------------------------------需要注意txt文件是不锁定的在打开的状态,所以可以自由控制txt文档
'
'    Jsfilepath = "C:\Users\adobe\Documents\cUrl_32\bin\curl.exe"
'    Jsfilepath = """" & Jsfilepath & """"""
'    Filepath = "C:\Users\adobe\Documents\cUrl_32\bin\t.txt"
'    Filepath = """" & Filepath & """"""
'    Url = "https://www.baidu.com"
'    Url = """" & Url & """"
'    strCommand = Jsfilepath & " -o " & Filepath & " " & Url
'    Set WshShell = CreateObject("WScript.Shell")
'    Set WshShellExec = WshShell.Exec(strCommand)
'    strOutput = WshShellExec.ProcessID     '返回执行的结果,如果文件处于打开的状态就有返回值,否则就是空值
'    Debug.Print strOutput
'    Set WshShell = Nothing
'    Set WshShellExec = Nothing
'
'End Sub
