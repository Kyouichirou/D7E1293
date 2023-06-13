__all__ = ['Logs']

import os
import time
from loguru import logger


# finished_state: 1
# 日志记录

def _time_stamp():
    return str(int(time.time()))


class Logs:
    _instance = None
    _duplicated_dic = None
    _path = None
    _is_write = False

    def __del__(self):
        # 假如没有错误写入内容删掉日这
        if not self._is_write:
            time.sleep(0.5)
            os.remove(self._path)
            print('no data write to log, delete log file')

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            # 用于存储消息, 剔除掉重复显示的数据
            cls._duplicated_dic = {
                'info': [],
                'debug': [],
                'error': [],
                'warning': []
            }
            cls._instance = super(Logs, cls).__new__(cls, *args, **kwargs)
            path = os.path.dirname(os.path.abspath(
                os.path.join(os.path.dirname(__file__), os.path.pardir))) + fr'\logs\douban_log_{_time_stamp()}.log'
            logger.add(path, rotation="5MB", encoding="utf-8", enqueue=True, backtrace=True, diagnose=True)
            cls._path = path
        return cls._instance

    @classmethod
    def info(cls, msg):
        if cls._check_data('info', msg):
            return
        logger.info(msg)

    @classmethod
    def _check_data(cls, s_type, msg):
        if msg in cls._duplicated_dic[s_type]:
            return True
        cls._duplicated_dic[s_type].append(msg)
        return False

    @classmethod
    def debug(cls, msg):
        if cls._check_data('debug', msg):
            return
        logger.debug(msg)

    @classmethod
    def warning(cls, msg):
        if cls._check_data('warning', msg):
            return
        logger.warning(msg)
        cls._is_write = True

    @classmethod
    def error(cls, msg):
        if cls._check_data('error', msg):
            return
        logger.error(msg)
        cls._is_write = True

    @staticmethod
    def capture_except(msg):
        logger.exception(msg)

    def decorator(self, msg):
        def decorator_log(func):
            # 错误日志记录-装饰器
            def wrapper(*args, **kwargs):
                # noinspection PyBroadException
                try:
                    return func(*args, **kwargs)
                except Exception:
                    self.capture_except(msg)
                    self._is_write = True
                    return None

            return wrapper

        return decorator_log
