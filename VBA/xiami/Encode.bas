Attribute VB_Name = "Encode"
Option Explicit

#If Win64 And VBA7 Then
    Private Declare PtrSafe Function MultiByteToWideChar Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpMultiByteStr As LongPtr, ByVal cchMultiByte As Long, ByVal lpWideCharStr As LongPtr, ByVal cchWideChar As Long) As Long
    Private Declare PtrSafe Function WideCharToMultiByte Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpWideCharStr As LongPtr, ByVal cchWideChar As Long, ByVal lpMultiByteStrPtr As LongPtr, ByVal cchMultiByte As Long, ByVal lpDefaultChar As LongPtr, ByVal lpUsedDefaultChar As LongPtr) As Long
#Else
    Private Declare Function MultiByteToWideChar Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpMultiByteStr As Long, ByVal cchMultiByte As Long, ByVal lpWideCharStr As Long, ByVal cchWideChar As Long) As Long
    Private Declare Function WideCharToMultiByte Lib "kernel32 " (ByVal CodePage As Long, ByVal dwFlags As Long, ByVal lpWideCharStr As Long, ByVal cchWideChar As Long, ByVal lpMultiByteStr As Long, ByVal cchMultiByte As Long, ByVal lpDefaultChar As Long, ByVal lpUsedDefaultChar As Long) As Long
#End If
Private Const CP_ACP = 0 ' default to ANSI code page
Private Const CP_UTF8 = 65001 ' default to UTF-8 code page

'×Ö·û×ª UTF8
Function EncodeToBytes(ByVal sData As String) As Byte() ' Note: Len(sData) > 0
    Dim aRetn() As Byte
    Dim nSize As Long
    nSize = WideCharToMultiByte(CP_UTF8, 0, StrPtr(sData), -1, 0, 0, 0, 0) - 1
    If nSize = 0 Then Exit Function
    ReDim aRetn(0 To nSize - 1) As Byte
    WideCharToMultiByte CP_UTF8, 0, StrPtr(sData), -1, VarPtr(aRetn(0)), nSize, 0, 0
    EncodeToBytes = aRetn
    Erase aRetn
End Function
