class SortAlgorithm:
    """
    @author: HLA
    @name: SortAlgorithm
    @description:
    常见排序算法
    """
    def __init__(self, arr):
        self.arr = arr
        self.len = len(self.arr)
        if self.len < 2:
            raise Exception("input err")

    def bubble_sort(self):
        flag = False
        n = self.len - 1
        for k in range(0, self.len):
            if flag:
                break
            flag = True
            for j in range(n, 0, -1):
                if self.arr[j - 1] > self.arr[j]:
                    self.arr[j - 1], self.arr[j] = self.arr[j], self.arr[j - 1]
                    flag = False

    def insert_sort(self):
        for k in range(1, self.len):
            if self.arr[k] < self.arr[k - 1]:
                tmp = self.arr[k]
                j = k - 1
                while j > -1 and self.arr[j] > tmp:
                    self.arr[j + 1] = self.arr[j]
                    j -= 1
                self.arr[j + 1] = tmp

    def select_sort(self):
        m = self.len - 1
        for k in range(0, m):
            imin = k
            for j in range(k + 1, self.len):
                if self.arr[j] < self.arr[imin]:
                    imin = j
            if imin != k:
                self.arr[imin], self.arr[k] = self.arr[k], self.arr[imin]

    def shell_sort(self):
        assist = self.ciura
        m = len(assist) - 1
        for k in range(m, -1, -1):
            gap = assist[k]
            for j in range(gap, self.len):
                if self.arr[j] < self.arr[j - gap]:
                    tmp = self.arr[j]
                    n = j - gap
                    while n > -1:
                        if self.arr[n] > tmp:
                            self.arr[n + gap] = self.arr[n]
                        else:
                            break
                        n -= gap
                    self.arr[n + gap] = tmp

    @property
    def ciura(self):
        # Ciura增量序列, 截止1750(论文原著,后续数字为推导)
        # 增量序列是影响shell排序的关键所在, 类似效果的还有斐波那契增量序列等
        swlist = [1, 4, 9, 23, 57, 131, 307, 701, 1579, 3547, 7993, 17971, 40427, 90947, 204641, 460451, 1036001,
                  2330959,
                  5244763]
        tmplist = []
        slen = self.len + 1
        n = len(swlist)
        for i in range(0, n):
            if swlist[i] < slen:
                tmplist.append(swlist[i])
            else:
                break
        return tmplist

import random

x = [random.randint(1, 100) for z in range(0, 10)]
s = SortAlgorithm(x)
print(x)
# s.bubble_sort()
# s.select_sort()
# s.shell_sort()
s.insert_sort()
print(x)
