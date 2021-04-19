'@name string_Encode_Decode_with_UTF8
'@author HLA
'https://docs.microsoft.com/en-us/windows/win32/api/Stringapiset/nf-stringapiset-widechartomultibyte
'https://support.microsoft.com/zh-cn/help/138813/how-to-convert-from-ansi-to-unicode-unicode-to-ansi-for-ole
'https://docs.microsoft.com/en-us/windows/win32/intl/unicode
Option Explicit
#If Win64 And VBA7 Then
    Private Declare PtrSafe Function MultiByteToWideChar Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpMultiByteStr As LongPtr, ByVal cchMultiByte As Long, ByVal lpWideCharStr As LongPtr, ByVal cchWideChar As Long) As Long
    Private Declare PtrSafe Function WideCharToMultiByte Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpWideCharStr As LongPtr, ByVal cchWideChar As Long, ByVal lpMultiByteStrPtr As LongPtr, ByVal cchMultiByte As Long, ByVal lpDefaultChar As LongPtr, ByVal lpUsedDefaultChar As LongPtr) As Long
#Else
    Private Declare Function MultiByteToWideChar Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpMultiByteStr As Long, ByVal cchMultiByte As Long, ByVal lpWideCharStr As Long, ByVal cchWideChar As Long) As Long
    Private Declare Function WideCharToMultiByte Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpWideCharStr As Long, ByVal cchWideChar As Long, ByVal lpMultiByteStr As Long, ByVal cchMultiByte As Long, ByVal lpDefaultChar As Long, ByVal lpUsedDefaultChar As Long) As Long
#End If
Private Const CP_ACP As Byte = 0      ' default to ANSI code page
Private Const CP_UTF8 As Long = 65001 ' default to UTF-8 code page

Function EncodeToBytes(ByVal sData As String) As Byte() '字符转 UTF8
    Dim aRetn() As Byte
    Dim nSize As Long
    
    If LenB(sData) = 0 Then Exit Function
    nSize = WideCharToMultiByte(CP_UTF8, 0, StrPtr(sData), -1, 0, 0, 0, 0) - 1
    If nSize = 0 Then Exit Function
    ReDim aRetn(0 To nSize - 1) As Byte
    WideCharToMultiByte CP_UTF8, 0, StrPtr(sData), -1, VarPtr(aRetn(0)), nSize, 0, 0
    EncodeToBytes = aRetn
    Erase aRetn
End Function

Function DecodeToBytes(ByVal sData As String) As Byte() '解码
    Dim aRetn() As Byte
    Dim nSize As Long
    
    If LenB(sData) = 0 Then Exit Function
    nSize = MultiByteToWideChar(CP_UTF8, 0, StrPtr(sData), -1, 0, 0) - 1
    If nSize = 0 Then Exit Function
    ReDim aRetn(0 To 2 * nSize - 1) As Byte
    MultiByteToWideChar CP_UTF8, 0, StrPtr(sData), -1, VarPtr(aRetn(0)), nSize
    DecodeToBytes = aRetn
    Erase aRetn
End Function
