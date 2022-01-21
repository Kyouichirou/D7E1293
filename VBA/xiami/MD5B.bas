Attribute VB_Name = "MD5B"
Option Explicit
Option Base 0
    Private Type MD5_CTX
        z(1) As Long
        buf(3) As Long
        inc(63) As Byte
        digest(15) As Byte
    End Type
'----------------------------------------------------------------------------------'Any 类型是有风险的
'http://www.vbgood.com/article-2386.html
' LongPtr 不是真正的数据类型，因为它在 32 位环境中会转换为 Long，或在 64 位环境中会转换为 LongLong。 使用 LongPtr 能够编写在 32 位和 64 位环境中均可运行的可移植代码。 将 LongPtr 用于指针和句柄。
'https://docs.microsoft.com/en-us/previous-versions/windows/desktop/legacy/aa366535(v=vs.85)
#If VBA7 Then
    Private Declare PtrSafe Sub MD5Init Lib "Cryptdll.dll" (ByVal pContex As LongPtr)
    Private Declare PtrSafe Sub MD5Final Lib "Cryptdll.dll" (ByVal pContex As LongPtr)
    '-------------------将数据设置longptr才能在64位office下使用，https://docs.microsoft.com/zh-cn/office/vba/Language/reference/user-interface-help/longptr-data-type
    Private Declare PtrSafe Sub MD5Update Lib "Cryptdll.dll" (ByVal pContex As LongPtr, ByVal lPtr As LongPtr, ByVal nSize As LongPtr)
#Else
    Private Declare Sub MD5Init Lib "Cryptdll.dll" (ByVal pContex As Long)
    Private Declare Sub MD5Final Lib "Cryptdll.dll" (ByVal pContex As Long)
    Private Declare Sub MD5Update Lib "Cryptdll.dll" (ByVal pContex As Long, ByVal lPtr As Long, ByVal nSize As Long)
#End If
 
Private Function ConvBytesToBinaryString(bytesIn() As Byte) As String
    Dim z As Long
    Dim nSize As Long
    Dim strRet As String
    
    nSize = UBound(bytesIn)
    For z = 0 To nSize
         strRet = strRet & Right$("0" & Hex(bytesIn(z)), 2)
    Next
    ConvBytesToBinaryString = strRet
End Function
 
Private Function GetMD5Hash(bytesIn() As Byte) As Byte()
    Dim ctx As MD5_CTX
    Dim nSize As Long
    
    nSize = UBound(bytesIn) + 1
    MD5Init VarPtr(ctx)
    MD5Update ByVal VarPtr(ctx), ByVal VarPtr(bytesIn(0)), nSize
    MD5Final VarPtr(ctx)
    GetMD5Hash = ctx.digest
End Function

Private Function GetMD5Hash_Bytes(bytesIn() As Byte) As String
    GetMD5Hash_Bytes = ConvBytesToBinaryString(GetMD5Hash(bytesIn))
End Function

Function GetMD5Hash_String(ByVal strIn As String, Optional ByVal cType As Byte = 0) As String        '字符串md5
    Dim Bytes() As Byte
    '------------------这里以utf8为准
    Select Case cType
        Case 1: Bytes = StrConv(strIn, vbFromUnicode) 'ansi
        Case 2: Bytes = strIn                         'unicode
        Case Else: Bytes = EncodeToBytes(strIn)       'utf-8
    End Select
    GetMD5Hash_String = GetMD5Hash_Bytes(Bytes) '
End Function

