__all__ = ['Spider']

import httpx
import tldextract
from . import log_module
from httpx import HTTPError
from httpx import TimeoutException


class Spider:
    def __init__(self):
        timeout = httpx.Timeout(30, connect=60)
        self._session = httpx.Client(timeout=timeout, http2=True, follow_redirects=True)
        self.is_404 = False
        self.is_anti = False
        self.redirected_url = None
        self.url_change = False
        self.__logger = log_module.Logs()

    def quit(self):
        self._session.close()
        self._session = None

    def get_dom(self, url, ua):
        try:
            r = self._session.get(url, headers={"User-Agent": ua})
            code = r.status_code
            self.redirected_url = None
            self.url_change = False
            new_url = str(r.url)  # 注意这里的URL, 而是整合了URL的多种元素(host等) 不是字符串格式
            if code == 200:
                # 如果发生重定向, History会包含数据
                if r.history:
                    sub = tldextract.extract(new_url)[0]
                    if sub == 'sec':
                        self.is_anti = True
                        return None
                    elif sub != tldextract.extract(url)[0]:
                        # 假如重定向到其他的域
                        self.url_change = True
                        return None
                    print(f'url has changed: {new_url}')
                    self.redirected_url = new_url
                return r.text
            elif 'sec.' in new_url:
                self.is_anti = True
            else:
                self.is_404 = code == 404
                print('httpx:', url, code)
                return None
        except (TimeoutException, HTTPError):
            self.__logger.capture_except(f'httpx error: {url}')
        return None
