__all__ = ['Fraud']

import os
import random
import execjs
from urllib.parse import quote_plus
from . import constants
from . import log_module
from .browser_ua_module import RandomUA


# 浏览器信息伪装

class Fraud:
    def __init__(self):
        self.__languages = (
            'en-US,en;q=0.5',
            'en-US,en;q=0.9',
            'zh-CN,zh;q=0.9',
            'zh-CN,zh;q=0.5',
            'zh-TW,en-us;q=0.7,en;q=0.3',
            'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
            'zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4',
            'zh,zh-CN;q=0.8,en-US;q=0.6,en;q=0.4',
            'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
            'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'zh-CN,zh;q=0.8,zh-HK;q=0.5,en-US;q=0.3',
            'en-GB,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'zh-CN;q=0.8,zh;q=0.7,en-GB,en;q=0.5',
            'zh-TW,zh;q=0.9,en-GB;q=0.8,en;q=0.7,zh-CN;q=0.6',
            'zh-TW,zh;q=0.9,en-GB;q=0.8,zh-CN;q=0.7',
            'zh-TW,zh;q=0.9,en-GB;q=0.8,zh-CN;q=0.7,en-US;q=0.6'
        )
        self.__hosts = (
            'douban',
            'baidu',
            'bing',
            'zhihu',
            'sogou',
            'google',
            'so',
            'yandex',
            'xiaohongshu',
            'bilibili',
            'kongfz',
            'jd',
            'dangdang',
            'github',
            'hao123',
            'qq',
            '163',
            'bookschina',
            'jianshu',
            'csdn',
            'cnblogs',
            'blogchina',
            'ixigua',
            'sohu',
            'iqiyi',
            'taobao',
            'tmall',
            'docin',
            'ruiwen',
            '360doc',
            'ximalaya',
            'hujiang',
            'smzdm',
            'offcn'
        )
        self.__seo_ua = (
            'Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)',
            'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36; 360Spider',
            'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 YisouSpider/5.0 Safari/537.36',
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/80.0.345.0 Safari/537.36 Edg/80.0.345.0'
        )
        self.__s_header = {
            "User-Agent": "",
            'Accept-Language': 'zh-CN,zh;q=0.9',
            "Accept-Encoding": "gzip, deflate, br",
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        }
        self.__hight_version_ua = RandomUA()
        self.__sfs = ('same-origin', 'none', 'same-site')
        self.__sfu = (0, 1)
        self.__sfm = ('navigate', 'same-origin')
        self.js_initial = False
        self.__logger = log_module.Logs()
        self.__initial_js_engine()

    @property
    def random_language(self):
        return random.choice(self.__languages)

    def h_version_ua(self, count):
        return self.__hight_version_ua.get_random_ua(count)

    @property
    def random_ua(self):
        return self.__js_engine.call('get_random_ua')

    @property
    def random_seo(self):
        return random.choice(self.__seo_ua)

    @property
    def __bing_form(self):
        # QBRE
        return ''.join(random.sample('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4))

    @property
    def __bing_cvid(self):
        # F688842879124FCC9ABCF52FF8AFC752
        return ''.join(random.sample('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 32))

    def bing_refer(self, d_id) -> str:
        return f'https://cn.bing.com/search?q=douban+{d_id}&qs=n&form={self.__bing_form}&sp=-1&pq=douban+{d_id}&sc=0-15&sk=&cvid={self.__bing_cvid}'

    def bing_url(self, url):
        return f'https://cn.bing.com/search?q={quote_plus(url)}&go=Search&qs=ds&form={self.__bing_form}&mkt=zh-CN'

    @property
    def random_refer(self) -> str:
        return 'https://www.' + random.choice(self.__hosts) + '.com/'

    @property
    def standard_header(self) -> dict:
        self.__s_header['User-Agent'] = self.random_ua
        self.__s_header['Accept-Language'] = self.random_language
        return self.__s_header

    @property
    def http_2_header(self):
        return None

    def complete_header(self, sfm: int, sfs: int, sfu=1):
        """
        Sec-Fetch-Dest: Dest是destination的缩写, 表明用户希望请求什么资源, CHROME80
        Sec-Fetch-Mode:
        cors：跨域请求；
        no-cors：限制请求只能使用请求方法(get/post/put)和请求头(accept/accept-language/content-language/content-type)；
        same-origin：如果使用此模式向另外一个源发送请求，显而易见，结果会是一个错误。你可以设置该模式以确保请求总是向当前的源发起的；
        navigate：表示这是一个浏览器的页面切换请求(request)。 navigate请求仅在浏览器切换页面时创建，该请求应该返回HTML；
        websocket：建立websocket连接;
        Sec-Fetch-Site: chrome76
        含义：
        表示一个请求发起者的来源与目标资源来源之间的关系；
        取值范围：
        cross-site：跨域请求；
        same-origin：发起和目标站点源完全一致；
        same-site：有几种判定情况，详见说明；
        none：如果用户直接触发页面导航，例如在浏览器地址栏中输入地址，点击书签跳转等，就会设置none；
        说明：
        same-site有几种情况(A->B)：
        A	                                 B	                           same site
        (" https ", " example.com ")	(" https ", " sub.example.com ")	true
        (" https ", " example.com ")	(" https ", " sub.other.example.com ")	true
        (" https ", " example.com ")	(" http ", " non-secure.example.com ")	false
        (" https ", " r.wildlife.museum ")	(" https ", " sub.r.wildlife.museum ")	true
        (" https ", " r.wildlife.museum ")	(" https ", " sub.other.r.wildlife.museum ")	true
        (" https ", " r.wildlife.museum ")	(" https ", " other.wildlife.museum ")	false
        (" https ", " r.wildlife.museum ")	(" https ", " wildlife.museum ")	false
        (" https ", " wildlife.museum ")	(" https ", " wildlife.museum ")	true
        在地址有重定向的情况下，Sec-Fetch-Site取值稍微复杂一点，直接参考一下示例：
        1.https://example.com/ 请求https://example.com/redirect，此时的Sec-Fetch-Site 是same-origin;
        2.https://example.com/redirect重定向到https://subdomain.example.com/redirect，此时的Sec-Fetch-Site 是same-site （因为是一级请求二级域名）;
        3.https://subdomain.example.com/redirect重定向到https://example.net/redirect，此时的Sec-Fetch-Site 是cross-site （因为https://example.net/和https://example.com&https://subdomain.example.com/是不同站点）;
        4.https://example.net/redirect重定向到https://example.com/，此时的Sec-Fetch-Site 是cross-site（因为重定向地址链里包含了https://example.net/）;
        Sec-Fetch-User chrome76
        含义：
        取值是一个Boolean类型的值，true(?1)表示导航请求由用户激活触发(鼠标点击/键盘)，false(?0)表示导航请求由用户激活以外的原因触发；
        取值范围：
        ?0
        ?1
        说明：
        请求头只会在导航请求情况下携带，导航请求包括document , embed , frame , iframe , or object ；
        安全策略
        了解了上面是个请求头的含义之后，我们就可以根据项目实际情况来制定安全策略了，例如google I/O提供的一个示例：
        # Reject cross-origin requests to protect from CSRF, XSSI & other bugs
        def allow_request(req):
             # Allow requests from browsers which don't send Fetch Metadata
             if not req['sec-fetch-site']:
                return True
             # Allow same-site and browser-initiated requests
             if req['sec-fetch-site'] in ('same-origin', 'same-site', 'none'):
                return True
             # Allow simple top-level navigations from anywhere
             if req['sec-fetch-mode'] == 'navigate' and req.method == 'GET':
                return True
             return False
        1.浏览器不支持Sec-Fetch-*请求头，则不做处理；
        2.容许sec-fetch-site为same-origin, same-site, none三种之一的请求；
        3.容许sec-fetch-mode为navigate且get请求的方法；
        4.容许部分跨域请求，可设置白名单进行匹配；
        5.禁止其他非导航的跨域请求，确保由用户直接发起；
        在使用Fetch Metadata Request Headers时，还需要注意Vary响应头的正确设置，Vary这个响应头是干嘛的呢，其实就是缓存的版本控制，
        当客户端请求头中的值包含在Vary中时，就会去匹配对应的缓存版本(如果失效就会同步资源)，因此针对不同的请求，能提供不同的缓存数据，可以理解为差异化服务，
        说明白了Vary响应头之后，就明白了Fetch Metadata Request Headers与Vary的影响关系了，
        因为要确保缓存能正确处理携带Sec-Fetch-*请求头的客户端响应，例如Vary: Accept-Encoding, Sec-Fetch-Site，因此有没有携带Sec-Fetch-Site将会对应两个缓存版本。
        :return: dict
        """
        headers = {
            "User-Agent": self.__hight_version_ua.get_random_ua(100),
            "Accept-Encoding": "gzip, deflate, br",
            'Accept-Language': self.random_language,
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': self.__sfm[sfm],
            'Sec-Fetch-Site': self.__sfs[sfs],
            'Sec-Fetch-User': f'?{self.__sfu[sfu]}',
            'Upgrade-Insecure-Requests': '1',
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        }
        return headers

    def __initial_js_engine(self):
        if os.path.exists(constants.JS_File):
            with open(constants.JS_File, mode='r', encoding='utf-8') as f:
                js = f.read()
            # noinspection PyBroadException
            try:
                if js:
                    self.__js_engine = execjs.compile(js)
                    self.js_initial = True
            except Exception:
                self.__logger.capture_except('browser')
