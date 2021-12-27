__all__ = ['DatabaseInstance']

from .mysql_pack import Database
from .mysql_pack.get_module import Get
from .mysql_pack.check_module import Check
from .mysql_pack.update_module import Update
from .mysql_pack.insert_module import Insert
from .mysql_pack.delete_module import Delete


class DatabaseInstance:
    def __init__(self, configs: dict, flag: bool):
        self.initial_flag = False
        database = Database()
        if database and database.init(configs, flag):
            self.__db_get = Get()
            self.__db_check = Check()
            self.__db_insert = Insert()
            self.__db_update = Update()
            self.__db_delete = Delete()
            self.__database = database
            self.initial_flag = True
            print('database_module has been loaded succeessfully')
        else:
            print('database some error')

    def quit(self):
        if self.initial_flag:
            self.commit()
            self.__database.quit()
            self.__db_get = None
            self.__db_insert = None
            self.__db_check = None
            self.__db_update = None
            self.__db_delete = None
            self.__database = None
        print('database_module has been exited successfullt')

    def commit(self):
        if any((self.__db_insert.changed, self.__db_update.changed, self.__db_delete.changed)):
            self.__database.changed = True
            self.__database.commit()
            self.__db_insert.changed = False
            self.__db_update.changed = False
            self.__db_delete.changed = False

    # add/insert
    def add_book(self, data: tuple or list):
        # 返回结果, 以判断是否执行成功
        return self.__db_insert.book(data)

    def add_menus(self, data: tuple or list):
        self.__db_insert.contents(data)

    def add_tag(self, data: tuple or list):
        self.__db_insert.tag(data)

    def add_work(self, data: tuple or list):
        self.__db_insert.work(data)

    def tag_404(self, tagname: str):
        self.__db_delete.tag(tagname)
        self.__db_insert.tag_404((tagname,))

    def book_404(self, douban_id: int):
        self.__db_insert.no_found_404((douban_id, 0))

    def work_404(self, same_id: int):
        self.__db_update.work_404(same_id)

    def book_mark_404(self, douban_id: int):
        # 书籍标记
        self.__db_update.book_404(douban_id)

    def doulist_404(self, doulist_id: int):
        self.__db_delete.doulist(doulist_id)
        self.__db_insert.no_found_404((doulist_id, 2))

    def series_404(self, series_id: int):
        self.__db_delete.series(series_id)
        self.__db_insert.no_found_404((series_id, 1))

    def add_doulist(self, data: list or tuple):
        self.__db_insert.doulist(data)

    def add_discuss(self, data: list or tuple):
        self.__db_insert.discuss(data)

    def add_review(self, data: tuple or list):
        self.__db_insert.review(data)

    def add_comment(self, data: tuple or list):
        self.__db_insert.comment(data)

    def add_abstract(self, data):
        self.__db_insert.abstract(data)

    def add_series(self, data: tuple or list):
        self.__db_insert.series(data)

    # batch
    def add_tag_book(self, data: tuple or list):
        self.__db_insert.tag_book(data)

    # batch
    def add_doulist_book(self, data: tuple or list):
        self.__db_insert.doulist_book(data)

    # batch
    def add_relate(self, data: tuple or list):
        self.__db_insert.relate_book(data)

    def add_author_about(self, data: tuple or list):
        self.__db_insert.author_about(data)

    # get
    def get_tag(self, update=0, limit=2):
        return self.__db_get.tag(update, limit)

    def get_series(self, update=0, limit=2):
        return self.__db_get.series(update, limit)

    def get_same_book(self, update=0, limit=10):
        return self.__db_get.work(update, limit)

    def get_doulist(self, update=0, limit=2):
        return self.__db_get.doulist(update, limit)

    def get_book(self, update=0, limit=100):
        return self.__db_get.book(update, limit)

    # update
    def update_tag(self, data: tuple or list):
        self.__db_update.tag(data)

    def update_series(self, data: tuple or list):
        self.__db_update.series(data)

    def update_doulist(self, data: tuple or list, mode=True):
        self.__db_update.doulist(data, mode)

    def update_book(self, data: tuple or list):
        self.__db_update.book(data)

    def update_work(self, data: tuple or list):
        self.__db_update.work(data)

    # check
    def check_douban_id(self, db_id: int):
        return self.__db_check.book(db_id)

    def check_doulist_book(self, data):
        return self.__db_check.doulist_book(data)

    def check_tag_404(self, tagname: str):
        return self.__db_check.tag_404(tagname)

    def check_doulist_404(self, doulist_id: int):
        return self.__db_check.no_found_404((doulist_id, 2))

    def check_series_404(self, series_id: int):
        return self.__db_check.no_found_404((series_id, 1))

    def check_series(self, series_id: int):
        return self.__db_check.series(series_id)

    def check_nation(self, nation: str):
        return self.__db_check.nation(nation)
