__all__ = ['Parser']

import re
import json
from bs4 import BeautifulSoup as bEs

from .log_module import Logs
from .dateformat_module import convert_date, now

# from .character_module import spilt_character

_logger = Logs()


class Parser:
    @property
    def multi_pages_comment(self):
        return self.__multi_pages_comment

    def __init__(self):
        self.__multi_pages_comment = False
        self.__author_reg = re.compile(r'(?<=people/).+(?=/)')
        self.__number_reg = re.compile(r'\d+')

    @staticmethod
    def html_to_dom(html: str):
        return bEs(html, 'lxml')

    def catalog(self, dom) -> list:
        if olt := dom.find('table', class_='olt'):
            tds = olt.find_all('td', class_='title')
            urls = []
            for td in tds:
                if a := td.find('a'):
                    if 'href' in a.attrs:
                        if href := a.attrs['href']:
                            if ms := self.__number_reg.search(href):
                                urls.append(ms.group())
            return urls

    @_logger.decorator('some error on get detail')
    def topic_detail(self, dom, url_id: str) -> dict:
        info = {
            'url_id': url_id,
            'title': '',
            'text': '',
            'author_id': '',
            'author_name': '',
            'author_ip': '',
            'commentCount': '',
            'userInteractionCount': '',
            'dateCreated': '',
            'dateCaptured': now(),
            'comments': []
        }
        if js := dom.find('script', attrs={'type': 'application/ld+json'}):
            content = js.getText().strip().replace('\\', '|')
            # strict, False, 关于如何处理换行符, 假如在双引号之内包含有换行符, 将会导致出错, 假如strict=True
            # "\" 符号可能导致转为json出现错误
            obs = json.loads(content, strict=False)
            info['title'] = obs['name']
            info['text'] = obs['text'].strip()
            info['commentCount'] = int(obs['commentCount'] or '0')
            info['dateCreated'] = convert_date(obs['dateCreated'])
            if tmp := obs.get('interactionStatistic', False):
                info['userInteractionCount'] = int(tmp['userInteractionCount'] or '0')

            if h := dom.find('h3'):
                if a := h.find('a'):
                    if 'href' in a.attrs:
                        if href := a.attrs['href']:
                            if ms := self.__author_reg.search(href):
                                info['author_id'] = ms.group()
                                info['author_name'] = a.text
                if ip := h.find('span', class_='create-ip'):
                    info['author_ip'] = ip.text.strip()
            return info

    @_logger.decorator('some error on get replies')
    def get_replies(self, dom) -> list:
        self.__multi_pages_comment = False
        if node := dom.find('ul', id='comments'):
            replies = node.find_all('li', class_='clearfix comment-item reply-item')
            datas = []
            self.__multi_pages_comment = len(replies) == 100
            for rp in replies:
                if p := rp.find('p', class_='reply-content'):
                    info = {
                        'author_id': '',
                        'author_name': '',
                        'author_ip': '',
                        'comment': p.text.strip(),
                        'like': 0,
                        'pubtime': ''
                    }
                    if h := rp.find('h4'):
                        if a := h.find('a'):
                            if 'href' in a.attrs:
                                if href := a.attrs['href']:
                                    if ms := self.__author_reg.search(href):
                                        info['author_id'] = ms.group()
                                        info['author_name'] = a.text.strip()
                        if pt := h.find('span', class_='pubtime'):
                            if text := pt.text.strip():
                                tmp = text.split(' ')
                                if len(tmp) == 3:
                                    info['author_ip'] = tmp[len(tmp) - 1]
                                    info['pubtime'] = convert_date(' '.join((tmp[:-1])))
                                else:
                                    info['pubtime'] = convert_date(text)
                        if follow := rp.find('div', class_='operation-div'):
                            if text := follow.text.strip():
                                if ms := self.__number_reg.search(text):
                                    info['like'] = int(ms.group())
                    datas.append(info)

            return datas
