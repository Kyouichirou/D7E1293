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
        self.__client = pymongo.MongoClient(
            host="localhost",
            port=27017
        )
        self.__collection = self.__client['douban_spider']['group']
        print('mongodb has been connected successfully')
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
            _logger.capture_except(error)
            return True

    def quit(self):
        if self.__client:
            self.__client.close()
            self.__client = None
