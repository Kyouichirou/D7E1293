import requests
import json
import time
import os
import pandas as pd
from bs4 import BeautifulSoup as bfS
import re
from datetime import datetime as dt
import random
from requests import exceptions as es


class trade_mark:
    def __init__(self, keyword):
        self.session = requests.session()
        self.cookies = ''
        s = self.session_data()
        if s:
            self.query(s, keyword)
        self.session.close()

    def get_dom(self, url, mode = False, refer =''):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
        }
        if self.cookies:
            headers['Referer'] = refer
            # headers['Cookies'] = self.cookies
            print(self.cookies)
        try:
            r = self.session.get(url, headers=headers, timeout=(30, 30))
            if r.status_code != 200 and r.status_code != 302:
                print(r.status_code)
                print('fail' + url)
                return None
            if mode:
                cookies_dict = requests.utils.dict_from_cookiejar(r.cookies)
                cookies = ''
                for key in cookies_dict:
                    cookies = cookies + key + "=" + cookies_dict[key] + ";"
                self.cookies  = cookies
                print(self.cookies)
            return r.text
        except es.Timeout or es.ConnectionError as e:
            print(e)
            return None

    def download_pic(self):
        pass

    def get_mark_pic(self):
        imgs = dom.find_all('img')
        for img in imgs:
            if 'alt' in img.attrs:
                break

    def get_detail(self):
        tables = dom.find_all('tbody')
        for t in tables:
            pass

    # state 参数需要修改
    # state=4810:aonequ.1.1
    def query(self, state, keyword):
        refer = 'https://tmsearch.uspto.gov/bin/gate.exe?f=searchss&' + state
        headers = {
            'Referer': refer,
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': self.cookies,

        }
        params = (
            ('f', 'toc^'),
            ('state', state),
            ('p_search', 'searchss^'),
            ('p_L', '50^'),
            ('BackReference', '^'),
            ('p_plural', 'no^'),
            ('p_s_PARA1', 'live^'),
            ('p_tagrepl^%^7E^%^3A', ['PARA1^%^24LD^', 'PARA2^%^24COMB^']),
            ('expr', 'PARA1 AND PARA2^'),
            ('p_s_PARA2', f'^%^09{keyword}^'),
            ('p_op_ALL', 'ADJ^'),
            ('a_default', 'search^'),
            ('a_search', ['Submit Query^', 'Submit Query']),
        )

        r = requests.get('https://tmsearch.uspto.gov/bin/showfield', headers=headers, params=params)
        # url = f'https://tmsearch.uspto.gov/bin/showfield?f=toc&{state}&p_search=searchss&p_L=50&BackReference=&p_plural=no&p_s_PARA1=live&p_tagrepl%7E%3A=PARA1%24LD&expr=PARA1+AND+PARA2&p_s_PARA2={keyword}&p_tagrepl%7E%3A=PARA2%24COMB&p_op_ALL=ADJ&a_default=search&a_search=Submit+Query&a_search=Submit+Query'
        # html = self.get_dom(url, True, refer)
        print(r.text)

    # 每一次都会产生一个新的session数据, 分别为url和cookie
    def session_data(self):
        url = 'https://tmsearch.uspto.gov/bin/gate.exe?f=login&p_lang=english&p_d=trmk'
        html = self.get_dom(url, True)
        if html:
            dom = bfS(html, 'html.parser')
            center = dom.find('center')
            if center:
                a = center.find('a')
                if a and 'href' in a.attrs:
                    href = a.attrs['href']
                    print(href)
                    if href:
                        state = href[href.rfind('&') + 1:]
                        print(state)
                        return state
        return None


if __name__ == '__main__':
    trade_mark('Daventry')
