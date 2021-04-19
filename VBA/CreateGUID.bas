'@name CreateGUID
'@author HLA
'@description
'生成GUID(UUID)
Option Explicit
Private Declare Function CoCreateGuid Lib "ole32" (id As Any) As Long

Function CreateGUID() As String '创建GUID
    Dim idBytes(0 To 15) As Byte
    Dim Cnt As Long, GUID As String
    '----------------------------https://www.cnblogs.com/snandy/p/3261754.html
    If CoCreateGuid(idBytes(0)) = 0 Then
        For Cnt = 0 To 15
            CreateGUID = CreateGUID + IIf(idBytes(Cnt) < 16, "0", "") + Hex$(idBytes(Cnt))
        Next Cnt
        CreateGUID = Left$(CreateGUID, 8) + "-" + Mid$(CreateGUID, 9, 4) + "-" + Mid$(CreateGUID, 13, 4) + "-" + Mid$(CreateGUID, 17, 4) + "-" + Right$(CreateGUID, 12)
    End If
End Function
