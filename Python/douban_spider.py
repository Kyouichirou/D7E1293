import requests
from bs4 import BeautifulSoup as bsDom
import os
import re
import random, json
import pandas as pd
import time, mysql.connector as cnn
from random_ua import rdua
from urllib.parse import quote
from enum import Enum

"""
@name: douban_spider
@author: HLA
@description:
爬取豆瓣标签页所有的标签下的书籍列表
146个tag, 大概10-14万条数据
将获取到的数据放置到Excel, MySQL等
将标签使用有道翻译后作为MySQL表名, 或文件名
"""


class WriteType(Enum):
    Excel = 0
    MySQL = 1
    CSV = 2


class Youdao:
    def __init__(self):
        self.__session = requests.session()
        self.__reg = re.compile(r"[.,;#%()\[\]{}&:!@'\"·?$/\\\s]")

    def __get_text(self, word):
        """
        此api没有反爬的限制, 但是功能较少, 不可选转换语言种类, 翻译质量较低
        :param word: str
        :return: str
        """
        api = 'http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&smartresult=ugc&sessionFrom=null'
        pdata = {
            'type': "AUTO",
            'i': word,
            "doctype": "json",
            "version": "2.1",
            "keyfrom": "fanyi.web",
            "ue": "UTF-8",
            "action": "FY_BY_CLICKBUTTON",
            "typoResult": "true"
        }
        try:
            r = self.__session.post(api, data=pdata, timeout=(8, 8))
            if r.status_code == 200:
                return r.text
            else:
                print("fail to get translation from youdao")
                return None
        except requests.exceptions.Timeout:
            print('timeout error')
            return None

    @property
    def __get_random_name(self):
        return ''.join(random.sample('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6))

    def translate(self, word):
        try:
            content = self.__get_text(word)
            if content:
                result = json.loads(content)
                r = result['translateResult'][0][0]['tgt']
                return self.__reg.sub("_", r) if r else self.__get_random_name
            else:
                return self.__get_random_name
        except ValueError:
            return self.__get_random_name

    def close(self):
        self.__session.close()


class Excel:
    def __init__(self):
        self.__path = os.path.join(os.path.expanduser("~"), 'Documents')

    def to_excel(self, arr, bn, sn):
        df = pd.DataFrame.from_dict(arr)
        df.to_excel(self.__path + '\\' + bn + '.xlsx', index=False, sheet_name=sn)

    def to_cvs(self, arr, bn):
        df = pd.DataFrame.from_dict(arr)
        df.to_csv(self.__path + '\\' + bn + '.csv', index=False)


class Database:
    def __init__(self, password, dbname, host='localhost', username='root'):
        self.__sql = cnn.connect(
            host=host,
            user=username,
            passwd=password
        )
        self.__cursor = self.__sql.cursor()
        self.__create_db(dbname)

    def create_table(self, tbname, tag):
        try:
            cmd = (
                f'create table if not exists `{tbname}`('
                'sid varchar(16) not null primary key,'
                'title varchar(255) not null,'
                'author varchar(255),'
                'nation varchar(16),'
                'rate double,'
                'rnums mediumint(9),'
                'img varchar(255),'
                'abstract varchar(255)'
                f') comment="{tag}"'
            )
            self.__cursor.execute(cmd)
            return True
        except cnn.Error:
            print('failed to create table: ' + tbname)
            return False

    def __create_db(self, dbname):
        self.__cursor.execute('show databases')
        if not any(dbname == e[0] for e in self.__cursor):
            self.__cursor.execute('create database ' + dbname)
        """
        .free.result()
        Frees the stored result set, if there is one, for this MySQL instance. 
        If the statement that was executed returned multiple result sets, 
        this method loops over and consumes all of them.
        如不使用此命令, 在数据库已创建的情况下, 将会出错
        """
        self.__sql.free_result()
        """
        .database
        This property sets the current (default) database by executing a USE statement.
        The property can also be used to retrieve the current database name.
        # self.__cursor.execute('use ' + dbname)
        """
        self.__sql.database = dbname

    def insert(self, data, tbname):
        try:
            cmd = (
                f'insert into {tbname}'
                '(sid, title, author, nation, rate, rnums, img, abstract)'
                'values'
                '(%s, %s, %s, %s, %s, %s, %s, %s)'
            )
            self.__cursor.executemany(cmd, data)
        except cnn.Error as error:
            print(error)
            # cnn.DataError or cnn.IntegrityError or cnn.InterfaceError
            print('failed to inser data to DB: ' + tbname)
            self.__cursor.execute('drop table ' + tbname)

    def quit(self):
        """
        This method sends a COMMIT statement to the MySQL server, committing the current transaction.
        Since by default Connector/Python does not autocommit,
        it is important to call this method after every transaction that modifies data
        for tables that use transactional storage engines.
        :return: None
        """
        self.__sql.commit()
        self.__cursor.close()
        self.__sql.cmd_quit()


class Douban:
    def __init__(self, url, stype='S', wtype=WriteType.MySQL.value):
        if wtype == 1:
            self.__db = Database("MySQL@#2021", 'douban')
        self.__stype = stype
        self.__wtype = wtype
        self.__sid_reg = re.compile(r'\d+')
        self.__en_reg = re.compile(r'[a-z]+', re.I)
        self.__bk_reg = re.compile(r'[〔「『【(\[（](.+?)[】\]）)』」〕](.+)')
        self.__tl_reg = re.compile(r'(\n|[\s]{2,})')
        self.__session = requests.session()
        self.__retry = []
        self.__retry_time = 3
        self.__youdao = Youdao()
        self.__is_anti = False
        self.__iniref = url
        self.__get_tabs()
        self.__db.quit()
        self.__session.close()
        self.__youdao.close()

    def __get_tabs(self):
        dom = self.__get_dom(self.__iniref)
        if not dom:
            return
        c = dom.find('div', class_='article')
        if not c:
            print('failed to get tags')
            return
        for e in c.children:
            if type(e).__name__ == 'Tag' and 'class' in e.attrs and len(e.attrs['class']) == 0:
                links = e.find_all('a')
                nlist = set()
                for link in links:
                    if 'href' in link.attrs:
                        url = link['href']
                        tag = url[url.rfind('/') + 1:].strip()
                        if not self.__en_reg.match(tag):
                            tbname = self.__youdao.translate(tag).lower()
                            if not self.__en_reg.match(tbname):
                                tbname = 'notr' + ''.join(random.sample('abcdefghijklmnopqrstuvwxyz1234567890', 2))
                        else:
                            tbname = tag
                        # 防止重名
                        if tbname in nlist:
                            tbname = tbname + '_' + ''.join(
                                random.sample('abcdefghijklmnopqrstuvwxyz1234567890', 2))
                        if len(tbname) > 63:
                            tbname = tbname[1:63]
                        nlist.add(tbname)
                        rs = self.__get_list(tag, tbname)
                        if not rs:
                            if self.__is_anti:
                                print('the anti-crawler mechanism of douban has been triggered')
                                return
                            else:
                                self.__session.close()
                                self.__retry.append((tag, tbname))
                                self.__session = requests.session()
                while self.__retry and self.__retry_time > 0:
                    print(f'start retrying {self.__retry_time}')
                    for index, ele in enumerate(self.__retry):
                        rs = self.__get_list(ele[0], ele[1])
                        if rs:
                            del self.__retry[index]
                        else:
                            self.__session.close()
                            self.__session = requests.session()
                    self.__retry_time -= 1
                break

    def __get_list(self, tag, tbname):
        i = 0
        arr = []
        f = False
        ref = self.__iniref
        pname = quote(tag)
        pref = 'https://book.douban.com/tag/'
        """
        requests的headers, 假如包含非ASCII字符, 不会自动进行URL编码
        将会出现encode error
        """
        sidset = set()
        print('start: ' + tag)
        while True:
            nurl = '{0}{1}?start={2}&type={3}'.format(pref, pname, str(i * 20), self.__stype)
            dom = self.__get_dom(nurl, ref)
            ref = nurl
            if not dom:
                print(f'fail to get content from {nurl}')
                return False
            ul = dom.find('ul', class_='subject-list')
            lists = ul.children
            for e in lists:
                if type(e).__name__ == 'NavigableString':
                    continue
                f = True
                r = self.__get_content(e, sidset)
                if r:
                    arr.append(r)
            i += 1
            # 豆瓣标签, 超过50页就没有数据, 尽管页面还有后续页数
            if not f or i > 49:
                break
            else:
                # 规避豆瓣的反爬检测, 0.25以下依然有可能触发反爬虫机制
                time.sleep(random.uniform(0.35, 2.5))
                f = False
        if arr:
            if self.__wtype == 0:
                eapp = Excel()
                eapp.to_excel(arr, tbname, 'douban')
            if self.__wtype == 2:
                eapp = Excel()
                eapp.to_cvs(arr, tbname)
            else:
                if self.__db.create_table(tbname, tag):
                    tup = []
                    for dic in arr:
                        tup.append(tuple(dic.values()))
                    self.__db.insert(tup, tbname)
            return True
        return False

    def __get_sid(self, ele, info, sidset):
        a = ele.find('a')
        href = a.attrs['href']
        if 'subject' in href:
            sid = self.__sid_reg.search(href).group()
            info['sid'] = sid
            if sid in sidset:
                return False
            sidset.add(sid)
        img = ele.find('img')
        href = img.attrs['src']
        if 'img' in href:
            info['img'] = href
        return True

    def __nation_check(self, text):
        if self.__en_reg.search(text) or '·' in text:
            return '欧美'
        elif any(e in text for e in [',', '、', '、']) or self.__sid_reg.match(text):
            return '不明'
        i = len(text)
        try:
            text.encode('big5hkscs')
            # 假如是繁体字(部分简体), 则不会出现错误
            if i < 4:
                return '中/港/澳/台/新'
            else:
                return '日'
        except UnicodeEncodeError:
            if i < 3:
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
                info['title'] = self.__tl_reg.sub('', e.text).strip()
            elif name == 'div':
                if 'class' in e.attrs:
                    tmp = e.attrs['class'][0]
                    if tmp == 'pub':
                        text = e.text.replace('\n', '').strip()
                        text = text[0: text.find('/')].strip()
                        mn = self.__bk_reg.match(text)
                        if mn:
                            info['nation'] = mn.group(1)
                            info['author'] = mn.group(2).strip()
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
                                    m = self.__sid_reg.search(p)
                                    if m:
                                        info['rnums'] = int(m.group())
                                    else:
                                        info['rnums'] = 0
            elif name == 'p':
                info['abstract'] = e.text.strip()

    def __get_content(self, e, sidset):
        info = {
            "sid": "N/A",
            "title": "N/A",
            "author": "N/A",
            "nation": "N/A",
            "rate": 0,
            "rnums": 0,
            "img": "N/A",
            'abstract': ""
        }
        for c in e.children:
            if type(c).__name__ == 'NavigableString':
                continue
            if 'class' in c.attrs:
                n = c.attrs['class'][0]
                if n == 'pic':
                    s = self.__get_sid(c, info, sidset)
                    if not s:
                        return None
                elif n == 'info':
                    self.__get_info(c, info)
        return info

    def __get_dom(self, url, ref=''):
        headers = {
            "User-Agent": rdua(),
            "Host": "book.douban.com",
            "Accept-Encoding": "gzip, deflate, br",
            'Accept-Language':
                random.sample(
                    ['zh-CN,zh;q=0.8', 'zh-TW;q=0.7', 'zh-HK;q=0.5', 'en-US;q=0.3', 'en;q=0.2', 'en-US,en;q=0.5'], 1)[
                    0],
            'DNT': '1',
            'Connection': 'keep-alive',
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Referer": ref
        }
        try:
            # 考虑到douban的服务器连接质量较差, 需要更长的等待时间, 否则容易触发timeout
            response = self.__session.get(url, headers=headers, timeout=(12, 12))
            if response.status_code != 200:
                self.__is_anti = True
                print(f'failed to get html: {response.status_code}')
                return None
            html = response.content.decode("utf-8")
            dom = bsDom(html, "html.parser")
            return dom
        except requests.exceptions.Timeout:
            print('time out error')
            return None


if __name__ == '__main__':
    # start = time.perf_counter()
    print('download start')
    Douban('https://book.douban.com/tag/?view=type', wtype=WriteType.MySQL.value)
    # print(f'running time: {time.perf_counter() - start} seconds')
