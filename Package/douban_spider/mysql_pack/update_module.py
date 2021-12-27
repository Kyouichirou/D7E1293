__all__ = ["Update"]

from . import Database
from ..log_module import Logs

logger = Logs()


class Update(Database):
    # 更新数据
    def __new__(cls, *args, **kwargs):
        return super(Database, cls).__new__(cls, *args, **kwargs)

    def tag(self, data):
        # 这是非标准的SQL语句, 仅限于在MySQL上使用, 如果tag不存在, 则将数据完整插入, 如果存在, 则更新指定的数据
        # 页码起始为0, 最大980, 即(i - 1) * 20, 标签页最多展示50页的数据
        sql = (
            f'insert into {self.table_names["tag"]} '
            f'(tagname, page_num, finished_state, update_times) '
            'values(%s, %s, %s, %s) ON DUPLICATE KEY UPDATE '
            'page_num=values(page_num),'
            'finished_state=values(finished_state),'
            'update_times=values(update_times);'
        )
        self.__update(sql, data)

    def doulist(self, data, mode):
        if mode:
            self.__update_record(self.table_names["doulist"], data, 'doulist_id')
        else:
            # 全部内容更新
            sql = (
                f'update {self.table_names["doulist"]} '
                'set page_num = %s,'
                'update_times = %s,'
                'title=%s,'
                'c_time=%s,'
                'u_time=%s,'
                'follow_nums=%s,'
                'rec_nums=%s where doulist_id = %s;'
            )
            self.__update(sql, data)

    def series(self, data):
        self.__update_record(self.table_names['series'], data, 'series_id')

    def work(self, data):
        sql = f'update {self.table_names["work"]} set update_times=%s where same_id=%s;'
        self.__update(sql, data)

    def book(self, data):
        sql = (
            f'update {self.table_names["book"]} '
            'set rate=%s,'
            'set star_5=%s,'
            'set star_4=%s,'
            'set star_3=%s,'
            'set star_2=%s,'
            'set star_1=%s,'
            'set rate_nums=%s,'
            'set comment_nums=%s,'
            'set review_nums=%s,'
            'set note_nums=%s,'
            'set reading_nums=%s,'
            'set read_nums=%s,'
            'set want_nums=%s,'
            'set update_times=%s,'
            'set quote=%s,'
            'set tag_nums=%s '
            'where douban_id=%s;'
        )
        self.__update(sql, data)

    def book_404(self, db_id: int):
        sql = f'update {self.table_names["book"]} set status_404=1 where douban_id={db_id};'
        self.__update(sql)

    def work_404(self, same_id: int):
        sql = f'update {self.table_names["work"]} set status_404=1 where same_id={same_id};'
        self.__update(sql)

    @logger.decorator('update')
    def __update(self, sql, data=None):
        self.cursor.execute(sql, data) if data else self.cursor.execute(sql)
        self.changed = True

    def __update_record(self, tbname, data, key):
        sql = (
            f'insert into {tbname} '
            f'({key}, page_num, update_times) '
            'values(%s, %s, %s) ON DUPLICATE KEY UPDATE '
            'page_num=values(page_num),'
            'update_times=values(update_times);'
        )
        # sql = f'update {tbname} set page_num=%s, set update_times= %s where {key}=%s;'
        self.__update(sql, data)
