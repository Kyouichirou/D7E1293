Attribute VB_Name = "xml"
Option Explicit
Option Base 1
Dim isExit As Boolean

Sub e_data(ByRef o As Variant, ByRef rindex As Long, ByRef arr() As String, Optional ByVal keyword As String)
    Dim tmp_text As String
    
    If (isExit = True) Then Exit Sub
    If (o.ChildNodes.Length = 0) Then
        Dim at As String
        Dim attrs As Object
        Set attrs = o.ParentNode.Attributes
        If (attrs.Length > 0) Then
            Dim n As String, i As Long
            n = attrs(0).text
            Select Case n
                Case "id": i = 1
                Case "subject": i = 2
                Case "from": i = 3
                Case "read": i = 4
                Case "receivedDate": i = 5
                Case "attached": i = 6
                Case "popRead": i = 7
                Case Else: i = 0
            End Select
            If (i > 0) Then
                If (i = 7) Then
                    arr(rindex, 4) = o.text + "(pop)"
                ElseIf (i = 2 And Len(keyword) > 0) Then
                    Dim t As String
                    t = o.text
                    If (InStr(1, t, keyword, vbTextCompare) = 0) Then
                        isExit = True
                    Else
                        arr(rindex, i) = t
                    End If
                Else
                    If i = 3 Then
                        tmp_text = o.text
                        If InStr(1, tmp_text, "<<", vbBinaryCompare) > 0 Then
                            tmp_text = Replace(tmp_text, "<<", "[")
                            tmp_text = Replace(tmp_text, ">>", "]")
                        End If
                         If InStr(tmp_text, "<") <> 0 Then
                            
                            
                             arr(rindex, i) = Split(Split(tmp_text, "<")(1), ">")(0)
                          Else
                        
                            arr(rindex, i) = tmp_text
                         End If
                    Else
                     arr(rindex, i) = o.text
                    End If
                End If
            End If
        End If
        Exit Sub
    End If
    Dim item As Object
    For Each item In o.ChildNodes
        e_data item, rindex, arr, keyword
    Next
End Sub

Function string_To_xml(ByRef content As String, ByRef rindex As Long, ByVal keyword As String, ByVal eP As Long) As String()
    Dim doc As Object, rint As Long
    Dim item As Object, arr As Object, c As Object, d As Object, x As Object, carr() As String
    
    On Error GoTo errhandle
    Set doc = CreateObject("MSXML2.DOMDocument.6.0") ' CreateObject("MSXML2.DOMDocument")
    doc.LoadXML (content)
    For Each item In doc.DocumentElement.ChildNodes
        If (item.nodeName = "array") Then
            Set arr = item
            Exit For
        End If
    Next
    If Not arr Is Nothing Then
        ReDim carr(eP, 6)
        Dim ic As Long, ik As Long
        rint = rindex
        For Each c In arr.ChildNodes
            isExit = False
            ik = ik + 1
            e_data c, rindex - rint + 1, carr, keyword
            If (isExit = False) Then rindex = rindex + 1
        Next
        ic = rindex - rint
        If (ic = 0) Then
            If (Len(keyword) > 0) Then MsgBox "未获取到指定邮件", vbInformation, "提示" Else MsgBox "没有更多邮件了", vbInformation, "提示"
        Else
            Dim n As Long, j As Long, tmp() As String
            ReDim tmp(ic, 6)
            ReDim string_To_xml(ic, 6)
            For n = 1 To ic
                For j = 1 To 6
                    tmp(n, j) = carr(n, j)
                Next
            Next
            ThisWorkbook.Sheets("mail").Cells(rint, 1).Resize(ic, 6) = tmp
            string_To_xml = tmp
            Debug.Print ("获取邮件成功")
        End If
    End If
    Set doc = Nothing
    Exit Function
errhandle:
    Debug.Print Err.Description
   MsgBox "邮件提取失败", vbInformation, "提示"
End Function

Function get_Attach(ByRef content As String) As String()
    Dim doc As Object, rint As Long
    Dim item As Object, arr As Object, c As Object, d As Object, x As Object, carr() As String
On Error GoTo errhandle
    Set doc = CreateObject("MSXML2.DOMDocument.6.0") 'CreateObject("MSXML2.DOMDocument")
    doc.LoadXML (content)
    For Each item In doc.DocumentElement.ChildNodes
        If (item.nodeName = "object") Then
            Set arr = item
            Exit For
        End If
    Next
    If Not arr Is Nothing Then
        Dim tmp As Object, text As String, g As Byte, i As Long
        i = 1
        For Each c In arr.ChildNodes
            If (c.Attributes(0).text = "attachments") Then
                Dim m As Long
                m = c.ChildNodes.Length
                If (m = 0) Then Exit Function
                Dim it As Object, k As Long
                ReDim carr(m, 2)
                ReDim get_Attach(m, 2)
                For Each tmp In c.ChildNodes
                    For Each it In tmp.ChildNodes
                        text = it.Attributes(0).text
                        If (text = "id") Then
                            carr(i, 1) = it.text
                            k = k + 1
                            If (k = 2) Then
                                k = 0
                                i = i + 1
                                Exit For
                            End If
                        ElseIf (text = "filename") Then
                            carr(i, 2) = it.text
                            k = k + 1
                            If (k = 2) Then
                                k = 0
                                i = i + 1
                                Exit For
                            End If
                        End If
                    Next
                Next
                get_Attach = carr
                Exit For
            End If
        Next
    End If
    Set doc = Nothing
    Exit Function
errhandle:
    MsgBox "读取邮件附件失败", vbCritical, "警告"
End Function
