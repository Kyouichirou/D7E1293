__all__ = ['Sipder']

import re
import sys
import time
import random
from urllib.parse import quote_plus as quotex
from urllib.parse import unquote_plus as decodeurl
# package_built-in module
from . import constants
from . import metadata_module


# 爬虫控制

def break_decrator(func):
    # 控制执行-装饰器
    def wrapper(*args, **kargs):
        return None if args[0].is_break else func(*args, **kargs)

    return wrapper


def args_flatten(args):
    for _ in args:
        if isinstance(_, list) or isinstance(_, tuple):
            yield from args_flatten(_)
        else:
            yield _


def decorator_args(func):
    # 参数扁平化-装饰器
    # 获得一个针对元祖和列表扁平化的generator, *解包
    def wrapper(*args, **kwargs):
        f = args_flatten(args)
        return func(*f, **kwargs)

    return wrapper


def decorator_log(func):
    # 错误日志记录-装饰器
    # 模块名称, 函数名称, 错误原因, 函数参数
    def wrapper(*args, **kwargs):
        # noinspection PyBroadException
        try:
            func(*args, **kwargs)
        except Exception:
            args[0].logger.capture_except('spider')

    return wrapper


class Sipder:
    @decorator_args
    @decorator_log
    def add_book(self, *args):
        # 支持输入参数, douban_id or url
        self.__error_retry()
        refer = self.crawler.random_refer
        for a in args:
            if ms := self.__metadata.book_reg.search(a) or self.book_reg.search(a):
                db_id = ms.group()
                if self.__check_douban_id(db_id):
                    continue
                self.__book_detail(db_id, refer=refer)
            else:
                print(f'the length of {a} has some problems')
            if self.is_break:
                break

    @decorator_log
    def start(self, mode: int):
        # 0, execute all unfinished tasks; 1, tag; 2, doulist; 3, series; 4, work, single task
        # 5, update_book, 6, update_tag
        self.__error_retry()
        self.__unfinished_task(mode) if mode < 5 else self.__update_task(mode)

    def __getattribute__(self, item):
        # 不能直接调用self.__dict__来获取值, 死循环
        if item == 'is_break':
            if super().__getattribute__('is_waiting'):
                if c := super().__getattribute__('control'):
                    print('pause, 90s.....')
                    c.waiting_show(150)
                    print('restart, ....')
        return super().__getattribute__(item)

    def __init__(self, depth: int):
        # 标记
        self.is_break = False
        self.is_protect = False
        self.is_waiting = False
        self.__is_404 = False
        self.__is_interrupted = False
        # 限制递归的深度, 值不能设置过大, 以免出现堆栈溢出
        self.iteration = self.iterations = depth if 0 < depth < sys.getrecursionlimit() * 0.12 else 75
        # 记录-缓存
        self.speed_ratio = 1
        self.speed_tune = 0
        self.__r_list = (23, 7, 17, 11, 2, 19, 37, 5, 13, 41, 29, 1, 31, 37, 3)
        #
        self.redirected_url = None
        self.__d_counter = 0
        self.b_percent = False
        self.book_counter = 0
        self.book_list = []
        self.tag_list = []
        self.gap_list = []
        self.dou_list = []
        self.series_list = []
        self.same_list = []
        self.no_found_list = []
        # 正则
        self.tag_reg = re.compile('(?<=tag/).+(?=\?)')
        self.book_reg = re.compile('\d{7,8}')
        # 类实例化
        self.database = None
        self.crawler = None
        self.control = None
        self.logger = None
        self.__metadata = metadata_module.Metadata()
        # start stopwatch
        self.start_time = time.time()
        self.end_time = 0
        print('spider_module has been loaded successsfully')

    def quit(self):
        # 假如重新连接, 没有成功切换IP, 那么退出程序
        if self.crawler:
            if self.crawler.total > 1:
                mean = self.crawler.request_time_mean
                end = time.time()
                self.end_time = end
                ctime = end - self.start_time
                t_mean = ctime / self.crawler.total
                percent = self.book_counter / self.crawler.total
                if mean:
                    print(f'average times of requests: {mean}')
                    data = "\n".join([str(e) for e in self.crawler.avg_list])
                    with open(f'{constants.Log_folder}\log_{int(self.start_time)}_{int(end)}.txt', mode='w',
                              encoding='utf-8') as f:
                        f.write(
                            f'{self.crawler.total}\n{mean}\n{t_mean}\n{ctime}\n{percent}\n{self.crawler.get_external_ip or ""}\nheader\n{data}')
                print(
                    f'completed, time: {ctime};average time: {t_mean};book: {percent}')
        self.__metadata = None
        print('spider_module has been exited successfully')

    def __error_retry(self):
        # 错误重试
        if self.crawler.err_list:
            i = len(self.crawler.err_list)
            self.is_break = False
            self.crawler.is_break = False
            self.crawler.top_limit += 1
            if not self.is_break and not self.crawler.is_break:
                url = self.crawler.err_list.pop()
                k = i - 1
                while i != k and k < i:
                    self.__error_handle(url)
                    if self.is_break or k == 0:
                        break
                    i = k
                    url = self.crawler.err_list.pop()
                    k = len(self.crawler.err_list)

    def __error_handle(self, url: str):
        if '/subject/' in url:
            db_id = self.__metadata.book_reg.search(url).group()
            refer = self.crawler.bing_refer(db_id)
            if '/discussion/' in url:
                self.__get_discuss(int(db_id), refer)
            elif '/reviews' in url:
                self.__get_review(int(db_id), refer)
            elif '/comments/' in url:
                self.__get_comment(int(db_id), refer)
            else:
                self.crawler.top_limit += 1
                if not self.__check_douban_id(db_id):
                    self.__book_detail(db_id)
        else:
            if dom := self.__get_dom(url):
                data = None
                if '/tag/' in url:
                    data = self.__metadata.tag.get_items(dom)
                    if data:
                        n_url = decodeurl(url)
                        if ms := self.tag_reg.search(n_url):
                            tag = self.__metadata.convertor.convert(ms.group())
                            self.database.add_tag_book([(tag, int(e)) * 2 for e in data])
                elif '/series/' in url:
                    data = self.__metadata.series.get_items(dom)
                elif '/doulist/' in url:
                    tmp = self.__metadata.doulist.get_items(dom)
                    doulist_id = int(self.__metadata.doulist_reg.search(url).group())
                    dbs = []
                    data = []
                    for e in tmp:
                        db_id = int(e[0])
                        if self.__check_doulist_book((doulist_id, db_id)):
                            continue
                        data.append(e[0])
                        add_time = self.__metadata.dateformat.date_format(e[1])
                        dbs.append((doulist_id, db_id, add_time, doulist_id, db_id))
                    if dbs:
                        self.database.add_doulist_book(dbs)
                if data:
                    self.crawler.top_limit += len(data)
                    # 假如没有完全执行完数据的获取, 则重新将错误链接添加回列表
                    if not self.__douban_id_iteration(data, refer=url):
                        self.crawler.err_list.append(url)

    # ------------------------ book_module_finished
    def __relate_book(self, data, db_id: int, refer: str):
        # a 电子书, b, 正常, c, 绑定, 需要进一步获取电子书
        # 电子书的数据在执行数据获取时转为数字
        a, b, c = data
        ebook = []
        if c:
            # 不同的host, 清除部分的数据
            self.crawler.cookies.clear()
            for e in c:
                self.crawler.counter -= 1
                # 获取具体的电子书
                url = f'https://read.douban.com/bundle/{e}/'
                if dom := self.__get_dom(url, host='read.douban.com', refer=refer):
                    es = self.__metadata.ebook.get_bundle(dom)
                    if es:
                        for s in es:
                            ebook.append(int(s))
                elif self.__is_404:
                    self.crawler.is_404 = False
                    break
        if a:
            for n in a:
                ebook.append(int(n))
        if ebook:
            # relate_book_table, (douban_id, id, types) # 1, ebook, 0, normal
            self.database.add_relate([(db_id, e, 1) for e in ebook])
        if b:
            self.database.add_relate([(db_id, int(e), 0) for e in b])
            # 提前检查db_id, 控制递归的深度
            self.__get_relate_book(b, refer)

    @break_decrator
    def __get_relate_book(self, data, refer=''):
        for db_id in data:
            if not self.__check_douban_id(db_id):
                # 限制递归的深度, 防止overflow
                if self.iterations > 0:
                    self.iterations -= 1
                    print(f'depth of scrapping: {self.iteration - self.iterations}')
                    self.__book_detail(db_id, refer=refer)
                    self.iterations += 1
                else:
                    self.__book_detail(db_id, mode=False)
            if self.is_break:
                break

    def __add_ugc(self, info: dict, db_id: int, discuss: tuple or int, refer: str):
        if (cn := info['comment_nums']) > 105:
            self.__get_comment(db_id, refer=refer, cn=cn)
        if info['review_nums'] > 25:
            self.__get_review(db_id, refer=refer)
        if isinstance(discuss, tuple):
            self.database.add_discuss((db_id, *discuss))
        else:
            if discuss > 5:
                self.__get_discuss(db_id, refer=refer)

    def __get_review(self, db_id: int, refer: str):
        # 获取书评的各类评论的占比
        self.crawler.counter -= 1
        url = f'https://book.douban.com/subject/{db_id}/reviews'
        if dom := self.__get_dom(url, refer=refer, host='book.douban.com'):
            if arr := self.__metadata.review.get_review_star(dom):
                # review_table, (douban_id, star_5, star_4, star_3, star_2, star_1)
                self.database.add_review((db_id, *arr))
            else:
                self.logger.info(f'review: {db_id}')
        elif self.__is_404:
            self.crawler.is_404 = False

    def __get_discuss(self, db_id: int, refer: str):
        # 讨论区
        self.crawler.counter -= 1
        url = f'https://book.douban.com/subject/{db_id}/discussion/'
        if dom := self.__get_dom(url, refer=refer, host='book.douban.com'):
            if data := self.__metadata.discuss.get_discuss_detail(dom):
                # discuss_table, (douban_id, topic_nums, people_nums)
                self.database.add_discuss((db_id, *data))
            else:
                self.logger.info(f'review: {db_id}')
        elif self.__is_404:
            self.crawler.is_404 = False

    def __get_comment(self, db_id: int, refer: str, cn=0):
        # 短评
        self.crawler.counter -= 1
        url = f'https://book.douban.com/subject/{db_id}/comments/'
        if dom := self.__get_dom(url, refer=refer, host='book.douban.com'):
            if arr := self.__metadata.comment.get_comment_percent(dom):
                # comment_table, (douban_id, c_good, c_common, c_bad)
                self.database.add_comment((db_id, *arr))
            else:
                self.logger.info(f'comment: {db_id, cn}')
        elif self.__is_404:
            self.crawler.is_404 = False

    def __add_tags(self, tags, new_db):
        # 执行添加标签和添加tag_book, 执行批量插入, 不检查, 插入时检查
        if tags:
            tag_book = []
            tag_table = []
            for tag in tags:
                # 当数据的来源是遍历tag时, 可以剔除掉该值, 在tag集中插入数据
                if len(tag) > 1 and tag.startswith('\\') and tag.endswith('/'):
                    # 部分标签存在异常字符'\\'
                    self.logger.debug(f'abnormal tagname: {tag}')
                    if not self.tag_list:
                        self.tag_list.append(tag)
                    continue
                if self.database.check_tag_404(tag):
                    # 检查该标签是否已经被废弃
                    if tag not in self.tag_list:
                        self.tag_list.append(tag)
                    continue
                # 需要执行检查输入, * 2
                # tag_book, (tagname, douban_id)
                tag_book.append((self.__metadata.convertor.convert(tag), new_db) * 2)
                if not tag in self.tag_list:
                    # tag, (tagname, page_num, finished_state, update_times)
                    tag_table.append((tag, 0, 0, 0, tag))
                    self.tag_list.append(tag)
            if tag_book:
                self.database.add_tag_book(tag_book)
            if tag_table:
                self.database.add_tag(tag_table)

    def __adjust(self):
        counter = self.book_counter
        print(f'books:                    {counter}')
        if counter % 20 == 0:
            self.speed_tune += 1
            q = self.speed_ratio
            if q > 0.2:
                q -= 0.032
                self.speed_ratio = q
                print(f's speed:        {q}')
            self.b_percent = counter / self.crawler.total < 0.3
            if self.speed_tune % 3 == 0:
                self.database.commit()
                if self.crawler.speed_ratio < 0.42:
                    if self.speed_tune == 6:
                        self.speed_ratio = random.uniform(0.2, 0.6)
                        self.speed_tune = 0
                else:
                    self.speed_tune = 3

    def __book_detail(self, db_id: str, mode=True, refer=''):
        url = f'https://book.douban.com/subject/{db_id}/'
        dom = self.__get_dom(url, refer=refer, host='book.douban.com')
        if not dom:
            if self.__is_404:
                self.no_found_list.append(db_id)
                self.database.book_404((int(db_id)))
                self.crawler.is_404 = False
            return True
        # 如果发生重定向
        if self.redirected_url:
            # 将该id添加到404表
            self.no_found_list.append(db_id)
            self.database.book_404((int(db_id)))
            self.crawler.redirected_url = None
            ms = self.__metadata.book_reg.search(self.redirected_url)
            if ms:
                db_id = ms.group()
                if self.__check_douban_id(db_id):
                    return True
            else:
                return False
        detail = self.__check_dom(dom, db_id)
        if not detail:
            self.crawler.is_anti = True
            self.is_break = True
            return False
        self.is_protect = True
        new_db = int(db_id)
        if datas := self.__metadata.book.extract_meta(dom, detail, db_id):
            info, abstract, tags, discuss, relate, nation, contents, author = datas
        else:
            self.logger.info(f'fialed to get info {db_id}')
            self.is_protect = False
            return True
        if nation and info['nation']:
            # 检查国家是否存在, 如果不存在, 则很大可能不是国家的名称
            if not self.database.check_nation(info['nation']):
                info['nation'] = ''
        # 确保主表数据插入正确后才执行后续的操作
        self.book_list.append(db_id)
        if not self.database.add_book(tuple(info.values())):
            self.logger.info(f'fialed to insert info {db_id}')
            self.is_protect = False
            return False
        self.book_counter += 1
        if author:
            self.database.add_author_about((new_db, info['author'], author))
        if same_id := info['same_id']:
            if same_id not in self.same_list:
                self.same_list.append(same_id)
                # 检查后插入数据, work_table, (same_id, update_times), 需要执行检查id, 故而需要增加多一个same_id作为检查
                self.database.add_work((same_id, 0, same_id))
        # tag
        self.__add_tags(tags, new_db)
        # abstract
        if abstract:
            self.database.add_abstract((new_db, abstract))
        if contents:
            self.database.add_menus((new_db, contents))
        # review, comment, discuss
        self.__add_ugc(info, new_db, discuss, url)
        # book, 高度关联的
        self.is_protect = False
        # series
        # 假如该出品方有id, 则优选获取出品方的id
        if series_id := info['producer_id'] or info['series_id']:
            # series_state_table, (series_id, page_num, update_times)
            # series, 页码从1开始(不是0)
            # if not self.database.check_series(series_id):
            if series_id not in self.series_list:
                if not self.__check_no_found(series_id, 1):
                    self.database.add_series((series_id, 1, 0, series_id))
                self.series_list.append(series_id)
        # doulist
        self.__extra_doulist(dom)
        # adjust speed
        self.__adjust()
        # relate
        if mode:
            self.__relate_book(relate, new_db, refer=url)
        return True

    # book_module ----------------------------------

    # ----- add book

    @break_decrator
    def __new_book(self):
        # 正常,20
        page = 1
        refer = 'https://book.douban.com/'
        while True:
            url = f'https://book.douban.com/latest?subcat=%E5%85%A8%E9%83%A8&p={page}'
            dom = self.__get_dom(url, refer=refer, host='book.douban.com')
            if dom:
                data = self.__metadata.new_book.get_new_book(dom)
                if data:
                    i = len(data)
                    self.__douban_id_iteration(data, url)
                    if i < 16:
                        print('mission of new book has completed')
                        break
                else:
                    print('mission of new book has completed')
                    break
            if self.is_break:
                break
            page += 1
            refer = url

    def __unfinished_task(self, mode):
        tasks = (
            self.__unfinided_tag_book,
            self.__unfinished_doulist_book,
            self.__unfinished_series_book,
            self.__unfinished_work_book
        )
        if mode == 0:
            for task in tasks:
                task()
                if self.is_break:
                    return
            self.__new_book()
        else:
            tasks[mode - 1]()

    def __update_task(self, mode):
        tasks = (
            self.__update_book,
            self.__update_tag
        )
        tasks[mode - 5]()

    def __update_book(self, update, mode=True):
        # true, 更新部分动态数据, false, 获取tag和relate
        while True:
            data = self.database.get_book(update=update)
            for e in data:
                self.__book_update(*e, mode)
                if self.is_break:
                    break

    def __book_update(self, db_id: int, update: int, mode: bool):
        # 部分更新, 只更新动态数据部分, 不执行tag获取和book的获取
        self.is_protect = True
        url = f'https://book.douban.com/subject/{db_id}/'
        dom = self.__get_dom(url, refer='', host='book.douban.com')
        if not dom:
            if self.__is_404:
                self.database.book_mark_404(db_id)
            return
        detail = self.__check_dom(dom, str(db_id))
        if not detail:
            self.crawler.is_anti = True
            self.is_break = True
        if data := self.__metadata.book.get_dynamic_data(dom, update):
            info, discuss, tags = data
            self.database.update_book((*info.values(), db_id))
            self.__add_ugc(info, db_id, discuss, url)
            if mode:
                self.__add_tags(tags, db_id)
                rbs = self.__metadata.book.get_r_book(dom)
                self.__douban_id_iteration(rbs, refer=url)
        self.is_protect = False

    def __update_tag(self, update):
        pass

    # ----------------------------- work_module
    def __add_book_from_work(self, same_id, update_times):
        # 注意该页面的所有数据都是放在一个页面里, 并不是翻页
        self.same_list.append(same_id)
        url = f'https://book.douban.com/works/{same_id}'
        if dom := self.__get_dom(url, host='book.douban.com'):
            if datas := self.__metadata.work.get_same_book(dom):
                if self.__douban_id_iteration(datas, url):
                    self.database.update_work((update_times + 1, same_id))
            else:
                self.database.update_work((update_times + 1, same_id))
        else:
            if self.__is_404:
                self.crawler.is_404 = False
                self.database.work_404(same_id)

    @break_decrator
    def __unfinished_work_book(self, mode=False):
        # 一本书不同版本
        while True:
            data = self.database.get_same_book()
            if data:
                for e in data:
                    self.__add_book_from_work(*e)
                    if self.is_break:
                        return
            else:
                break
            if mode:
                break

    # --------------------- work_module

    # --------------series_module
    def __update_series_state(self, data):
        self.database.update_series(data)

    @break_decrator
    def __add_book_from_series(self, series_id, page, update_times):
        refer = ''
        self.series_list.append(series_id)
        while True:
            url = f'https://book.douban.com/series/{series_id}?page={page}'
            dom = self.__get_dom(url, refer=refer, host='book.douban.com')
            if dom:
                data = self.__metadata.series.get_items(dom)
                if data:
                    counter = len(data)
                    if self.__douban_id_iteration(data, url, is_tag=True, is_doulist=True) and counter < 8:
                        # 获取到最后一页, 并且遍历完数据, 则执行updat_times + 1
                        self.__update_series_state((series_id, page, update_times + 1))
                        break
                else:
                    # 获取到最后一页
                    self.__update_series_state((series_id, page, update_times + 1))
                    break
            else:
                if self.__is_404:
                    # 最后一页, 可能存在两种状态, 即404, 或者是没有数据
                    self.crawler.is_404 = False
                    if page == 1:
                        self.database.series_404(series_id)
                        break
                    self.__update_series_state((series_id, page, update_times + 1))
            if self.is_break or self.__is_interrupted:
                if self.__is_interrupted:
                    self.crawler.is_interrupted = False
                self.__update_series_state((series_id, page, update_times))
                return
            page += 1
            refer = url

    @break_decrator
    def __unfinished_series_book(self, mode=False):
        # 正常, 10
        while True:
            datas = self.database.get_series()
            if datas:
                for data in datas:
                    self.__add_book_from_series(*data)
                    if self.is_break:
                        return
            else:
                break
            if mode:
                break

    # series_module -----------------------------

    # ---------------------- tag_module _finished
    def __clear_tag(self, tags):
        arr = []
        for tag in tags:
            if tag in self.tag_list:
                continue
            if len(tag) > 1 and tag.startswith('\\') and tag.endswith('/'):
                # 部分标签存在异常字符'\\'
                self.logger.debug(f'abnormal tagname: {tag}')
                self.tag_list.append(tag)
                continue
            if self.database.check_tag_404(tag):
                self.tag_list.append(tag)
                continue
            arr.append((tag, 0, 0, 0, tag))
        return arr

    def __update_tag_state(self, data, dom=None):
        # tab_table, (tagname, page_num, finished_state, update_times)
        self.database.update_tag(data)
        if dom:
            # 获取侧边栏的数据, 该部分的数据在其他地方不容易获取到
            if side := self.__metadata.tag.side(dom):
                print('get sider bar')
                books, tags = side
                if tags:
                    if new_tags := self.__clear_tag(tags):
                        self.database.add_tag(new_tags)
                if books:
                    self.__douban_id_iteration(books)

    def __add_book_from_tag(self, tagname: str, page: int, sort: int, uptimes: int):
        print(f'start: {tagname}')
        tag = quotex(tagname)
        types = ['T', 'R', 'S']
        stype = types[sort:]
        k = len(stype) - 1
        pref = 'https://book.douban.com/tag/'
        self.tag_list.append(tagname)
        # 将标签转为简体
        s_tag = self.__metadata.convertor.convert(tagname)
        tmp_list = []
        # 需要注意不同的状态的切换
        # 标签页下的页面和内容并不完全一致, 部分的页面没有展示的页码, 但是实际上继续访问页面依然存在内容
        refer = ''
        for i, t in enumerate(stype):
            while True:
                url = f'{pref}{tag}?start={page * 20}&type={t}'
                if dom := self.__get_dom(url, refer=refer, host='book.douban.com'):
                    if data := self.__metadata.tag.get_items(dom):
                        counter = len(data)
                        # tag_book_table, (tagname, douban_id)
                        tbs = []
                        for e in data:
                            if e in tmp_list:
                                continue
                            tbs.append((s_tag, int(e)) * 2)
                            tmp_list.append(e)
                        if tbs:
                            self.database.add_tag_book(tbs)
                        if self.__douban_id_iteration(data, url, is_tag=True) and counter < 16:
                            # 注意部分的标签的数据差异很大, 不同的排列方式
                            # 切换到下一个排列方式时, 或者页面已经全部访问完
                            mode = i == k
                            self.__update_tag_state(
                                (tagname, page if mode else 0, i + 1, uptimes + 1 if mode else uptimes),
                                dom if mode else None)
                            break
                    else:
                        mode = i == k
                        self.__update_tag_state(
                            (tagname, page if mode else 0, i + 1, uptimes + 1 if mode else uptimes),
                            dom if mode else None)
                        break
                else:
                    if self.__is_404:
                        self.crawler.is_404 = False
                        # 当标签404时
                        if page == 0 and i == 0 and sort == 0:
                            self.database.tag_404(tagname)
                            return
                        mode = i == k
                        self.__update_tag_state(
                            (tagname, page if mode else 0, i + 1, uptimes + 1 if mode else uptimes),
                            dom if mode else None)
                        break
                if self.is_break or self.__is_interrupted:
                    break
                page += 1
                if page == 50:
                    mode = i == k
                    self.__update_tag_state(
                        (tagname, page - 1 if mode else 0, i + 1, uptimes + 1 if mode else uptimes),
                        dom if mode else None)
                    break
                refer = url
            # 中断执行
            if self.is_break or self.__is_interrupted:
                if self.__is_interrupted:
                    self.crawler.is_interrupted = False
                self.__update_tag_state((tagname, page, i, uptimes))
                return
            page = 0
        self.__unfinished_doulist_book(mode=True)

    @break_decrator
    def __unfinided_tag_book(self):
        # 一本书的标签有非常多, 展示出来的只是其中的一小部分
        while True:
            data = self.database.get_tag()
            if data:
                for e in data:
                    self.__add_book_from_tag(*e)
                    if self.is_break:
                        return
            else:
                break

    # tag_module ----------------------------------

    # -------------------- doulist_module_finished
    def clear_doulist(self, data):
        new_data = []
        for e in data:
            if e in self.dou_list:
                continue
            elif self.__check_no_found(e, 2):
                self.dou_list.append(e)
                continue
            new_data.append((e, 0, 0, e))
            self.dou_list.append(e)
        return new_data

    @break_decrator
    def __extra_doulist(self, dom):
        # 提取subject页面推荐的doulist
        node = dom.find('div', id='db-doulist-section')
        data = self.__metadata.doulist.extra_doulist(node)
        if data:
            counter = len(data)
            # doulist_table, (doulist_id, page_num, update_times)
            if new_data := self.clear_doulist(data):
                self.database.add_doulist(new_data)
            if counter > 4 and not self.b_percent:
                if href := self.__metadata.doulist.get_all_doulist(node):
                    self.__doulist_page(href)

    @break_decrator
    def __doulist_page(self, href: str):
        # 豆列集中的页面
        page = 0
        refer = ''
        mx = 0.8 * sp if (sp := self.speed_ratio) != 1 else 0.8
        while True:
            url = f'{href}?start={page * 20}'
            dom = self.__get_dom(url, refer=refer, host='book.douban.com')
            if dom:
                data = self.__metadata.doulist.get_doulist(dom)
                if data:
                    i = len(data)
                    if new_data := self.clear_doulist(data):
                        self.database.add_doulist(new_data)
                    if i < 16:
                        break
                else:
                    break
            if self.is_break or self.__is_404:
                self.crawler.is_404 = False
                break
            page += 1
            if page % random.choice(self.__r_list) == 0:
                break
            elif page % 4 != 0 and mx > 0.1:
                time.sleep(random.uniform(0.01, mx))
            refer = url

    def __update_doulist_state(self, data, dom=None):
        # doulist_table, (doulist_id, page_num, update_times)
        if dom:
            if detail := self.__metadata.doulist.doulist_detail(dom):
                new_date = (*data[1:], *detail.values(), data[0])
                self.database.update_doulist(new_date, False)
                return
        self.database.update_doulist(data)

    # 状态改变, 需要进一步修改
    @break_decrator
    def __add_book_from_doulist(self, doulist_id: int, page: int, update_times: int):
        # 20, 正常
        refer = ''
        tmp_list = []
        self.dou_list.append(doulist_id)
        self.__d_counter += 1
        while True:
            url = f'https://www.douban.com/doulist/{doulist_id}/?start={page * 25}&sort=time&playable=0&sub_type='
            if dom := self.__get_dom(url, refer=refer, host='www.douban.com'):
                if data := self.__metadata.doulist.get_items(dom):
                    counter = len(data)
                    f = self.__douban_id_iteration([e[0] for e in data], url, is_tag=True, is_doulist=True)
                    # doulist_book_table, (doulist_id, douban_id, add_time)
                    dbs = []
                    for e in data:
                        db_id = int(e[0])
                        if db_id in tmp_list:
                            continue
                        # 添加到doulistd的时间
                        # 因为需要将字符串日期格式化, 故而在添加数据前先执行数据检测
                        elif self.__check_doulist_book((doulist_id, db_id)):
                            tmp_list.append(db_id)
                            continue
                        add_time = self.__metadata.book.dateformat.date_format(e[1])
                        dbs.append((doulist_id, db_id, add_time, doulist_id, db_id))
                        tmp_list.append(db_id)
                    if dbs:
                        self.database.add_doulist_book(dbs)
                    if f and counter < 17:
                        # 在完整添加了所有的书籍时, 才执行update_times + 1
                        # 所有的遍历方式均采用数量判断和404, 判断是否遍历到数据的尽头
                        self.__update_doulist_state((doulist_id, page, update_times + 1), dom)
                        break
                else:
                    self.__update_doulist_state((doulist_id, page, update_times + 1), dom)
                    break
            else:
                if self.__is_404:
                    # 当页面在第1页就出现404, 则表明该doulist已经被废弃
                    self.crawler.is_404 = False
                    if page == 0:
                        self.database.doulist_404(int(doulist_id))
                        break
                    # 出现404, 即判断为该豆列已经被遍历
                    self.__update_doulist_state((doulist_id, page, update_times + 1), dom)
                    break
            if self.is_break or self.__is_interrupted:
                if self.__is_interrupted:
                    self.crawler.is_interrupted = False
                self.__update_doulist_state((doulist_id, page, update_times))
                return
            page += 1
            refer = url
        if self.__d_counter == 300:
            self.__unfinished_series_book(mode=True)
            self.__unfinished_work_book(mode=True)
            self.__d_counter = 0

    def __unfinished_doulist_book(self, mode=False):
        while True:
            if data := self.database.get_doulist():
                for e in data:
                    self.__add_book_from_doulist(*e)
                    if self.is_break:
                        return
            else:
                break
            if mode:
                break

    # doulist_module-----------------------------------------

    # --------------- check_module
    def __check_douban_id(self, db_id: str):
        # 已爬取列表和404列表
        if db_id in self.book_list or db_id in self.no_found_list:
            return True
        # 如果已经存在于数据库, 添加到列表, 加快查询的速度
        if self.database.check_douban_id(int(db_id)):
            self.book_list.append(db_id)
            return True
        return False

    def __check_dom(self, dom, db_id: str):
        # 检查dom是否包含核心的info element
        detail = dom.find('div', id='info')
        if not detail:
            print(f'warning: no content from {db_id}')
            return None
        if self.crawler.cookies_flag:
            self.crawler.add_cookie(db_id)
        return detail

    def __check_doulist_book(self, data):
        return self.database.check_doulist_book(data)

    def __check_no_found(self, sid: int, itype: int):
        return self.database.check_series_404(sid) if itype == 1 else self.database.check_doulist_404(sid)

    # check_module --------------------------------------
    @break_decrator
    def __douban_id_iteration(self, data: set or tuple or list, refer='', is_tag=False, is_doulist=False):
        i = len(data)
        j = k = 0
        for db_id in data:
            if self.__check_douban_id(db_id):
                j += 1
            else:
                self.__book_detail(db_id, refer=refer)
            k += 1
            if self.is_break:
                break
        if is_tag and j == i and not self.is_break:
            time.sleep(random.uniform(0.1, 0.3 if is_doulist else 0.5))
        return i == k

    # get dom and status
    def __get_dom(self, url: str, host='', refer=''):
        dom = self.crawler.request(url, refer=refer, host=host)
        self.is_break = self.crawler.is_break
        self.__is_404 = self.crawler.is_404
        self.__is_interrupted = self.crawler.is_interrupted
        self.redirected_url = self.crawler.redirected_url
        return dom
