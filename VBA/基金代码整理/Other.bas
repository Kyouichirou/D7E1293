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
'------------------------------------------------------------����
#If Win64 And VBA7 Then
    Private Declare PtrSafe Function MsgBoxTimeOut Lib "user32" Alias "MessageBoxTimeoutA" (ByVal hwnd As Long, _
ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long, ByVal wlange As Long, ByVal dwTimeout As Long) As Long '��ʱ���Զ��رյ���
#Else
    Private Declare Function MsgBoxTimeOut Lib "user32" Alias "MessageBoxTimeoutA" (ByVal hwnd As Long, _
ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long, ByVal wlange As Long, ByVal dwTimeout As Long) As Long '��ʱ���Զ��رյ���
#End If
Public Fund_ID As String
Public Fund_Name As String

Function IsNetConnectOnline() As Boolean '��������״̬
    IsNetConnectOnline = InternetGetConnectedState(0&, 0&)
End Function

Function Check_OutDate() As Boolean '������ݸ��µ�ʱ����
    Dim date1 As Date
    Check_OutDate = False
    If Len(ThisWorkbook.Sheets("Fund_Lists").Cells(2, 3).Value) > 0 Then
        date1 = ThisWorkbook.Sheets("Fund_Lists").Cells(2, 3).Value
        If DateDiff("d", date1, Now) > 3 Then Check_OutDate = True '����ʱ�䳬��3��Ž���
    Else
        Check_OutDate = True
    End If
End Function

Sub IECache_Clear() '���IE����
    On Error Resume Next
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 1 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 2 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 16 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 32 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 255 "
    Shell "RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 4351 "
    MsgShow "��������ɹ�", "Tip", 1200
End Sub

Sub EnEvents() '����
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

Sub DisEvents() '���ø�����
    On Error Resume Next
    '------------------------ http://www.360doc.com/content/15/0401/06/7835172_459703611.shtml
    '------------------------ https://docs.microsoft.com/zh-cn/office/vba/api/excel.application.interactive
    With ThisWorkbook.Application
        .ScreenUpdating = False '��ֹ��Ļˢ��
        .EnableEvents = False '�����¼�
        .Calculation = xlCalculationManual '�����Զ�����
        .Interactive = False '��ֹ����(��ִ�к�ʱ,����ڱ���������ݻ���ɺ���ֹ)
    End With
End Sub

Sub MsgShow(ByVal strText As String, ByVal signalx As String, ByVal timex As Integer) '��ʱ����
    '����,"�����Ի�","�Ի������",ͼ������,Ĭ�ϲ���,N����Զ��ر�
    MsgBoxTimeOut 0, strText, signalx, 64, 0, timex
End Sub

Sub Showoption() '�ָ�ԭ���Ľ���
    On Error Resume Next
    With ThisWorkbook.Windows(1)
        .DisplayFormulas = True
        .DisplayHeadings = True
        .DisplayHorizontalScrollBar = True
        .DisplayVerticalScrollBar = True
        .DisplayWorkbookTabs = True
    End With
End Sub

Sub HideOption() '������ҳ�Ľ���
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


