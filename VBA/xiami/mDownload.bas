Attribute VB_Name = "mDownload"
Option Explicit
#If VBA7 Then
Private Declare PtrSafe Function OpenProcess Lib "kernel32" (ByVal dwDesiredAccess As Long, ByVal bInheritHandle As Long, ByVal dwProcessId As Long) As Long
Private Declare PtrSafe Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long
Private Declare PtrSafe Function GetExitCodeProcess Lib "kernel32" (ByVal hProcess As Long, lpExitCode As Long) As Long
Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
Private Declare Function OpenProcess Lib "kernel32" (ByVal dwDesiredAccess As Long, ByVal bInheritHandle As Long, ByVal dwProcessId As Long) As Long
Private Declare Function CloseHandle Lib "kernel32" (ByVal hObject As Long) As Long
Private Declare Function GetExitCodeProcess Lib "kernel32" (ByVal hProcess As Long, lpExitCode As Long) As Long
Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#End If
Private Const PROCESS_QUERY_INFORMATION = &H400
Private Const STILL_ALIVE = &H103
Private Const INFINITE = &HFFFF '(�������Ҫע��, �ȴ���ʱ��)
Public oFso As Object
Public isRunning As Boolean
Public StopFlag As Boolean
Public bPath As String

Function Curl_Downlaod(ByRef arrx() As String, ByRef arrs() As String, ByVal icx As Byte, ByVal sID As String, ByVal sName As String, ByVal sArtist As String, Optional ByVal alldown As Boolean = False) As Boolean
    Dim cdx As New cDownload
    Dim Filepath As String
    Dim i As Byte, k As Byte, p As Byte, j As Byte
    Dim rCount As Byte
    Dim arrbin() As String, iR As Byte
    
    If Len(bPath) = 0 Then bPath = ThisWorkbook.path & "\music_download\"
    icx = icx - 1
    ReDim arrbin(icx)
    cdx.mListcount = icx
    cdx.Array_Initial
    If cdx.isPrepare = False Then Exit Function
    Curl_Downlaod = False
    For i = 0 To icx
        If StopFlag = True Then Exit Function
        Filepath = bPath & CheckRname(sID & "_" & sName & "_" & sArtist & "." & fExtension(arrx(i)))
        cdx.mIndex = i
        p = p + 1
        arrbin(i) = Filepath
        cdx.mDownload arrx(i), Filepath
    Next
    '------------�첽ȫ��һ������
    '------------�ȴ����̽���,�������ʱ�䷢����������
    '------------��ֹ����, ��ֹ���ص��ļ���ȷ, �����Ǵ��������\
    For i = 0 To icx
        Do
            DoEvents
            If StopFlag = True Then Exit Function
            If CheckProgramRun(cdx.List_Index(i), i) = False Then
                If oFso.fileexists(arrbin(i)) = True Then
                    If i = 0 Then
                        If oFso.getfile(arrbin(i)).Size < 10240 Then '����Ŀ���ļ� '�������403forbiddenҲ���ܲ��������ļ�,���Ƿǳ�С
                            If alldown = False Then '�Ƿ�ȫ������'��ȫ�����ص�ʱ��, �����������سɹ���ʧ��
                                k = UBound(arrs)
                                If k > 0 Then
                                    For j = 0 To k
                                        cdx.mIndex = 0
                                        Filepath = bPath & CheckRname(sID & "_" & sName & "_" & sArtist & "." & fExtension(arrs(j)))
                                        cdx.mDownload arrs(j), Filepath
                                        Do
                                            DoEvents
                                            If StopFlag = True Then Exit Function
                                            Sleep 25
                                            If CheckProgramRun(cdx.List_Index(0), 0) = False Then
                                                If oFso.fileexists(Filepath) = True Then
                                                    If oFso.getfile(Filepath).Size > 10240 Then Curl_Downlaod = True: Exit For Else Exit Do
                                                End If
                                            End If
                                            iR = iR + 1
                                            If iR > 20 Then Exit Do
                                        Loop
                                    Next
                                Else
                                    Curl_Downlaod = False
                                    Exit Do
                                End If
                            Else
                                Exit Do
                            End If
                        Else
                            Curl_Downlaod = True
                            Exit Do
                        End If
                    Else
                        Exit Do
                    End If
                Else
                    If i = 0 Then Curl_Downlaod = False
                    Exit Do
                End If
            Else
                rCount = rCount + 1
                If rCount > 20 Then Exit Do '��ֹ����ʱ�����
            End If
        Loop
        rCount = 0
    Next
    Set cdx = Nothing
End Function

Function CheckProgramRun(ByVal pid As Long, ByVal isBig As Byte) As Boolean '�жϳ����Ƿ��ڼ�������
    Dim i As Integer, k As Integer
    Dim ExitCode As Long, hProcess As Long
    Dim Timeout As Integer
    Timeout = IIf(isBig = 0, 600, 60)
    CheckProgramRun = False
    hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, 0, pid)
    If hProcess <> 0 Then
        Do
            If StopFlag = True Then Exit Do
            Sleep 50
            GetExitCodeProcess hProcess, ExitCode
            DoEvents
            i = i + 1
        Loop While ExitCode = STILL_ALIVE And i < Timeout
    End If
    CloseHandle hProcess
    If ExitCode = STILL_ALIVE Then CheckProgramRun = True
End Function

Private Sub endProgress(ByVal pid As Long)
    Shell ("cmd /c taskkill /pid " & CStr(pid) & " /f")
End Sub

Private Function fExtension(ByVal sUrl As String) As String '��չ��
    Dim strTemp As String
    strTemp = Right$(sUrl, Len(sUrl) - InStrRev(sUrl, "."))
    If InStr(1, ".jpg" & "/" & ".webp" & ".jpeg" & "/" & ".png" & "/" & ".trc", strTemp, vbTextCompare) > 0 Then
        strTemp = Right$(sUrl, Len(sUrl) - InStrRev(sUrl, "."))
    Else
        If InStr(1, sUrl, "?", vbBinaryCompare) > 0 Then
            strTemp = Split(sUrl, "?")(0)
            strTemp = Right$(strTemp, Len(strTemp) - InStrRev(strTemp, "."))
        End If
    End If
    fExtension = strTemp
End Function

Private Function CheckRname(ByVal FileName As String) As String '���ļ����еķǷ��ַ��滻��
    Dim Char As String, i As Integer, k As Byte, strx As String, strx2 As String, j As Byte
    '---------------------------------------------------------------------------------------�������漰���ļ�������Ҳ���Ե������ģ��
    i = Len(FileName)
    strx = Right$(FileName, i - InStrRev(FileName, ".") + 1) '����״̬,��չ�� ��: http://*.*.*/*.jpg
    If i > 120 Then i = 119 '���Ƴ���(windowsϵͳ֧��255����ļ�������·��ȫ��)
    k = i - Len(strx)
    strx2 = Left$(FileName, k)
    For j = 1 To k
        Char = Mid$(strx2, j, 1)
        Select Case asc(Char)
              Case asc("/"), asc("\"), asc(":"), asc("*"), asc("?"), asc("<"), asc(">"), asc("|") 'windows ���Ƶ��ַ�
              Char = "-"
              Mid$(strx2, j, 1) = Char '����Щ�ַ�ͳһ�滻��
        End Select
    Next
    strx2 = Replace$(strx2, Chr(34), "", 1, , vbBinaryCompare) '�滻��˫���ź͵�����
    strx2 = Replace$(strx2, Chr(39), "", 1, , vbBinaryCompare)
    CheckRname = strx2 & strx
End Function
