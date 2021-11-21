# 设置鼠标右键菜单调用Python脚本

![Image 087.png](https://7.dusays.com/2021/05/19/154ed785be618.png)

如上图所示, 准备为文件的右键菜单设置一个功能, 调用7zip压缩文件, 同时根据特定的要求生成密码, 在压缩文件的同时, 为压缩包添加密码

添加菜单

![Image 088.png](https://7.dusays.com/2021/05/19/e5538fc56851b.png)

添加注册表

![Image 089.png](https://7.dusays.com/2021/05/19/c9e50ffed3429.png)

在command下

修改键值为, python.exe的路径 + python脚本的文件的路径, 加上表示路径的参数 "%v"即可
