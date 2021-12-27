__all__ = ['Spider']

import httpx
from . import log_module
from httpx import HTTPError
from httpx import TimeoutException


class Spider:
    def __init__(self):
        timeout = httpx.Timeout(30, connect=60)
        self._session = httpx.Client(timeout=timeout, http2=True, follow_redirects=False)
        self.is_404 = False
        self.__logger = log_module.Logs()

    def quit(self):
        self._session.close()
        self._session = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.quit()

    def get_dom(self, url, ua):
        try:
            r = self._session.get(url, headers={"User-Agent": ua})
            code = r.status_code
            if code == 200:
                return r.text
            else:
                self.is_404 = code == 404
                print('httpx:', url, code)
                return None
        except (TimeoutException, HTTPError):
            self.__logger.capture_except('httpx')
        return None
