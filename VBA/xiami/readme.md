# 虾米的历史代码

![xiami](https://p0.meituan.net/dpgroup/054298176237ad08778f4d2a1568f33315087.png)

​	                                                                                                                (操作界面)



在虾米倒闭前, 写的爬虫工具

虾米的无损音乐(flac, 以及wav, mp3 320高音质格式)链接地址以非常简单的方式直接放在html中, 其安全验证也非常简单, 只是几个参数进行md5哈希即可破解

![music](https://p0.meituan.net/dpgroup/310cff2cfc538665cf430af99849ed0a78041.png)

除此之外就是cookie的时效

鉴于下载的文件非常大, winhttprequest下载不是很稳定, 下载调用外部工具cURL(**[curl-for-win](https://github.com/curl/curl-for-win)**)来下载.

爬虫的核心是WinHttpRequest

此外还涉及:

md5, vba的md5实现还是相对麻烦的

json, vba在这里已经有点乏力了

encode, 对字符进行编码

....

外部程序的调用和控制(如: 开始, 退出等)
