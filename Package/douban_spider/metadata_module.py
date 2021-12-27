__all__ = ['Metadata']

from . import date_format_module
from . import price_module
from . import log_module
from . import constants
from . import zh_module
import re
import os

'''
HTML内容解析和提取
1. 需要注意的细节, 出版时间的录入不规范, 部分的字符为双字节的字符
2. 部分书籍是一些生僻的外语, 如泰语
'''

logger = log_module.Logs()


class CommonMethods:
    def __init__(self, book_reg, zh_convertor):
        self.__book_reg = book_reg
        self.__zh_convertor = zh_convertor

    @staticmethod
    def get_node_href(node):
        if type(node).__name__ == "Tag":
            links = node.find_all('a')
            for a in links:
                if 'href' in a.attrs:
                    href = a.attrs['href']
                    if href:
                        return href
        return None

    def get_douban_id(self, href):
        ms = self.__book_reg.search(href)
        return ms.group() if ms else None

    def slice_text(self, text, limit):
        tmp = text if len(text) < limit else text[0: limit - (4 if limit > 255 else 1)]
        return self.__zh_convertor.convert(tmp)


class Subject:
    def __init__(self, common_m, num_reg, ebook_reg, book_reg, bundle_reg, dateformat, convertor):
        self.__common_m = common_m
        self.num_reg = num_reg
        self.ebook_reg = ebook_reg
        self.book_reg = book_reg
        self.bundle_reg = bundle_reg
        self.pro_reg = re.compile('(?<=series/)\d+')
        self.price_reg = re.compile('\d+([,.]\d+)?')
        self.people_reg = re.compile('(?<=people/)\w+')
        self.review_reg = re.compile('\((\d+)\)')
        self.newline_reg = re.compile('\n+')
        self.author_reg = re.compile('(?<=author/)\d+')
        self.blank_reg = re.compile('((?<=[/\-・】\]）)』」〕］>}])\s+|\s+(?=[/\-・［{<〔「『【(\[（]))')
        self.nation_reg = re.compile('[{<［〔「『【(\[（](.+?)[】\]）)』」〕］>}]')
        self.nation_c_reg = re.compile('[{<［〔「『【(\[（】\]）)』」〕］>}]')
        self.abc_reg = re.compile('[a-z]+', re.I)
        self.menus_reg = re.compile('\n\s*')
        self.id_reg = re.compile('dir_\d+_full')
        self.id_short_reg = re.compile('dir_\d+_short')
        self.zh_convertor = convertor
        self.dateformat = dateformat
        self.exchange = price_module.Currency()
        self.pic_folder = constants.Pic_Folder
        self.clist = (
            '编', '著', '选', '合', '名', '脚',
            '整', '修', '撰', '访', '谈', '筹',
            '卷', '案', '装', '考', '七', '伪',
            '册', '译', '版', '集', '套', '评',
            '精', '文', '計', '史', '二', '布',
            '级', '株', '演', '馆', '上', '一',
            '作', '漫', '画', 'ー', '下', '图',
            '托', '读', '释', '解', '社', '序',
            '摄', '绘', '注', '写', '录', '佚',
            '笔', '题', '摘', '辑', '诗', '藏',
            '章', '等', '审', '写', '创',
            '补', '述', '划', '原', '书', '你',
            '.', '•', '！', '@', '出', '稿',
            '请', '私', '丸', '讲', '族'
        )
        self.dynasty = (
            "秦",
            "汉",
            "宋",
            "清",
            "元",
            "明",
            "唐",
            "商",
            "周",
            "隋",
            '晋',
            '魏',
            '梁',
            '齐',
            '辽',
            '满',
            '蒙',
            '蜀'
        )
        self.check_nation = False
        self.pre_dy = ('前', '后', '西', '东', '北', '南', '晚')
        self.clist_2 = [
            '北京', '杭州',
            '深圳', '南京',
            '广州', '西安',
            '上海', '重庆',
            '成都', '天津',
            '战国', '春秋',
            '三国', '五代',
            '西夏', '南朝',
            '十国', '南北',
            '十六', '北朝',
            '高丽'
        ]
        self.__nation_abridge_e = (
            'us',
            'ca',
            'fr',
            'au',
            'de',
            'uk',
            'ru',
            'gb',
            'hk',
            'kr',
            'jp',
            'nz',
            'sg',
            'tw'
        )
        self.__nation_abridge_c = (
            '美',
            '加拿大',
            '法',
            '澳大利亚',
            '德',
            '英',
            '俄',
            '英',
            '港',
            '韩',
            '日',
            '新西兰',
            '新加坡',
            '台湾'
        )
        if not os.path.exists(self.pic_folder):
            os.mkdir(self.pic_folder)

    @staticmethod
    def __check_book_url_format(href):
        # 需要检查URL是否满足要求, 不然会有小部分的其他的豆瓣链接混入其中
        return 'book.' in href and '/subject/' in href

    def get_book_url(self, node):
        href = self.__common_m.get_node_href(node)
        return href if href and self.__check_book_url_format(href) else None

    def __get_a_text(self, text, limit):
        k = text.find(':')
        return self.__common_m.slice_text(text if k < 0 else text[k + 1:].strip(), limit)

    def __remove_line_break(self, text):
        return self.blank_reg.sub('', self.newline_reg.sub('', text))

    def __abtain_author(self, ts, limit):
        # 处理长度异常的作者, 译者(如: 多个作者), 此二者的数据结构是趋于一致的
        ts = self.__remove_line_break(ts)
        k = ts.rfind('/')
        while k > 0 and len(ts) > limit:
            ts = ts[0: k].strip()
            k = ts.rfind('/')
        return self.__common_m.slice_text(ts, limit)

    def get_detail(self, node, info):
        # 获取书籍的详细信息, bs解析的dom和web页面解析的有些不同
        childrens = node.children
        text = ''
        for c in childrens:
            name = type(c).__name__
            if name == 'NavigableString':
                if text:
                    cstr = str(c).strip()
                    if cstr:
                        if '作者' in text and not info['author']:
                            info['author'] = self.__abtain_author(cstr, 255)
                            text = ''
                        elif '出版社' in text:
                            info['publisher'] = self.__common_m.slice_text(cstr, 128)
                            text = ''
                        elif '出版年' in text:
                            if date := self.dateformat.date_disassemble(cstr):
                                info['publish_y'], info['publish_m'], info['publish_d'] = date
                            info['publish_time'] = self.__common_m.slice_text(cstr, 12)
                            text = ''
                        elif 'isbn' in text.lower():
                            info['isbn'] = cstr
                            text = ''
                        elif '统一书号' in text:
                            # 部分刊物采用此标准, 已基本废弃, 仅用于部分非标准的书籍
                            info['isbn'] = 'no.' + cstr
                            text = ''
                        elif '原作名' in text:
                            info['ogltitle'] = self.__common_m.slice_text(cstr, 255)
                            text = ''
                        elif '出品方' in text:
                            info['producer'] = self.__common_m.slice_text(cstr, 128)
                            text = ''
                        elif '页数' in text:
                            if cstr.isdigit():
                                info['pages'] = int(cstr)
                            else:
                                ms = self.num_reg.search(cstr)
                                if ms:
                                    info['pages'] = int(ms.group())
                            text = ''
                        elif '译者' in text:
                            info['translator'] = self.__abtain_author(text, 32)
                            text = ''
                        elif '丛书' in text:
                            info['series'] = self.__common_m.slice_text(cstr, 255)
                        elif '定价' in text:
                            t = self.__common_m.slice_text(cstr, 16)
                            ms = self.price_reg.search(t)
                            info['price_c'] = t
                            if ms:
                                # 注意清除其中的 ","
                                px = ms.group().replace(',', '')
                                info['price'] = self.exchange.change_curency(t, float(px))
                            text = ''
                        elif '副标题' in text:
                            info['subtitle'] = self.__common_m.slice_text(cstr, 255)
                            text = ''
                        elif '装帧' in text:
                            info['binding'] = '平装' if len(text) > 16 and '平装' in text else self.__common_m.slice_text(
                                cstr, 32)
                            text = ''
            elif name == 'Tag':
                if c.name == 'span':
                    text = c.text.strip()
                    # 部分的页面的结构有所不一致, 需要单独处理
                    cl = len(text)
                    if cl > 3:
                        if '作者' in text and not info['author']:
                            k = text.find(':')
                            info['author'] = self.__abtain_author(text if k < 0 else text[k + 1:].strip(), 255)
                            text = ''
                            if href := self.__common_m.get_node_href(c):
                                if ms := self.author_reg.search(href):
                                    info['author_id'] = int(ms.group())
                        elif '译者' in text and not info['translator']:
                            k = text.find(':')
                            info['translator'] = self.__abtain_author(text if k < 0 else text[k + 1:].strip(), 32)
                            text = ''
                        elif '丛书' in text and not info['series']:
                            a = c.find('a')
                            info['series'] = self.__get_a_text(text, 255)
                            if a and 'href' in a.attrs:
                                href = a.attrs['href']
                                if href:
                                    ms = self.pro_reg.search(href)
                                    if ms:
                                        info['series_id'] = int(ms.group())
                            text = ''
                        elif "出品方" in text and cl > 4 and not info['producer']:
                            a = c.find('a')
                            info['producer'] = self.__get_a_text(text, 128)
                            if a and 'href' in a.attrs:
                                href = a.attrs['href']
                                if href:
                                    ms = self.pro_reg.search(href)
                                    if ms:
                                        info['producer_id'] = int(ms.group())
                            text = ''
                elif len(c.contents) > 5:
                    # 部分内容解析不是很正常
                    self.get_detail(c, info)
                elif c.name == 'a':
                    if '作者' in text and not info['author']:
                        # 作者的数据结构差异较大, 单独处理
                        text = ''
                        tz = c.text.strip()
                        if tz:
                            k = tz.find(':')
                            info['author'] = self.__abtain_author(tz if k < 0 else tz[k + 1:].strip(), 32)
                        if 'href' in c.attrs:
                            if href := c.attrs['href']:
                                if ms := self.author_reg.search(href):
                                    info['author_id'] = int(ms.group())
                    elif '丛书' in text and not info['series']:
                        text = ''
                        tz = c.text.strip()
                        if tz:
                            info['series'] = self.__get_a_text(tz, 255)
                        if 'href' in c.attrs:
                            href = c.attrs['href']
                            if href:
                                ms = self.pro_reg.search(href)
                                if ms:
                                    info['series_id'] = int(ms.group())
                    elif '译者' in text and not info['translator']:
                        text = ''
                        tz = c.text.strip()
                        if tz:
                            info['translator'] = self.__get_a_text(tz, 32)
                    elif '出品方' in text and not info['producer']:
                        text = ''
                        tz = c.text.strip()
                        if tz:
                            info['producer'] = self.__get_a_text(tz, 128)
                        if 'href' in c.attrs:
                            href = c.attrs['href']
                            if href:
                                ms = self.pro_reg.search(href)
                                if ms:
                                    info['producer_id'] = int(ms.group())

    @staticmethod
    def __get_picture(dom, info):
        # 下载封面图片
        if pic := dom.find('div', id='mainpic'):
            if a := pic.find('a'):
                if 'href' in a.attrs:
                    if href := a.attrs['href']:
                        if 'update_image' in href or 'default' in href or (href.find('.com') == href.rfind('.')):
                            info['pic_url'] = 'no pic'
                            return
                        tmp = href.replace('doubanio.com/view/subject/l/public/', '').replace('https://', '')
                        info['pic_url'] = tmp if len(tmp) < 20 else 'url too long'

    def __nation_handle(self, text: str):
        text = text.strip().replace(' ', '')
        if (t := text.find('/')) > 0:
            text = text[0:t]
        i = len(text)
        if i == 0:
            return ''
        b = ''
        f = self.abc_reg.search(text)
        if i == 1:
            if f:
                # 如果只有一个字母
                return ''
            # 只有一个值时, 即判定为国家
            if text in self.clist:
                return ''
            if text in self.dynasty:
                b = '中'
            else:
                b = text
                if b == '苏':
                    b = '俄'
                elif b == '港':
                    b = '香港'
                elif b == '南':
                    b = '塞尔维亚'
                elif b == '台':
                    b = '台湾'
                elif b == '荷':
                    b = '荷兰'
                elif b == '古':
                    b = '古巴'
                elif b == '匈':
                    b = '匈牙利'
        elif i == 2:
            if f:
                n = text.lower()
                for e, c in zip(self.__nation_abridge_e, self.__nation_abridge_c):
                    if e == n:
                        b = c
                        break
                if not b and self.check_nation:
                    return ''
            else:
                if text == '苏联':
                    b = '俄'
                elif text == '波斯':
                    b = '伊朗'
                elif text == '罗马':
                    b = '意'
                else:
                    if text in self.clist_2:
                        b = '中'
                    else:
                        c, d = text
                        if c == '日' and d == '本':
                            b = c
                        elif d == '德' and (c == '东' or c == '西'):
                            b = d
                        elif c in self.pre_dy and d in self.dynasty:
                            b = '中'
                        elif c in self.dynasty and (d == '朝' or d == '初' or d == '国' or d == '代'):
                            b = '中'
                        elif d == '国':
                            b = '中' if d == '民' else c
        elif i == 3:
            if '罗马' in text or text == '意大利':
                b = '意'
            elif text == '古希腊':
                b = '希腊'
            elif text == '前苏联':
                b = '俄'
            elif text == '古印度':
                b = '印度'
            elif text == '古埃及':
                b = '埃及'
        else:
            if '澳大利亚' == text:
                b = '澳'
            elif '德国' in text:
                b = '德'
            elif '澳门' in text:
                b = '澳门'
            elif '香港' in text:
                b = '香港'
            elif text[0] == '古' and '阿拉伯' in text:
                b = '沙特'
        if b:
            self.check_nation = False
        else:
            if i > 2 and any(e in text for e in self.clist_2):
                b = '中'
            elif i > 2 and '台湾' in text:
                b = '台湾'
            else:
                if any(e in text for e in self.clist):
                    return ''
                if self.check_nation and f:
                    return ''
        if b:
            return b
        else:
            if len(text) > 16:
                logger.debug(f'nation too long {text}')
                return ''
            else:
                return text

    def __get_nation(self, info):
        # 提取国家的名称
        author = info['author']
        self.check_nation = False
        if author:
            # match, 从字符串开始的位置匹配
            if ms := self.nation_reg.match(author):
                text = self.nation_c_reg.sub('', ms.group(1))
                info['nation'] = self.__nation_handle(text)
            else:
                # search, 找到匹配的即返回结果
                if ms := self.nation_reg.search(author):
                    tmp = ms.group(1)
                    text = self.nation_c_reg.sub('', tmp)
                    if tmp and len(tmp) < 7:
                        if self.num_reg.search(text):
                            return
                        self.check_nation = True
                        info['nation'] = self.__nation_handle(tmp)

    def __get_contents(self, dom):
        # 目录
        nodes = dom.find_all('div', class_='indent')
        short = None
        for n in nodes:
            if 'id' in n.attrs:
                if ids := n.attrs['id']:
                    if self.id_reg.match(ids):
                        if text := n.text:
                            t = text.replace('· · · · · ·     (收起)', '').strip()
                            return self.__common_m.slice_text(self.menus_reg.sub('|;|', t), 5120) if t else None
                    elif self.id_short_reg.match(ids):
                        short = n
        if short:
            # 考虑到豆瓣的页面不一致的问题, 需要备用此设置
            if t := short.text.strip():
                return self.__common_m.slice_text(self.menus_reg.sub('|;|', t), 5120)
        return None

    def __get_abtract(self, dom):
        # 摘要
        node = dom.find('div', id='link-report')
        text = ''
        if node:
            h = node.find('div', class_='all hidden')
            if h:
                i = h.find('div', class_='intro')
                if i:
                    text = i.text.strip()
            else:
                ns = node.find_all('div', class_='intro')
                text = ns[k - 1].text.strip() if (k := len(ns)) > 0 else ''
        return self.__common_m.slice_text(text, 10240) if text else text

    def __get_author(self, dom):
        # 作者简介
        hs = dom.find_all('h2')
        for i, h in enumerate(hs):
            if text := h.text.strip():
                if text.startswith('作者简介'):
                    # next_element, 这个遇到文本节点
                    a = h.next_elements
                    b = None
                    for e in a:
                        if type(e).__name__ == 'Tag':
                            if 'class' in e.attrs:
                                if c := e.attrs['class']:
                                    if c[0] == 'indent':
                                        b = e
                                        break
                    if b:
                        text = t.text.strip() if (t := b.find('span', class_='all hidden')) else b.text.strip()
                        return self.__common_m.slice_text(text, 1024) if text else text
                    break
        return None

    def __get_title(self, dom, info):
        # 标题
        title = dom.find('h1')
        if title:
            text = title.text.strip()
            info['title'] = self.__common_m.slice_text(text, 255)

    @staticmethod
    def check_quote(dom) -> int:
        return 1 if dom.find('div', class_='ugc-mod blockquote-list-wrapper') else 0

    # 动态数据
    def get_read_state(self, dom):
        c = dom.find('div', id='collector')
        if c:
            ps = c.find_all('p', class_='pl')
            dic = {
                'reading': 0,
                'read': 0,
                'want': 0
            }
            for p in ps:
                text = p.text
                ms = self.num_reg.search(text)
                if ms:
                    n = int(ms.group())
                    if '在读' in text:
                        dic['reading'] = n
                    elif '读过' in text:
                        dic['read'] = n
                    elif '想读' in text:
                        dic['want'] = n
            return dic
        return None

    @staticmethod
    def __get_rate(node):
        # 评分
        rate = node.find('strong', class_='ll rating_num')
        if rate:
            text = rate.text
            if text:
                text = text.strip()
                if text:
                    return float(text)
        return 0

    def __get_rate_peoples(self, node):
        # 评分人数
        peo = node.find('a', class_='rating_people')
        if peo:
            text = peo.text
            if text:
                text = text.strip()
                ms = self.num_reg.search(text)
                if ms:
                    return int(ms.group())
        return 0

    @staticmethod
    def __get_rate_percent(node) -> list:
        # 获取评分占比情况
        # 注意MySQL的float类型和Python的float类型的差异
        pers = node.find_all('span', class_='rating_per')
        arr = []
        for i, p in enumerate(pers):
            k = 5 - i
            if k < 1:
                print('some problems from percent of rate')
                break
            tmp = p.text
            per = float(tmp.strip()[:-1]) if tmp else 0
            arr.append(per)
        return arr

    def __get_comment_nums(self, dom) -> int:
        # 短评数量
        node = dom.find('div', id='comments-section')
        return self.__get_target(node)

    def __get_review_nums(self, dom) -> int:
        # 书评数量, 不同出版社或不同版本的书, 可能共用书评
        node = dom.find('section', id='reviews-wrapper')
        return self.__get_target(node)

    def __get_note_nums(self, dom) -> int:
        # 笔记的数量
        node = dom.find('div', class_='ugc-mod reading-notes')
        i = self.__get_target(node)
        if i == 0 and node:
            li = node.find_all('li', class_='ctsh clearfix')
            i = len(li) // 3
        return i

    def __get_target(self, node) -> int:
        if node:
            if h := node.find('h2'):
                if p := h.find('span', class_='pl'):
                    if text := p.text:
                        ms = self.num_reg.search(text)
                        if ms:
                            return int(ms.group())
        return 0

    # ------------------动态数据
    def get_tags(self, dom):
        tag = dom.find('div', id='db-tags-section')
        if tag:
            tag_nums = 0
            if h2 := tag.find('h2'):
                if text := h2.text:
                    if ms := self.num_reg.search(text):
                        tag_nums = int(ms.group())
            tags = tag.find_all('a')
            return [e for e in [t.text.strip() for t in tags] if e], tag_nums
        return None

    def get_discuss_nums(self, dom) -> int or tuple:
        dic = dom.find('div', id='db-discussion-section')
        if dic:
            tables = dic.find_all('tr')
            if tables:
                i = len(tables)
                if i > 5 and '浏览更多话题':
                    return i
                elif i > 1:
                    cs = dic.select("a[href*='/people/']")
                    s = set()
                    for c in cs:
                        if 'href' in c.attrs:
                            href = c.attrs['href']
                            if href:
                                if ms := self.people_reg.search(href):
                                    s.add(ms.group())
                    return i - 1, len(s)
        return 0

    def get_same_version_book(self, dom):
        n = dom.find('div', class_='gray_ad version_works')
        if n:
            h = n.find('h2')
            if h:
                a = h.find('a')
                if a and 'href' in a.attrs:
                    href = a.attrs['href']
                    if href and '/works/' in href:
                        ms = self.num_reg.search(href)
                        return ms.group() if ms else None
        return None

    def get_relate_book(self, dom):
        # 相关电子书, 需要修改, 当数据为bundle时, 访问页面
        rec = dom.find('div', id='rec-ebook-section')
        al = []
        cl = []
        if rec:
            # 电子书推荐
            node = self.__get_book_node(rec)
            if node:
                for e in node.children:
                    href = self.__common_m.get_node_href(e)
                    if href:
                        ms = self.ebook_reg.search(href)
                        if ms:
                            al.append(int(ms.group()))
                        else:
                            ms = self.bundle_reg.search(href)
                            if ms:
                                cl.append(ms.group())
        bl = self.get_r_book(dom)
        return set(al) if al else None, set(bl) if bl else None, set(cl) if cl else None

    def get_r_book(self, dom):
        # 相关图书
        bl = []
        db = dom.find('div', id='db-rec-section')
        if db:
            node = self.__get_book_node(db)
            if node:
                for e in node.children:
                    href = self.get_book_url(e)
                    if href:
                        ms = self.book_reg.search(href)
                        if ms:
                            bl.append(ms.group())
        return bl

    @staticmethod
    def __get_book_node(node):
        return node.find('div', class_='content clearfix')

    def __dy_data(self, dom, info):
        # 动态数据的获取
        if grade := dom.find('div', id='interest_sectl'):
            gtxt = grade.text
            if not ('无' in gtxt or '不' in gtxt):
                info['rate'] = self.__get_rate(grade)
                info['rate_nums'] = self.__get_rate_peoples(grade)
                pers = self.__get_rate_percent(grade)
                for i, p in enumerate(pers):
                    info[f'star_{5 - i}'] = p
        info['review_nums'] = self.__get_review_nums(dom)
        info['comment_nums'] = self.__get_comment_nums(dom)
        info['note_nums'] = self.__get_note_nums(dom)
        info['quote'] = self.check_quote(dom)
        if r_state := self.get_read_state(dom):
            info['reading_nums'] = r_state['reading']
            info['read_nums'] = r_state['read']
            info['want_nums'] = r_state['want']
        discuss = self.get_discuss_nums(dom)
        return discuss

    @logger.decorator('dynamic_data')
    def get_dynamic_data(self, dom, update):
        info = {
            "rate": 0,
            "star_5": 0,
            "star_4": 0,
            "star_3": 0,
            "star_2": 0,
            "star_1": 0,
            "rate_nums": 0,
            "comment_nums": 0,
            "review_nums": 0,
            "note_nums": 0,
            'reading_nums': 0,
            'read_nums': 0,
            'want_nums': 0,
            'quote': 0,
            "tag_nums": 0,
            "update_times": update,
        }
        discuss = self.__dy_data(dom, info)
        tag = None
        if tags := self.get_tags(dom):
            tag, info['tag_nums'] = tags
        return info, discuss, tag

    @logger.decorator('extract_data')
    def extract_meta(self, dom, detail, db_id):
        # 提取所有的数据
        # 除了评分相关之外, 其他的数据都在这个节点
        # 核心数据的获取, 需要注意这个节点的结构并不是所有的都是一致的
        self.check_nation = False
        info = {
            "douban_id": int(db_id),
            "title": '',
            "subtitle": '',
            "ogltitle": '',
            "publisher": '',
            "publish_time": '',
            "publish_y": 0,
            "publish_m": 0,
            "publish_d": 0,
            "author": '',
            "author_id": 0,
            "nation": '',
            "pages": 0,
            "producer": '',
            "producer_id": 0,
            "price_c": '',
            "price": 0,
            "translator": '',
            "series": '',
            "series_id": 0,
            "rate": 0,
            "star_5": 0,
            "star_4": 0,
            "star_3": 0,
            "star_2": 0,
            "star_1": 0,
            "isbn": '',
            "rate_nums": 0,
            "comment_nums": 0,
            "review_nums": 0,
            "note_nums": 0,
            'reading_nums': 0,
            'read_nums': 0,
            'want_nums': 0,
            "same_id": 0,
            "binding": '',
            'quote': 0,
            "tags": '',
            "tag_nums": 0,
            "pic_url": '',
            "update_times": 0,
        }
        # title
        self.__get_title(dom, info)
        # meta_date
        self.get_detail(detail, info)
        # nation
        self.__get_nation(info)
        if same_id := self.get_same_version_book(dom):
            info['same_id'] = same_id
        tag_info = self.get_tags(dom)
        tags = None
        if tag_info:
            tags, tag_nums = tag_info
            info['tags'] = ';'.join(tags)
            info['tag_nums'] = tag_nums
        self.__get_picture(dom, info)
        abstract = self.__get_abtract(dom)
        relate = self.get_relate_book(dom)
        contents = self.__get_contents(dom)
        discuss = self.__dy_data(dom, info)
        # 如果作者没有id, 则获取内容的作者简介
        author = self.__get_author(dom) if not info['author_id'] else None
        return info, abstract, tags, discuss, relate, self.check_nation, contents, author


