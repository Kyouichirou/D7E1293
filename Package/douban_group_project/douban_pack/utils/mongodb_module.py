__all__ = ['Database']

import pymongo
from .log_module import Logs

_logger = Logs()


class Database:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.quit()

    def __init__(self):
        self.__client = None
        self.__collection = None

    @_logger.decorator('mongodb fail to initialize')
    def initial(self) -> bool:
        # 注意这里假如, mongodb服务没有启动, 不会出现错误
        self.__client = pymongo.MongoClient(
            host="localhost",
            port=27017
        )
        self.__collection = self.__client['douban_spider']['group']
        # server_info(), 这里会出现错误, 假如服务没有运行
        print(f'[info]: mongodb {self.__client.server_info()["version"]} has been connected successfully')
        return True

    @_logger.decorator('insert data error')
    def insert_data(self, datas: list) -> bool:
        self.__collection.insert_many(datas)
        return True

    def check_url_id(self, url_id: str) -> bool:
        try:
            # find_one => 返回dict, or None
            # find => 返回的是cursor
            cursor = self.__collection.find_one({'url_id': url_id}, {'url_id': True})
            return True if cursor else False
        except Exception as error:
            # 假如出现错误, 则返回true, 以避免重复内容写入
            _logger.capture_except(error)
            return True

    def quit(self):
        if self.__client:
            self.__client.close()
            self.__client = None
