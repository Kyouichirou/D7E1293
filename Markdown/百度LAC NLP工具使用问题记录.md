# 百度LAC NLP工具使用问题记录

[GitHub](https://github.com/baidu/lac)

使用环境: anaconda, 4.10.3

首先是win32com的问题

```python
Deprecated since version 3.4: The imp module is deprecated in favor of importlib.
```

集成的win32com的版本比较旧, 其中有个模块使用 **imp** 这个库, imp已经不被鼓励使用, 将逐步[废弃](https://docs.python.org/3/library/imp.html).

手动升级win32com

```bash
pip install --upgrade pywin32 -i https://repo.huaweicloud.com/repository/pypi/simple
```

作者已经在新的版本解决这个问题, 使用[importlib](https://docs.python.org/3/library/importlib.html)和[types](https://docs.python.org/3/library/types.html)来取代imp.

更新后, 百度lac可以正常使用.

但是很快在另一个程序中调用win32com却出现问题

```python	
import win32api
import win32con

win32api.MessageBox(0, 'test', 'test', win32con.MB_OK)

# DLL load failed while importing win32api: The specified procedure could not be found.
```

作者在[readme.md](https://github.com/mhammond/pywin32/blob/main/README.md#the-specified-procedure-could-not-be-found--entry-point-not-found-errors)提及此问题.

> You can install pywin32 via pip:
>
> > pip install pywin32
>
> If you encounter any problems when upgrading (eg, "module not found" errors or similar), you should execute:
>
> > python Scripts/pywin32_postinstall.py -install
>
> This will make some small attempts to cleanup older conflicting installs.
>
> Note that if you want to use pywin32 for "system wide" features, such as registering COM objects or implementing Windows Services, then you must run that command from an elevated (ie, "Run as Administrator) command prompt.
>
> ### `The specified procedure could not be found` / `Entry-point not found` Errors?
>
> A very common report is that people install pywin32, but many imports fail with errors similar to the above.
>
> In almost all cases, this tends to mean there are other pywin32 DLLs installed in your system, but in a different location than the new ones. This sometimes happens in environments that come with pywin32 pre-shipped (eg, anaconda?).
>
> The possible solutions are:
>
> - Run the "post_install" script documented above.
> - Otherwise, find and remove all other copies of `pywintypesXX.dll` and `pythoncomXX.dll` (where `XX` is the Python version - eg, "39")
>
> ### Running as a Windows Service
>
> Modern Python installers do not, by default, install Python in a way that is suitable for running as a service, particularly for other users.
>
> - Ensure Python is installed in a location where the user running the service has access to the installation and is able to load `pywintypesXX.dll` and `pythonXX.dll`.
> - Manually copy `pythonservice.exe` from the `site-packages/win32` directory to the same place as these DLLs.

从安装到升级都有坑要踩.

找一下解决的方法, 试了几个, 都不行, 在[CSDN](https://blog.csdn.net/weixin_44007213/article/details/115275193)中找到解决方法

![img](https://p0.meituan.net/dpplatform/f7476bbd8e1618d6dc603a97835edd6512944.png)

1. 找到pywin32_postinstall.py文件
2. 执行
3. 重新运行程序