class Doulist:
    def __init__(self, common_m, num_reg, dateformat, convertor, doulist_reg):
        self.__common_m = common_m
        self.__num_reg = num_reg
        self.__dateformat = dateformat
        self.__convertor = convertor
        self.__time_reg = re.compile('\d+-\d+-\d+')
        self.__doulist_reg = doulist_reg

    @staticmethod
    def __get_add_time(node):
        time = node.find('time')
        if time:
            for e in time.children:
                if type(e).__name__ == 'Tag':
                    if 'title' in e.attrs:
                        if title := e.attrs['title']:
                            return title
        return '1970-01-01 00:00:01'

    def get_items(self, dom):
        # 获取页面的书籍
        lists = dom.find_all('div', class_='doulist-item')
        arr = []
        tmp = []
        for a in lists:
            if href := self.__common_m.get_node_href(a):
                if ids := self.__common_m.get_douban_id(href):
                    if ids in tmp:
                        continue
                    tmp.append(ids)
                    arr.append((ids, self.__get_add_time(a)))
        return arr if len(arr) > 0 else None

    def get_doulist(self, dom):
        # 获取页面的豆列
        doulist = dom.find("ul", class_='doulist-list')
        if doulist:
            links = doulist.find_all('li')
            s = set()
            for li in links:
                if href := self.__common_m.get_node_href(li):
                    if ms := self.__doulist_reg.search(href):
                        s.add(int(ms.group()))
            return s if len(s) > 0 else None

    def extra_doulist(self, node):
        # 提取subject页面侧边栏推荐的doulist
        if node:
            links = node.find_all('a')
            s = set()
            for a in links:
                if 'href' in a.attrs:
                    if href := a.attrs['href']:
                        if did := self.get_doulist_id(href):
                            s.add(did)
            return s if len(s) > 0 else None
        return None

    def get_doulist_id(self, href: str):
        if ms := self.__doulist_reg.search(href):
            return int(ms.group())
        return None

    @staticmethod
    def get_all_doulist(node):
        nodes = node.previous_elements
        i = 0
        for e in nodes:
            if type(e).__name__ == 'Tag':
                if 'href' in e.attrs:
                    href = e.attrs['href']
                    if href and '/subject' in href and '/doulist' in href:
                        return href
            i += 1
            if i > 6:
                return None

    def doulist_detail(self, dom):
        # 当豆列遍历完成之后, 添加该数据到豆列
        info = {
            'title': '',
            'c_time': 0,
            'u_time': 0,
            'follow_nums': 0,
            'rec_nums': 0
        }
        title = dom.find('h1')
        if not title:
            return None
        text = title.text.strip()
        info['title'] = self.__convertor.convert(text if len(text) < 32 else text[:30])
        meta = dom.find('div', class_='meta')
        if meta:
            t = meta.find('span', class_='time')
            if t:
                if text := t.text:
                    ms = self.__time_reg.findall(text)
                    if ms and len(ms) == 2:
                        info['c_time'] = self.__dateformat.date_format(ms[0], False)
                        info['u_time'] = self.__dateformat.date_format(ms[1], False)
                        info['follow_nums'] = self.__get_follow_num(dom)
                        info['rec_nums'] = self.__get_rec_num(dom)
                        return info
        return None

    def __get_rec_num(self, dom) -> int:
        rec = dom.find('div', class_='doulist-panel')
        if rec:
            if text := rec.text:
                return self.__get_nums(text)
        return 0

    def __get_follow_num(self, dom) -> int:
        collect = dom.find('div', class_='doulist-collect')
        if collect:
            if text := collect.text:
                return self.__get_nums(text)
        return 0

    def __get_nums(self, text) -> int:
        if ms := self.__num_reg.search(text):
            return int(ms.group())
        return 0


