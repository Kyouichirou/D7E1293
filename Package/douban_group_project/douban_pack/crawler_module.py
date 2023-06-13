__all__ = ['Crawler']

import time
import random
import requests
from .utils.log_module import Logs
from .utils.browser_module import RandomUA

_logger = Logs()


class Crawler:
    @property
    def anti_spider(self) -> bool:
        return self._anti_spider

    @property
    def requests_times(self) -> int:
        return self._request_times

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.exit_crawler()

    def __init__(self):
        self._request_times = 0
        self._visited_state = False
        self._anti_spider = False
        self.__visited_times = 0
        self._state_code = None
        self._close_state = False
        self._error_times = 0
        self.__random_count = random.randint(15, 35)
        self._random_ua = RandomUA()
        self._headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;'
                      'q=0.9,image/avif,image/webp,image/apng,*/*;'
                      'q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': self._random_ua.get_language(),
            'Connection': 'keep-alive',
            'Host': 'www.douban.com',
            'Referer': '',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': self._random_ua.get_ua(),
        }
        self._session = requests.session()

    def request(self, url: str, referer: str) -> str:
        try:
            print(f'[get data from]: {url}')
            if self.__visited_times == self.__random_count:
                self.__random_count = random.randint(15, 35)
                self._visited_state = False
                self.reset_connect()

            if self.__visited_times == 1:
                self._visited_state = True
                self._headers['Sec-Fetch-Site'] = 'same-origin'

            if self._visited_state:
                self._headers['Referer'] = referer
            self.__visited_times += 1
            r = self._session.get(url, headers=self._headers, timeout=(33, 33))
            code = r.status_code
            self._state_code = code
            self._request_times += 1
            time.sleep(random.uniform(3.25, 10.25))
            if code == 200:
                # decode支持的一个额外参数, 默认是严格模式strict
                # errors='ignore'
                # 支持检查的额外的编码参数, 默认为strict类型
                return r.content.decode('utf-8')
            self._error_times += 1
            if self._error_times > 25 or (code != 404 and code != 403):
                self._anti_spider = True
            _logger.warning(f'[fail]: no 200, {url}, {referer}, {code}')
        except Exception as error:
            _logger.capture_except(error)

    @property
    def state_code(self) -> int:
        return self._state_code

    def exit_crawler(self):
        if not self._close_state:
            self._session.close()
            self._session = None
            self._close_state = True

    def reset_connect(self):
        if self._request_times == 0:
            return
        self.exit_crawler()
        self.__visited_times = 0
        time.sleep(random.uniform(0.55, 5.25))
        print('[info]: switch to new agent....')
        self._session = requests.session()
        self._headers['Sec-Fetch-Site'] = 'none'
        self._headers['User-Agent'] = self._random_ua.get_ua()
        self._headers['Accept-Language'] = self._random_ua.get_language()
        self._close_state = False
