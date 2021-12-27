# 豆瓣图书全站爬虫

## 涉及库的使用
|index|library|
|-----|-------|
|1|requests*|
|2| mysql_connector*|
|3| httpx*|
|4| os*|
|5| urllib*|
|6| time*|
|7| datetime*|
|8| random*|
|9| sys|
|10| random*|
|11| execjs*|
|12| configparser*|
|13| pkg_resources|
|14| json|
|15| re*|
|16| threading*|
|17| math|
|18| msvcrt*|
|19| functools|
|20| http|
|21| bs4*|
|22| aiohttp*|
|23| asyncio*|
|24| win32com|
|25| inspect|
|26| loguru*|

_* : 深度使用_

## 1. init模块
启动整个爬虫

## 2. browser模块(核心模块)
请求伪装成浏览器
提供两个外部接口
1. 直接启动
2. 添加新的书籍

## 3. config模块(核心模块)
设置程序的启动参数

## 4. control模块(核心模块)
控制程序的执行, 如暂停, 退出, 控制爬虫执行速度等
(英文输入法状态)
1. p, pause, 暂停(默认暂停90秒)
2. s, start, 开始
3. q, quit, 退出程序
4. -, 加快爬取的速度
5. +, 减慢爬取的速度
6. y, 允许重新断开网络, 重新获取新的IP
7. n, 取消网络的重新连接

## 5. constants模块
常量

## 6. crawler模块(核心模块)
具体请求的发出和调度

## 7. database模块(核心模块)
MySQL数据库实例化和操作接口

## 8. dateframe
时间格式转换和分离

## 9. download模块
批量图片的下载

## 10. httpx备用模块
备用请求库, 使用http/2协议发出

## 11. log模块(核心模块)
日志的记录

## 12. metadata模块(核心模块)
html文档的解析和数据的分离

## 13. other模块
辅助

## 14. price模块
价格的提取和单位的换算

## 15. router
控制路由器的断开和连接以获取新的IP

## spider模块(核心模块)
爬取具体内容的调度

## 16.zh模块
繁体转换为简体
为方便后续的数据处理, 统一将中文转换为简体

## 17. mysql包
MySQL数据库的具体操作

# 使用
```python
import douban_spider as dsc

if __name__ == '__main__':
    with dsc.Douban() as douban:
        douban.start()
```