class Review:
    # review页面各星的数量
    def __init__(self):
        self.__review_reg = re.compile('\((\d+)\)')

    def get_review_star(self, dom):
        node = dom.find('ul', class_='droplist')
        if node:
            arr = []
            for e in node.children:
                if type(e).__name__ == 'Tag' and 'class' in e.attrs:
                    cn = e.attrs['class'][0]
                    if 'rating' in cn and len(cn) > len('rating'):
                        text = e.text
                        if text:
                            ms = self.__review_reg.search(text)
                            if ms:
                                arr.append(int(ms.group(1)))
            return arr if len(arr) == 5 else None


class Comment:
    def __init__(self):
        pass

    @staticmethod
    def get_comment_percent(dom):
        if dom:
            node = dom.find('div', class_='comment-filter')
            if node:
                arr = []
                cms = node.find_all('span', class_='comment-percent')
                for c in cms:
                    text = c.text.strip()
                    if text:
                        arr.append(int(text[:-1] if '%' in text else text))
                return arr if len(arr) == 3 else None
        return None


class Author:
    def __init__(self, num_reg, common_c, dateformat):
        self.__num_reg = num_reg
        self.__format_date = dateformat
        self.__common_c = common_c

    def __get_author_about(self, dom):
        intro = dom.find('div', id='intro')
        if intro:
            if bd := intro.find('div', class_='bd'):
                if span := bd.find('span', class_='all hidden'):
                    return self.__common_c.slice_text(span.text.strip(), 1024)
                else:
                    return self.__common_c.slice_text(bd.text.strip(), 1024)
        return ''

    def get_collect_nums(self, dom):
        if fans := dom.find('div', id='fans'):
            if h2 := fans.find('h2'):
                if text := h2.text:
                    if ms := self.__num_reg.findall(text):
                        return int(ms.pop() if len(ms) > 1 else ms[0])
        return 0

    @staticmethod
    def get_recent_publish(dom):
        if node := dom.find('div', id='recent_books'):
            if li := node.find('li'):
                if h3 := li.find('h3'):
                    if text := h3.text.strip():
                        if text.isdigit():
                            return int(text)
        return 0

    def get_author_detail(self, dom, author_id):
        if node := dom.find('div', id='headline'):
            info = {
                "author_id": author_id,
                'name': '',
                'gender': 0,
                'birthday': None,
                'birthplace': '',
                'nation': '',
                'o_names': '',
                'c_names': '',
                'recent_publish': 0,
                'fan_nums': 0,
                'about': ''
            }
            if title := dom.find('h1'):
                info['name'] = self.__common_c.slice_text(title.text, 32)
            else:
                return None
            if a := node.find('div', class_='info'):
                lis = a.find_all('li')
                s_lice = lambda x: x[x.find(':') + 1:].strip()
                for li in lis:
                    if text := li.text.strip():
                        if '性别' in text:
                            info['gender'] = 1 if '男' in text else 0
                        elif '日期' in text:
                            tmp = s_lice(text)
                            k = tmp.find('至')
                            info['birthday'] = self.__format_date.get_date(tmp if k < 1 else tmp[k + 1:])
                        elif '出生地' in text:
                            info['birthplace'] = self.__common_c.slice_text(s_lice(text), 32)
                        elif '国家' in text:
                            info['nation'] = self.__common_c.slice_text(s_lice(text), 16)
                        elif '外文名' in text:
                            info['o_names'] = self.__common_c.slice_text(s_lice(text), 32)
                        elif '中文名' in text:
                            info['c_names'] = self.__common_c.slice_text(s_lice(text), 32)
                if not info['birthday']:
                    info['birthday'] = self.__format_date.default_date
                info['fan_nums'] = self.get_collect_nums(dom)
                info['about'] = self.__get_author_about(dom)
                info['recent_publish'] = self.get_recent_publish(dom)
                return info
        return None


