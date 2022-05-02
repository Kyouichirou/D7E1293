__all__ = ['Logs']

import os
from loguru import logger


# 日志记录

# def __new__, 单例集成, 即当此cls初始化之后, 其他的模块再度调用此cls, 将会直接返回该cls的实例化对象所在的指针, 而不是再次实例化, 适用于一个程序中需要统一接口的操作, 如日志, 数据库等操作

class Logs:
    __instance = None

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            cls.__instance = super(Logs, cls).__new__(cls, *args, **kwargs)
            path = os.path.join(os.getcwd(), os.path.dirname(__file__), 'audio.log')
            logger.add(path, rotation="5MB", encoding="utf-8", enqueue=True, backtrace=False, diagnose=False)
        return cls.__instance

    @staticmethod
    def info(msg):
        return logger.info(msg)

    @staticmethod
    def debug(msg):
        logger.debug(msg)

    @staticmethod
    def warning(msg):
        logger.warning(msg)

    @staticmethod
    def error(msg):
        logger.error(msg)

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
                    return None

            return wrapper

        return decorator_log
