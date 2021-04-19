Option Explicit
'@name Eight_Queen_Algorithm
'@authot HLA
'@description
'8皇后算法
'棋盘 8x8, 将8个棋子皇后放置在特定的位置,使其无法互相攻击, 即位置, 相互不处于同一列, 行, 对角线, 反对角线
Private Const iBoundary As Long = 8
Private Const iFrontier As Long = 7
Dim arrQueen(iBoundary) As Long
Dim xPosition As Long
Dim yPosition As Long
Dim iCcount As Long         '计算解法数量

Sub Eight_Queens()
    Dim i As Long, sText As String
    
    DisEvents
    For i = 0 To iFrontier
        arrQueen(i) = -1
    Next
    iCcount = 0: yPosition = 1: xPosition = 1
    placeQueen 0
    Erase arrQueen
    sText = "总共 " & iCcount & " 种解法!"
    yPosition = 1: iCcount = 0
    Cells(xPosition, yPosition).Value = sText
    Cells(xPosition, yPosition).Font.Bold = True
    Range("b2:i" & xPosition).Font.Italic = True
    yPosition = 0: xPosition = 0
    Cells.Columns.AutoFit
    EnEvents
    MsgBox sText, vbInformation + vbOKOnly, "Tips"
End Sub

Private Sub placeQueen(ByVal n As Long)
    Dim i As Long, k As Long, j As Long, m As Long
    Dim arrStatus(iBoundary) As Boolean
    
    For i = 0 To iFrontier
        arrStatus(i) = True
    Next
    i = 0
    Do While i < n
        arrStatus(arrQueen(i)) = False
        k = n - i
        m = arrQueen(i) + k
        If m >= 0 And m < iBoundary Then arrStatus(m) = False
        m = arrQueen(i) - k
        If m >= 0 And m < iBoundary Then arrStatus(m) = False
        i = i + 1
    Loop
    For i = 0 To iFrontier
        If arrStatus(i) = True Then
            If n < iFrontier Then
                arrQueen(n) = i
                placeQueen (n + 1)
            Else
                arrQueen(n) = i
                iCcount = iCcount + 1
                yPosition = 1
                Cells(xPosition, yPosition).Value = "这是第" & iCcount & "个解法, 如下:"
                Cells(xPosition, yPosition).Font.Bold = True
                xPosition = xPosition + 1
                Dim a As Long
                a = xPosition
                For m = 0 To iFrontier
                    If arrQueen(m) = 0 Then
                        yPosition = 2
                    Else
                        yPosition = arrQueen(m) + 2
                    End If
                    Cells(xPosition, yPosition).Value = "Queen"
                    Cells(xPosition, yPosition).Interior.Color = 65535
                    xPosition = xPosition + 1
                Next
                CreateBorders a, xPosition - 1
                i = m
            End If
        End If
    Next
End Sub

Private Sub CreateBorders(ByVal x As Long, ByVal y As Long)
    Dim iRng As Range
    Set iRng = Range("b" & x & ":" & "i" & y)
    iRng.Borders(xlDiagonalDown).LineStyle = xlNone
    iRng.Borders(xlDiagonalUp).LineStyle = xlNone
    With iRng.Borders(xlEdgeLeft)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With iRng.Borders(xlEdgeTop)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With iRng.Borders(xlEdgeBottom)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With iRng.Borders(xlEdgeRight)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With iRng.Borders(xlInsideVertical)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    With iRng.Borders(xlInsideHorizontal)
        .LineStyle = xlContinuous
        .ColorIndex = 0
        .TintAndShade = 0
        .Weight = xlThin
    End With
    Set iRng = Nothing
End Sub

Private Sub DisEvents() '禁用干扰项
    With ThisWorkbook.Application
        .ScreenUpdating = False '禁止屏幕刷新
        .EnableEvents = False '禁用事件
        .Calculation = xlCalculationManual '禁用自动计算
        .Interactive = False '禁止交互(在执行宏时,如果在表格输入内容会造成宏终止)
    End With
End Sub

Private Sub EnEvents() '启用
    With ThisWorkbook.Application
        .ScreenUpdating = True
        .EnableEvents = True
        .Calculation = xlCalculationAutomatic
        .Interactive = True
    End With
End Sub
