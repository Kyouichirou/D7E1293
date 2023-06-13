from datetime import datetime

_reg_d = '%Y-%m-%d'
_reg = '%Y-%m-%d %H:%M:%S'
_reg_t = '%Y-%m-%dT%H:%M:%S'


def convert_date(s_date: str):
    return datetime.strptime(s_date, _reg_t if 'T' in s_date else (_reg if ' ' in s_date else _reg_d))


def now():
    return datetime.now()
