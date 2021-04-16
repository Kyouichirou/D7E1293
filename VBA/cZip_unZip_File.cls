Option Explicit
'@name: cZip_unZip_File
'@Author: HLA
'@Date: 2020-04-29
'@Function Description:
' 支持多文件(包含不同文件夹/文件混合), 判断输入的内容是否为数组
' 支持加压后删除源文件
' 支持文件/文件夹混合添加
'---------------------------------------------Zip/UnZip
'(4)
'Do not display a progress dialog box.
'(8)
'Give the file being operated on a new name in a move, copy, or rename operation if a file with the target name already exists.
'(16)
'Respond with "Yes to All" for any dialog box that is displayed.
'(64)
'Preserve undo information, if possible.
'(128)
'Perform the operation on files only if a wildcard file name (*.*) is specified.
'(256)
'Display a progress dialog box but do not show the file names.
'(512)
'Do not confirm the creation of a new directory if the operation requires one to be created.
'(1024)
'Do not display a user interface if an error occurs.
'(2048)
'Version 4.71. Do not copy the security attributes of the file.
'(4096)
'Only operate in the local directory. Do not operate recursively into subdirectories.
'(8192)
'Version 5.0. Do not copy connected files as a group. Only copy the specified files.
'-----------------------------
Private oFso As Object
Private oShell As Object
Private OutPutPath As String
Private ZipName As String
Private iCount As Integer
Private isCreated As Boolean
Private IsDelete As Boolean
#If VBA7 Then
    Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
    Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#End If
'https://docs.microsoft.com/en-us/windows/win32/shell/shell
'https://docs.microsoft.com/en-us/windows/win32/shell/folder-copyhere

Private Sub Class_Initialize()
    iCount = 1
    Set oFso = CreateObject("Scripting.FileSystemObject")
    Set oShell = CreateObject("Shell.Application")
End Sub

Private Sub Class_Terminate()
    Set oFso = Nothing
    Set oShell = Nothing
    isCreated = False
    IsDelete = False
    OutPutPath = ""
    ZipName = ""
    iCount = 0
End Sub

Friend Property Let Zip_Name(ByVal nZip As String) '指定压缩文件包名
    ZipName = CheckRname(nZip)
End Property

Friend Property Let OutPut_Path(ByVal oPath As String) '指定压缩包输出路径
    If oFso.folderexists(oPath) = False Then Exit Property
    OutPutPath = AddPathSeparator(oPath)
End Property

Friend Property Let Zip_Delete(ByVal isDel As Boolean) '执行后是否删除文件
    IsDelete = isDel
End Property

Friend Function ZipCompress(ByVal inPath As Variant) As Boolean '压缩文件
    Dim i As Integer, k As Integer, j As Integer
    
    On Error GoTo ErrHandle
    If IsArray(inPath) = False Then '判断输入的内容是否为组合内容
        If Zip_File(inPath) = True Then
            iCount = iCount + 1
        ElseIf Zip_Folder(inPath) = True Then
            iCount = iCount + 1
        End If
        If iCount > 1 Then ZipCompress = True
        If IsDelete = True Then oFso.DeleteFile inPath
    Else
        i = UBound(inPath)
        j = LBound(inPath)
        For k = j To i
            If Zip_File(inPath(k)) = True Then
                iCount = iCount + 1
                If IsDelete = True Then oFso.DeleteFile inPath(k)
            ElseIf Zip_Folder(inPath(k)) = True Then
                iCount = iCount + 1
                If IsDelete = True Then oFso.DeleteFolder inPath(k)
            End If
        Next
        i = i - j '1,0,2
        iCount = iCount - 2
        If iCount = i Then ZipCompress = True
    End If
    Exit Function
ErrHandle:
    If Err.Number <> 70 Then ZipCompress = False '70表示删除的文件处于占用状态
End Function

Friend Function File_unZip(ByVal FilePath As String) As Boolean '解压文件
    Dim sPath As Variant
    Dim fPath As Variant
    Dim i As Integer
    
    On Error GoTo ErrHandle
    If oFso.fileexists(FilePath) = False Then Exit Function
    If LCase(oFso.GetExtensionName(FilePath)) <> "zip" Then Exit Function
    File_unZip = True
    If Len(OutPutPath) = 0 Then
        OutPutPath = oFso.GetFile(FilePath).ParentFolder.Path
        OutPutPath = AddPathSeparator(OutPutPath)
    End If
    fPath = CVar(OutPutPath)
    sPath = CVar(FilePath)
    With oShell
        .Namespace(fPath).CopyHere .Namespace(sPath).Items
    End With
