VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm1 
   Caption         =   "UserForm1"
   ClientHeight    =   5970
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   8655
   OleObjectBlob   =   "UserForm1.frx":0000
   StartUpPosition =   1  '所有者中心
End
Attribute VB_Name = "UserForm1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub UserForm_Initialize()
    Dim sh As Worksheet, i As Double, k As Byte
    k = 1
    For Each sh In Worksheets
        i = AscW(Right$(sh.name, 1))
        If (i < 65 Or i > 122) Then
            Me.Controls("label" & k).Caption = sh.name
            k = k + 1
        End If
    Next
End Sub
