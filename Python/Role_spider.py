import requests
from bs4 import BeautifulSoup as bFS
import re
import random
import time
import os
from enum import Enum
import pandas as pd


# 支持4种筛选方式, 默认按照销量获取
class Filter_type(Enum):
    by_sell = 0
    by_price = 1
    by_position = 2
    by_new = 3


class Role_spider:
    def __init__(self, typex):
        self.stype = typex
        types = ['popularity_by_sells', 'price', 'position', 'created_at']
        rank_url = f'https://www.rolecosplay.com/new-products.html?dir=asc&order={types[Filter_type[typex].value]}'
        self.session = requests.session()
        self.rreg = re.compile('(\d+[\.,]\d+|\d+)')
        self.storage = []
        self.review = []
        self.title = []
        self.path = os.path.join(os.path.expanduser("~"), 'Documents')
        self.description = []
        links = self.get_links(rank_url, False)
        if links:
            for link in set(links):
                self.get_links(link)
        self.summery_write()
        self.session.close()

    # 获取rank 页面的数据
    def get_links(self, url, mode=True):
        dom = self.get_dom(url)
        if dom:
            links = dom.find_all('a', class_='product-image')
            if links:
                for link in links:
                    if 'href' in link.attrs:
                        href = link.attrs['href']
                        if href:
                            dic = self.get_detail(href)
                            if dic:
                                self.storage.append(dic)
                            time.sleep(random.uniform(0.05, 0.35))
            if mode:
                return None
            # 返回页面总数
            pages = dom.find('div', class_='pages')
            if pages:
                ps = pages.find_all('a')
                arr = []
                for a in ps:
                    if 'href' in a.attrs:
                        href = a.attrs['href']
                        if href:
                            arr.append(href)
                return arr

    def get_dom(self, url):
        cookies = {
            'external_no_cache': '1',
            'trustedsite_visit': '1',
        }
        headers = {
            'Connection': 'keep-alive',
            'sec-ch-ua': '^\\^',
            'sec-ch-ua-mobile': '?0',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Edg/91.0.864.54',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        try:
            r = self.session.get(url, headers=headers, cookies=cookies, timeout=(30, 30))
            if r.status_code != 200:
                print(f'error: {r.status_code}; {url}')
                return None
            return bFS(r.text, 'html.parser')
        except requests.exceptions.Timeout:
            print(f'timeout network: {url}')
            return None

    # title
    @staticmethod
    def get_title(dom):
        title = dom.find('div', class_='product-name')
        return title.text if title else None

    # 价格
    def get_price(self, dom):
        box = dom.find('div', class_='ww-pc-box')
        if box:
            p = box.find('span', class_='price')
            if p:
                pr = p.text
                ms = self.rreg.findall(pr)
                i = len(ms)
                if i == 1:
                    return float(ms[0])
                elif i == 2:
                    return (float(ms[0]) + float(ms[1])) / 2
        return None

    # 评论
    @staticmethod
    def get_reviews(dom):
        reviews = dom.find_all('div', class_='content ctr-track')
        if not reviews:
            return None
        arr = []
        for r in reviews:
            arr.append(r.contents[7].text)
        return arr

    # 产品编号
    @staticmethod
    def get_code(dom):
        code = dom.find('div', class_='product-code')
        return code.text if code else None

    def get_detail(self, url):
        dom = self.get_dom(url)
        if not dom:
            return None
        dic = {
            'code': 'N/A',
            'title': 'N/A',
            'price': 0,
            'reviews': 'N/A',
            'url': url
        }
        code = self.get_code(dom)
        if code: dic['code'] = code
        title = self.get_title(dom)
        if title:
            dic['title'] = title
        else:
            return None
        price = self.get_price(dom)
        if price: dic['price'] = price
        reviews = self.get_reviews(dom)
        if reviews: dic['reviews'] = '|\n'.join(reviews)
        return dic

    @staticmethod
    def get_time_stamp():
        return str(round(time.time() * 1000))

    def summery_write(self):
        if self.storage:
            df = pd.DataFrame(self.storage)
            df.to_excel(self.path + fr'\{self.get_time_stamp()}_{self.stype}.xlsx', sheet_name=f'{self.stype}',
                        index=False)


if __name__ == '__main__':
    Role_spider(Filter_type.by_sell.name)
