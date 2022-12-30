# 豆瓣小组爬虫

> 抓取豆瓣小组的全部内容

每15分钟抓取一次, `esc`, `q`, 退出执行

触发反爬, 自动关闭爬虫

数据存储使用`MongoDB`

- 文本 - 分词
- 绘图 - Gephi
- 用户 - 活跃
- 用户 - 关键词
- 小组的话题偏好
- 地域活跃
- 地域偏好

```bash
# -i, id, the id of group
# -w, wait, the interval time of run

python main.py -i 613560 -w 3600
```