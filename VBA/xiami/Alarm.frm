VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Alarm 
   Caption         =   "Tip"
   ClientHeight    =   4035
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   10620
   OleObjectBlob   =   "Alarm.frx":0000
   StartUpPosition =   1  '所有者中心
End
Attribute VB_Name = "Alarm"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Option Explicit

Private Sub CheckBox1_Click()
    If Me.CheckBox1.Value = True Then
        ThisWorkbook.Sheets("Temp").Cells(1, 1) = 1
    Else
        ThisWorkbook.Sheets("Temp").Cells(1, 1) = ""
    End If
End Sub
