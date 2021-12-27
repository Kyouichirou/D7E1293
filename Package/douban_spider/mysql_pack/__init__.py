from .. import log_module
import mysql.connector as cnn

logger = log_module.Logs()


# fnished
class Database:
    # MySQL
    table_names = {
        "abstract": "abstract_table",
        "book": "book_table",
        "comment": "comment_table",
        "discuss": "discuss_table",
        "doulist_b": "doulist_book_table",
        "doulist": "doulist_table",
        "ebook": "ebook_table",
        "no_found": "no_found_404_table",
        "relate": "relate_book_table",
        "review": "review_table",
        "series": "series_table",
        "tag_4": "tag_404_table",
        "tag_b": "tag_book_table",
        "tag": "tag_table",
        "work": "work_table",
        'contents': 'contents_table',
        'author': 'author_table',
        'about': 'author_about_table'
    }
    __instance = None
    __is_initial = False
    sql = None
    cursor = None
    changed = False

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            cls.__instance = super(Database, cls).__new__(cls, *args, **kwargs)
            print('mysql_module has been loaded successsfully')
        return cls.__instance

    @classmethod
    @logger.decorator('database_initial')
    def init(cls, configs: dict, flag: bool):
        if not cls.__is_initial:
            cls.__is_initial = True
            db = ''
            if not flag:
                # 当数据库尚未创建时, 连接中包含数据库会报错
                db = configs.pop('database')
            cls.sql = cnn.connect(**configs)
            cls.cursor = cls.sql.cursor()
            if flag:
                return flag
            else:
                if cls.__create_db(db):
                    return cls.__create_table()
            return False

    @logger.decorator('create_tbale')
    def __create_table(self):
        # ON UPDATE CURRENT_TIMESTAMP, 设置为自动修改时间戳,当数据更新时
        # 只设置title, douban_id,这两项为not null
        # 核心表
        book_cmd = (
            "CREATE TABLE if not exists book_table ("
            "douban_id INT UNSIGNED NOT NULL PRIMARY KEY,"
            "title VARCHAR ( 255 ) NOT NULL,"
            "subtitle VARCHAR ( 255 ),"
            "ogltitle VARCHAR ( 255 ),"
            "publisher VARCHAR ( 128 ),"
            "publish_time VARCHAR(12),"
            "publish_y SMALLINT UNSIGNED,"
            "publish_m TINYINT UNSIGNED,"
            "publish_d TINYINT UNSIGNED,"
            "author VARCHAR ( 255 ),"
            "author_id INT UNSIGNED,"
            "nation VARCHAR ( 16 ),"
            "pages SMALLINT UNSIGNED DEFAULT 0,"
            "producer VARCHAR ( 128 ),"
            "producer_id MEDIUMINT UNSIGNED,"
            "price_c VARCHAR(16),"
            "price DOUBLE UNSIGNED DEFAULT 0,"
            "translator VARCHAR ( 32 ),"
            "series VARCHAR ( 255 ),"
            "series_id MIDDLEINT UNSIGNED DEFAULT 0,"
            "rate DOUBLE UNSIGNED NOT NULL DEFAULT 0,"
            "star_5 DOUBLE UNSIGNED DEFAULT 0,"
            "star_4 DOUBLE UNSIGNED DEFAULT 0,"
            "star_3 DOUBLE UNSIGNED DEFAULT 0,"
            "star_2 DOUBLE UNSIGNED DEFAULT 0,"
            "star_1 DOUBLE UNSIGNED DEFAULT 0,"
            "isbn VARCHAR ( 32 ),"
            "rate_nums MEDIUMINT UNSIGNED DEFAULT 0,"
            "comment_nums MEDIUMINT UNSIGNED DEFAULT 0,"
            "review_nums SMALLINT UNSIGNED DEFAULT 0,"
            "note_nums SMALLINT UNSIGNED DEFAULT 0,"
            "reading_nums MEDIUMINT UNSIGNED,"
            "read_nums MEDIUMINT UNSIGNED,"
            "want_nums MEDIUMINT UNSIGNED,"
            "same_id INT UNSIGNED,"
            "binding VARCHAR ( 4 ) COMMENT '装帧',"
            "tags VARCHAR ( 512 ),"
            "tag_nums smallint unsigned,"
            "pic_url VARCHAR ( 128 ),"
            "created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
            "modified_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
            "update_times TINYINT UNSIGNED DEFAULT 0,"
            "status_404 TINYINT ( 1 ) "
            ");"
        )
        # 标签表
        tag_cmd = (
            "create TABLE if not exists tag_table ("
            "tagname varchar(32) not null primary key,"
            "page_num smallint unsigned not null default 0,"
            "finished_state tinyint unsigned not null default 0 comment '0-2, R,S,T; 3, finised',"
            "update_times tinyint unsigned DEFAULT 0,"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        # 豆列表
        doulist_cmd = (
            "CREATE TABLE if not exists doulist_table ( "
            "doulist_id int unsigned not null primary key,"
            "page_num smallint unsigned not null default 0,"
            "update_time tinyint unsigned not null default 0,"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        # 重要关联表
        abstract_cmd = (
            "create TABLE if not exists abstract_table("
            "douban_id int UNSIGNED not null PRIMARY key,"
            "abstract VARCHAR(10240)"
            ");"
        )
        # 短评详情
        comment_cmd = (
            "CREATE TABLE if not exists comment_table("
            "douban_id int unsigned not null primary key,"
            "c_good tinyint unsigned default 0,"
            "c_common tinyint unsigned default 0,"
            "c_bad tinyint unsigned default 0"
            ");"
        )
        # 书评详情
        review_cmd = (
            "CREATE TABLE if not exists review_table("
            "douban_id int unsigned not null primary key,"
            "r_star_5 smallint unsigned default 0,"
            "r_star_4 smallint unsigned default 0,"
            "r_star_3 smallint unsigned default 0,"
            "r_star_2 smallint unsigned default 0,"
            "r_star_1 smallint unsigned default 0"
            ");"
        )
        # 标签下书表
        tag_book_cmd = (
            "create TABLE if not exists tag_book_table ("
            "tagname varchar(32) not null,"
            "douban_id int UNSIGNED NOT null,"
            "INDEX tag_index (tagname)"
            ");"
        )
        # 豆列下书表
        doulist_book_cmd = (
            "create TABLE if not exists doulist_book_table ("
            "doulist_id int UNSIGNED not null,"
            "douban_id int UNSIGNED NOT null,"
            "add_time TIMESTAMP,"
            "INDEX doulist_index (doulist_id)"
            ");"
        )
        # 讨论表
        discuss_cmd = (
            "CREATE TABLE if not exists discuss_table("
            "douban_id int unsigned not null primary key,"
            "topic_nums smallint unsigned,"
            "people_nums smallint unsigned"
            ");"
        )
        # 404表
        tag_404_cmd = (
            "create TABLE if not exists tag_404_table("
            "tagname varchar(32) not null primary key,"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        common_404_cmd = (
            "create TABLE if not exists no_found_404_table ("
            "id int unsigned not null primary key,"
            "type TINYINT UNSIGNED NOT NULL COMMENT '0, doulist; 1, series; 2, work',"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        relate_cmd = (
            "CREATE TABLE if not exists relate_book_table ("
            "id_a INT UNSIGNED NOT null,"
            "id_b INT UNSIGNED NOT null,"
            "type TINYINT(1) COMMENT '0, book; 1, ebook',"
            "INDEX a_index(id_a),"
            "index b_index(id_b)"
            ");"
        )
        ebook_cmd = (
            "CREATE TABLE if not exists ebook_table("
            "douban_id int UNSIGNED not null primary key, "
            "e_id int unsigned not null,"
            "word_nums MEDIUMINT UNSIGNED,"
            "provider VARCHAR(128),"
            "provider_id INT UNSIGNED,"
            "rate DOUBLE UNSIGNED,"
            "rate_nums MEDIUMINT UNSIGNED,"
            "star_5 double unsigned default 0,"
            "star_4 double unsigned default 0,"
            "star_3 double unsigned default 0,"
            "star_2 double unsigned default 0,"
            "star_1 double unsigned default 0,"
            "update_times TINYINT UNSIGNED DEFAULT 0,"
            "status_404 TINYINT(1),"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        # 记录爬取进度
        series_cmd = (
            "create TABLE if not exists series_table ("
            "series_id MEDIUMINT UNSIGNED NOT NULL PRIMARY KEY,"
            "page_num SMALLINT UNSIGNED DEFAULT 0,"
            "update_times TINYINT UNSIGNED DEFAULT 0,"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP"
            ");"
        )
        # 记录爬取进度
        work_cmd = (
            "create TABLE if not exists work_table("
            "some_id int UNSIGNED NOT NULL PRIMARY KEY,"
            "update_times TINYINT UNSIGNED DEFAULT 0,"
            "created_time timestamp not null default current_timestamp,"
            "modified_time timestamp not null default current_timestamp ON UPDATE CURRENT_TIMESTAMP,"
            "status_404 tinyint(1) default 0"
            ");"
        )
        contents_cmd = (
            "create TABLE if not exists contents_table("
            "douban_id int UNSIGNED NOT NULL PRIMARY KEY,"
            'context VARCHAR(5120)'
            ");"
        )
        author_cmd = (
            "CREATE TABLE if not exists author_table ("
            "author_id INT UNSIGNED NOT NULL PRIMARY KEY,"
            "`name` VARCHAR ( 32 ),"
            "gender TINYINT ( 1 ) COMMENT '0, female; 1, male',"
            "birthday datetime,"
            "birthplace VARCHAR(32),"
            "nation VARCHAR ( 16 ),"
            "o_names VARCHAR ( 32 ),"
            "c_names VARCHAR ( 32 ),"
            "recent_publish TINYINT UNSIGNED,"
            "fan_nums MEDIUMINT UNSIGNED DEFAULT 0,"
            "about VARCHAR ( 1024 )"
            ");"
        )
        author_about_cmd = (
            "CREATE TABLE if not exists author_about_table ("
            "douban_id INT UNSIGNED NOT NULL PRIMARY KEY,"
            'author varchar(255),'
            "about VARCHAR ( 1024 )"
            ");"
        )
        tables_cmd = (
            book_cmd,
            tag_cmd,
            abstract_cmd,
            doulist_cmd,
            review_cmd,
            comment_cmd,
            tag_book_cmd,
            doulist_book_cmd,
            discuss_cmd,
            relate_cmd,
            work_cmd,
            tag_404_cmd,
            common_404_cmd,
            ebook_cmd,
            series_cmd,
            contents_cmd,
            author_cmd,
            author_about_cmd
        )
        # 命令行需要拆开, 否则会导致 Commands out of sync; you can't run this command now
        # 注意self.cursor.executemany(), self.cursor.execute()在执行多条语句上的问题
        # With the executemany() method, it is not possible to specify multiple
        # statements to execute in the operation argument.
        # Doing so raises an InternalError exception. Consider using execute() with multi=True instead.
        # If multi is set to True, execute() is able to execute
        # multiple statements specified in the operation string.
        # It returns an iterator that enables processing the result of each statement.
        # However, using parameters does not work well in this case,
        # and it is usually a good idea to execute each statement on its own.
        for cmd in tables_cmd:
            self.cursor.execute(cmd)
        self.sql.free_result()
        return True

    @logger.decorator('create_db')
    def __create_db(self, dbname: str):
        self.cursor.execute('show databases;')
        if not any(dbname == e[0] for e in self.cursor):
            self.cursor.execute('create database ' + dbname)
        """
        .free.result()
        Frees the stored result set, if there is one, for this MySQL instance. 
        If the statement that was executed returned multiple result sets, 
        this method loops over and consumes all of them.
        如不使用此命令, 在数据库已创建的情况下, 将会出错
        """
        self.sql.free_result()
        """
        .database
        This property sets the current (default) database by executing a USE statement.
        The property can also be used to retrieve the current database name.
        # self.cursor.execute('use ' + dbname)
        """
        self.sql.database = dbname
        return True

    @logger.decorator('db_commit')
    def commit(self):
        if self.cursor and self.changed:
            self.sql.commit()
            self.changed = False

    @logger.decorator('db_quit')
    def quit(self):
        """
        This method sends a COMMIT statement to the MySQL server, committing the current transaction.
        Since by default Connector/Python does not autocommit,
        it is important to call this method after every transaction that modifies data
        for tables that use transactional storage engines.
        :return: None
        """
        # 注意commit, 因为在connector操作MySQL是在事务中进行的
        if self.sql:
            self.commit()
            if self.cursor:
                self.cursor.close()
            self.sql.cmd_quit()
            self.sql = None
            self.cursor = None
            print('mysql_module has been exited successfully')
