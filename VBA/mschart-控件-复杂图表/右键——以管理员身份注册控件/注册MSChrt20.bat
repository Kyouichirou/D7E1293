@echo 开始注册
copy MSChrt20.ocx %windir%\system32\
regsvr32 %windir%\system32\MSChrt20.ocx /s
@echo 注册成功
@pause
