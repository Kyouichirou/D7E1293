__all__ = ['Downloader']

import os
import aiohttp
import asyncio
from . import log_module
from aiohttp import client_exceptions as ace


class Downloader:
    def __init__(self):
        self.__error_counter = 0
        self.is_error = False
        self.__logger = log_module.Logs()

    async def __async_download(self, arr, ua):
        # 如果使用new_event_loop, timeout和 connect必须将变量放在loop(task)内, 否则将导致错误
        # 如果是get_event_loop, self.timeout, 可以如此设置
        # 使用Process, 在 __name__ == '__main__'下, 可以在get_event_loop下, 可以多次在不同的进程调用
        connect = aiohttp.TCPConnector(limit=10)
        timeout = aiohttp.ClientTimeout(total=63)
        async with aiohttp.ClientSession(connector=connect, timeout=timeout) as session:
            await asyncio.gather(*[asyncio.create_task(self.__async_fetch(session, e, ua)) for e in arr])

    async def __async_fetch(self, session, data, ua):
        if self.is_error:
            return
        try:
            headers = {
                "User-Agent": ua,
                "Accept-Encoding": "gzip, deflate, br",
                'Accept-Language': 'en-US,en;q=0.9',
                'DNT': '1',
                'Connection': 'keep-alive',
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Referer": data[2]
            }
            async with session.get(data[0], headers=headers) as r:
                if r.status == 200:
                    binary = await r.read()
                    if binary:
                        with open(data[1], mode='wb') as f:
                            f.write(binary)
                else:
                    self.__check_error()
        except (FileNotFoundError, ace, TypeError):
            self.__logger.capture_except('fetch')

    def __check_error(self):
        self.__error_counter += 1
        self.is_error = self.__error_counter > 5

    def async_downloader(self, pic_list, session, ua, mode=False):
        # new_event_loop, 保证可以在当前线程内多次调用loop循环, 依然可能出错
        # 有别于get_event_loop, 只允许运行一次
        try:
            if self.is_error:
                return
            self.__error_counter = 0
            if pic_list:
                print('batch download pic...')
                loop = asyncio.get_event_loop() if mode else asyncio.new_event_loop()
                loop.run_until_complete(self.__async_download(pic_list, ua))
                loop.run_until_complete(asyncio.sleep(0.25))
                if loop.is_running():
                    print('asyinco still running')
                    loop.run_until_complete(asyncio.sleep(0.5))
                if loop.is_closed() is not True:
                    loop.close()
                pic_list.clear()
                # 内存地址(id)不会发生变化, 直接 = [], 将创建新的内存地址
        except (RuntimeError, Exception):
            self.__logger.capture_except('downloader')
            if self.is_error:
                return
            for data in pic_list:
                self.__download_pic(data, session, ua)
                if self.is_error:
                    break
            pic_list.clear()

    def __download_pic(self, data, session, ua):
        if os.path.exists(data[1]):
            return
        headers = {
            "User-Agent": ua,
            "Accept-Encoding": "gzip, deflate, br",
            'Accept-Language': 'en-US,en;q=0.9',
            'DNT': '1',
            'Connection': 'keep-alive',
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Referer": data[2]
        }
        try:
            r = session.get(data[0], headers=headers, timeout=(63, 63))
            if r.status_code == 200:
                with open(data[1], mode='wb') as f:
                    f.write(r.content)
            else:
                self.__check_error()
                print(f'failed to get pic from {data[0]}, code: {r.status_code}')
        except Exception as error:
            print(error)
            self.__check_error()
            print(f'failed to download pic: {data[0]}')
