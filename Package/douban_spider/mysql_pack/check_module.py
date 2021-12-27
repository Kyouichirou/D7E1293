__all__ = ["Check"]

from . import Database
from ..log_module import Logs

logger = Logs()


class Check(Database):
    # 查询数据
    def __new__(cls, *args, **kwargs):
        return super(Database, cls).__new__(cls, *args, **kwargs)

    def __check_data(self, sql, data=None):
        # noinspection PyBroadException
        # 为防止后续出现重复的键值, 出现错误则统一返回True
        try:
            self.cursor.execute(sql, data) if data else self.cursor.execute(sql)
            return True if self.cursor.fetchall() else False
        except Exception:
            logger.capture_except('check')
            return True

    def book(self, key: int):
        # 执行后返回包含元祖的list
        # try..except, 错误捕捉, 多个不能用or , 支持and 或 (a, b)
        # Indicates whether there is an unread result. It is set to False if there is not an unread result, otherwise True.
        # This is used by cursors to check whether another cursor still needs to retrieve its result set.
        # Do not set the value of this property, as only the connector should change the value.
        # In other words, treat this as a read-only property.
        # 如果不fetchall, 在执行之后会导致后面的操作出现错误, 包括退出
        # noinspection PyBroadException
        sql = f'select douban_id from {self.table_names["book"]} where douban_id = {key} limit 1;'
        return self.__check_data(sql) or self.no_found_404((key, 0))

    def no_found_404(self, data):
        # doulist, book, series, work
        sql = f'select id from {self.table_names["no_found"]} where id=%s and type=%s limit 1;'
        return self.__check_data(sql, data)

    def tag_404(self, key: str):
        # 注意包含转义字的标签, "{key}"
        sql = f'select tagname from {self.table_names["tag_4"]} where tagname=%s limit 1;'
        return self.__check_data(sql, (key,))

    def tag(self, key: str):
        # 检查标签是否存在, # 注意包含转义字的标签
        sql = f'select tagname from {self.table_names["tag"]} where tagname =%s limit 1;'
        return self.__check_data(sql, (key,))

    def doulist(self, key: int):
        # 检查豆列是否存在
        sql = f'select * from {self.table_names["doulist"]} where doulist_id = {key} limit 1;'
        return self.__check_data(sql)

    def doulist_book(self, data):
        # 因为需要将字符串日期格式化, 故而在添加数据前先执行数据检测
        sql = f'select doulist_id from {self.table_names["doulist_b"]} where doulist_id=%s and douban_id=%s limit 1;'
        return self.__check_data(sql, data)

    def series(self, series_id: int):
        sql = f'select series_id from {self.table_names["series"]} where series_id={series_id} limit 1;'
        return self.__check_data(sql)

    def nation(self, nation: str):
        sql = f' select nation from {self.table_names["book"]} where nation=%s limit 1;'
        return self.__check_data(sql, (nation,))
