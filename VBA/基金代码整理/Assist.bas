Attribute VB_Name = "Assist"
Option Explicit
#If VBA7 Then
    Private Declare PtrSafe Function GetSystemWow64Directory Lib "Kernel32.dll" Alias "GetSystemWow64DirectoryA" (ByVal lpBuffer As String, ByVal uSize As Long) As Long
#Else
    Private Declare Function GetSystemWow64Directory Lib "Kernel32.dll" Alias "GetSystemWow64DirectoryA" (ByVal lpBuffer As String, ByVal uSize As Long) As Long
#End If
#If VBA7 Then
Private Declare PtrSafe Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" _
    (ByVal hwnd As Long, ByVal lpOperation As String, ByVal lpFile As String, _
    ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
#Else
Private Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" _
    (ByVal hwnd As Long, ByVal lpOperation As String, ByVal lpFile As String, _
    ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
#End If
Dim wsh As Object
'除了某些区域,部分情况下x64的office32位 也能读取大部分的注册表
'https://docs.microsoft.com/en-us/windows/win32/winprog64/shared-registry-keys
'这里的HKEY_LOCAL_MACHINE r64Keypath必须是x64的office才能访问在x64系统的时候
'补充写入wps "et.exe"
'64位的excel也不能往该制定键值写入数据， 需要获得管理员的权限才能，包括wmi
Private Const w32Keypath As String = "HKEY_CURRENT_USER\Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION\et.exe"
Private Const r32Keypath As String = "HKEY_CURRENT_USER\Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION\Excel.exe" '32-32/64-32系统注册表的位置
Private Const r64Keypath As String = "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\MAIN\FeatureControl\FEATURE_BROWSER_EMULATION\Excel.exe" '64位的office必须写入这里
Private Const r32Key64path As String = "HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Internet Explorer\MAIN\FeatureControl\FEATURE_BROWSER_EMULATION\Excel.exe" '64位系统32位office注册表的位置
    
Private Function Is64Bit() As Boolean '获取系统是否为x64
    Dim DirPath As String, Result As Long
    DirPath = Space(255)
    Is64Bit = False
    Result = GetSystemWow64Directory(DirPath, 255)
    If Len(Result) = 0 Then Is64Bit = True
End Function

Private Function RegRead(ByVal Is64 As Boolean, Optional ByVal IsWPS As Boolean) As Boolean '注册表. 判断注册表是否存在, 内中的值是否满足要求
    Dim path As String
    Dim arrx
    Dim s As String, i As Byte
    On Error Resume Next
    RegRead = False
    arrx = Array("9000", "9999", "10000", "10001", "11000")
    If IsWPS = False Then
        If Is64 = True Then
            path = r64Keypath
        Else
            path = r32Keypath
        End If
    Else
        path = w32Keypath
    End If
    s = wsh.RegRead(path) '读取到的是10进制的数据, 转为16进制在进行比较
    If Len(s) > 0 Then
        s = ThisWorkbook.Application.WorksheetFunction.Dec2Hex(s)
        For i = 0 To 4
            If InStr(s, arrx(i)) > 0 Then RegRead = True: Exit For '读取到满足要求的值
        Next
    End If
End Function

Private Function RegWrite(ByVal Is64 As Boolean, ByVal KeyV As String, Optional ByVal IsWPS As Boolean) As Boolean '写入注册表
    Dim path As String
    Dim i As Long
    Dim vbspath As String
    Dim obj As Object
    
    On Error GoTo errhandle
    RegWrite = True
    KeyV = ThisWorkbook.Application.WorksheetFunction.Hex2Dec(KeyV) '将对应的值转为对应的值
    If IsWPS = False Then
        If Is64 = True Then
            vbspath = ThisWorkbook.path & "\IE.vbs"
            Set obj = CreateObject("Scripting.FileSystemObject")
            If obj.fileexists(vbspath) = False Then Set obj = Nothing: RegWrite = False: Exit Function
            i = ShellExecute(0, "runas", "wscript.exe", vbspath & " " & KeyV, 0, 1)
            If i = 5 Then RegWrite = False
            Set obj = Nothing
            Exit Function
        Else
            path = r32Keypath
        End If
    Else
        path = w32Keypath
    End If
    wsh.RegWrite path, KeyV, "REG_DWORD" '此方法不适合用于写入x64的注册表
    Exit Function
errhandle:
    RegWrite = False
End Function

Function RegControl() As Boolean
    Dim xBit As Boolean, xWPS As Boolean
    Dim Key As String
    Dim x As Double
    
    xBit = CheckExcel64
    RegControl = True
    Set wsh = CreateObject("WScript.Shell")
    x = IEVersion(False)
    If x = 0 Then RegControl = False: Exit Function '浏览器的版本达不到要求
    If x < 10 Then
        Key = "9000"
    ElseIf x >= 10 And x < 11 Then
        Key = "10000"
    Else
        Key = "11000"
    End If
    xWPS = CheckWPS
    If RegRead(xBit, xWPS) = False Then RegControl = RegWrite(xBit, Key, xWPS)
    Set wsh = Nothing
End Function

Private Function CheckWPS() As Boolean '检查是否为wps
    CheckWPS = False
    If LCase(Right(ThisWorkbook.Application.Caption, 5)) = "wps表格" Then CheckWPS = True
End Function

Private Function CheckExcel64() As Boolean '判断Excel是x86还是x64
    Dim xi As Long
    CheckExcel64 = False
    On Error GoTo errhandle
    xi = ThisWorkbook.Application.Hinstance
    Exit Function
errhandle:
    CheckExcel64 = True
End Function

Function IEVersion(ByVal cm As Boolean) As Double '获取IE浏览器的版本
    Dim strx As String
    Dim regstr As String
    Dim i As Double
    
    On Error Resume Next
    IEVersion = 0
    If cm = True Then Set wsh = CreateObject("WScript.Shell")
    regstr = "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\svcUpdateVersion" '读取注册表,win7/win8.1 ,IE浏览器更新版本,win10的情况不清楚
    strx = Trim(wsh.RegRead(regstr))
    If Len(strx) < 2 Then Exit Function
    i = CDbl(Left(strx, 2))
    If i > 8 Then IEVersion = i
    If cm = True Then Set wsh = Nothing
End Function


