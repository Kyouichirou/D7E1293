__all__ = ['Crawler']

import time
import random
import requests
from math import sin, cos
from functools import partial
from bs4 import BeautifulSoup as Btf
from urllib.parse import quote_plus as quotex
from http.client import IncompleteRead as iCR
from requests.utils import dict_from_cookiejar as dfc
from requests.exceptions import ReadTimeout as rTo, ConnectTimeout as cTo
# package_built-in module
from . import other_module
from . import browser_module
from . import httpx_backup_module


class Crawler:
    def __setattr__(self, key, value):
        # 中断操作标志; 情景: 反爬, 访问达到上限, 太多错误, 手动退出, 太慢
        # 路由器断开网络链接, 重新获取新的IP
        # __dict__, 不会触发__setattr__
        self.__dict__[key] = value
        if value == True and key in ('is_anti', 'is_limit', 'too_error', 'too_slow'):
            # 当出现过多的错误和访问过慢, 以及触发反爬, 将触发路由器重新联网
            if key != 'is_limit':
                self.__dict__['retry_flag'] = False
                self.logger.warning(f'anti_spider: {self.__single_avg_time}')
                if self.control.reconnect(self.__session):
                    self.__dict__['retry_flag'] = True
                    self.__parameters_reset()
                    self.__update_parameters()
                    return
            self.__dict__['is_break'] = True

    def __init__(self):
        self.initial_falg = False
        self.__brower_fraud = browser_module.Fraud()
        if not self.__brower_fraud.js_initial:
            print('failed to initialize browser_module')
            return
        self.initial_falg = True
        # flag
        self.logger = None
        self.too_slow = False
        self.slow_times = 0
        self.too_error = False
        self.is_break = False
        self.is_anti = False
        self.is_404 = False
        self.__retry_flag = False
        # record
        self.avg_list = []
        self.gap_list = []
        self.err_list = other_module.load_error_file()
        self.pre_list = ['/tag/', '/subject/', '/doulist/', '/series/']
        # error_types
        self.__a_c = 0
        # 一般错误
        self.__b_c = 0
        # 301错误
        self.__c_c = 0
        # timeout 错误
        self.__d_c = 0
        # 其他错误
        # counter
        self.top_limit = 0
        self.counter = 0
        self.total = 0
        self.__buffer_counter = 70
        self.total_counter = 0
        self.error_counter = 0
        self.__random_counter = 0
        # browser
        self.cookies_flag = False
        self.cookies = {}
        # time
        self.__time_tuning_a = (
            (0.91, 0.2), (0.9, 0.4), (0.85, 0.5), (0.83, 0.55), (0.82, 0.6), (0.81, 0.65), (0.78, 0.7), (0.74, 0.75),
            (0.71, 0.8))
        self.__time_tuning_b = ((0.62, 1.15), (0.63, 1.1), (0.66, 1.05), (0.69, 1))
        self.speed_ratio = 1
        self.start_time = 0
        self.a_time = 0
        self.b_time = 0
        self.gap_time = 0
        self.extra_time = 0
        self.gap_time = 0
        # func
        self.__session_mean = lambda x: sum(x) / len(x) if x else 0
        self.__round = lambda x: partial(round, x, 4)()
        # class
        self.control = None
        self.__httpx = None
        self.__random_header = None
        self.__session = None
        self.__clock = cos if random.randint(1, 100) // 3 == 0 else sin
        self.__update_parameters()
        print('crawler_module is initialized successfully')

    def quit(self):
        if self.initial_falg:
            self.__session.close()
            if self.__httpx:
                self.__httpx.quit()
                self.__httpx = None
            self.__session = None
            self.__brower_fraud = None
            other_module.write_error(self.err_list)
        print('crawler_module has been exited successfullt')

    def __check_limit(self):
        self.counter += 1
        self.__random_counter -= 1
        if self.counter > self.top_limit:
            print(f'the visit has reached the limit of {self.top_limit}')
            self.is_limit = True
        elif self.__random_counter == 0:
            self.__session.close()
            self.__update_parameters()

    def __set_header(self):
        self.__random_header = {**self.__brower_fraud.standard_header}

    def __adjust_time(self, mode, r_mean):
        compare, times = (lambda *x: x[0] > x[1], self.__time_tuning_a) if mode else (
            lambda *x: x[0] < x[1], self.__time_tuning_b)
        for e in times:
            if compare(r_mean, e[0]):
                self.speed_ratio = e[1]
                return
        if self.total > 2000:
            q = 1 - self.total // 1000 * 0.017
            if 0.5 < q < 1:
                self.speed_ratio = q

    def __update_parameters(self):
        # 更新伪装信息, 调节休眠时间
        r_mean = self.request_time_mean
        if r_mean > 0.95:
            self.slow_times += 1
            if self.slow_times > 45 and self.counter > 300:
                print('network too slow')
                self.too_slow = True
                # 假如重新链接网络后
                if self.__retry_flag:
                    self.__retry_flag = False
                else:
                    return
            else:
                self.logger.info(f'slow {r_mean}')
        else:
            self.total > 800 and self.__adjust_time(r_mean > 0.71, r_mean)
            if self.slow_times > 0:
                self.slow_times -= 1
        if self.cookies:
            self.cookies.clear()
        self.cookies_flag = False
        s_mean = self.__session_mean(self.gap_list)
        if self.__buffer_counter > 0:
            self.extra_time = 0.105 if self.__buffer_counter > 25 else 0.06
            self.__buffer_counter -= 1
        else:
            self.extra_time = 0
        k = x = 0
        if s_mean > 0:
            print(
                f'avg time of requests:\
                \ntotal was::               {self.__round(r_mean)}s;\
                \nsession was::             {self.__round(s_mean)}s;\
                \nsingle_time::             {self.__single_avg_time}s;'
            )
            if s_mean < 0.55:
                k = 6
                if s_mean < 0.4:
                    self.extra_time += 0.205
                elif s_mean < 0.45:
                    self.extra_time += 0.122
                elif s_mean < 0.48:
                    self.extra_time += 0.092
                else:
                    self.extra_time += 0.078
            else:
                if s_mean < 0.65:
                    k = 5
                    x = 1
                    self.extra_time += 0.05
                elif s_mean < 0.88:
                    k = 2
                    x = 2
                elif s_mean < 1.08:
                    k = 1
                    x = 3
                elif s_mean < 1.14:
                    k = 3
                    x = 4
                    self.extra_time = -0.082
                else:
                    self.extra_time = -0.152
                    x = 5
                    k = 4
            self.gap_list.clear()
        a, b = ((5, 9), (7, 11), (9, 13), (11, 15), (13, 17), (15, 19))[x]
        self.__random_counter = random.randint(a, b)
        self.a_time, self.b_time = ((8, 16), (1, 5), (2, 10), (1, 3), (2, 4), (2, 6), (0, 11))[k]
        self.__set_header()
        self.__session = requests.session()

    def add_cookie(self, db_id='', ctime=0, cookies=None):
        # 随机添加cookie
        if db_id:
            if 'viewed' in self.cookies:
                cps = self.cookies['viewed'].split('_')
                if len(cps) == 10:
                    cps.pop()
                cps.insert(0, db_id)
                self.cookies['viewed'] = '_'.join(cps)
            else:
                self.cookies['viewed'] = db_id
        elif ctime:
            if cookies:
                self.cookies = cookies
                if not 'ap_v' in self.cookies:
                    self.cookies['ap_v'] = '0,6.0'
                p = partial(random.randint, 1)
                if not '_pk_ses.100001.3ac3' in self.cookies and p(100) % 3 == 0:
                    self.cookies['_pk_ses.100001.3ac3'] = "*"
                if not '_pk_ref.100001.3ac3' in self.cookies and p(100) % 2 == 0:
                    self.cookies['_pk_ref.100001.3ac3'] = quotex(
                        f'["","",{ctime},"{self.__brower_fraud.random_refer}"]')
                if not 'douban-fav-remind' in self.cookies and p(100) % 5 == 0:
                    self.cookies['douban-fav-remind'] = '1'
                if not 'll' in self.cookies and p(100) % 7 == 0:
                    self.cookies['ll'] = "118282"

    def __show_info(self, url: str):
        print(
            f'scraping_{self.total}/{self.top_limit}/{(str((self.total / self.top_limit) * 100) + "00")[0:5] + "%"}:\
            {url[url.find("com") + 4:]}')

    def __handle_404(self):
        time.sleep(random.uniform(0.01, 3.5))
        self.counter -= 1
        self.is_404 = True

    def __error_handle(self, url: str, types: int, error):
        print('error: ' + url, error)
        self.counter -= 1
        if any(e in url for e in self.pre_list):
            if not 'doulists?start' in url and url not in self.err_list:
                self.err_list.append(url)
        if types < 4:
            s_time = 0
            if types == 0:
                self.__a_c += 1
                if self.__a_c > 25:
                    self.too_error = True
                else:
                    s_time = 0.35
            elif types == 1:
                self.__b_c += 1
                if self.__b_c > 20:
                    self.too_error = True
                else:
                    s_time = 1.2
            elif types == 2:
                self.__c_c += 1
                if self.__c_c > 5:
                    self.too_slow = True
                else:
                    s_time = 3.5
            elif types == 3:
                self.__d_c += 1
                if self.__d_c > 3:
                    self.too_error = True
                else:
                    s_time = 10
            if s_time:
                time.sleep(s_time)
                self.__session.close()
                self.__update_parameters()

    def __httpx_retry(self, url: str, code: int):
        if not self.__httpx:
            self.__httpx = httpx_backup_module.Spider()
        print(f'{code}: {url}')
        self.total_counter += 1
        time.sleep(random.uniform(3.5, 25.5))
        text = self.__httpx.get_dom(url, self.__brower_fraud.h_version_ua(self.total))
        if text:
            if self.__check_anti_spider(text):
                self.__error_handle(url, 4, 'anti spider')
                self.is_anti = True
                return None
            else:
                self.__session.close()
                self.__update_parameters()
                return Btf(text, 'lxml')
        else:
            if self.__httpx.is_404:
                print(f'{code} => 404, {url}')
                self.__httpx.is_404 = False
                self.__handle_404()
            else:
                self.__error_handle(url, 3 if code == 302 else 2, code)
        return None

    def request(self, url: str, host: str, refer: str):
        self.__check_limit()
        if self.is_break:
            if '/subject/' in url and not 'doulists' in url and url not in self.err_list:
                self.err_list.append(url)
            return None
        self.total += 1
        self.total_counter += 1
        self.__show_info(url)
        s = time.time()
        try:
            # 注意host和refer的设置
            if refer:
                self.__random_header['Referer'] = refer
            else:
                self.__random_header['Referer'] = self.__brower_fraud.bing_url(url)
            if host:
                self.__random_header['Host'] = host
            r = self.__session.get(url, headers=self.__random_header, timeout=(93, 93), allow_redirects=False,
                                   cookies=self.cookies) if self.cookies else self.__session.get(url,
                                                                                                 headers=self.__random_header,
                                                                                                 timeout=(93, 93),
                                                                                                 allow_redirects=False)
            code = r.status_code
            if code == 200:
                text = r.text
                # 检测是否触发反爬机制
                # douban的安全机制有非常多种形式, 302重定向, 返回错误的页面等
                # 直接将check的结果赋予self.ia_anti, 调试器没有跳转__setattr__
                # 多次403可能潜在触发反爬
                # 302, 基本可以表示触发反爬
                # 部分标签, 没有底部的下一页, 但实际上还是有内容的(不超过49页)
                # 潜在触发307重定向
                # 404, 多出现在标签页上, 部分标签的页面被移除, 标签还保留着
                # 不同的状态码, 表示豆瓣的服务器的访问状态的波动, 如出现部分的307, 并不意味着触发反爬机制
                # 500错误, 内部错误, 多发生于过载, 也可能是服务器端的主动设置, 以检验是否为爬虫访问的措施
                # 豆瓣的服务器经常性的不稳定, 很容易出现不规则的错误
                if self.__check_anti_spider(text):
                    self.__error_handle(url, 4, 'anti spider')
                    self.is_anti = True
                    return None
                else:
                    ctime = time.time()
                    k = ctime - s
                    if self.cookies_flag and not self.cookies:
                        self.add_cookie(ctime=int(ctime), cookies=dfc(r.cookies))
                    if self.gap_time == 0:
                        self.gap_time = random.randint(self.a_time, self.b_time)
                    else:
                        sp = abs(self.__clock(self.counter)) + self.extra_time
                        if sp > 0:
                            sr = self.speed_ratio
                            time.sleep(sp if sr == 1 else sp * sr)
                        self.gap_time -= 1
                    self.avg_list.append(k)
                    self.gap_list.append(k)
                    return Btf(text, 'lxml')
            elif code == 301 or code == 302:
                # 调用httpx模块重新请求数据
                return self.__httpx_retry(url, code)
            elif code == 403:
                self.__error_handle(url, 2, code)
            elif code == 404:
                self.__handle_404()
            elif code == 307:
                self.__error_handle(url, 0, code)
            else:
                self.__error_handle(url, 1, code)
            print(f'failed to get dom: {code}, {url}')
        except (rTo, cTo) as error:
            self.__error_handle(url, 2, error)
        except iCR as error:
            self.__error_handle(url, 2, error)
        except Exception as error:
            self.logger.capture_except(f'unknow error: {url}')
            self.__error_handle(url, 3, error)
        return None

    @property
    def request_time_mean(self):
        return sum(self.avg_list) / (len(self.avg_list)) if self.avg_list else 0

    @property
    def __single_avg_time(self):
        return self.__round((time.time() - self.start_time) / self.total)

    @staticmethod
    def __check_anti_spider(text: str):
        return text.find('sec.douban.com', 0, 500) > 0 or text.find('<title>禁止访问</title>', 0, 1000) > 0

    @property
    def get_external_ip(self):
        return other_module.get_ip(self.__session, self.__brower_fraud.random_ua)

    def __parameters_reset(self):
        # 重置记录参数, 当重新链接网络时
        self.is_anti = False
        self.too_slow = False
        self.too_error = False
        self.error_counter = 0
        self.slow_times = 0
        self.__a_c = 0
        self.__b_c = 0
        self.__c_c = 0
        self.__d_c = 0

    @property
    def random_refer(self):
        return self.__brower_fraud.random_refer

    def bing_refer(self, d_id):
        return self.__brower_fraud.bing_refer(d_id)
