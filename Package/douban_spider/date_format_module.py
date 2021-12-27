__all__ = ['DateFormat']

from . import log_module
from datetime import datetime

__logger = log_module.Logs()


def decorator(mode):
    def decorator_log(func):
        # 错误日志记录-装饰器, 带有结果返回
        # args[0], 为self传递过来
        # 模块名称, 函数名称, 错误原因, 函数参数
        def wrapper(*args, **kwargs):
            # noinspection PyBroadException
            try:
                return func(*args, **kwargs)
            except Exception:
                __logger.capture_except('dateformat')
                return None if mode else args[0].default_date

        return wrapper

    return decorator_log


class DateFormat:
    def __init__(self, reg):
        self.num_reg = reg

    @staticmethod
    def __full_width_to_half_width(ustring: str):
        arr = []
        for s in ustring:
            # 返回字符的unicode编码
            code = ord(s)
            if code == 12288:
                # 全角空格直接转换
                code = 32
            elif 65280 < code < 65375:
                # 除空格,全角字符,根据关系转化
                code -= 65248
            arr.append(chr(code))
        return ''.join(arr)

    @staticmethod
    def __year_check(year):
        i = len(year)
        y = int(year)
        if i == 2:
            if y > 0:
                return int(f'19{year}')
        elif i == 4:
            if 0 < y < 2025:
                return y
        return None

    @staticmethod
    def __month_check(month):
        m = int(month)
        return m if 0 < m < 13 else None

    @staticmethod
    def __day_check(day):
        d = int(day)
        return d if 0 < d < 32 else None

    @property
    def default_date(self):
        return datetime.strptime('1970-01-01 00:00:01', '%Y-%m-%d %H:%M:%S')

    @decorator(True)
    def date_disassemble(self, text: str):
        # 由于部分的字符为全角字符, 需要转换为半角
        # 将年月日逐个分离
        # 如果无法分离的, 需要智能分离出年月日, 如9812 => 则判断为98年12月(98年1月2日, 优先匹配月而不是日),9813=>98年1月3日
        if ms := self.num_reg.findall(self.__full_width_to_half_width(text)):
            k = len(ms)
            if 0 < k < 4:
                year = ms[0]
                arr = []
                if y := self.__year_check(year):
                    arr.append(y)
                    if k > 1:
                        if m := self.__month_check(ms[1]):
                            arr.append(m)
                            if k == 3:
                                if d := self.__day_check(ms[2]):
                                    arr.append(d)
                else:
                    k = len(year)
                    if k == 8:
                        if a := self.__year_check(year[:4]):
                            arr.append(a)
                            if b := self.__month_check(year[4:6]):
                                arr.append(b)
                                if c := self.__day_check(year[6:]):
                                    arr.append(c)
                    elif k > 4:
                        if a := self.__year_check(year[:4]):
                            arr.append(a)
                            if k == 5:
                                if b := self.__month_check(year[4:]):
                                    arr.append(b)
                            elif k == 6:
                                if b := self.__month_check(year[4:]):
                                    arr.append(b)
                                else:
                                    arr.append(int(year[4]))
                                    arr.append(int(year[5]))
                            else:
                                if b := self.__month_check(year[4:6]):
                                    arr.append(b)
                                    if c := self.__day_check(year[6]):
                                        arr.append(c)
                                else:
                                    arr.append(int(year[4]))
                                    if c := self.__day_check(year[5:]):
                                        arr.append(c)
                return [*arr, *[0] * (3 - len(arr))]
        return None

    @decorator(False)
    def get_date(self, text: str):
        data = self.date_disassemble(text)
        if not data:
            return self.default_date
        new_data = [e for e in data if e > 0]
        return self.date_format('-'.join(str(e) for e in [*new_data, *[1] * (3 - len(data))]),
                                mode=False) if new_data else self.default_date

    @staticmethod
    @decorator(False)
    def date_format(text: str, mode=True):
        # 年月日, 小写为补零, 时分秒, 大写为补零
        reg = '%Y-%m-%d %H:%M:%S' if mode else '%Y-%m-%d'
        return datetime.strptime(text, reg)
