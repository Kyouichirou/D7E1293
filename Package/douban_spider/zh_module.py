__all__ = ['Convertor']

import os
import json
from . import log_module
from pkg_resources import resource_stream

__logger = log_module.Logs()


def decorator_log(func):
    # 错误日志记录-装饰器
    # 模块名称, 函数名称, 错误原因, 函数参数
    def wrapper(*args, **kwargs):
        # noinspection PyBroadException
        try:
            return func(*args, **kwargs)
        except Exception:
            __logger.capture_except('zh')
            return args[1]

    return wrapper


# 繁体转简体, 改自zhconv库

class Convertor:
    def __init__(self):
        self.__pfset = None
        self.__zhdict = self.__getdict()

    def __getdict(self):
        zhcdicts = self.__loaddict()
        dict_zhcn = zhcdicts['zh2Hans'].copy()
        dict_zhcn.update(zhcdicts['zh2CN'])
        self.__pfset = self.__getpfset(dict_zhcn)
        return dict_zhcn

    @staticmethod
    def __getpfset(convdict):
        pfset = []
        for word in convdict:
            for ch in range(len(word)):
                pfset.append(word[:ch + 1])
        return frozenset(pfset)

    @staticmethod
    def __loaddict():
        filename = "zhcdict.json"
        get_module_res = lambda *res: resource_stream(__name__, os.path.join(*res))
        zhcdicts = json.loads(get_module_res(filename).read().decode('utf-8'))
        zhcdicts['SIMPONLY'] = frozenset(zhcdicts['SIMPONLY'])
        zhcdicts['TRADONLY'] = frozenset(zhcdicts['TRADONLY'])
        return zhcdicts

    @decorator_log
    def convert(self, s: str):
        ch = []
        n = len(s)
        pos = 0
        while pos < n:
            i = pos
            frag = s[pos]
            maxword = None
            maxpos = 0
            while i < n and frag in self.__pfset:
                if frag in self.__zhdict:
                    maxword = self.__zhdict[frag]
                    maxpos = i
                i += 1
                frag = s[pos:i + 1]
            if maxword is None:
                maxword = s[pos]
                pos += 1
            else:
                pos = maxpos + 1
            ch.append(maxword)
        return ''.join(ch)
