Option Explicit
'@name: File_md5_Hash
'@author: HLA
'@update: 2021/4/16
'@function description:
'利用WindowsInstaller计算文件的md5,计算md5速度最好的方法,支持unicode字符路径, 最大测试文件12G
Private WDI As Object

Function GetFileHashMD5(ByVal FilePath As String, Optional ByVal errx As Integer) As String
    Dim Filehashx As Object
    Dim HashValue As String
    Dim i As Integer                  'https://docs.microsoft.com/zh-cn/windows/win32/msi/msifilehash-table
    Dim k As Byte, j As Byte, m As Byte
    
    On Error GoTo ErrHandle
    Set Filehashx = WDI.FileHash(FilePath, 0)                       '核心
    If WDI Is Nothing Or Filehashx Is Nothing Then GoTo ErrHandle
    k = Filehashx.FieldCount '4
    For i = 1 To k
        HashValue = HashValue & BigEndianHex(Filehashx.IntegerData(i))
    Next
    GetFileHashMD5 = HashValue
    Set Filehashx = Nothing
ErrHandle:
End Function

Private Function BigEndianHex(ByVal xl As Long) As String 'https://blog.csdn.net/weixin_42066185/article/details/83755433
    Dim Result As String
    Dim strx1 As String * 2, strx2 As String * 2, strx3 As String * 2, strx4 As String * 2
    '-------------------------------------https://stackoverrun.com/ja/q/8312292
    '-----------https://docs.microsoft.com/zh-CN/office/vba/api/excel.application.worksheetfunction
    '-----------https://docs.microsoft.com/zh-CN/office/vba/api/excel.worksheetfunction.dec2hex
    '-----------Result = ThisWorkbook.Application.WorksheetFunction.Dec2Hex(xl, 8) '会出现超出8位的问题
    Result = Hex(xl) '-----------------------------------------------最多八个十六进制字符
    If Len(Result) < 8 Then Result = Right$("00000000" & Result, 8) '补位
    strx1 = Mid$(Result, 7, 2)
    strx2 = Mid$(Result, 5, 2)
    strx3 = Mid$(Result, 3, 2)
    strx4 = Mid$(Result, 1, 2)
    BigEndianHex = strx1 & strx2 & strx3 & strx4
End Function

Private Sub Class_Initialize()
    Set WDI = CreateObject("WindowsInstaller.Installer") ''https://docs.microsoft.com/zh-cn/windows/win32/msi/installer-object
End Sub

Private Sub Class_Terminate()
    Set WDI = Nothing
End Sub
