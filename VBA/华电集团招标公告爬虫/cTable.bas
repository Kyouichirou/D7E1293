Attribute VB_Name = "cTable"
Option Explicit
'��ҳ��ȡ
Function create_Table() As Worksheet
    Set create_Table = ThisWorkbook.Sheets.Add(After:=Worksheets(Worksheets.Count))
End Function
