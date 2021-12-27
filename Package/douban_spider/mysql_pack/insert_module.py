__all__ = ["Insert"]

from . import Database
from ..log_module import Logs

logger = Logs()


class Insert(Database):
    # 插入数据
    # 两种不同的插入方式, a. 检查数据, 如果不存在则插入; b. 直接插入(已经检查过id是否存在)
    def __new__(cls, *args, **kwargs):
        return super(Database, cls).__new__(cls, *args, **kwargs)

    def book(self, data: tuple):
        # 41 项目
        sql = (
            f'INSERT INTO {self.table_names["book"]}'
            '('
            "douban_id,"
            "title,"
            "subtitle,"
            "ogltitle,"
            "publisher,"
            "publish_time,"
            "publish_y,"
            "publish_m,"
            "publish_d,"
            "author,"
            "author_id,"
            "nation,"
            "pages,"
            "producer,"
            "producer_id,"
            "price_c,"
            "price,"
            "translator,"
            "series,"
            "series_id,"
            "rate,"
            "star_5,"
            "star_4,"
            "star_3,"
            "star_2,"
            "star_1,"
            "isbn,"
            "rate_nums,"
            "comment_nums,"
            "review_nums,"
            "note_nums,"
            'reading_nums,'
            'read_nums,'
            'want_nums,'
            "same_id,"
            "binding,"
            'quote,'
            "tags,"
            'tag_nums,'
            "pic_url,"
            "update_times"
            ')'
            'values ('
            '%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,'
            '%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,'
            '%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,'
            '%s, %s, %s, %s, %s, %s, %s, %s'
            ');'
        )
        return self.__insert_data(sql, data)

    def contents(self, data):
        sql = f'insert into {self.table_names["contents"]} values(%s, %s);'
        self.__insert_data(sql, data)

    def abstract(self, data):
        sql = (
            f'INSERT INTO {self.table_names["abstract"]} '
            '('
            'douban_id,'
            'abstract'
            ') '
            'values (%s, %s);'
        )
        return self.__insert_data(sql, data)

    def author_about(self, data):
        sql = (
            f'INSERT INTO {self.table_names["about"]} '
            '('
            'douban_id,'
            'author,'
            'about'
            ') '
            'values (%s, %s, %s);'
        )
        self.__insert_data(sql, data)

    def tag(self, data):
        tbname = self.table_names['tag']
        sql = (
            f'INSERT INTO {tbname} (tagname, page_num, finished_state, update_times) '
            'SELECT %s, %s, %s, %s WHERE NOT EXISTS ('
            f'select tagname from {tbname} WHERE tagname=%s limit 1'
            ');'
        )
        self.__insert_data(sql, data)

    def doulist(self, data):
        self.__insert_record(self.table_names["doulist"], data, 'doulist_id')

    def series(self, data):
        self.__insert_record(self.table_names["series"], data, 'series_id')

    def comment(self, data):
        sql = (
            f'INSERT INTO {self.table_names["comment"]} '
            '('
            'douban_id,'
            'c_good,'
            'c_common,'
            'c_bad'
            ') '
            'values (%s, %s, %s, %s);'
        )
        self.__insert_data(sql, data)

    def review(self, data):
        sql = (
            f'INSERT INTO {self.table_names["review"]} '
            '('
            'douban_id,'
            'r_star_5,'
            'r_star_4,'
            'r_star_3,'
            'r_star_2,'
            'r_star_1'
            ') '
            'values (%s, %s, %s, %s, %s, %s);'
        )
        self.__insert_data(sql, data)

    def discuss(self, data):
        # (douban_id, topic_nums, people_nums)
        sql = f'insert into {self.table_names["discuss"]} values(%s, %s, %s);'
        self.__insert_data(sql, data)

    def work(self, data):
        tbname = self.table_names["work"]
        sql = (
            f'insert into {tbname} (same_id, update_times) '
            'select %s, %s where not exists '
            f'(select * from {tbname} where same_id=%s limit 1);'
        )
        self.__insert_data(sql, data)

    def tag_404(self, data):
        sql = f'insert into {self.table_names["tag_4"]} (tagname) values(%s);'
        self.__insert_data(sql, data)

    def no_found_404(self, data):
        sql = f'insert into {self.table_names["no_found"]} (id, type) values(%s, %s);'
        self.__insert_data(sql, data)

    def tag_book(self, data):
        # (tagname, douban_id)
        tbname = self.table_names["tag_b"]
        sql = (
            f'insert into {tbname} '
            'select %s, %s where not exists '
            f'(select * from {tbname} where tagname=%s and douban_id=%s limit 1);'
        )
        self.__insert_data(sql, data)

    def doulist_book(self, data):
        # (doulist_id, douban_id, add_time)
        tbname = self.table_names["doulist_b"]
        sql = (
            f'insert into {tbname} '
            'select %s, %s, %s where not exists '
            f'(select * from {tbname} where doulist_id=%s and douban_id=%s limit 1);'
        )
        self.__insert_data(sql, data)

    def relate_book(self, data):
        sql = f'insert into {self.table_names["relate"]} values(%s, %s, %s);'
        self.__insert_data(sql, data)

    def __insert_record(self, tbname, data, key):
        # doulist, series, 共享此命令
        # 检查是否存在, 不存在则添加
        # tagname, page, finished_state
        sql = (
            f'INSERT INTO {tbname} ({key}, page_num, update_times) '
            'SELECT %s, %s, %s WHERE NOT EXISTS ('
            f'select {key} from {tbname} WHERE {key}=%s limit 1'
            ');'
        )
        self.__insert_data(sql, data)

    @logger.decorator('insert_data')
    def __insert_data(self, sql, data):
        self.cursor.executemany(sql, data) if isinstance(data, list) else self.cursor.execute(sql, data)
        self.changed = True
        return True