class Tag:
    def __init__(self, common_m):
        self.__common_m = common_m

    def get_items(self, dom):
        ulists = dom.find_all('li', class_='subject-item')
        s = set()
        for a in ulists:
            if href := self.__common_m.get_node_href(a):
                if ids := self.__common_m.get_douban_id(href):
                    s.add(ids)
        return s if len(s) > 0 else None

    def side_book(self, node):
        rec = node.find('div', id='book_rec')
        if rec:
            s = set()
            for e in rec.children:
                if href := self.__common_m.get_node_href(e):
                    if ids := self.__common_m.get_douban_id(href):
                        s.add(ids)
            return s if len(s) > 0 else None
        return None

    @staticmethod
    def side_tag(node):
        tag_node = node.find('div', class_='tags-list')
        if tag_node:
            s = set()
            tag_list = tag_node.find_all('a')
            for e in tag_list:
                if text := e.text.strip():
                    s.add(text)
            return s if len(s) > 0 else None
        return None

    def side(self, dom):
        side = dom.find('div', class_='aside')
        if side:
            books = self.side_book(side)
            tags = self.side_tag(side)
            return books, tags
        return None


class Newbook:
    # https://book.douban.com/latest
    def __init__(self, common_m):
        self.__common_m = common_m

    def get_new_book(self, dom):
        content = dom.find('div', id='content')
        if content:
            links = content.find_all('li')
            s = set()
            for li in links:
                href = self.__common_m.get_node_href(li)
                if href:
                    if db_id := self.__common_m.get_douban_id(href):
                        s.add(db_id)
            return s if len(s) > 0 else None
        return None


