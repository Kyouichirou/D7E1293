# 豆瓣小组爬虫

抓取豆瓣小组的全部内容, 最初的目的是抓取[豆瓣象组](https://www.douban.com/group/613560/?ref=sidebar)的信息.

> 关于豆瓣象组, 虽号称主要关注网红八卦, 实则一个极端病态的"女拳"垃圾桶, 对于研究极端病态信息传播以及其形成是一个相对高价值的信息源.


## 程序

每15分钟抓取一次, 终端上(执行), `esc`, `q`, 退出执行

触发反爬, 将自动关闭爬虫.

数据存储使用`MongoDB`(需要预先安装), 数据库名称: douban_spider; 表名(collection): group

```bash
# -i, id, the id of group
# -w, wait, the interval time of run, second

python main.py -i 613560 -w 3600
```

[![pCmuegJ.png](https://s1.ax1x.com/2023/06/13/pCmuegJ.png)](https://imgse.com/i/pCmuegJ)