__all__ = ['spilt_character']

import re
from collections import namedtuple

_alpha_reg = re.compile('[a-zA-Z]{3,}')


# 对字符串进行逐个拆分
# 计算数字, 中文, 英文, 其他字符的出现次数, 以及英文单词的出现次数

def spilt_character(text: str, mode=False) -> tuple:
    i = c = a = o = ac = 0

    for w in text:
        # 数字0-9
        # unicode 范围: 48 - 57
        if '\u002f' < w < '\u003a':
            i += 1
        # 中文, 参看js
        # Unicode范围: 19967 - 40959
        elif '\u4DFF' < w < '\uA000':
            c += 1
        # 英文符号
        # 大小写涵盖
        # Unicode范围 65 -122
        elif '\u0040' < w < '\u007b':
            a += 1
        else:
            o += 1
    if mode and a > 2:
        # 长度大于2的字母组合默认其为单词
        if ms := _alpha_reg.findall(text):
            ac = len(ms)
    return (i, c, a, o, ac) if mode else (i, c, a, o)
