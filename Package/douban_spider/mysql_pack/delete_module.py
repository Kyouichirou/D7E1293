__all__ = ["Delete"]

from . import Database
from ..log_module import Logs

logger = Logs()


class Delete(Database):
    def __new__(cls, *args, **kwargs):
        return super(Database, cls).__new__(cls, *args, **kwargs)

    @logger.decorator('delete')
    def __excute(self, sql: str):
        self.cursor.execute(sql)
        self.changed = True

    def book(self, db_id: int):
        sql = f'delete from {self.table_names["book"]} where douban_id = {db_id};'
        self.__excute(sql)

    def doulist(self, doulist_id: int):
        sql = f'delete from {self.table_names["doulist"]} where doulist_id={doulist_id};'
        self.__excute(sql)

    def tag(self, tagname: str):
        # 注意字符串的符号, 使用f"", 有别于单独传入元祖参数
        sql = f'delete from {self.table_names["tag"]} where tagname="{tagname}";'
        self.__excute(sql)

    def series(self, series_id: int):
        sql = f'delete from {self.table_names["series"]} where series_id={series_id};'
        self.__excute(sql)