class Work:
    def __init__(self, num_reg):
        self.__num_reg = num_reg

    def get_same_book(self, dom):
        # /work/
        nodes = dom.find_all('div', class_='bkses clearfix')
        datas = set()
        for e in nodes:
            a = e.find('a', class_='pl2')
            if a and 'href' in a.attrs:
                if href := a.attrs['href']:
                    if ms := self.__num_reg.search(href):
                        datas.add(ms.group())
        return datas


class Ebook:
    def __init__(self, book_reg, ebook_reg, num_reg, bundle_reg, common_m):
        self.__num_reg = num_reg
        self.__ebook_reg = ebook_reg
        self.__book_reg = book_reg
        self.__common_m = common_m
        self.__bundle_reg = bundle_reg
        self.__provider_reg = re.compile('(?<=provider/)\d+')
        self.__words_reg = re.compile('字数(.+)?约.+?(\d+(,\d+)).+字', re.S)

    def get_detail(self, dom):
        # 提取书籍的douban_id, 出版社的id, 书籍的字数
        node = dom.find('div', class_='article-meta')
        if node:
            arr = [0] * 3
            links = node.find_all('a')
            for a in links:
                if 'href' in a.attrs:
                    href = a.attrs['href']
                    if href:
                        if 'subject/' in href and not arr[0]:
                            arr[0] = self.__get_id(href, True)
                        elif 'provider/' in href and not arr[1]:
                            arr[1] = self.__get_id(href, False)
            if arr[0]:
                text = node.text
                if text:
                    ms = self.__words_reg.search(text)
                    if ms:
                        arr[3] = int(ms.group(2).replace(',', ''))
                return arr
        return None

    def get_rate(self, dom):
        node = dom.find('div', class_='rating rating-light')
        n = r = 0
        if node:
            score = node.find('span', class_='score')
            if score:
                if text := score.text:
                    r = float(text)
            rate = node.find('span', class_='amount')
            if rate:
                if text := rate.text:
                    if ms := self.__num_reg.search(text):
                        n = int(ms.group())
        return n, r

    @staticmethod
    def get_rate_detail(dom):
        ul = dom.find('ul', class_='rating-stat bar-chart')
        if ul:
            arr = []
            rates = ul.find_all('span', class_='rank-rate')
            for r in rates:
                if text := r.text:
                    arr.append(float(text[:-1] if '%' in text else text))
            return arr
        return None

    def get_provider_items(self, dom):
        # https://read.douban.com/provider/63687209/
        node = dom.find('section', class_='provider-ebooks')
        if node:
            links = node.find_all('li', class_='item')
            s = set()
            for a in links:
                href = self.__common_m.get_node_href(a)
                if href:
                    ms = self.__ebook_reg.search(href)
                    if ms:
                        s.add(ms.group)
            return s if len(s) > 0 else None
        return None

    def get_bundle(self, dom):
        node = dom.find('ul', class_='ebook-list')
        s = set()
        for e in node:
            if type(e).__name__ == 'Tag':
                if href := self.__common_m.get_node_href(e):
                    if ms := self.__bundle_reg.search(href):
                        s.add(ms.group)
        return s if len(s) > 0 else None

    @staticmethod
    def get_home_items(dom):
        # https://read.douban.com/category/1?dcm=header
        node = dom.find('div', class_='section-works')
        if node:
            links = node.find('li', class_='works-item')
            s = set()
            for a in links:
                if 'data-works-id' in a.attrs:
                    if ids := a.attrs['data-works-id']:
                        s.add(ids)
            return s if len(s) > 0 else None
        return None

    def __get_id(self, href, mode):
        ms = self.__book_reg.search(href) if mode else self.__provider_reg.search(href)
        return int(ms.group()) if ms else 0


