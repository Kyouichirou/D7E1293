'@name string_AlgorithmRSA
'@author HLA
'@description
'rsa 非对称加密/解密
Option Explicit
'更多细节参数还需要进一步细化
'---------------https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.rsaencryptionpadding?view=netframework-4.8
Private Const RSA As String = "System.Security.Cryptography.RSACryptoServiceProvider"
Dim objRSA As Object

Function AlgorithmRSA(ByVal strText As String, ByVal IsEncrypt As Boolean, Optional ByVal privateKey As String) As String() '选择加密或者解密
    Dim arr() As String
    Dim publicKey As String
    
    If Len(strText) = 0 Then Exit Function
    If IsEncrypt = True Then
        ReDim arr(2)
        ReDim AlgorithmRSA(2)
        '--------------https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.rsa.fromxmlstring?redirectedfrom=MSDN&view=netframework-4.8
        With objRSA
            publicKey = .ToXmlString(False) '产生公钥
            privateKey = .ToXmlString(True) '产生公钥和私钥
        End With
        arr(1) = publicKey
        arr(2) = privateKey
        arr(0) = Encrypt(strText, publicKey) '公钥加密
    Else
        If Len(privateKey) = 0 Then Exit Function
        ReDim arr(0)
        ReDim AlgorithmRSA(0)
        arr(0) = Decrypt(strText, privateKey) '私钥解密
    End If
    AlgorithmRSA = arr
End Function

Private Function Encrypt(ByVal strText As String, ByVal publicKey As String) As String
    Dim Bytes() As Byte
    Dim Hash() As Byte
    Dim Result As String
    Dim i As Integer, k As Integer
    '--------------------https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.rsa.encrypt?view=netframework-4.8
    Bytes = strText
    objRSA.FromXmlString publicKey
    Hash = objRSA.Encrypt(Bytes, False)
    i = UBound(Hash)
    For k = 0 To i
        Result = Result & Right$("00" & Hex(Hash(k)), 2)
    Next
    Encrypt = Result
End Function

Private Function Decrypt(ByVal strText As String, ByVal privateKey As String) As String
    Dim bLen As Integer
    Dim Hash() As Byte
    Dim i As Integer
    '-----------------https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.rsa.decrypt?view=netframework-4.8
    bLen = Len(strText) \ 2
    bLen = bLen - 1
    ReDim Hash(bLen)
    For i = 0 To bLen
        Hash(i) = CByte("&H" & Mid$(strText, i * 2 + 1, 2)) 'CByte将数据转为byte类型
    Next
    objRSA.FromXmlString privateKey
    Decrypt = objRSA.Decrypt(Hash, False)
End Function

Private Sub Class_Initialize()
    Set objRSA = CreateObject(RSA)
End Sub

Private Sub Class_Terminate()
    Set objRSA = Nothing
End Sub
