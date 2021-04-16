'@name disable_Excel_unsecurity_tips
'@author HLA
'@description
'解除Excel加载activex控件的不安全提示, 很多控件在加载的时候会出现不安全的提示
Option Explicit

Sub ActivexUnTips()
    Dim wsh As Object
    
    Set wsh = CreateObject("Wscript.Shell")
    wsh.RegWrite "HKCU\Software\Microsoft\VBA\Security\LoadControlsInForms", 1, "REG_DWORD"
    wsh.RegWrite "HKCU\Software\Microsoft\Office\Common\Security\UFIControls", 1, "REG_DWORD"
    Set wsh = Nothing
End Sub
