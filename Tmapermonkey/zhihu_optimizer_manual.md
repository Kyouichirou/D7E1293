
<!doctype html>
<html>
<head>
<meta charset='UTF-8'><meta name='viewport' content='width=device-width initial-scale=1'>
<title>知乎优化器</title></head>
<body><h1>简介</h1>
<p><strong>zhihu optimizer</strong>, 这是一款让知乎变得更好的轻量级Tampermonkey脚本.....<em>Make Thing Better and Simpler</em></p>
<p>浏览器兼容测试: <strong>chrome 80+</strong>(x_64)完美运行, 已知不兼容chrome最低版本为: <strong>64</strong>(x_86), Firefox未作兼容测试</p>
<p><strong>Tampermonkey</strong>版本: 4.11.6120</p>
<p>推荐使用浏览器: <a href='https://www.centbrowser.cn/'>Centbrowser(百分浏览器)</a></p>
<h2>一, 屏幕颜色调节</h2>
<p>生效页面: 全站</p>
<p>预置4种颜色可选, 在Tampermonkey菜单可选</p>
<p>分别为: 土黄色, 橄榄绿, 草原绿, 灰色(具体颜色效果参考实际)</p>
<p>亮度将根据时间自动梯度调节, 颜色, 透明度都将同步调节</p>
<p>支持暂时关闭当前页面颜色调节, 支持完全退出页面颜色调节</p>
<p><img src="https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20089.jpg?raw=true" referrerpolicy="no-referrer" alt="颜色切换"></p>
<h2>二, 过滤器</h2>
<p>生效页面:</p>
<ol start='' >
<li>搜索(search)</li>
<li>话题(Topic)</li>
<li>问题和答案(question &amp;&amp; answer)</li>

</ol>
<p>支持两种种拦截方式:</p>
<ol start='' >
<li>blackName, 用户名, 例如: <a href='https://www.zhihu.com/people/gu-shi-dang-an-ju-71'>故事档案局</a></li>
<li>blackKey, 关键词, 将过滤内容, 如果内容包含此关键词, 相关的信息将被移除, 使用需谨慎</li>

</ol>
<pre><code class='language-javascript' lang='javascript'>eg: const blackKey = [&quot;留学中介&quot;, &quot;肖战&quot;];
</code></pre>
<p>blackkey需要在代码中修改, 该部分位于代码块的顶部(该功能尚未完善, 需要和正则表达式搭配使用更加)</p>
<p>当点击&quot;<strong>Block</strong>&quot;按钮的时候, 相关页面中的用户回答的答案将被隐藏, 反之, &quot;<strong>unBlock</strong>&quot;,  取消拦截, 将显示答案, 同步执行, 不需要刷新页面即可</p>
<p>此按钮将在用户页面的左下角生成, eg: <a href='https://www.zhihu.com/people/gu-shi-dang-an-ju-71'>故事档案局</a></p>
<p><img src="https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20099.jpg?raw=true" referrerpolicy="no-referrer" alt="Block按钮"></p>
<h2>三, 点击即突出内容</h2>
<p>生效页面:</p>
<ol start='' >
<li>搜索(search)</li>
<li>话题(Topic)</li>
<li>问题和答案(question &amp;&amp; answer)</li>

</ol>
<p>即当你点击页面的信息时, 将该部分的内容突出显示</p>
<h2>四, 页面内容文字辅助颜色</h2>
<p>生效页面: <a href='https://zhuanlan.zhihu.com/'>专栏</a></p>
<p>对内容的文字颜色进行一定的规律调节, 缓解单一颜色文字的眼睛枯燥(理论上....), 突出英文字母, 和数字</p>
<p>预置红, 蓝两种基准色(即在这两种颜色上进行梯级调节)</p>
<p>字母和数字采用绿色和紫色</p>
<p><img src="https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20095.jpg?raw=true" referrerpolicy="no-referrer" alt="多彩页面"></p>
<h4>代码高亮</h4>
<p>仅对于部分JavaScript的代码生效, 即知乎未进行关键字高亮的代码块, 仅突出显示关键字</p>
<h2>五, 搜索框控制</h2>
<ol start='' >
<li>移除预置搜索框搜索词</li>
<li>移除搜索框下的热门搜索, <strong>不影响搜索建议和搜索历史</strong></li>
<li>禁止搜索框在<strong>空白状态</strong>依然产生搜索的行为, 即不输入任何内容的状态下, 按回车键依然会搜索(关键词为知乎的热门搜索)</li>

