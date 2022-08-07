VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Fund_Profile 
   Caption         =   "UserForm1"
   ClientHeight    =   9435
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   5865
   OleObjectBlob   =   "Fund_Profile.frx":0000
   StartUpPosition =   1  '所有者中心
End
Attribute VB_Name = "Fund_Profile"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
#If Win64 And VBA7 Then
Private Declare PtrSafe Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" (ByVal hwnd As Long, _
ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
#Else
Private Declare Function ShellExecute Lib "shell32.dll" Alias "ShellExecuteA" (ByVal hwnd As Long, _
ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long
#End If
Private Const THS_Url As String = "http://fund.10jqka.com.cn/"
Private Const SW_SHOWNORMAL As Byte = 0

Private Sub CommandButton1_Click() '生成Excel报告
    Dim wb As Workbook
    Dim lb As Object
    Dim arr() As String
    Dim i As Byte, k As Byte
    
    If IsNetConnectOnline = False Then MsgBox "网络不可用", vbCritical + vbInformation, "Warning": Exit Sub
    Info_window.Show 0
    DisEvents
    On Error GoTo errhandle
    Set wb = Workbooks.Add
    With wb.Worksheets
        .Add after:=wb.Worksheets(.Count), Count:=5 - .Count '创建6张表
    End With
    With wb
        .Worksheets(1).Name = "Essential"
        .Worksheets(2).Name = "7"
        .Worksheets(3).Name = "30"
        .Worksheets(4).Name = "90"
        .Worksheets(5).Name = "180"
        ThisWorkbook.Sheets("Templet").Range("a1:l42").Copy .Sheets("Essential").Range("a1") '将模板的内容复制到新的表格
        ReDim arr(19)
        For i = 21 To 40
            Set lb = Me.Controls("LB" & i) '数据部分
            arr(k) = lb.Caption: k = k + 1
        Next
        Set lb = Nothing
        If Fund_Position(Fund_ID, wb) = False Then GoTo errhandle
        '-----------------------------------持仓
        If Fund_History(Fund_ID, "7", wb) = False Then GoTo errhandle
        If Fund_History(Fund_ID, "30", wb) = False Then GoTo errhandle
        If Fund_History(Fund_ID, "90", wb) = False Then GoTo errhandle
        Fund_History Fund_ID, "180", wb
        '----------------------------------抓取历史数据
        .Activate
        With .Sheets("Essential")
            .Cells(32, "n") = "备注:"
            .Cells(33, "n") = 1
            .Cells(34, "n") = 2
            .Cells(34, "o") = "投资需谨慎!"
            .Hyperlinks.Add Anchor:=.Cells(33, "o"), Address:=THS_Url & Fund_ID & "/index.html", TextToDisplay:="爱基金链接"
            .Cells(3, 3).NumberFormatLocal = "@"
            .Cells(3, 3).Resize(20, 1) = ThisWorkbook.Application.Transpose(arr) '概要的内容
            .Range("c3:c22").HorizontalAlignment = xlLeft
            .Columns.AutoFit
            .Columns(1).ColumnWidth = 2.5
            .Activate
            .Cells(28, "h").Activate
        End With
        ActiveWindow.FreezePanes = True
        .SaveAs ThisWorkbook.path & "\" & Fund_ID & "_" & Fund_Name & "_" & Format(Now, "yyyymmddhhmmss") & ".xlsx"
    End With
    Set wb = Nothing
    Unload Info_window
    EnEvents
    Unload Me
    MsgShow "数据已生成", "Tip", 1200
    Exit Sub
errhandle:
    Err.Clear
    EnEvents
    Unload Info_window
    If Not wb Is Nothing Then wb.Close savechanges:=False
    MsgBox "数据获取失败", vbCritical + vbInformation, "Warning"
End Sub

Private Sub CommandButton2_Click() '基金页面
    Dim sUrl As String
    sUrl = THS_Url & Fund_ID & "/index.html"
    ShellExecute 0, "open", sUrl, 0, 0, SW_SHOWNORMAL
End Sub

Private Sub UserForm_Initialize()
    Dim lb As Object
    Dim i As Byte
    Dim h As Integer
    Dim arr As Variant
    Dim arrTemp() As String
    Dim strTemp As String
    
    On Error Resume Next
    If Len(Fund_ID) = 0 Then Exit Sub
    arr = ThisWorkbook.Sheets("Templet").Range("b3:b22").Value
    h = 42
    With Me
        .Caption = Fund_ID & "-" & Fund_Name
        For i = 1 To 20
            Set lb = .Controls.Add("Forms.Label.1", "LB" & i, True) '标题部分
            With lb
                .Caption = arr(i, 1)
                .TextAlign = fmTextAlignRight
                .Height = 16
                .Left = 18
                .Width = 92
                .Top = h
            End With
            h = h + 18
        Next
        Erase arr
        If IsNetConnectOnline = False Then MsgBox "网络不可用", vbCritical, "Warning": Exit Sub
        h = 42
        arrTemp = sFund_Profile(Fund_ID)
        If UBound(arrTemp) < 19 Then Set lb = Nothing: MsgBox "获取数据失败", vbCritical, "Warning": Exit Sub
        For i = 21 To 40
            Set lb = .Controls.Add("Forms.Label.1", "LB" & i, True) '数据部分
            With lb
                 strTemp = arrTemp(i - 21)
                 If Len(strTemp) = 0 Then strTemp = "暂无数据"
                .Caption = strTemp
                .TextAlign = fmTextAlignLeft
                .Height = 16
                .Left = 114
                .Width = 180
                .Top = h
            End With
            h = h + 18
        Next
    End With
    Set lb = Nothing
End Sub

Private Sub UserForm_Terminate()
    Fund_ID = ""
    Fund_Name = ""
End Sub
