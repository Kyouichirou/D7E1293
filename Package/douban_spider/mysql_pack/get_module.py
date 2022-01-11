__all__ = ["Get"]

from . import Database
from ..log_module import Logs

logger = Logs()


class Get(Database):
    # 获取数据
    def __new__(cls, *args, **kwargs):
        return super(Database, cls).__new__(cls, *args, **kwargs)

    @logger.decorator('query_data')
    def __query_data(self, command_line: str):
        self.cursor.execute(command_line)
        arr = self.cursor.fetchall()
        self.sql.free_result()
        return arr

    def tag(self, update: int, limit: int):
        # 获取未完成的爬取数据的标签
        sql = f'select tagname, page_num, finished_state, update_times from {self.table_names["tag"]} where update_times = {update} limit {limit};'
        return self.__query_data(sql)

    def doulist(self, update: int, limit: int):
        # 获取未完成的豆列
        sql = f'select doulist_id, page_num, update_times from {self.table_names["doulist"]} where update_times = {update} limit {limit};'
        return self.__query_data(sql)

    # 修改
    def work(self, update: int, limit: int):
        sql = f'select same_id, update_times from {self.table_names["work"]} where update_times={update} and status_404=0 limit {limit};'
        return self.__query_data(sql)

    def series(self, update: int, limit: int):
        sql = f'select series_id, page_num, update_times from {self.table_names["series"]} where update_times={update} limit {limit};'
        return self.__query_data(sql)

    def book(self, update: int, limit: int):
        sql = f'select douban_id, update_times from {self.table_names["book"]} where update_times={update} limit {limit};'
        return self.__query_data(sql)

    def random_tag(self, limit: int):
        # 随机获取标签
        sql = f'SELECT tagname FROM {self.table_names["tag"]} ORDER BY rand() LIMIT {limit};'
        return self.__query_data(sql)

    def random_book(self, limit=int):
        # 随机获取书籍
        sql = f'SELECT douban_id FROM {self.table_names["book"]} ORDER BY rand() LIMIT {limit};'
        return self.__query_data(sql)
