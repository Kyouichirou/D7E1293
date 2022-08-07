VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit
Dim arra() As Variant
'--表格的模块级别的变量在发生表格切换时会被自动重置
Dim blow As Integer

Private Sub CommandButton1_Click() '生成基金概要
    Dim i As Integer
    Sheets("Home").Cells(1, 1).Select
    If Len(Trim(Me.TextBox1.Text)) = 0 Then Exit Sub
    If Me.ListBox1.ListCount = 0 Then Exit Sub
    i = Me.ListBox1.ListIndex
    If i = -1 Then Exit Sub
    Fund_ID = Me.ListBox1.List(i, 0)
    Fund_Name = Me.ListBox1.List(i, 1)
    Fund_Profile.Show 0
End Sub

Private Sub CommandButton2_Click() '更新数据
    Dim yesno As Variant
    Sheets("Home").Cells(1, 1).Select
    If Check_OutDate = True Then
        If IsNetConnectOnline = False Then MsgBox "网络链接不可用", vbInformation + vbOKOnly, "Warning"
        If Len(ThisWorkbook.Sheets("Fund_Lists").Cells(2, 3)) > 0 Then
            yesno = MsgBox("是否开始更新数据", vbQuestion + vbInformation, "Question")
            If yesno = vbNo Then Exit Sub
        End If
        DisEvents
        Get_eastmoney_FundLists
        EnEvents
    Else
        MsgBox "数据库已经是最新", vbInformation, "Tip"
    End If
End Sub

Private Sub CommandButton3_Click() '清除数据缓存
    IECache_Clear
End Sub

Private Sub CommandButton4_Click() '退出
    With ThisWorkbook.Sheets("Home")
        .ListBox1.Height = 0.5
        .TextBox1.Text = ""
    End With
    MsgShow "数据自动保存", "Tip", 1200
    If Workbooks.Count = 1 Then
        ThisWorkbook.Save
        ThisWorkbook.Application.EnableEvents = False: ThisWorkbook.Application.Quit
    Else
        ThisWorkbook.Close savechanges:=True
    End If
End Sub

Private Sub Worksheet_Activate()
    With ThisWorkbook.Sheets("Home")
        .Range("a1").Activate '让按钮保持透明
        .ScrollArea = "a1:t36" '控制滑动的区域
    End With
End Sub

'--------------------------------------------------------搜索模块
Private Sub TextBox1_Change() '搜索框
    Dim i As Integer, j As Integer, k As Integer
    Dim strx As String, mi As Byte, p As Byte
    Dim strTemp As String, iblow As Integer

    If blow = 0 Then
        ArrayLoadx
        If blow < 8 Then MsgBox "数据库尚未存储数据", vbInformation + vbOKOnly, "Tip"
        Exit Sub
    End If
    strx = Trim(Me.TextBox1.Value)
    strx = Replace(strx, "/", " ") '替换掉"/"符号
    With Me.ListBox1
        If Len(strx) > 1 Then
            .Clear
            iblow = blow - 6
            mi = 0
            For k = 1 To iblow
                For p = 1 To 5
                    strTemp = strTemp & arra(k, p) & "/"
                Next
                strTemp = Left$(strTemp, Len(strTemp) - 1)
                If InStr(1, strTemp, strx, vbTextCompare) > 0 Then
                    If mi = 0 Then .Height = 128 '注意这里的高度只能设置一次否则会出现,无法看到添加的列表值的情况
                    .AddItem
                    .List(mi, 0) = arra(k, 1)
                    .List(mi, 1) = arra(k, 3)
                    .List(mi, 2) = arra(k, 4)
                    mi = mi + 1
                    If mi > 10 Then Exit For
                Else
                   If mi = 0 Then .Clear: .Height = 1 '这里需要注意, 如果直接使用visible属性,会造成屏幕刷新的问题,无法通过application.screen来解决
                End If                                '这里使用控制listbox的宽度来假装处于隐藏的状态
            Next
        Else
            .Clear: .Height = 1
        End If
    End With
End Sub

Private Sub ArrayLoadx() '将数据放进数组
    With ThisWorkbook.Sheets("Fund_Lists") '注意这里的sheet被隐藏的问题
        blow = .[d65536].End(xlUp).Row
        If blow > 7 Then arra = .Range("b7:f" & blow).Value
    End With
End Sub


