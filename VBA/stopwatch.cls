'@name stopwatch
'@description:
'利用系统提供的api, 高精度计时器(精确到微秒)
Option Explicit
'----https://docs.microsoft.com/en-us/windows/win32/api/profileapi/nf-profileapi-queryperformancecounter
'---Retrieves the current value of the performance counter, which is a high resolution (<1us) time stamp that can be used for time-interval measurements.
Private Declare Function QueryPerformanceCounter Lib "kernel32" (lpPerformanceCount As UINT64) As Long
Private Declare Function QueryPerformanceFrequency Lib "kernel32" (lpFrequency As UINT64) As Long
Private pFrequency As Double
Private pStartTS As UINT64
Private pEndTS As UINT64
'-------------------------------https://clickhouse.yandex/docs/zh/data_types/int_uint/
'------------------------------https://docs.microsoft.com/zh-cn/dotnet/api/system.uint64?redirectedfrom=MSDN&view=netframework-4.8
Private pElapsed As Double
Private pRunning As Boolean
Private Type UINT64
    LowPart As Long
    HighPart As Long
End Type
Private Const BSHIFT_32 = 4294967296# ' 2 ^ 32

Private Sub Class_Initialize()
    Dim PerfFrequency As UINT64
    QueryPerformanceFrequency PerfFrequency
    pFrequency = U64Dbl(PerfFrequency)
End Sub

Private Sub Class_Terminate()
    pElapsed = 0: pFrequency = 0
End Sub

Private Function U64Dbl(U64 As UINT64) As Double
    Dim lDbl As Double, hDbl As Double
    lDbl = U64.LowPart
    hDbl = U64.HighPart
    If lDbl < 0 Then lDbl = lDbl + BSHIFT_32
    If hDbl < 0 Then hDbl = hDbl + BSHIFT_32
    U64Dbl = lDbl + BSHIFT_32 * hDbl
End Function

Friend Property Get Elapsed() As Double
    If pRunning Then
        Dim pNow As UINT64
        QueryPerformanceCounter pNow
        Elapsed = pElapsed + (U64Dbl(pNow) - U64Dbl(pStartTS)) / pFrequency
    Else
        Elapsed = pElapsed
    End If
End Property
 
Friend Sub Start()
    If Not pRunning Then
        QueryPerformanceCounter pStartTS
        pRunning = True
    End If
End Sub
 
Friend Sub Pause()
    If pRunning Then
        QueryPerformanceCounter pEndTS
        pRunning = False
        pElapsed = pElapsed + (U64Dbl(pEndTS) - U64Dbl(pStartTS)) / pFrequency
    End If
End Sub
 
Friend Sub Reset()
    pElapsed = 0
    pRunning = False
End Sub
 
Friend Sub Restart()
    pElapsed = 0
    QueryPerformanceCounter pStartTS
    pRunning = True
End Sub
 
Friend Property Get Running() As Boolean
   Running = pRunning
End Property

'Sub StopTimer() '计时器 /理论上较高精度
'With New Stopwatch
'    .Restart
''     Call sub
'    .Pause
'    Debug.Print Format(.Elapsed, "0.000000"); " seconds elapsed"
'End With
'End Sub
