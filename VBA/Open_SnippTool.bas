'@name: Open_SnippTool
'@author: HLA
'@description:
'主要问题出在x64上, 因为system32下的snipp为x64程序, 无法直接访问
'这里作为范例,解决x86 访问 x64的问题
Option Explicit
Private Declare Function LoadLibrary Lib "kernel32.dll" Alias "LoadLibraryA" (ByVal lpLibFileName As String) As Long
Private Declare Function FreeLibrary Lib "kernel32.dll" (ByVal hLibModule As Long) As Long
Private Declare Function GetProcAddress Lib "kernel32.dll" (ByVal hModule As Long, ByVal lLonpProcName As String) As Long
Private Declare Function Wow64DisableWow64FsRedirection Lib "kernel32" (ByRef oldvalue As Long) As Boolean
Private Declare Function Wow64RevertWow64FsRedirection Lib "kernel32" (ByVal oldvalue As Long) As Boolean

'https://www.samlogic.net/articles/sysnative-folder-64-bit-windows.html
'https://docs.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-wow64revertwow64fsredirection
'https://docs.microsoft.com/en-us/windows/win32/winprog64/file-system-redirector?redirectedfrom=MSDN
'http://blog.sina.com.cn/s/blog_792da39c01013bzh.html
'https://www.cnblogs.com/lhglihuagang/p/3930874.html
'这里的问题主要在于x86的程序访问system32下的x64的程序,无法直接访问
Private Function IsSupport(ByVal strDLL As String, strFunctionName As String) As Boolean
    Dim hMod As Long, lPA As Long
    hMod = LoadLibrary(strDLL)
    If hMod Then
        lPA = GetProcAddress(hMod, strFunctionName)
        FreeLibrary hMod
        If lPA Then
            IsSupport = True
        End If
    End If
End Function

Sub OpenSnipp() '打开system32下的snipping截图工具
    Dim fsRedirect As Long
    If IsSupport("Kernel32", "Wow64DisableWow64FsRedirection") = True And IsSupport("Kernel32", "Wow64RevertWow64FsRedirection") = True Then
        fsRedirect = Wow64DisableWow64FsRedirection(fsRedirect)
        If fsRedirect Then
            Shell "c:\windows\system32\SnippingTool.exe", vbNormalFocus
            Wow64RevertWow64FsRedirection fsRedirect
            Exit Sub
        End If
        Shell "c:\windows\system32\SnippingTool.exe"
    End If
End Sub

