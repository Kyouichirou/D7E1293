import random

"""
@name: no_repeat_random_num
@author: HLA
@description:
洗牌算法, 生成指定范围的不重复的随机数
"""


def rand_range_num(start, end, count):
    if start < 0 or end < 0 or count < 2:
        return None
    end += 1
    tmp = [x for x in range(start, end)]
    arr = []
    for _ in range(count, 0, -1):
        k = len(tmp) - 1
        r = random.randint(0, k)
        arr.append(tmp[r])
        tmp[r] = tmp[k]
        tmp.pop()
    return arr