class Discuss:
    def __init__(self, num_reg):
        self.__num_reg = num_reg

    def get_discuss_detail(self, dom):
        # 话题, 参与人数
        r = dom.find('span', class_='rec')
        if r:
            a = r.find('a')
            if a:
                if 'data-desc' in a.attrs:
                    data = a.attrs['data-desc']
                    if data:
                        ms = self.__num_reg.findall(data)
                        if ms and len(ms) == 2:
                            return tuple(int(e) for e in ms)
        d = dom.find('span', class_='count')
        num = 0
        if d:
            text = d.text
            if text:
                ms = self.__num_reg.search(text)
                if ms:
                    num = int(ms.group())
        else:
            t = dom.find('div', class_='discussion-posts')
            if t:
                trs = t.find_all('tr')
                i = len(trs)
                num = i - 1 if i > 0 else 0
        return (num, 0) if num > 0 else None


class Series:
    def __init__(self, common_m):
        self.__common_m = common_m

    def get_items(self, dom):
        ul = dom.find('ul', class_='subject-list')
        if ul:
            s = set()
            for c in ul.children:
                if type(c).__name__ == 'Tag':
                    if href := self.__common_m.get_node_href(c):
                        if ids := self.__common_m.get_douban_id(href):
                            s.add(ids)
            return s if len(s) > 0 else None
        return None


