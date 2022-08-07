Attribute VB_Name = "Other"
Option Explicit
#If Win64 And VBA7 Then
Private Declare PtrSafe Function _
  InternetGetConnectedState _
  Lib "wininet.dll" (ByRef lpdwFlags As Long, _
  ByVal dwReserved As Long) As Long             'https://www.cnblogs.com/fuchongjundream/p/3853716.html
Private Const _
  INTERNET_CONNECTION_MODEM_BUSY As Long = &H8   'https://docs.microsoft.com/en-us/windows/win32/wininet/wininet-functions
Private Const _
  INTERNET_RAS_INSTALLED As Long = &H10
Private Const _
  INTERNET_CONNECTION_OFFLINE As Long = &H20
Private Const _
  INTERNET_CONNECTION_CONFIGURED As Long = &H40
#Else
Private Declare Function _
  InternetGetConnectedState _
  Lib "wininet.dll" (ByRef lpdwFlags As Long, _
  ByVal dwReserved As Long) As Long             'https://www.cnblogs.com/fuchongjundream/p/3853716.html
Private Const _
  INTERNET_CONNECTION_MODEM_BUSY As Long = &H8   'https://docs.microsoft.com/en-us/windows/win32/wininet/wininet-functions
Private Const _
  INTERNET_RAS_INSTALLED As Long = &H10
Private Const _
  INTERNET_CONNECTION_OFFLINE As Long = &H20
Private Const _
  INTERNET_CONNECTION_CONFIGURED As Long = &H40
#End If
'------------------------------------------------------------网络
#If Win64 And VBA7 Then
    Private Declare PtrSafe Function MsgBoxTimeOut Lib "user32" Alias "MessageBoxTimeoutA" (ByVal hwnd As Long, _
ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long, ByVal wlange As Long, ByVal dwTimeout As Long) As Long '定时可自动关闭弹窗
#Else
    Private Declare Function MsgBoxTimeOut Lib "user32" Alias "MessageBoxTimeoutA" (ByVal hwnd As Long, _
ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long, ByVal wlange As Long, ByVal dwTimeout As Long) As Long '定时可自动关闭弹窗
#End If
Public Fund_ID As String
Public Fund_Name As String

Function IsNetConnectOnline() As Boolean '检查网络的状态
    IsNetConnectOnline = InternetGetConnectedState(0&, 0&)
End Function

Function Check_OutDate() As Boolean '检查数据更新的时间跨度
    Dim date1 As Date
    Check_OutDate = False
    If Len(ThisWorkbook.Sheets("Fund_Lists").Cells(2, 3).Value) > 0 Then
        date1 = ThisWorkbook.Sheets("Fund_Lists").Cells(2, 3).Value
        If DateDiff("d", date1, Now) > 3 Then Check_OutDate = True '更新时间超过3天才进行
    Else
        Check_OutDate = True
    End If
End Function

Sub IECache_Clear() '清除IE缓存
    On Error Resume Next
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 1 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 2 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 16 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 32 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 255 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 4351 "
    MsgShow "缓存清除成功", "Tip", 1200
End Sub

Sub EnEvents() '启用
    On Error Resume Next
    With ThisWorkbook
        With .Application
            .ScreenUpdating = True
            .EnableEvents = True
            .Calculation = xlCalculationAutomatic
            .Interactive = True
        End With
        .Save
    End With
End Sub

Sub DisEvents() '禁用干扰项
    On Error Resume Next
    '------------------------ http://www.360doc.com/content/15/0401/06/7835172_459703611.shtml
    '------------------------ https://docs.microsoft.com/zh-cn/office/vba/api/excel.application.interactive
    With ThisWorkbook.Application
        .ScreenUpdating = False '禁止屏幕刷新
        .EnableEvents = False '禁用事件
        .Calculation = xlCalculationManual '禁用自动计算
        .Interactive = False '禁止交互(在执行宏时,如果在表格输入内容会造成宏终止)
    End With
End Sub

Sub MsgShow(ByVal strText As String, ByVal signalx As String, ByVal timex As Integer) '定时弹窗
    '过程,"弹出对话","对话框标题",图标类型,默认参数,N秒后自动关闭
    MsgBoxTimeOut 0, strText, signalx, 64, 0, timex
End Sub

Sub Showoption() '恢复原来的界面
    On Error Resume Next
    With ThisWorkbook.Windows(1)
        .DisplayFormulas = True
        .DisplayHeadings = True
        .DisplayHorizontalScrollBar = True
        .DisplayVerticalScrollBar = True
        .DisplayWorkbookTabs = True
    End With
End Sub

Sub HideOption() '美化首页的界面
    On Error Resume Next
    With ThisWorkbook.Windows(1)
        .DisplayFormulas = False
        .DisplayHeadings = False
        .DisplayHorizontalScrollBar = False
        .DisplayVerticalScrollBar = False
        .DisplayWorkbookTabs = False
    End With
End Sub

Sub kdkfk()
Sheet1.Activate
End Sub


