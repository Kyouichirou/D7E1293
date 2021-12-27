__all__ = ["Config"]

import os
from configparser import ConfigParser


class Config:
    def __init__(self):
        self.config = ConfigParser()
        self.__path = os.path.join(os.getcwd(), os.path.dirname(__file__), 'douban.ini')
        self.config.read(self.__path, encoding='UTF-8') if os.path.exists(self.__path) else self.__initial_create()

    def __initial_create(self):
        # 数据库的记录
        self.config['mysql'] = {
            "user": "root",
            "host": "localhost",
            "passwd": "MySQL@#2021",
            "port": "3306",
            "database": "douban2022",
        }
        # 数据的创建
        self.config['database'] = {
            'created': "False"
        }
        # 记录爬虫情况
        self.config['crawler'] = {
            "total": "0"
        }
        # 运行记录
        self.config['running_state'] = {
            "start_time": "0",
            "end_time": "0",
        }
        # 记录更新情况
        self.config['update'] = {
            'book': "0",
            "tag": "1"
        }
        # 种子id
        self.config['seed'] = {
            'douban_id': "10554308"
        }
        self.__write()

    def __write(self):
        with open(self.__path, encoding='utf-8', mode='w') as f:
            self.config.write(f)

    def read(self, section: str, key='') -> str or dict:
        return self.config[section][key] if key else dict(self.config.items(section))

    def set(self, section: str, key: str, value: str):
        self.config.set(section, key, value)
        self.__write()
