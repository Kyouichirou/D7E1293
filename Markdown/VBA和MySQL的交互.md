# VBA和MySQL的交互

## 环境

1. Office 2016, 32bit(注意这里的版本问题)
2. MySQL 8.x

安装教程略过, 但是在安装驱动时需要注意安装对应的驱动和安装的office版本相对应, 32位的office安装32为, 64位office安装64为位.

(注: 建议使用MySQL installer来安装和管理MySQL, 方便配置和调整.)

![odbc](https://p0.meituan.net/dpplatform/b9fc192e64f0721be2132f1d0df4f2b335356.png)

## VBA和MySQL的连接主要依赖组件

VBA端: 依赖于Microsoft ActiveX Data Object

*(注: 或者可以补充勾选Microsoft ActiveX Data Objects Recordset 2.8 Library)*

![ado](https://p0.meituan.net/dpplatform/975f61a2aa60f4da4d6a12d72c32416410979.png)

中间件: ODBC(Open Database Connectivity)

## 配置连接

在Windows中需要配置

![ODBC](https://p1.meituan.net/dpplatform/20a9b6a4cca4b90093ac53f59a0add36166724.png)

注意配置需要区分开32位和64位和安装的office, ODBC一致)

打开后添加驱动

![driver](https://p0.meituan.net/dpplatform/adfe89756c7edfa791a0818eef316a7338019.png)

unicode即可

配置数据库的连接

![cofigs](https://p0.meituan.net/dpplatform/8c6c040926a6835b8177422ee7564a7a41985.png)



填写完参数, 务必测试连接是否可用.

VBA连接测试

```vbscript
Option Explicit
        
Sub test()
    Dim con As New ADODB.Connection
    
    con.ConnectionString = "Driver={MySQL ODBC 8.0 Unicode Driver};Server=localhost;DB=test_db;UID=root;PWD=123456;OPTION=3;"
    con.Open
    MsgBox ("connect" & vbCrLf & "mysql" & con.State & vbCrLf & "mysql version" & con.Version)
    con.Close
    Set con = Nothing
End Sub
```

参数解析

> "Driver={MySQL ODBC 8.0 Unicode Driver};Server=localhost;DB=test_db;UID=root;PWD=123456;OPTION=3;"

Driver: 驱动名称

Server: 数据库地址

DB: 需要连接的数据库具体名称

UID: 用户名称

PWD: 登录密码

OPTION: 取自[官方文档](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-configuration-connection-without-dsn.html), 和驱动的工作方式有关, 但是这个参数=3没有查到具体的含义,  在[文档](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-configuration-connection-parameters.html)中没有提及3的含义

## 在局域网中访问

1. 确保Windows防火墙(假如处于开启状态)的进站规则当中包含MySQL的端口处于开放的状态(默认端口3306/33060), 使用前可以先ping对应的主机是否可用.
2. [配置数据库的权限](https://www.cnblogs.com/chig/p/11907047.html), 允许局域网访问.

