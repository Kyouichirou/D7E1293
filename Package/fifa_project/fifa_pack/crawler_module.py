__all__ = ['Crawler']

import time
import random
import requests
from .utils.log_module import Logs
from .utils.browser_module import RandomUA

_logger = Logs()


class Crawler:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.exit_crawler()

    def __init__(self):
        self._visited_state = False
        self._state_code = None
        self._random_ua = RandomUA()
        self._headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;'
                      'q=0.9,image/avif,image/webp,image/apng,*/*;'
                      'q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Host': 'data.7m.com.cn',
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
            print(f'get data from: {url}')

            if not self._visited_state:
                self._visited_state = True
                self._headers['Sec-Fetch-Site'] = 'same-origin'
            self._headers['Referer'] = referer

            r = self._session.get(url, headers=self._headers, timeout=(33, 33))
            code = r.status_code
            self._state_code = code
            time.sleep(random.uniform(0.35, 3.25))
            if code == 200:
                # decode支持的一个额外参数, 默认是严格模式strict
                # errors='ignore'
                # 支持检查的额外的编码参数, 默认为strict类型
                return r.content.decode('utf-8')
            _logger.warning(f'fail: no 200, {url}, {referer}, {code}')
        except Exception as error:
            _logger.capture_except(error)

    @property
    def state_code(self) -> int:
        return self._state_code

    def exit_crawler(self):
        self._session.close()

    def reset_connect(self):
        self.exit_crawler()
        self._session = requests.session()
        self._headers['User-Agent'] = self._random_ua.get_ua()
        time.sleep(random.uniform(0.55, 5.25))
