import requests
from fake_useragent import UserAgent as fUA
from bs4 import BeautifulSoup as btDom
import re
import os
import time

"""
@author: HLA
@description:
获取99藏书的内容
该站点采用的反爬措施为:
1.乱序
2.动态代码生成
3.滚动加载数据
4.混杂内容
@name: csw99_download
"""

class CSW:
    def __init__(self, url):
        self.session = requests.session()
        self.__get_menus(url)

    def __get_menus(self, url):
        dom = self.__get_dom(url)
        if not dom:
            return None
        title = dom.find('h2').text
        self.__create_file(title)
        menus = dom.find('dl', id="dir").children
        mlist = list(menus)
        menus_list = [title + "\n", '目录']
        for m in mlist:
            menus_list.append(m.text)
        menus_list.append('目录' + "\n\n")
        self.__write_file('\n'.join(menus_list))
        for m in mlist:
            a = m.find('a')
            if a and 'href' in a.attrs:
                self.__get_content('http://www.99csw.com/' + a.attrs['href'], a.text)
        self.session.close()
        self.file.close()

    def __create_file(self, name):
        name = re.sub(r'[*|?.<>/:"]', '', name)
        downloads = os.path.join(os.path.expanduser("~"), 'Downloads')
        path = rf'{downloads}\{name}'
        if not os.path.exists(path):
            os.mkdir(path)
        path += '\\' + name + ".txt"
        self.file = open(path, encoding='utf-8', mode='w')

    def __write_file(self, content):
        self.file.write(content)

    def __get_dom(self, url):
        headers = {
            "User-Agent": fUA().random,
            "Host": "www.99csw.com",
            "Accept-Encoding": "gzip, deflate",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        }
        response = self.session.get(url, headers=headers)
        if response.status_code != 200:
            print('failed to get html')
            return None
        html = response.content.decode("utf-8")
        dom = btDom(html, "html.parser")
        return dom

    def __get_content(self, url, chapter):
        dom = self.__get_dom(url)
        if not dom:
            print('failed to download: ' + chapter)
            return None
        tmp = dom.find_all('meta')
        meta = tmp[4].attrs['content']
        code = self.__base64(meta)
        arr = self.__re_sort(dom, code)
        self.__write_file(chapter + "\n\n" + ''.join(arr) + '\n')

    @staticmethod
    def __get_start(chs):
        i = 0
        k = 0
        for c in chs:
            name = c.name
            if name == 'h2':
                k = i + 1
            elif name == 'div':
                if 'class' in c.attrs:
                    if not 'chapter' in c.attrs['class']:
                        break
                else:
                    break
            i += 1
        return k

    def __re_sort(self, dom, code):
        """
        注意chs, 可迭代对象, 在使用后指针会发生移动, 不能直接使用可迭代对象
        :param dom: html dom
        :param code: string
        :return: array
        """
        tcode = re.split(r'[A-Z]+%', code)
        chs = dom.find('div', id="content").children
        clist = list(chs)
        istart = self.__get_start(clist)
        lt = len(tcode)
        arr = lt * [None]
        i = j = 0
        for t in tcode:
            m = int(t)
            if m < 3:
                arr[m] = clist[i + istart]
                j += 1
            else:
                arr[m - j] = clist[i + istart]
                j += 2
            i += 1

        tmp = []
        for a in arr:
            if a.name == 'div':
                cs = a.children
                text = ''
                for c in cs:
                    sp = type(c).__name__
                    if sp == "NavigableString":
                        text += c.string
                    elif sp == "Tag":
                        cname = c.name
                        if cname == 'span' and 'data-note' in c.attrs:
                            text += ('[备注: ' + re.sub(r'(<a.+?>|</a>)', '', c.attrs['data-note']) + ']')
                        elif cname in ['strong', 'small', 'h3', 'a']:
                            text += c.text
                if text:
                    tmp.append(text + '\n')
                else:
                    tmp.append("")
        return tmp

    @staticmethod
    def __base64(meta):
        smap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        d = ''
        prefix = {
            1: "00000",
            2: "0000",
            3: "000",
            4: "00",
            5: "0",
            6: "",
        }
        '''
        bin()函数生成的二进制字符串包含表示二进制的 0b开头的字符串
        '''
        for e in meta:
            if e == "=":
                break
            else:
                i = smap.index(e)
                s = format(i, 'b')
                d = d + prefix[len(s)] + s
        '''
        match函数和js中的不一样, 不是多次匹配
        '''
        ms = re.findall("[0-1]{8}", d)
        result = ''
        for m in ms:
            result += chr(int(m, base=2))
        return result


if __name__ == '__main__':
    start = time.perf_counter()
    print('download start')
    csw = CSW('http://www.99csw.com/book/9479/index.htm')
    print(f'running time: {time.perf_counter() - start} seconds')
