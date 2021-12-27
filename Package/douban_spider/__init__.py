__all__ = ["Douban"]

from . import log_module
from . import spider_module
from . import control_module
from . import crawler_module
from . import database_module
from . import other_module as om
from . import config_module as cm


def decorator_initialize(func):
    # 初始化-执行-装饰器
    def wrapper(*args, **kwargs):
        if args[0].initial_flag != 3:
            print('failed to initialize, the progress can not start')
            return
        func(*args, **kwargs)

    return wrapper


class Douban:
    def __init__(self, limit=100000, depth=105):
        if limit < 3:
            limit = 300
        self.initial_flag = 0
        self.__f_flag = False
        self.config = cm.Config()
        configs = self.config.read('mysql')
        # 没有str转换为bool值的函数
        flag = self.config.read('database', 'created') == 'True'
        self.database = database_module.DatabaseInstance(configs, flag)
        self.initial_flag = 1
        if self.database.initial_flag:
            if not flag:
                self.config.set('database', 'created', 'True')
                self.__f_flag = True
            # mysql_module start
            self.crawler = crawler_module.Crawler()
            self.initial_flag = 2
            # crawler_module start
            if self.crawler.initial_falg:
                # spider_module start
                self.spider = spider_module.Sipder(depth=depth)
                self.initial_flag = 3
                if not flag:
                    self.config.set('running_state', 'start_time', str(self.spider.start_time))
                # control_module start
                self.logger = log_module.Logs()
                self.control = control_module.Control()
                self.control.crawler = self.crawler
                self.control.spider = self.spider
                # setups of spider
                self.spider.control = self.control
                self.spider.database = self.database
                self.spider.crawler = self.crawler
                self.spider.logger = self.logger
                # setups of crawler
                self.crawler.total_counter = int(self.config.read('crawler', 'total'))
                self.crawler.control = self.control
                self.crawler.top_limit = limit
                self.crawler.logger = self.logger
                self.crawler.start_time = self.spider.start_time
                # start key control
                self.control.start_key_event()
                print('spider of douban has been started successfully')

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.quit()

    def quit(self):
        if self.initial_flag > 0:
            self.database.quit()
        if self.initial_flag == 3:
            self.spider.quit()
            self.config.set('running_state', 'end_time', str(self.spider.end_time))
        if self.initial_flag > 1:
            self.config.set('crawler', 'total', str(self.crawler.total_counter))
            self.crawler.quit()
        if self.initial_flag == 3:
            if self.control.exit_flag:
                print('your progress has been canceled sucessfully')
            else:
                om.notification_voice(
                    'warning, your spider has been found' if self.crawler.is_anti else 'hi, your mission has completed')
        self.spider = None
        self.control = None
        self.crawler = None
        self.database = None
        self.config = None
        self.logger = None

    @decorator_initialize
    def start(self, mode=0):
        print('douban spider has been started successfull')
        if self.__f_flag:
            if douban_id := self.config.read('seed', 'douban_id'):
                self.add_book(douban_id)
            else:
                print('no seed book...')
                return
        self.spider.start(mode)

    @decorator_initialize
    def add_book(self, *args):
        self.spider.add_book(args)
