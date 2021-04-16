'@name: c_imgFile_base64_convertor
'@author: HLA
'description
'支持将图片转为base64, 也支持base64转图片

Option Explicit
Private Const preFix As String = "base64,"
Private ado As Object
Private objXML As Object
Private objNode As Object
Private fso As Object

Friend Function sBase64_Picture(ByVal strText As String) '将字符串的base64转为图片
    Dim arr() As String
    Dim i As Byte

    If Len(strText) = 0 Then Exit Function
    arr = Check_String(strTemp)
    i = UBound(arr)
    Bytes = DecodeBase64(arr(0))
    If i = 0 Then
        WriteData_File Bytes
    Else
        WriteData_File Bytes, arr(1)
    End If
End Function

Friend Function File_Picture_sBase64(ByVal Imgpath As String, Optional ByVal filez As Long, Optional ByVal IsExist As Boolean = False, Optional ByVal iType As Byte = 0, _
                                    Optional ByVal oType As Boolean = False) As String '将图片转为base64
    Dim strTemp As String
    Dim Bytes() As Byte
    Dim arr() As String
    Dim filex As String, strx As String
    Dim fl As TextStream
    
    If IsExist = False Then
        If fso.fileexists(Imgpath) = False Then Exit Function
    End If
    If filez = 0 Then
        filez = fso.GetFile(Imgpath).Size
        If filez = 0 Or filez > 104857600 Then Exit Function
        filex = LCase(fso.GetExtensionName(Imgpath))
    End If
    With ado
        .Type = 1
        .Mode = 3
        .Open
        .Position = 0
        .LoadFromFile Imgpath
        Bytes = .Read()
        .Close
    End With
    strTemp = EcodeBase64(Bytes)
    Select Case iType
        Case 1: strTemp = "data:image/" & filex & ";base64," & strTemp
        Case 2: strTemp = "<img src='data:image/" & filex & ";base64," & strTemp & "'/>"
    End Select
    If oType = True Then
        strx = Format(Now, "yyyymmddhhmmss") & CStr(RandNumx(1000))
        strx = ThisWorkbook.Path & "\" & strx & ".txt"
        Set fl = fso.CreateTextFile(strx, True, False)
        fl.Write strTemp
        fl.Close
        Set fl = Nothing
    End If
    Picture_sBase64 = strTemp
    Erase Bytes
End Function

Friend Function sBase64form_txtFile_Picture(ByVal FilePath As String, Optional ByVal sCharter As String = "gb2312", Optional ByVal filez As Long, Optional ByVal IsExist As Boolean = False)
    Dim strTemp As String
    Dim Bytes() As Byte
    Dim arr() As String
    Dim i As Byte
    
    If IsExist = False Then
        If fso.fileexists(FilePath) = False Then Exit Function
        If LCase$(Right$(FilePath, 3)) <> "txt" Then Exit Function
    End If
    If filez = 0 Then
        If fso.GetFile(FilePath).Size = 0 Then Exit Function
    End If
    With ado
        .Type = 2 ' 1  'adTypeBinary 'adTypeText=2
        .Mode = 3
        .Charset = sCharter
        .Open
        .LoadFromFile FilePath
        strTemp = .ReadText()
        .Close
    End With
    arr = Check_String(strTemp)
    i = UBound(arr)
    Bytes = DecodeBase64(arr(0))
    If i = 0 Then
        WriteData_File Bytes
    Else
        WriteData_File Bytes, arr(1)
    End If
End Function

Private Function Check_String(ByVal strText As String) As String() '检查字符串
    Dim strx As String
    Dim strT As Variant
    Dim arr() As String
    
    If InStr(strText, preFix) > 0 Then
        ReDim arr(1)
        ReDim Check_String(1)
        strT = Split(strText, preFix) '清除干扰项
        strText = strT(1)
        strx = strT(0)
        strx = Left$(Right$(strx, Len(strx) - InStrRev(strx, "/")), Len(strx) - 1) '扩展名
        strx = Trim(strx)
        strx = Replace(strx, ";", "")
        arr(0) = Replace(strText, "'/>", "")
        arr(1) = strx
    Else
        ReDim Check_String(0)
        ReDim arr(0)
        arr(0) = strText
    End If
    Check_String = arr
End Function

Private Sub WriteData_File(ByRef Bytes() As Byte, Optional filex As String = "jpg") '将数据写入文件
    Dim strx As String
    strx = Format(Now, "yyyymmddhhmmss") & CStr(RandNumx(1000))
    With ado
        .Type = 1
        .Mode = 3
        .Open
        .Write Bytes
        .SaveToFile ThisWorkbook.Path & "\" & strx & "." & filex
        .Close
    End With
End Sub

Private Function EcodeBase64(ByRef Bytes() As Byte) As String
    'https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ms762308(v=vs.85)
    With objNode
        .DataType = "bin.base64"
        .nodeTypedValue = Bytes
        EcodeBase64 = .Text
    End With
End Function

Private Function DecodeBase64(ByVal strData As String) As Byte()
    With objNode
        .DataType = "bin.base64"
        .Text = strData
        DecodeBase64 = .nodeTypedValue
    End With
End Function

Private Sub Class_Initialize()
    Set objXML = CreateObject("MSXML2.DomDocument")
    Set objNode = objXML.createElement("b64")
    Set ado = CreateObject("adodb.stream")
    Set fso = CreateObject("Scripting.FileSystemObject")
End Sub

Private Sub Class_Terminate()
    Set ado = Nothing
    Set objXML = Nothing
    Set objNode = Nothing
    Set fso = Nothing
End Sub