</ol>
<p><img src="https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/images/Image%20097.jpg?raw=true" referrerpolicy="no-referrer" alt="搜索清洁"></p>
<h2>六, 快捷键</h2>
<p>生效页面: <a href='https://zhuanlan.zhihu.com/'>专栏</a></p>
<p>已知<strong>占用原页面</strong>的登录和滚动到底部快捷键</p>
<p>分别为:</p>
<p>单键&quot;<strong>d</strong>&quot;, <strong>登录弹窗</strong>(搜索快捷键, 豆瓣搜索占用)</p>
<p>&quot;<strong>shift</strong>&quot; + &#39;<strong>g</strong>&#39;, 滚动到页面底部</p>
<h3>1. 搜索</h3>
<p>单键, 无辅助键</p>
<p>Google =&gt; &#39;<strong>g</strong>&#39;, (实际站点为<a href='https://www.dogedoge.com/'>DogeDoge</a>);</p>
<p>Zhihu =&gt; &quot;<strong>z</strong>&quot;;</p>
<p>MDN =&gt; &quot;<strong>m</strong>&quot;, (即MDN Web Docs);</p>
<p>Bilibili =&gt; &#39;<strong>b</strong>&#39;;</p>
<p>Github =&gt; &#39;<strong>h</strong>&#39;, (&#39;g&#39;被用在Google);</p>
<p>Douban =&gt; &#39;<strong>d</strong>&#39;</p>
<h3>2. 高亮</h3>
<p>支持4种颜色可选, 分别为黄色, 绿色, 紫色, 红色</p>
<p>辅助键: &#39;<strong>Shift</strong>&#39;键</p>
<p>yellow =&gt; &#39;<strong>y</strong>&#39;;</p>
<p>green =&gt; &#39;<strong>g</strong>&#39;;</p>
<p>purple =&gt; &#39;<strong>p</strong>&#39;;</p>
<p>red =&gt; &#39;<strong>r</strong>&#39;;</p>
<h3>3. 清除高亮</h3>
<p>辅助键: &#39;<strong>Shift</strong>&#39;键</p>
<p>clear =&gt; &#39;<strong>c</strong>&#39;;</p>
<p>使用前选中已经被高亮的区域, 即可清除被高亮的部分</p>
<h3>4. 编辑当前页面</h3>
<p>即将当前页面转为可编辑的状态, 可以方便在打印页面的时候, 清除掉不需要的元素</p>
<p>&quot;<strong>F2</strong>&quot;, 无辅助键</p>
<p>如果页面处于可编辑状态, 将关闭可编辑状态, 反之, 亦如此.</p>
<h3>5. 自动滚屏</h3>
<p>使用 <a href='https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame'>requestAnimationFrame</a> API, 不会出现滚屏抖动的问题</p>
<p>&quot;<strong>`</strong>&quot;, 无辅助键, 该键位于&quot;<strong>Tab</strong>&quot;键上方(左上角的角落位置那个按键)</p>
<p><strong>双击</strong>开始滚动或者暂停;</p>
<p><strong>调节速度</strong>, 无辅助键</p>
<p>&quot;<strong>+</strong>&quot;, 加速</p>
<p>&quot;<strong>-</strong>&quot;, 减速</p>
<h2>七, 页面样式调整</h2>
<h4>字体:</h4>
<p>生效页面: 全局</p>
<p>轻微对字体进行调节, 稍稍改善字体的显示效果, 增加了一定的字体阴影</p>
<h4>页面内容加宽显示:</h4>
<p>(同时将字体的对齐方式调节为两侧对齐)</p>
<p>生效页面:</p>
<ol start='' >
<li>搜索(search)</li>
<li>话题(Topic)</li>
<li>问题和答案(question &amp;&amp; answer)</li>
<li>专栏</li>

</ol>
<h2>八, 其他</h2>
<ol start='' >
<li>去重定向, 即在打开外链知乎安全中心跳转(全局生效, 包括评论区)</li>
<li>移除在为未登录状态下, 访问(问题 &amp; 答案)页面出现的登录弹窗(<strong>不影响正常的登录, 当你主动登录账号时</strong>)</li>
<li>剪切板优化, 移除版权声明, 将部分常用的中文符号换成对应的英文符号, 如中文空心句号, 换成英文实心句号</li>
<li>对广告内容进行轻微调整....</li>

</ol>
<p>&nbsp;</p>
<p>&nbsp;</p>
</body>
</html>
