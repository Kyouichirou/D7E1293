Attribute VB_Name = "MD5B"
Option Explicit
Option Base 0
    Private Type MD5_CTX
        z(1) As Long
        buf(3) As Long
        inc(63) As Byte
        digest(15) As Byte
    End Type
'----------------------------------------------------------------------------------'Any �������з��յ�
'http://www.vbgood.com/article-2386.html
' LongPtr �����������������ͣ���Ϊ���� 32 λ�����л�ת��Ϊ Long������ 64 λ�����л�ת��Ϊ LongLong�� ʹ�� LongPtr �ܹ���д�� 32 λ�� 64 λ�����о������еĿ���ֲ���롣 �� LongPtr ����ָ��;����
'https://docs.microsoft.com/en-us/previous-versions/windows/desktop/legacy/aa366535(v=vs.85)
#If VBA7 Then
    Private Declare PtrSafe Sub MD5Init Lib "Cryptdll.dll" (ByVal pContex As LongPtr)
    Private Declare PtrSafe Sub MD5Final Lib "Cryptdll.dll" (ByVal pContex As LongPtr)
    '-------------------����������longptr������64λoffice��ʹ�ã�https://docs.microsoft.com/zh-cn/office/vba/Language/reference/user-interface-help/longptr-data-type
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

Function GetMD5Hash_String(ByVal strIn As String, Optional ByVal cType As Byte = 0) As String        '�ַ���md5
    Dim Bytes() As Byte
    '------------------������utf8Ϊ׼
    Select Case cType
        Case 1: Bytes = StrConv(strIn, vbFromUnicode) 'ansi
        Case 2: Bytes = strIn                         'unicode
        Case Else: Bytes = EncodeToBytes(strIn)       'utf-8
    End Select
    GetMD5Hash_String = GetMD5Hash_Bytes(Bytes) '
End Function

