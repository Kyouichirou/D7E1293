Option Explicit
'@name file_AESEncrypt_Decrypt_Algorithm
'https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.symmetricalgorithm.createencryptor?view=netframework-4.8#System_Security_Cryptography_SymmetricAlgorithm_CreateEncryptor_System_Byte___System_Byte___
'https://docs.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.icryptotransform?view=netframework-4.8
'这是AES算法的一种(Rijndael was the winner of the NIST competition to select the algorithm that would become AES.However,
'------------------there are some differences between Rijndael and the official FIPS-197 specification for AES.)
'---------'https://docs.microsoft.com/en-us/archive/blogs/shawnfa/the-differences-between-rijndael-and-aes
'CipherMode
Private Const CipherMode_CBC As Byte = 1
Private Const CipherMode_ECB As Byte = 2
Private Const CipherMode_OFB As Byte = 3
Private Const CipherMode_CFB As Byte = 4
Private Const CipherMode_CTS As Byte = 5
'------------------------------------------//
Private Const rAES As String = "System.Security.Cryptography.RijndaelManaged"
Private Const rUTF8 As String = "System.Text.UTF8Encoding"
Private Const rSHA256 As String = "System.Security.Cryptography.SHA256Managed"
Private Const eBlockSize As Long = 130172 '加密读取数据块的大小
Private Const dBlockSize As Long = 130176 '加密后写入的块大小/解密读取块大小 '如果修改此参数,需要两个同步修改
'参数 --------final block
'inputBuffer--------------注意这里的final block 和 fromblock和hash计算的细微区别
'Byte[]
'要为其计算转换的输入
'inputOffset
'Int32
'字节数组中的偏移量，从该位置开始使用数据。
'inputCount
'Int32
'字节数组中用作数据的字节数
'//------------------------------------------------------------//

'-------------------需要注意的是尽管对文件进行了加密,但是文件流的opentextasstream依然可以写入破坏掉文件的数据
Dim FsoA As Object
Dim objSHA256 As Object
Dim objUTF8 As Object
Dim objDummy As Object
Dim ado As Object, Adob As Object

