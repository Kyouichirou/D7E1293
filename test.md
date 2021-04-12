# 简介
![optimizer](https://img.meituan.net/csc/083a417e5e990b04248baf5912a24ca2333972.png)

*zhihu optimizer, 这是一款让知乎变得更好的轻量级Tampermonkey脚本.....Make Thing Better and Simpler*

浏览器兼容测试: chrome 80+ 完美运行; Firefox未作兼容测试

Tampermonkey版本: 4.1x

*(建议使用尽可能高版本的chrome | chromium浏览器和Tampermonkey扩展)*

安装地址: [Github](https://github.com/Kyouichirou/D7E1293/raw/main/Tmapermonkey/zhihu%20optimizer.user.js)

安装地址: [Greasyfork](https://greasyfork.org/scripts/420005-zhihu-optimizer/code/zhihu%20optimizer.user.js)

*(二选一即可)*

推荐使用浏览器: [Centbrowser(百分浏览器)](https://www.centbrowser.cn/)

推荐搭配脚本: [Toc Bar, auto-generating table of content](https://greasyfork.org/zh-CN/scripts/406337-toc-bar-auto-generating-table-of-content)

# 目录

## 一. 快捷键
快捷键是本脚本的*核心*组成部分, 大量的功能的使用或关闭都是通过快捷键操作来完成的

部分快捷键位置示意图

![位置](https://img.meituan.net/csc/1cadca7aeb2a4c0f3fd11573d894c00b116690.jpg)

由于快捷键的数量很多, *具体以表格内容的为标准*, 上图仅作为参考

![shortcuts](https://img.meituan.net/csc/df2540f418efadc25e0562df5924bb8b193354.png)

注:
部分功能和知乎页面预置的快捷键有冲突, 冲突的几组快捷键将被本脚本的取代掉

![预置](https://img.meituan.net/csc/a24e8e72e0d7ba7d7c613e7a18a130c147530.png)

一些需要注意的快捷键:

1. 高亮
   支持4种颜色可选, 分别为黄色, 绿色, 紫色, 红色

   辅助键: '**Shift**'键
   yellow => '**y**';
   green => '**g**';
   purple => '**p**';
   red => '**r**';

   通过此项, 将可以对专栏文章进行标记处理, 相应的标记在使用"打印"为PDF时,将会保存下来

   ![marker_PDF](https://img.meituan.net/csc/ed528fdce687ef6f8c06c3a28c7c5887173736.png)

2. 命令行

   辅助键: shift

   q => 'query';

   具体支持的命令参考命令行部分

3. 多搜索引擎

   辅助键: shift + 'm', (multi)

   具体参考搜索多搜索引擎部分

4. 编辑当前页面

   辅助键: 无, F2

   编辑模式将使得当前页面可以被用户自由修改; 为避免页面异常, 在使用后, 务必退出可编辑模式

   在[答案](https://www.zhihu.com/question/26006703/answer/129209540), [问题](https://www.zhihu.com/question/26006703)页面也提供可编辑选项

   ![可编辑](https://img.meituan.net/csc/02631938ef55c0f7322010252216a2ef87976.png)

5. 自动滚屏

   辅助键: 无
   "**`**", 该键位于"**Tab**"键上方(左上角的角落位置那个按键)

   **双击**开始滚动或者暂停;

   此项功能是自动化的基础, 自动化围绕着此功能展开, 具体参考自动化部分.

   其中和此项密切相关的快捷键为'shift' + 'a'

6. PDF打印排版优化

   辅助键: shift + "["

   清除不相关的内容(轻微调整页面布局), 方便生成主要包含正文PDF文件, 增加和 [Toc Bar, 自动生成文章大纲](https://greasyfork.org/zh-CN/scripts/406337-toc-bar-auto-generating-table-of-content)联动

   ![自动目录生成](https://img.meituan.net/csc/f5b9ba7c11599ce0bd502e448b50d51b98748.png)

## 二. 过滤器

### 2.1 生效页面:
1. [搜索(search)](https://www.zhihu.com/search?q=%E6%9C%BA%E5%99%A8%E5%AD%A6%E4%B9%A0&type=content)
2. [话题(topic)](https://www.zhihu.com/topic/19559450)
3. [问题(question)](https://www.zhihu.com/question/26006703)
4. [答案(answer)](https://www.zhihu.com/question/26006703/answer/129209540)

### 2.2 支持拦截方式:
1. 用户名(user)
   该用户发表的所有内容将在上述页面被移除掉, 例如: [故事档案局](https://www.zhihu.com/people/gu-shi-dang-an-ju-71)
2. 关键词(keyword)
   此项覆盖的范围最广, 内容, URL, document.title..., 假如URL或document.title包含有关键词的, 将在打开页面前警示用户, 如果内容包含的, 相应项将从上述页面移除
3. 问题(question)
   该问题所包含的所有答案将从上述页面被移除掉
4. 答案(answer)
5. 专栏文章(article)

### 2.3 使用方法:
使用非常简单, 只需要点击相应的按钮即可完成, 取消也是如此

1. 用户名拦截:
   打开用户的主页面, 如 [盐选成长计划](https://www.zhihu.com/people/liu-kan-shan-78-51/answers)

   ![拦截|取消拦截](https://img.meituan.net/csc/3e2c97319998a8f9517ff5691dd1d1da335808.jpg)

2. 话题拦截:
   可以在[搜索页面](https://www.zhihu.com/search?q=JavaScript&type=content)或[话题页面](https://www.zhihu.com/topic/19552521)执行拦截

   ![话题|搜索](https://img.meituan.net/csc/6f302ba21b318b6ded8cba7674b0700a317790.png)

3. 问题拦截:
   可以在[搜索页面](https://www.zhihu.com/search?q=JavaScript&type=content), [答案](https://www.zhihu.com/question/280091684/answer/505734063), [问题](https://www.zhihu.com/question/280091684)或[话题页面](https://www.zhihu.com/topic/19552521)

   ![答案|搜索](https://img.meituan.net/csc/fbb8082e3e94cb3cdb8507265fae7e2e189187.png)

4. 其他的项皆是类似操作

   ![问题|文章](https://img.meituan.net/csc/3637f205bd2e6b89467e0830c89e0f21828612.png)

### 2.4 注意事项
注1: 拦截的优先级, 针对包含用户名称的项, 用户名优先级最高; 全局, 关键词的优先级最高
注2: 用户拦截, 为唯一的同步操作, 即在拦截或取消拦截, 相应的操作会直接**同步**到所有的上述页面, 不需要刷新页面
注3: 用户拦截和话题拦截的数据存储于Tampermonkey内置存储, 专栏文章和答案拦截存储于浏览器的**IndexedDB**中(相应区别见Q&A)
注4: 关键词用户自定义功能尚未开放, 内置关键词仅包含少量的常见垃圾词汇

## 三. 命令行

![图示](https://img.meituan.net/csc/5409e56911b74b0fa3e8e0e3fc40c62587055.png )

目前支持的命令有:

1. bgi, 用于设置[话题](https://www.zhihu.com/topic/19559450), [答案](https://www.zhihu.com/question/26006703/answer/129209540), [问题](https://www.zhihu.com/question/26006703), [搜索](https://www.zhihu.com/search?q=%E6%9C%BA%E5%99%A8%E5%AD%A6%E4%B9%A0&type=content)页面的背景图片, 亦或者可以下载对应的壁纸

如: 设置背景壁纸为必应每日壁纸

![图示](https://img.meituan.net/csc/2dcf4e34b0d65ab329fb470900253b0e1072591.png)

![图示](https://img.meituan.net/csc/959bd8ed1b752e222581dc42b3feb54f1170477.png)

![图示](https://img.meituan.net/csc/7b55294048790bfdb34ea87eed46d4401373678.png)

当然你也能自定义壁纸或者使用阅读器的壁纸

如果图片载入太慢, 或者你特别喜欢某张壁纸, 可以 *$bgi -f* , 此命令将会固定使用该壁纸, 同时对壁纸进行压缩缓存, 以获得更好的使用体验
 
2. light, 用于设置屏幕颜色遮罩

3. fold, expand, 顾名思义, 用于在话题, 答案|问题, 搜索页面折叠, 展开相应的内容, 但需要注意的是每次展开将被限制5项(这是为了避免短时间内载入大量的内容, 在载入内容的同时将同时触发过滤器检查机制, 大量的内容会导致页面潜在可能的卡顿)

4. reset, 用于重置数据的存储, 使用的时候需要谨慎(小心数据的误删)

5. help, 打开相应的帮主页面
   
![命令行](https://img.meituan.net/csc/5409e56911b74b0fa3e8e0e3fc40c62587055.png)

注: 假如在使用脚本的过程中出现异常, 可以尝试清除Tampermonkey等存储的数据

## 四. 多搜索引擎

![search](https://img.meituan.net/csc/29bae0a159923ec0c3f196326b6e3a2816319.png)

1. 单一快捷键

选中搜索, 'dm', 'db', 这两项不支持, 直接选中搜索

2. 弹窗搜索
   * 2.1 单一搜索引擎
   如 z java, 表示在使用知乎搜索引擎, 来搜索java, 支持'dm', 'db'
   * 2.2 混合搜索
   如 $ -z -b -d 我不是药神, 表示同时搜索知乎, B站, 豆瓣
   ![图示](https://img.meituan.net/csc/0001ea9bcc0fd4db876f2a9aec987c0f47693.png)

*注意, 不同搜索引擎之间需要用空格隔开*

## 五. 数据的导出与导入

即, IndexedDB的数据

导出, 快捷键'shift' + 'b', (backup)

导入, 快捷键 'shift' + 'i', (import); 取消此窗体也为此快捷键

![pannel](https://img.meituan.net/csc/0d25d9875671812fd739b1d8a825a02375355.png)

在清理浏览器前, 切记备份数据

注意: www.zhihu.com, zhuanlan.zhihu.com的数据要分别导出或导入

## 六. 页面颜色

生效页面: 全站

预置4种颜色可选, 在Tampermonkey菜单可选

![menu](https://img.meituan.net/csc/b606175e1bb3c603e6a195c3f036187b42930.png)

分别为: 土黄色, 橄榄绿, 草原绿, 灰色(具体颜色效果参考实际)

亮度将根据时间自动梯度调节, 颜色, 透明度都将**同步**调节

支持暂时关闭当前页面颜色调节, 支持完全退出页面颜色调节

支持使用命令行进行自定义调节(具体参考命令行), 假如你在命令行设置自定义屏幕颜色遮罩后, 使用菜单栏项进行设置, 则通过命令行进行的设置将被自动清除

## 七. 专栏文章文字颜色辅助

生效页面: [专栏文章](https://zhuanlan.zhihu.com/p/162363262)

对内容的文字颜色进行一定的规律调节, 预置红, 蓝两种基准色(即在这两种颜色上进行梯级调节)

突出英文字母, 和数字, 字母和数字采用绿色和紫色

需要注意的是: 如果原文已经加粗(或者已经表示强调的内容), 标题, 链接等内容将不会受到影响

![colorful](https://img.meituan.net/csc/123ced490d36fedd5bb0027ec36c9207192735.jpg)

默认开启, 需要手动关闭, 'shift' + 'T'

## 八. 自动化

1. 阅读器

   生效页面[问题](https://www.zhihu.com/question/280091684), [答案](https://www.zhihu.com/question/280091684/answer/505734063)

   ![Tips](https://img.meituan.net/csc/e942e7b4ef4cfe62669a655e75529ed979143.png)

   * 1.1 自动加载下一内容

      快捷键'shift' + 'a' (auto), 开启或关闭自动加载, 以下内容皆如此

      在开启自动模式后, 'a', 快捷键将可以临时暂停

   * 1.2 自动加载阅读模式

      快捷键'shift' + 'd' (direct)

      在打开页面5秒后, 将自动加载阅读模式

   * 1.3 '护士模式'

      快捷键 'shift' + 'nurse'(护士)

      在打开页面5秒后, 将自动加载阅读模式, 同时自动开启自动模式

2. 专栏文章

   只支持'shift' + 'a', 自动加载模式, 但是需要注意的是, 你当前阅读的文章**必须**在侧边栏的目录中, 如, 下图所示

   ![menu](https://img.meituan.net/csc/a0bfa1ead6476d59e4f41d3bbc6d13b089122.png)

3. 注意事项

   * 3.1 开启自动模式之后, 为了避免冲突, 部分功能可能会暂时禁用, 如加载间隙期(如等待5s), 手动去点击一些其他的项目, 或退出阅读模式等都会受到限制, 可以关闭自动模式之后在进行操作

   * 3.2 在[答案](https://www.zhihu.com/question/280091684/answer/505734063), [问题](https://www.zhihu.com/question/280091684)页面下, 阅读器模式, 由于答案的长短不一(如只有几十个字), 将会自动分析其内容长度, 来决定在当前答案停留的时间, 为避免过短时间滚动到下一答案, 将会稍微延长等待时间

## 九. 侧边栏

![图示](https://img.meituan.net/csc/7d65d0d4df78bae0b0a4a46652c8c5c6129268.png)

1. 专栏(column)
   * 1.1 订阅(subscribe)
      上限10项, 用于你当前急切关注的专栏, 超出上限, 将根据订阅的先后进行清除, 即早期添加进来的将被后期添加的取代

   * 1.2 跟随(follow)
      近似于fans, 无理性的, 将你喜欢的专栏都可以装进来, 不设上限

2. 检索
   
   *注意不带'$'开头则默认检索你follow的专栏, 带$号的将检索对应的项*

   * 2.1 按关键词, 单一关键词, $a=(python), 多个关键词$a=(python 机器学习), 使用空格进行分隔, **括号必须存在**
   
   * 2.2 按时间搜索, 支持小时(hour), 天数(day), 星期(week), 月份(month), 年(year)
         $h<24, 表示收藏时间小于24个小时, **多个条件**, $d>1 $d<7, 即收藏时间大于1天, 小于7天
   
   * 2.3 按文章ID搜索, $p=102274476, (**精确搜索**)
   
   * 2.4 **混合条件**搜索(时间+关键词), 如: $d>3 $d<7 $a=(python javascript), 即收藏时间大于3天小于7天, 关键词包含python和JavaScript;

   * 2.5 收藏的答案将有别于收藏的专栏文章, 使用 $q 进行检索, 如 $q=javascript, 或 $q=javascript python

3. 收藏
   3.1 专栏
   3.2 阅读器

4. 稍后阅读
   4.1 专栏
   快捷键 shift + 'l', (read it later)
   4.2 阅读器

5. 注意事项:
   在'pages'项中, 有一个'reverse', 可以对目录进行倒排序, 可以方便查看该专栏很久以前发表的文章或你follow的专栏

## 十. 白噪音

预置10种不同风格的白噪音可选, 相关操作详见与快捷键操作. 但需要注意的是主页已经预设音频控制项(不需要手动开启)

## 十一. 主页

将征用知乎专栏首页作为数据的汇总页面[知乎专栏](https://zhuanlan.zhihu.com/)

你subscribe, follow的专栏, 专栏文章或答案收藏, 稍后阅读等数据将在此页面汇聚, 作为个人的新主页

![home_page](https://img.meituan.net/csc/f1cafa0a3dd097cfdb84c667de69c337184007.png)

## 十二. 阅读器

![reader](https://img.meituan.net/csc/50385a20c049cd0acf0ce8de69259fee886925.png)

界面以及主要功能介绍

![picture](https://img.meituan.net/csc/746b1a627e7d83c5166e3d5879df4de4926692.png)

在图片模式下, 并不会加载所有的当前页面图片, 只加载含有大图(原图)的图片

## 十三. 问题|答案

![图示](https://img.meituan.net/csc/3cda29cb07ae01f1d22c324d772b9671582630.png)

## 十四. 搜索

![图示](https://img.meituan.net/csc/88c508ef37a0ff4aeba1e48556762aac715119.png)

简单模式, 仅保留搜索的主要内容, 移除掉知乎的商业推广, 如live, 盐选, 视频等

![live](https://img.meituan.net/csc/64ae30ac69a823d9dd5eacc3d70bbbd9159776.png)

## 十五. 专栏

![图示](https://img.meituan.net/csc/5964cd0c25283ad4d19a9a5aeb38510d225676.png)

## 十六. 搜索框控制

1. 移除预置搜索框搜索词
   
2. 移除搜索框下的热门搜索, **不影响搜索建议和搜索历史**
   
3. 禁止搜索框在**空白状态**依然产生搜索的行为, 即不输入任何内容的状态下, 按回车键依然会搜索(关键词为知乎的热门搜索)

![搜索清洁](https://img.meituan.net/csc/0752a89f637655991bd1fbaa2fe680b068842.jpg)

## 十七. 错误或拦截执行过节提示

F12即可查看到包含脚本信息, 过滤内容提示, 错误等
![console](https://img.meituan.net/csc/42d25b5451a71b56c6340d1bd7680f2537980.png)

## 十八. 其他

1. 去重定向
   即在打开外链知乎安全中心跳转(全局生效, 包括评论区)

2. 未登录账号弹窗
   移除在为未登录状态下, 页面出现的登录弹窗(**不影响正常的登录, 当你主动登录账号时**)

3. 剪切板优化
   移除版权声明, 将部分常用的中文符号换成对应的英文符号, 如中文空心句号, 换成英文实心句号, 此项默认开启, 如需关闭此设置, 见于快捷键操作部分

4. 广告内容调整
   对广告内容进行轻微调整

5. 滚动辅助
   拦截导致页面在自动滚动时出现卡顿的setInterval事件

6. 页面宽度调整
   
7. 字体微调整, 略微增加点阴影

# Q&A

## 一. 数据存储

数据的存储选择了两种不同的存储方式

1. Tampermonkey自带的数据存储, 这部分的数据为相对重要的数据, 数据量较小的数据, 如关注的专栏, 屏蔽掉的用户, 屏蔽掉的话题, 问题

2. [IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API/Using_IndexedDB), 反之, 用于大规模的数据的存储, 如收藏的文章(以及其生成的摘要, 备注, 标签等),屏蔽掉的答案或专栏文章

注意事项:
1. 使用IndexedDB存储的问题
这是高度受制于浏览器, 如同源限制(简单的理解就是zhuanlan.zhihu.com无法和www.zhihu.com进行直接的数据访问), 限制了IndexedDB的可用性, 故而在收藏答案时, 只做简单处理, 并不会像收藏专栏文章, 可以收集各个方面的数据.

2. 谨慎清理浏览器
   注意IndexedDB存储的数据会在**清理浏览器**, 或者使用管家类(xx垃圾清理, 隐私保护等噱头的工具软件)"清理"系统时, 会**一并移除**

3. 用户所有的使用数据均为**本地存储**

## 二. 阅读器相关

1. 由于知乎的答案是采用懒加载模式,(即你滚动到特定的页面时, 才加载数据), 而在阅读模式下, 采用的为模拟滚动的方式触发数据的加载, 可能有时无法有效加载数据, 可以尝试退出阅读器, 进行手动滚动加载

2. 页面潜在崩溃, 在阅读模式下采用模拟滚动来加载后续的数据, 短期内可能由于滚动过快, 过于频繁, 触发大量数据加载, 导致页面可能出现崩溃(亦或者知乎页面的反爬保护)

3. 得益于代码的优化, 以上两种情况在3.4.7.x以上版本暂未出现过, 并不保证是否依然存在类似问题.

# 关于代码

1. api, 代码所使用到的api接口均源于搜索查找所得, 原api所有者持有最终版权, 请勿滥用
2. 第三方代码, 大量使用到第三方代码的项为
   * 2.1 阅读器, html和css主要源于360doc.com
   * 2.2 flipclock, html和css
   * 2.3 其他的零散来源不同的站点如, BiliBili, zhihu等
   * 2.4 以上使用均已在代码中标注出处来源, 原作者版权所有, 请勿滥用
   * 2.5 如原作者禁止以上代码, 请联系我, Lian_Hwang@126.com, 我将删除以上对应代码
3. 本代码遵循MIT开源协议, (以上第三方代码, 原作者所有), 使用请自行风险评估
4. 代码一次写成, 没有进行二度重构, 修修补补, 可阅读性价差, 将就吧...

-----------------------------------------------------------End-------------------------------------------------------------------------
***Make Thing Better & Simpler***
