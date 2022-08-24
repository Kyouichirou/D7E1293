百度LAC分词工具在商品标题关键词提取的作用

![segment](https://p0.meituan.net/dpplatform/b5c4a828833c129970ae79f5181cb89b182202.png)


在不进行外部干预的情况下, 百度LAC在分词的质量远胜于jieba(特别是长度大于2的分词上), jieba多处理成长度为2的词.

不清楚是算法的效果还是内置字典的效果.

jieba是一个不限于分词的工具, 还整合NLP的辅助的功能.

百度LAC则相对简单, 只是提供分词的功能(最起码其文档没有提供其他的接口说明)

但是需要注意的是百度LAC需要调用win32com, anaconda整合的win32com版本相对偏低. 使用了imp来进行导包, 这个包已经逐步被废弃.

需要手动升级一下win32com, 作者已经修复这个问题, 采用importlib和types取代imp.