Function AESEncrypt(ByVal strText As String, ByVal key As String, ByVal IsFile As Boolean, Optional ByVal IsRemove As Boolean = False, Optional ByVal filez As Long, _
Optional ByVal OutPut As String) As String() '加密
    Dim Hash() As Byte
    Dim Bytes() As Byte
    Dim TempFile As String, i As Long, k As Long
    Dim arrTemp() As String
    
    If Len(strText) = 0 Then Exit Function
    If IsFile = True Then '选择文件/字符串
        If FsoA.fileexists(strText) = False Then Exit Function
        If filez = 0 Then
            filez = FsoA.GetFile(strText).Size
            If filez = 0 Then Exit Function
        End If
        key = SHA256(key)
        With objRijndael
            .Mode = CipherMode_CBC
            .BlockSize = 128
            .keysize = 256
            .Iv   'GenerateIV        '偏移值
            'In general, there is no reason to use this method, because CreateEncryptor() or CreateEncryptor(null, null)
            'automatically generates both an initialization vector and a key. However, you may want to use the GenerateIV method to reuse a symmetric algorithm instance
            'with a different initialization vector.
            '当你创建一个 SymmetricAlgorithm 类的新实例或手动调用 GenerateIV 方法时，IV 属性会自动设置为新的随机值。 IV 属性的大小必须等于 BlockSize 属性除以8。
            '派生自 SymmetricAlgorithm 类的类使用称为加密块链接（CBC）的链接模式，这需要一个密钥和一个初始化向量来对数据执行加密转换。
            '若要对使用 SymmetricAlgorithm 类之一加密的数据进行解密，必须将 Key 属性和 IV 属性设置为用于加密的相同值。
            .key = Hex2Bytes(key)
        End With
        '----------------------------------------前期准备
        If Len(OutPut) = 0 Then
            OutPut = strText & ".aes" '加密后的文件路径
        Else
            If FsoA.folderexists(OutPut) = False Then
                OutPut = strText & ".aes" '加密后的文件路径
            Else
                If Right(OutPut, 1) = "\" Then
                    OutPut = OutPut & Right$(strText, Len(strText) - InStrRev$(strText, "\")) & ".aes"
                Else
                    OutPut = OutPut & "\" & Right$(strText, Len(strText) - InStrRev$(strText, "\")) & ".aes"
                End If
            End If
        End If
        '---------------确定加密后的文件的存放位置
        TempFile = ThisWorkbook.Path & "\temp" & Format(Now, "yyyymmddhhmmss") '临时文件,,防止存在temp的文件夹
        FsoA.CreateTextFile(TempFile, True, False).Write (Space(filez)) '占位
        With ado
            .Mode = 3  '不能选1,只读模式/,3 读写模式
            .Type = 1  'adTypeBinary 'adTypeText=2
            .Open
            .LoadFromFile (strText)
            .Position = 0
            If filez > eBlockSize Then
                k = 0
                With Adob
                    .Mode = 3
                    .Type = 1
                    .Open
                    .LoadFromFile (TempFile)
                End With
                Do Until .EOS = True
                    Bytes = .Read(eBlockSize)
                    i = UBound(Bytes) + 1
                    Hash = objRijndael.CreateEncryptor.TransformFinalBlock(Bytes, 0, i)
                    i = UBound(Hash) + 1
                    Adob.Position = k
                    Adob.Write Hash '如果写入的数据超过了当前 EOS 位置，则 Stream 的 Size 会增加，以包含所有新字节，并且 EOS 将移动到 Stream 中新的最后一个字节。
                    k = k + i
                Loop
                .Close
                Adob.SaveToFile OutPut 'https://docs.microsoft.com/zh-cn/office/client-developer/access/desktop-database-reference/saveoptionsenum
                Adob.Close
                Set Adob = Nothing
            Else
                Bytes = .Read(filez)
                Hash = objRijndael.CreateEncryptor.TransformFinalBlock((Bytes), 0, filez) 'LenB(Bytes)
                .LoadFromFile (TempFile)
                .Write Hash
                .SaveToFile OutPut
                .Close
            End If
        End With
        FsoA.DeleteFile TempFile
        If IsRemove = True Then FsoA.DeleteFile strText '删除源文件
        ReDim AESEncrypt(1)
        ReDim arrTemp(1)
    Else
        key = SHA256(key)
        With objRijndael
            .Mode = CipherMode_CBC
            .BlockSize = 128
            .keysize = 256
            .Iv   'GenerateIV
            .key = Hex2Bytes(key)
        End With
        Bytes = objUTF8.GetBytes_4(strText)
        ReDim AESEncrypt(2)
        ReDim arrTemp(2)
        k = UBound(Bytes) + 1
        Hash = objRijndael.CreateEncryptor.TransformFinalBlock((Bytes), 0, k)
        arrTemp(2) = Bytes2Hex(Hash) '加密的密文
    End If
    Hash = objRijndael.Iv
    arrTemp(1) = Bytes2Hex(Hash) '偏移值
    arrTemp(0) = "SHA256:" & key '新的key
    objRijndael.Clear
    AESEncrypt = arrTemp
    Erase arrTemp
End Function

Function AESDecrypt(ByVal strText As String, ByVal IsFile As Boolean, ByVal Ivx As String, ByVal key As String, Optional ByVal filez As Long, _
Optional ByVal IsRemove As Boolean = False, Optional ByVal OutPut As String) As String '解密
    Dim Hash() As Byte
    Dim Bytes() As Byte
    Dim TempFile As String, i As Long, k As Long, blockSizex As Long
    Dim strx As String, strx1 As String
    
    If Len(strText) = 0 Then Exit Function
    If IsFile = True Then '选择文件/字符串
        If FsoA.fileexists(strText) = False Then Exit Function
        If filez = 0 Then
            filez = FsoA.GetFile(strText).Size
            If filez = 0 Then Exit Function
        End If
        If LCase$(Right$(strText, 3)) <> "aes" Then Exit Function '如果扩展名不是aes即退出
        With objRijndael
            .Mode = CipherMode_CBC
            .BlockSize = 128
            .keysize = 256
            .Iv = Hex2Bytes(Ivx)
            .key = Hex2Bytes(key)
        End With
        '----------------------------------------前期准备
        strx1 = Format(Time, "hhmmss")
        strx = Right$(strText, Len(strText) - InStrRev(strText, "\"))
        strx = strx1 & Left$(strx, Len(strx) - 4) '---新的文件名
        If Len(OutPut) = 0 Then
            OutPut = Left$(strText, InStrRev(strText, "\"))
            OutPut = OutPut & strx1 & strx
        Else
            If FsoA.folderexists(OutPut) = False Then
                OutPut = Left$(strText, InStrRev(strText, "\"))
                OutPut = OutPut & strx1 & strx
            Else
                If Right$(OutPut, 1) = "\" Then
                    OutPut = OutPut & strx1 & strx
                Else
                    OutPut = OutPut & "\" & strx1 & strx
                End If
            End If
        End If
        '---------------确定解密后的文件的存放位置
        'Environ("temp"),系统缓存文件夹的位置
        TempFile = ThisWorkbook.Path & "\temp" & Format(Now, "yyyymmddhhmmss") '临时文件,,防止存在temp的文件夹
        FsoA.CreateTextFile(TempFile, True, False).Write (Space(filez)) '占位
        With ado
            .Mode = 3  '不能选1,只读模式/,3 读写模式
            .Type = 1  'adTypeBinary 'adTypeText=2
            .Open
            .LoadFromFile (strText)
            .Position = 0
            If filez > dBlockSize Then
                k = 0
                With Adob
                    .Mode = 3
                    .Type = 1
                    .Open
                    .LoadFromFile (TempFile)
                End With
                Do Until .EOS = True
                    Bytes = .Read(dBlockSize)
                    i = UBound(Bytes) + 1
                    Hash = objRijndael.CreateDecryptor.TransformFinalBlock(Bytes, 0, i)
                    '需要注意加密后的数据块前后写入的大小发生变化, 之前加密后的数据从130172变成130176, 当解密读取的时候需要按照写入(130176)的块大小来读取
                    '否则会出现长度不符的问题
                    i = UBound(Hash) + 1
                    Adob.Position = k
                    Adob.Write Hash '如果写入的数据超过了当前 EOS 位置，则 Stream 的 Size 会增加，以包含所有新字节，并且 EOS 将移动到 Stream 中新的最后一个字节。
                    k = k + i
                Loop
                .Close
                Adob.SaveToFile OutPut
                Adob.Close
            Else
                Bytes = .Read(filez)
                Hash = objRijndael.CreateDecryptor.TransformFinalBlock((Bytes), 0, filez)
                .LoadFromFile (TempFile)
                .Write Hash
                .SaveToFile OutPut
                .Close
            End If
        End With
        FsoA.DeleteFile TempFile
        If IsRemove = True Then FsoA.DeleteFile strText '删除源文件
    Else
        Bytes = Hex2Bytes(strText)
        With objRijndael
            .Mode = CipherMode_CBC
            .BlockSize = 128
            .keysize = 256
            .Iv = Hex2Bytes(Ivx)
            .key = Hex2Bytes(key)
        End With
        i = UBound(Bytes) + 1
        Hash = objRijndael.CreateDecryptor.TransformFinalBlock((Bytes), 0, i)
        AESDecrypt = objUTF8.GetString(Hash) '加密的密文
    End If
    objRijndael.Clear
End Function

Private Function Bytes2Hex(ByRef Arrayx() As Byte) As String '将数组转为16进制字符串
    With objDummy
        .DataType = "bin.hex"
        .nodeTypedValue = Arrayx
        Bytes2Hex = .Text
    End With
End Function
'-----------------------------------------------------------https://www.cnblogs.com/hnxxcxg/p/11126688.html
Private Function Hex2Bytes(ByVal strText As String) As Byte() '将16进制的字符串转为数组
    With objDummy
        .DataType = "bin.hex"
        .Text = strText
        Hex2Bytes = .nodeTypedValue
    End With
End Function

Private Function SHA256(ByVal strText As String) As String '将字符串转化为SHA256 Hash
    Dim Bytes() As Byte
    Dim Hash() As Byte

    Bytes = objUTF8.GetBytes_4(strText)
    Hash = objSHA256.ComputeHash_2((Bytes))
    SHA256 = Bytes2Hex(Hash)
End Function

Private Sub Class_Initialize()
    Set objRijndael = CreateObject(rAES)
    Set ado = CreateObject("adodb.stream")
    Set Adob = CreateObject("adodb.stream")
    Set FsoA = CreateObject("Scripting.FileSystemObject")
    Set objSHA256 = CreateObject(rSHA256)
    Set objUTF8 = CreateObject(rUTF8)
    Set objDummy = CreateObject("Microsoft.XMLDOM").createElement("dummy")
End Sub

Private Sub Class_Terminate()
    Set FsoA = Nothing
    Set Adob = Nothing
    Set objRijndael = Nothing
    Set objSHA256 = Nothing
    Set objUTF8 = Nothing
    Set ado = Nothing
    Set objDummy = Nothing
End Sub
