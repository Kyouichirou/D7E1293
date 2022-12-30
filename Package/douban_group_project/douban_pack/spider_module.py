__all__ = ['Spider']

import time
import msvcrt
import random
import threading
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler

from .utils.log_module import Logs
from .crawler_module import Crawler
from .utils.config_module import Config
from .utils.mongodb_module import Database
from .utils.html_parser_module import Parser
from .utils.voice_module import notification_voice

_logger = Logs()


class Spider:
    def _write_config(self):
        # 总访问次数
        print('write data to config')
        total = int(self._config.read('crawler', 'total'))
        total += self.__crawler.requests_times
        self._config.set('crawler', 'total', str(total))
        # 最后访问时间
        self._config.set('running_state', 'end_time', str(int(time.time() * 1000)))

    def _monitor_key_press(self):
        # 按键退出程序
        # 需要在终端运行, 才能监听按键
        while True:
            k = ord(msvcrt.getch())
            # exit, q(Q)
            if k == 113 or k == 27 or k == 81:
                print('waiting seconds, spider is exiting...')
                self._exit_flag = True
                self._close_mission()
                break

    def _control(self):
        # 额外线程 => 控制
        print('key monitor....')
        th = threading.Thread(target=self._monitor_key_press)
        # 线程守护, 主进程退出,子线程退出
        th.daemon = True
        th.start()

    def _close_mission(self):
        if self._scheduler:
            self._scheduler.shutdown(wait=False)
            self._scheduler = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._write_config()
        self._close_mission()
        self.__database.quit()
        self.__crawler.exit_crawler()
        notification_voice('warning: spider has been quit.')

    def __init__(self, group_id: str):
        # properties
        self._scheduler = None
        self._exit_flag = False
        self.__is_running = False
        self.__group_id = group_id
        self.__first_time_run = True
        self.__visited_cache_list = []
        self.__running_times = 0
        self.__url_prefix = 'https://www.douban.com/group/'
        # class
        self._config = Config()
        self.__parser = Parser()
        self.__crawler = Crawler()
        self.__database = Database()
        self.__initial_flag = self.__database.initial()

    @property
    def initial_flag(self):
        return self.__initial_flag

    def __catalog_page(self):
        if self.__is_running:
            print('current mission is still running...')
            return
        try:
            print(f'current mission loop is {self.__running_times}; {time.asctime()}')
            refer = ''
            self.__crawler.reset_connect()
            self.__is_running = True
            if self.__first_time_run:
                pages = [e for e in range(0, 15)]
                random.shuffle(pages)
                self.__first_time_run = False
            else:
                pages = random.sample([0, 1, 2, 3, 4], 2)
            while pages:
                url = f'{self.__url_prefix}{self.__group_id}/discussion?start={25 * pages.pop()}&type=new'
                if html := self.__crawler.request(url, refer):
                    if urls := self.__parser.catalog(self.__parser.html_to_dom(html)):
                        self.__topic_page(urls, url)
                    else:
                        print('warning: no urls')
                        break
                else:
                    break
                if self.__crawler.anti_spider or self._exit_flag:
                    break
                refer = url
        except Exception as error:
            _logger.capture_except(error)
        finally:
            self.__running_times += 1
            if self.__running_times > 30 or self.__crawler.anti_spider or self._exit_flag:
                print('mission has reached 10th times')
                self._close_mission()
            else:
                print(f'finish the {self.__running_times} times mission, now is waiting next running; {time.asctime()}')
                self.__crawler.exit_crawler()
                self.__is_running = False

    def __check_visited(self, url_id: str) -> bool:
        # 访问页面
        if url_id in self.__visited_cache_list:
            return True
        else:
            self.__visited_cache_list.append(url_id)
        return self.__database.check_url_id(url_id)

    def __topic_page(self, urls: list, refer: str):
        # 话题页
        datas = []
        for url_id in urls:
            if self.__check_visited(url_id):
                # 假如连接已经访问过
                continue
            url = f'{self.__url_prefix}topic/{url_id}/'
            if html := self.__crawler.request(url, refer):
                dom = self.__parser.html_to_dom(html)
                info = self.__parser.topic_detail(dom, url_id)
                if not info:
                    # 假如没有基础信息, 可能触发反爬
                    break
                comment = self.__parser.get_replies(dom)
                if not comment:
                    # 没有评论
                    continue
                if self.__parser.multi_pages_comment:
                    next_comment, f = self.__next_comment(url)
                    if f and next_comment:
                        comment.extend(next_comment)
                    else:
                        # 任意页面触发反爬, 都退出程序
                        break
                info['comments'] = comment
                datas.append(info)
            else:
                break
            if self.__crawler.anti_spider or self._exit_flag:
                break
        if datas:
            if self.__database.insert_data(datas):
                print('insert data to database successfully')

    def __next_comment(self, base_url: str) -> tuple:
        # 评论页面
        page = 1
        datas = []
        refer = base_url
        f = True
        while True:
            url = f'{base_url}?start={page * 100}'
            if html := self.__crawler.request(url, refer):
                if comment := self.__parser.get_replies(self.__parser.html_to_dom(html)):
                    datas.extend(comment)
                    if not self.__parser.multi_pages_comment:
                        break
                else:
                    f = False
                    break
            else:
                f = False
                break
            refer = url
            page += 1
        return datas, f

    def start(self, interval_time: int):
        print('spider is starting...')
        # 任务调度
        self._scheduler = BlockingScheduler(timezone='Asia/Shanghai')
        # 不支持限定运行次数, 就算加上时间的限制start_date, end_date;
        # 这样只会停止执行, 但是程序不会退出.
        # 当任务执行的时间超过等待的时间将导致异常
        self._scheduler.add_job(
            func=self.__catalog_page,
            trigger='interval',
            seconds=interval_time,
            next_run_time=datetime.now(),
            # 开多一个线程, 同时使用is_running来控制执行
            max_instances=2
        )
        self._control()
        self._scheduler.start()
        print('spider has been started')
