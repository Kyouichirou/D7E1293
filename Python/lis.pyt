import time
import random
import pprint


# require python 3.8+
# Longest Increasing Subsequence,LIS

def time_clock(func):
    def wraper(*args, **kwargs):
        s = time.time()
        r = func(*args, **kwargs)
        print(time.time() - s)
        return r

    return wraper


def get_lis(nums, indexs, index, n):
    # get the Subsequence
    results = []
    for i, e in enumerate(indexs):
        if e == index:
            r = []
            k = index + 1
            for j in range(i, n):
                if k - indexs[j] == 1:
                    r.append(nums[j])
                else:
                    continue
                k = indexs[j]
            results.append(r)
    return results


@time_clock
def lis(nums):
    n = len(nums)
    indexs = [1] * n
    index = 1
    for i in reversed(range(n)):
        for j in range(i + 1, n):
            if nums[j] > nums[i]:
                if (a := indexs[j] + 1) > indexs[i]:
                    indexs[i] = a
                    if a > index:
                        index = a

    return (index, get_lis(nums, indexs, index, n)) if index > 1 else (1, [[e] for e in nums])


pprint.pprint(lis([random.randint(1, 10000) for _ in range(150)]))
