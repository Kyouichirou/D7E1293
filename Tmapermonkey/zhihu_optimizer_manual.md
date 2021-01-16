# 简介

**zhihu optimizer**, 这是一款让知乎变得更好的轻量级Tampermonkey脚本....._Make Thing Better and Simpler_

浏览器兼容测试: **chrome 80+**(x_64)完美运行, 已知不兼容chrome最低版本为: **64**(x_86), Firefox未作兼容测试

**Tampermonkey**版本: 4.11.6120

安装地址: [Github](https://github.com/Kyouichirou/D7E1293/raw/main/Tmapermonkey/zhihu%20optimizer.user.js)

安装地址: [Greasyfork](https://greasyfork.org/scripts/420005-zhihu-optimizer/code/zhihu%20optimizer.user.js)

(二选一即可)

推荐使用浏览器: [Centbrowser(百分浏览器)](https://www.centbrowser.cn/)

## 一, 屏幕颜色调节

生效页面: 全站

预置4种颜色可选, 在Tampermonkey菜单可选

分别为: 土黄色, 橄榄绿, 草原绿, 灰色(具体颜色效果参考实际)

亮度将根据时间自动梯度调节, 颜色, 透明度都将同步调节

支持暂时关闭当前页面颜色调节, 支持完全退出页面颜色调节

![颜色切换](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20089.jpg?raw=true)

## 二, 过滤器

生效页面:

1. 搜索(search)
2. 话题(Topic)
3. 问题和答案(question && answer)

支持两种种拦截方式:

1. blackName, 用户名, 例如: [故事档案局](https://www.zhihu.com/people/gu-shi-dang-an-ju-71)
3. blackKey, 关键词, 将过滤内容, 如果内容包含此关键词, 相关的信息将被移除, 使用需谨慎

````javascript
eg: const blackKey = ["留学中介", "肖战"];
````

blackkey需要在代码中修改, 该部分位于代码块的顶部(该功能尚未完善, 未作全面启用)

当点击"**Block**"按钮的时候, 相关页面中的用户回答的答案将被隐藏, 反之, "**unBlock**",  取消拦截, 将显示答案, 同步执行, 不需要刷新页面即可

此按钮将在用户页面的左下角生成, eg: [故事档案局](https://www.zhihu.com/people/gu-shi-dang-an-ju-71)

![Block按钮](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20099.jpg?raw=true)

## 三, 点击即突出内容

生效页面:

1. 搜索(search)
2. 话题(Topic)
3. 问题和答案(question && answer)

即当你点击页面的信息时, 将该部分的内容突出显示

## 四, 页面内容文字辅助颜色

生效页面: [专栏](https://zhuanlan.zhihu.com/)

对内容的文字颜色进行一定的规律调节, 缓解单一颜色文字的眼睛枯燥(理论上....), 突出英文字母, 和数字

预置红, 蓝两种基准色(即在这两种颜色上进行梯级调节)

字母和数字采用绿色和紫色

**需要注意的是**: 如果原文已经加粗(或者已经表示强调的内容), 标题, 链接等内容将不会受到影响

![多彩页面](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20095.jpg?raw=true)

#### 代码高亮

仅对于部分JavaScript的代码生效, 即知乎未进行关键字高亮的代码块, 仅突出显示关键字

## 五, 搜索框控制

1. 移除预置搜索框搜索词
2. 移除搜索框下的热门搜索, **不影响搜索建议和搜索历史**
3. 禁止搜索框在**空白状态**依然产生搜索的行为, 即不输入任何内容的状态下, 按回车键依然会搜索(关键词为知乎的热门搜索)

![搜索清洁](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20097.jpg?raw=true)

## 六, 快捷键

生效页面: [专栏](https://zhuanlan.zhihu.com/)

![快捷键示意图](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20105.jpg?raw=true)

已知**占用原页面**的登录和滚动到底部快捷键

分别为:

单键"**d**", **登录弹窗**(搜索快捷键, 豆瓣搜索占用)

"**shift**" + '**g**', 滚动到页面底部

### 1. 搜索

单键, 无辅助键

Google => '**g**', (实际站点为[DogeDoge](https://www.dogedoge.com/));

Zhihu => "**z**";

MDN => "**m**", (即MDN Web Docs);

Bilibili => '**b**';

Github => '**h**', ('g'被用在Google);

Douban => '**d**'

### 2. 高亮

支持4种颜色可选, 分别为黄色, 绿色, 紫色, 红色

辅助键: '**Shift**'键

yellow => '**y**';

green => '**g**';

purple => '**p**';

red => '**r**';

![高亮](https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20101.jpg?raw=true)

### 3. 清除高亮

辅助键: '**Shift**'键

clear => '**c**';

使用前选中已经被高亮的区域, 即可清除被高亮的部分

### 4. 编辑当前页面

即将当前页面转为可编辑的状态, 可以方便在打印页面的时候, 清除掉不需要的元素

"**F2**", 无辅助键

如果页面处于可编辑状态, 将关闭可编辑状态, 反之, 亦如此.

### 5. 自动滚屏

使用 [requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame) API, 不会出现滚屏抖动的问题

"**`**", 无辅助键, 该键位于"**Tab**"键上方(左上角的角落位置那个按键)

**双击**开始滚动或者暂停;

**调节速度**, 无辅助键

"**+**", 加速

"**-**", 减速

### 6. 翻页 (2.5.1版本新增)

方便左手也能在键盘上进行翻页操作

up => "**u**", 向上翻页

next => "**n**", 向下翻页

### 7. 快速复制代码

辅助键 "**Ctrl**" + 鼠标右键, 鼠标所在区域如果是代码区域, 该区域的代码将会自动被复制

## 七, 页面样式调整

#### 字体:

生效页面: 全局

轻微对字体进行调节, 稍稍改善字体的显示效果, 增加了一定的字体阴影

#### 页面内容加宽显示:

(同时将字体的对齐方式调节为两侧对齐)

生效页面:

1. 搜索(search)
2. 话题(Topic)
3. 问题和答案(question && answer)
4. 专栏

## 八, 其他

1. 去重定向, 即在打开外链知乎安全中心跳转(全局生效, 包括评论区)

2. 移除在为未登录状态下, 访问(问题 & 答案)页面出现的登录弹窗(**不影响正常的登录, 当你主动登录账号时**)
3. 剪切板优化, 移除版权声明, 将部分常用的中文符号换成对应的英文符号, 如中文空心句号, 换成英文实心句号

4. 对广告内容进行轻微调整....



