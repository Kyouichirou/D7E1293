import requests
from bs4 import BeautifulSoup as btDom
import os
import time
import random
import re
import json

"""
@name feiku6_spider
@author: HLA
@description:
反爬措施:
异步数据
URL+干扰
refer
"""

class Spider:
    def __init__(self, url):
        self.__session = requests.session()
        self.__jreg = re.compile(".*?({.*}).*", re.S)
        self.__nreg = re.compile('[*|?.<>/:"]')
        self.__get_menus(url)

    def __get_menus(self, url):
        script = self.__get_script(url)
        if not script:
            return None
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "Host": "cdn.book.moujishu.com",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "*/*",
            "Referer": url
        }
        if not script.startswith('https:'):
            script = 'https:' + script
        r = self.__session.get(script, headers=headers)
        js = json.loads(self.__jreg.match(r.content.decode('utf-8')).group(1))
        chapters = js['bookVolumeList'][0]['bookChapterList']
        m = url[url.rfind('/') + 1: url.rfind('.')]
        prefix = 'https://www.feiku6.com/'
        for i, c in enumerate(chapters):
            url = prefix + 'read/{}/{}.html'.format(m, c['id'])
            arr = self.__get_content(url)
            if arr:
                self.__write_txt(arr, c['chapter_name'], i)
        self.__session.close()

    def __get_script(self, url):
        dom = self.__get_dom(url)
        if not dom:
            return None
        try:
            name = dom.find('input', id='book_name').attrs['value']
            self.__create_folder(name)
            a = dom.find('div', id='volumes')
            s = a.find('script')
            return s.attrs['src']
        except KeyError:
            return None

    def __clear_path(self, name):
        """
        清除windows路径非法字符
        :param name: str
        :return: str
        """
        return self.__nreg.sub('', name)

    def __create_folder(self, name):
        downloads = os.path.join(os.path.expanduser("~"), 'Downloads')
        path = rf'{downloads}\{self.__clear_path(name)}'
        if not os.path.exists(path):
            os.mkdir(path)
        self.__path = path

    def __write_txt(self, arr, chapter, index):
        filename = self.__path + '\\' + self.__clear_path(str(index) + '_' + chapter) + '.txt'
        f = open(filename, mode='w', encoding='utf-8')
        f.write(chapter + "\n\n" + '\n'.join(arr) + '\n')
        f.close()

    def merger_txt(self, name):
        slist = os.listdir(self.__path)
        slist.sort(key=lambda x: int(x[0: x.find('_')]))
        menus = map(lambda x: x[x.find('_'): x.rfind('.')], slist)
        f = open(self.__path + "\\" + name + '.txt', mode='w', encoding='utf-8')
        f.write(name + '\n\n' + '\n'.join(menus) + '\n')
        for sf in slist:
            tp = self.__path + "\\" + sf
            tmp = open(tp, encoding='utf-8', mode='r')
            for line in tmp:
                f.writelines(line)
            tmp.close()
            os.remove(tp)
            f.write("\n\n")
        f.close()

    @property
    def __timestamp(self):
        return str(int(time.time() * 1000))

    @property
    def __jquery(self):
        return "jQuery" + re.sub(r'\D', '', '1.7.2' + str(random.random())) + '_' + self.__timestamp

    @staticmethod
    def __get_chapter_id(dom):
        return dom.find('input', id="chapter_id").attrs['value']

    def __get_content(self, url):
        dom = self.__get_dom(url)
        if not dom:
            return None
        bid = self.__get_chapter_id(dom)
        surl = 'https://cdn.book.moujishu.com/CsAjax.do?method=getChapter&callback={}&chapter_id={}&_={}'.format(
            self.__jquery, bid, self.__timestamp)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "Host": "cdn.book.moujishu.com",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "*/*",
            "Referer": url
        }
        r = self.__session.get(surl, headers=headers)
        if r.status_code != 200:
            print('failed to get content')
            return None
        js = json.loads(self.__jreg.match(r.content.decode('utf-8')).group(1))
        dom = btDom(js['data'], 'html.parser')
        ps = dom.find_all('p')
        return map(lambda x: x.text, ps)

    def __get_dom(self, url):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36",
            "Host": "www.feiku6.com",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
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


if __name__ == '__main__':
    start = time.perf_counter()
    print('download start')
    Spider('https://www.feiku6.com/book/s3-xiwangzhixian.html')
    print(f'running time: {time.perf_counter() - start} seconds')
