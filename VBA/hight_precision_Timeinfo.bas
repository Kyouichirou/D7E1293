'@name: hight_precision_Timeinfo
'@author: HLA
'@description:
'高精度时间信息
Option Explicit
'https://docs.microsoft.com/en-us/windows/win32/api/minwinbase/ns-minwinbase-systemtime
'https://docs.microsoft.com/en-us/windows/win32/api/timezoneapi/ns-timezoneapi-time_zone_information
'https://blog.csdn.net/GW569453350game/article/details/79638176
'https://docs.microsoft.com/zh-cn/office/vba/language/reference/user-interface-help/now-function
'注意Excel内置有1900, 1904两个版本的时间系统
'https://blog.csdn.net/sjf0115/article/details/7084192
'https://docs.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getlocaltime
#If Win64 Then
    Private Declare PtrSafe Sub GetTimeZoneInformation Lib "kernel32" (lpTimeZoneInformation As TIME_ZONE_INFORMATION)
    Private Declare PtrSafe Sub GetSystemTime Lib "kernel32" (lpSystemTime As SYSTEMTIME)
#Else
    Private Declare Sub GetTimeZoneInformation Lib "kernel32" (lpTimeZoneInformation As TIME_ZONE_INFORMATION)
    Private Declare Sub GetSystemTime Lib "kernel32" (lpSystemTime As SYSTEMTIME)
#End If
Private Type SYSTEMTIME
    sYear As Integer
    sMonth As Integer
    sDayOfWeek As Integer
    sDay As Integer
    sHour As Integer
    sMinute As Integer
    sSecond As Integer
    sMilliseconds As Integer
End Type

Private Type TIME_ZONE_INFORMATION
    iBias As Long
    iStandardName(32) As Integer
    iStandardDate As SYSTEMTIME
    iStandardBias As Long
    iDaylightName(32) As Integer
    iDaylightDate As SYSTEMTIME
    iDaylightBias As Long
End Type

Function Get_Time_Stamp(Optional ByVal isThirteen As Boolean = True) As String '获取高精度的时间信息
    If isThirteen = True Then
    Dim sysTime As SYSTEMTIME
        GetSystemTime sysTime
        Get_Time_Stamp = ((Now - 70 * 365 - 19) * 86400 - 8 * 3600) & sysTime.sMilliseconds
    Else
        Get_Time_Stamp = ((Now - 70 * 365 - 19) * 86400 - 8 * 3600) 'DateDiff("s", "01/01/1970 00:00:00", Now()) 'DateDiff("s", "01/01/1970 00:00:00", time)
    End If
End Function

Function Get_TimeZone() As Integer      '获取时区
    Dim sysTime As SYSTEMTIME
    Dim tzInfo As TIME_ZONE_INFORMATION
    
    GetSystemTime sysTime
    GetTimeZoneInformation tzInfo
    Get_TimeZone = tzInfo.iBias / 60
End Function

Function TimeStamp2Date(ByVal sTime As String) As String '将时间戳转为正常日期
    Dim i As Byte
    
    If IsNumeric(sTime) = False Then Exit Function
    i = Len(Trim$(sTime))
    If i = 13 Then
        TimeStamp2Date = ThisWorkbook.Application.WorksheetFunction.Text((sTime / 1000 + 8 * 3600) / 86400 + 70 * 365 + 19, "yyyy/mm/dd hh:mm:ss.000") 'format不支持这种格式的转换
    ElseIf i = 10 Then
        TimeStamp2Date = ThisWorkbook.Application.WorksheetFunction.Text((sTime + 8 * 3600) / 86400 + 70 * 365 + 19, "yyyy/mm/dd hh:mm:ss") 'DateAdd("s", Unix timestamp, "01/01/1970 00:00:00")
    End If
End Function
