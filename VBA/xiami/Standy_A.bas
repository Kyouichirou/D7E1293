Attribute VB_Name = "Standy_A"
'Option Explicit
'
'Function DownloadFileA(ByVal Url As String, ByVal filepath As String) As Boolean '��api�ķ�ʽ�����ļ�
'    Dim arrHttp() As Variant, startpos As Long, FileName As String
'    Dim j As Integer, t As Long, xi As Variant, ThreadCount As Byte, i As Byte, p As Byte, endpos As Long
'    Dim ado As Object, ohttp As Object, Filesize As Long, strx As String, remaindersize As Long, blockSize As Long, upbound As Byte
'
'    ThreadCount = 4 '��װ���߳�
'    xi = Split(Url, "/")
'    FileName = xi(UBound(xi)) '��ȡ�ļ���
'    FileName = CheckRname(FileName) '������ȡ�����ļ���(��Ϊ���ܰ����Ƿ����ַ�)
'    If Left(filepath, 1) <> "\" Then filepath = filepath & "\" '�ļ����λ��
'    Set ohttp = CreateObject("msxml2.serverxmlhttp")
'    '-------------------------------------------------https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ms766431(v=vs.85)?redirectedfrom=MSDN
'    Set ado = CreateObject("adodb.stream")
'    If ohttp Is Nothing Or ado Is Nothing Then DownloadFileA = False: Exit Function
'    With ado
'        .type = 1 '���ص��������� adTypeBinary  =1 adTypeText  =2
'        .mode = 3
'        .Open
'    End With
'
'    With ohttp
'        .Open "Head", Url, True
'        .send
'        Do While .readyState <> 4 And j < 256 '��������Ҫע�� ,Ҫ����ѭ���Ĵ���,��ֹ�������γ���ѭ��
'            DoEvents
'            j = j + 1
'            Sleep 25
'        Loop
'        If .readyState <> 4 Then DownloadFileA = False: GoTo 100
'        Filesize = .getResponseHeader("Content-Length") '����ļ���С
'        .abort
'    End With
'
'    strx = filepath & "TmpFile" '��ʱ�ļ�
'    fso.CreateTextFile(strx, True, False).Write (Space(Filesize)) '����һ����С��ͬ�Ŀ��ļ�/��ǰռ�ݴ��̵�λ��
'    ado.LoadFromFile (strx)
'    blockSize = Fix(Filesize / ThreadCount)
'    '--------------------fix����---https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/int-fix-functions
'    remaindersize = Filesize - ThreadCount * blockSize
'    upbound = ThreadCount - 1
'
'    ReDim arrHttp(upbound) '�������msxml2.xmlhttp���������,����Ա�������ǡ��̡߳���
'
'    For i = 0 To upbound
'        startpos = i * blockSize
'        endpos = (i + 1) * blockSize - 1
'        If i = upbound Then endpos = endpos + remaindersize
'        Set arrHttp(i) = CreateObject("msxml2.xmlhttp")
'        With arrHttp(i)
'            .Open "Get", Url, True
'            '�ֶ�����
'            .setRequestHeader "Range", "bytes=" & startpos & "-" & endpos
'            .send
'        End With
'    Next
'
'    Do
'        t = timeGetTime
'        Do While timeGetTime - t < 300
'            DoEvents
'            Sleep 25 '��Ҫ��ȫʹ��sleep, sleep�Ὣ�������̶�����
'        Loop
'        For i = 0 To upbound
'            If arrHttp(i).readyState = 4 Then
'                'ÿ��ģ��������Ͼͽ���д����ʱ�ļ�����Ӧλ��
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
'    '-------------------------------------------------------------��Ҫע��txt�ļ��ǲ��������ڴ򿪵�״̬,���Կ������ɿ���txt�ĵ�
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
'    strOutput = WshShellExec.ProcessID     '����ִ�еĽ��,����ļ����ڴ򿪵�״̬���з���ֵ,������ǿ�ֵ
'    Debug.Print strOutput
'    Set WshShell = Nothing
'    Set WshShellExec = Nothing
'
'End Sub
