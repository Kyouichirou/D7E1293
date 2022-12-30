__all__ = ["Config"]

import os
import time
from configparser import ConfigParser


# @description: 配置模块, ConfigParser只支持字符串的形式的数据, 不支持包含数字在内的其他类型

class Config:
    def __init__(self):
        self._config = ConfigParser()
        self._path = os.path.join(os.getcwd(), os.path.dirname(__file__), 'douban_spider.ini')
        self._config.read(self._path, encoding='UTF-8') if os.path.exists(self._path) else self._initial_create()

    def _initial_create(self):
        # 记录爬虫情况, 累计执行访问的次数
        self._config['crawler'] = {
            "total": "0"
        }
        # 运行记录, 开始的时间, 到最后执行的时间
        self._config['running_state'] = {
            "start_time": str(int(time.time() * 1000)),
            "end_time": "0",
        }
        self._write()

    def _write(self):
        # 写入的数据必须是文本类型, 即数字不能直接写入, 需要转为文本类型
        with open(
                self._path,
                encoding='utf-8',
                mode='w'
        ) as f:
            self._config.write(f)

    def read(self, section: str, key='') -> str or dict:
        return self._config[section][key] if key else dict(self._config.items(section))

    def set(self, section: str, key: str, value: str):
        self._config.set(section, key, value)
        self._write()