Redo:
    DoEvents
    Sleep 25
    If IsDelete = True Then oFso.DeleteFile FilePath
    Exit Function
ErrHandle:
    If Err.Number <> 70 Then
        File_unZip = False
    Else
        If IsDelete = True And i < 100 Then i = i + 1: GoTo Redo
    End If
End Function

Private Function Zip_Create(ByVal outPath As String) As Boolean '创建空白zip文件
    On Error GoTo ErrHandle
    Zip_Create = True
    With oFso.CreateTextFile(outPath, True)
        .Write ChrW$(&H50) & ChrW$(&H4B) & ChrW$(&H5) & ChrW$(&H6) & String$(18, ChrW$(0)) 'zip要求的文件格式, 就类似于bom格式的txt文件头一样
        .Close
    End With
    isCreated = True
    Exit Function
ErrHandle:
    Zip_Create = False
End Function

Private Function Zip_File(ByVal FilePath As String) As Boolean '压缩文件
    Dim sPath As Variant
    Dim fPath As Variant
    
    Zip_File = False
    On Error GoTo ErrHandle
    If oFso.fileexists(FilePath) = False Then Exit Function
    If Len(OutPutPath) = 0 Then
        OutPutPath = oFso.GetFile(FilePath).ParentFolder.Path
        OutPutPath = AddPathSeparator(OutPutPath)
    End If
    '---------注意文件夹或文件的位置处于第一层(c:\)
    If Len(ZipName) = 0 Then ZipName = oFso.GetBaseName(FilePath) & ".zip"
    If isCreated And Zip_Create(OutPutPath & ZipName) = False Then Exit Function
    sPath = CVar(OutPutPath & ZipName)
    fPath = CVar(FilePath)
    With oShell.Namespace(sPath) 'shell这里需要使用的参数变量的数据类型为variant
        .CopyHere fPath
        While .Items.Count < iCount '等待文件压缩完成
            DoEvents
        Wend
    End With
    Zip_File = True
ErrHandle:
End Function

Private Function Zip_Folder(ByVal Folderpath As String) As Boolean '压缩文件夹
    Dim sPath As Variant
    Dim fPath As Variant
    
    Zip_Folder = False
    On Error GoTo ErrHandle
    If oFso.folderexists(Folderpath) = False Then Exit Function
    If Len(OutPutPath) = 0 Then
        OutPutPath = oFso.GetFile(Folderpath).ParentFolder.Path
        OutPutPath = AddPathSeparator(OutPutPath)
    End If
    If Len(ZipName) = 0 Then ZipName = oFso.GetBaseName(Folderpath) & ".zip"
    If isCreated = False Then
        If Zip_Create(OutPutPath & ZipName) = False Then Exit Function
    End If
    sPath = CVar(OutPutPath & ZipName)
    fPath = CVar(Folderpath)
    With oShell.Namespace(sPath)
        .CopyHere fPath
        While .Items.Count < iCount
            DoEvents
        Wend
    End With
    Zip_Folder = True
ErrHandle:
End Function

Private Function AddPathSeparator(ByVal sPath As String) As String '增加斜杠
    If Right$(sPath, 1) <> ChrW$(92) Then sPath = sPath & ChrW$(92)
    AddPathSeparator = sPath
End Function

Private Function CheckRname(ByVal FileName As String) As String '将文件名中的非法字符替换掉
    Dim Char As String, i As Integer, j As Byte
    
    i = Len(FileName)
    If i > 100 Then i = 100: FileName = Right$(FileName, 100) '限制长度(windows系统支持255的最长文件名包含路径全长)
    For j = 1 To i
        Char = Mid$(FileName, j, 1)
        Select Case Asc(Char)
              Case Asc("/"), Asc("\"), Asc(":"), Asc("*"), Asc("?"), Asc("<"), Asc(">"), Asc("|") 'windows 限制的字符
              Char = "-"
              Mid$(FileName, j, 1) = Char '把这些字符统一替换掉
        End Select
    Next
    FileName = Replace$(FileName, ChrW$(34), "", 1, , vbBinaryCompare) '替换掉双引号和单引号 '这些符号潜在影响后续的其他的进程的操作
    FileName = Replace$(FileName, ChrW$(39), "", 1, , vbBinaryCompare)
    If LCase(Right$(FileName, 4)) <> ".zip" Then FileName = FileName & ".zip" '添加后缀名
    CheckRname = FileName
End Function
