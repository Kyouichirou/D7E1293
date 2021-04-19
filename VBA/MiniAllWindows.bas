'@name MiniAllWindows
'@author HLA

Sub MiniAllWindows() '最小化所有的窗口
    Dim objShell As Object
    
    Set objShell = CreateObject("shell.application")
    objShell.MinimizeAll
    Set objShell = Nothing
End Sub
