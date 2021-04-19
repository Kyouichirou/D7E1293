'@name ObtainMediaLen
'author HLA

Function ObtainMediaLen(ByVal FilePath As Variant) As String '获取媒体文件的长度
    Dim FileName As Variant
    Dim obj As Object, FD As Object, fditem As Object
    '-----------------https://docs.microsoft.com/en-us/windows/win32/shell/shell-namespace
    '---------------这里需要注意,filename, filepath不能是string类型的数据,必须是vi类型的数据, 否则会出现错误
    ' ( ByVal vDir As Variant ) As Folder
    FileName = Right(FilePath, Len(FilePath) - InStrRev(FilePath, "\")) '不能加$符号
    FilePath = Left(FilePath, Len(FilePath) - Len(FileName) - 1) '文件夹
    Set obj = CreateObject("Shell.Application")
    Set FD = obj.Namespace(FilePath)
    Set fditem = FD.ParseName(FileName)
    ObtainMediaLen = FD.getdetailsof(fditem, 27) 'https://docs.microsoft.com/en-us/windows/win32/shell/folder-getdetailsof
    Set obj = Nothing
    Set FD = Nothing
    Set fditem = Nothing
End Function
