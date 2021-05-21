import requests
import mysql.connector
from bs4 import BeautifulSoup as btDom
import os
import re
import random
import pandas as pd
import time

"""
@name: douban_spider
@author: HLA
"""


class Excel:
    def __init__(self):
        self.__path = os.path.join(os.path.expanduser("~"), 'Documents')

    def to_excel(self, arr, bn, sn):
        df = pd.DataFrame.from_dict(arr)
        df.to_excel(self.__path + '\\' + bn + '.xlsx', index=False, sheet_name=sn)

    def to_cvs(self):
        pass


class Douban:
    def __init__(self, url):
        self.__session = requests.session()
        self.__sid_reg = re.compile(r'\d+')
        self.__en_reg = re.compile(r'[a-z]+', re.I)
        self.__bk_reg = re.compile(r'[「『【(\[（](.+?)[】\]）)』」](.+)')
        self.__get_list(url)

    def __get_list(self, url):
        i = 0
        prefix = url[0: url.find('?') + 1]
        suffix = url[url.rfind('type'):]
        arr = []
        f = False
        ref = ''
        while True:
            nurl = prefix + 'start=' + str(i * 20) + '&' + suffix
            dom = self.__get_dom(nurl, ref)
            ref = nurl
            if not dom:
                print(f'fail to get content from {url}')
                self.__session.close()
                return None
            ul = dom.find('ul', class_='subject-list')
            lists = ul.children
            for e in lists:
                if type(e).__name__ == 'NavigableString':
                    continue
                f = True
                arr.append(self.__get_content(e))
            i += 1
            if not f or i > 49:
                break
            else:
                time.sleep(random.randint(1, 5))
                f = False
        if arr:
            self.__session.close()
            eapp = Excel()
            eapp.to_excel(arr, '豆瓣', 'douban')

    def __get_sid(self, ele, info):
        a = ele.find('a')
        href = a.attrs['href']
        if 'subject' in href:
            info['sid'] = self.__sid_reg.search(href).group()
        img = ele.find('img')
        href = img.attrs['src']
        if 'img' in href:
            info['img'] = href

    def __nation_check(self, text):
        if self.__en_reg.match(text) or '·' in text:
            return '欧美'
        elif any(e in text for e in [',', '、', '、']):
            return '不明'
        i = len(text)
        try:
            text.encode('big5hkscs')
            # 假如是繁体字, 则不会出现错误
            if i < 3:
                return '港/澳/台/新/日'
            else:
                return '日'
        except UnicodeEncodeError:
            if i < 2:
                return '中'
            elif ' ' in text:
                return '日'
            elif i == 3:
                return '中/港/台'
            else:
                return '中/港/台/日'

    def __get_info(self, ele, info):
        chs = ele.children
        for e in chs:
            if type(e).__name__ == 'NavigableString':
                continue
            name = e.name
            if name == 'h2':
                info['name'] = e.text.replace('\n', '').strip()
            elif name == 'div':
                if 'class' in e.attrs:
                    tmp = e.attrs['class'][0]
                    if tmp == 'pub':
                        text = e.text.replace('\n', '').strip()
                        text = text[0: text.find('/')].strip()
                        mn = self.__bk_reg.match(text)
                        if mn:
                            info['nation'] = mn.group(1)
                            info['author'] = mn.group(2)
                        else:
                            info['nation'] = self.__nation_check(text)
                            info['author'] = text
                    elif tmp == 'star':
                        for c in e.children:
                            if type(c).__name__ == 'NavigableString':
                                continue
                            if 'class' in c.attrs:
                                n = c.attrs['class'][0]
                                if n == 'rating_nums':
                                    r = c.text.replace('\n', '').strip()
                                    if r:
                                        info['rate'] = float(r)
                                    else:
                                        info['rate'] = 0
                                elif n == 'pl':
                                    p = c.text.replace('\n', '').strip()
                                    m = self.__sid_reg.search(p).group()
                                    if m:
                                        info['rnums'] = int(m)
                                    else:
                                        info['rnums'] = 0
            elif name == 'p':
                info['abstact'] = e.text.strip()

    def __get_content(self, e):
        info = {
            "sid": "N/A",
            "name": "N/A",
            "author": "N/A",
            "nation": "N/A",
            "rate": 0,
            "rnums": 0,
            "img": "N/A"
        }
        for c in e.children:
            if type(c).__name__ == 'NavigableString':
                continue
            if 'class' in c.attrs:
                n = c.attrs['class'][0]
                if n == 'pic':
                    self.__get_sid(c, info)
                elif n == 'info':
                    self.__get_info(c, info)
        return info

    def __get_dom(self, url, ref):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "Host": "book.douban.com",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Referer": ref
        }
        try:
            response = self.__session.get(url, headers=headers, timeout=(8, 8))
            if response.status_code != 200:
                print('failed to get html')
                return None
            html = response.content.decode("utf-8")
            dom = btDom(html, "html.parser")
            return dom
        except requests.exceptions.Timeout:
            print('time out error')
            return None


class Database:
    def __init__(self, pw, un):
        mydb = mysql.connector.connect(
            host="localhost",
            user=un,
            passwd=pw,
        )
        self.cursor = mydb.cursor()

    def __check_db(self):
        self.cursor.execute('SHOW DATABASES')
        for db in self.cursor:
            pass

    def __check_table(self):
        pass

    def __create_db(self):
        self.cursor.execute("CREATE DATABASE douban_db")

    def __create_table(self):
        pass

    def write_info(self):
        pass


if __name__ == '__main__':
    # start = time.perf_counter()
    print('download start')
    Douban('https://book.douban.com/tag/%E6%8E%A8%E7%90%86?type=S')
    # print(f'running time: {time.perf_counter() - start} seconds')