class Metadata:
    def __init__(self):
        # reg
        self.num_reg = re.compile('\d+')
        self.ebook_reg = re.compile('(?<=ebook/)\d+')
        self.book_reg = re.compile('(?<=subject/)\d+')
        self.bundle_reg = re.compile('(?<=bundle/)\d+')
        self.doulist_reg = re.compile('(?<=doulist/)\d+')
        # class_assistant
        self.convertor = zh_module.Convertor()
        self.common_m = CommonMethods(self.book_reg, self.convertor)
        self.discuss = Discuss(self.num_reg)
        self.dateformat = date_format_module.DateFormat(self.num_reg)
        # class_main
        self.ebook = Ebook(self.book_reg, self.ebook_reg, self.num_reg, self.bundle_reg, self.common_m)
        self.new_book = Newbook(self.common_m)
        self.tag = Tag(self.common_m)
        self.comment = Comment()
        self.review = Review()
        self.work = Work(self.num_reg)
        self.doulist = Doulist(self.common_m, self.num_reg, self.dateformat, self.convertor, self.doulist_reg)
        self.series = Series(self.common_m)
        self.book = Subject(self.common_m, self.num_reg, self.ebook_reg, self.book_reg, self.bundle_reg,
                            self.dateformat, self.convertor)
        self.author = Author(self.num_reg, self.common_m, self.dateformat)
