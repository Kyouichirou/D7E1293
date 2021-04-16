'@name: Get_Set_Clipboard
'@update: NA
'@description:
'支持unicode字符
Option Explicit
'http://wisdom.sakura.ne.jp/system/winapi/win32/win90.html
Private Declare Function OpenClipboard Lib "user32.dll" (ByVal hwnd As Long) As Long
Private Declare Function EmptyClipboard Lib "user32.dll" () As Long
Private Declare Function CloseClipboard Lib "user32.dll" () As Long
Private Declare Function IsClipboardFormatAvailable Lib "user32.dll" (ByVal wFormat As Long) As Long
Private Declare Function GetClipboardData Lib "user32.dll" (ByVal wFormat As Long) As Long
Private Declare Function SetClipboardData Lib "user32.dll" (ByVal wFormat As Long, ByVal hMem As Long) As Long
Private Declare Function GlobalAlloc Lib "kernel32.dll" (ByVal wFlags As Long, ByVal dwBytes As Long) As Long
Private Declare Function GlobalLock Lib "kernel32.dll" (ByVal hMem As Long) As Long
Private Declare Function GlobalUnlock Lib "kernel32.dll" (ByVal hMem As Long) As Long
Private Declare Function GlobalSize Lib "kernel32" (ByVal hMem As Long) As Long
Private Declare Function lstrcpy Lib "kernel32.dll" Alias "lstrcpyW" (ByVal lpString1 As Long, ByVal lpString2 As Long) As Long

Sub SetClipboard(sUniText As String)
    Dim iStrPtr As Long
    Dim iLen As Long
    Dim iLock As Long
    Const GMEM_MOVEABLE As Long = &H2 '2
    Const GMEM_ZEROINIT As Long = &H40 '64
    Const CF_UNICODETEXT As Long = &HD '13
    
    'https://wutils.com/com-dll/constants/constants-VBA.htm
    OpenClipboard 0&
    EmptyClipboard
    '------------------------------------https://teratail.com/questions/190985
    iLen = LenB(sUniText) + 2&         'lenb 这里需要注意,区别于len函数 以及Excel表格中的len/lenb函数的区别
    '---------------------------------与在双字节字符集 (DBCS) 语言中一样，将 LenB 函数用于字符串中包含的字节数据。
    '---------------------------------https://docs.microsoft.com/zh-cn/office/vba/language/reference/user-interface-help/len-function
    '-------------------------------------LenB 返回用于表示此字符串的字节的数目，而不是返回字符串中的字符数
    iStrPtr = GlobalAlloc(GMEM_MOVEABLE Or GMEM_ZEROINIT, iLen)
    iLock = GlobalLock(iStrPtr)
    lstrcpy iLock, StrPtr(sUniText)
    GlobalUnlock iStrPtr
    SetClipboardData CF_UNICODETEXT, iStrPtr
    CloseClipboard
End Sub

Function GetClipboard() As String
    Dim iStrPtr As Long
    Dim iLen As Long
    Dim iLock As Long
    Dim sUniText As String
    Const CF_UNICODETEXT As Long = 13&
    OpenClipboard 0&
    If IsClipboardFormatAvailable(CF_UNICODETEXT) Then
        iStrPtr = GetClipboardData(CF_UNICODETEXT)
        If iStrPtr Then
            iLock = GlobalLock(iStrPtr)
            iLen = GlobalSize(iStrPtr)
            sUniText = String$(iLen \ 2& - 1&, vbNullChar)
            lstrcpy StrPtr(sUniText), iLock
            GlobalUnlock iStrPtr
        End If
        GetClipboard = sUniText
    End If
    CloseClipboard
End Function
