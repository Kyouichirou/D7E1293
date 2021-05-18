class Sunday:
    """
    @name sunday_string_match_algorithm
    @author HLA
    @description:
    高效率的字符串匹配算法, 特别是双向均为大字符串
    """
    def __init__(self, target):
        self.target = target
        self.length = len(target)
        self.sdic = {}
        """
        生成偏移位置, 相同的字符串距离右侧的距离
        """
        for i, e in enumerate(target):
            self.sdic[e] = self.length - i

    def indexof(self, raw):
        rlen = len(raw)
        p = 0
        """
        \0, 补位作用, 否则潜在匹配会出现越界的问题
        """
        raw += '\0'
        g = rlen - self.length + 1
        while p < g:
            k = 0
            while self.target[k] == raw[p + k]:
                k += 1
                if k >= self.length: return p
            n = p + self.length
            """
            注: 假如使用did.get(item), 再进行判断, 速度将大幅度降低 -50% - ?
            关键一步, 'abcd', 'ef', 当字符串'c'完全不匹配'e', 'f', 移动的位置为3, 即移动到'd'
            开始重新匹配 'abcd', 'bd', 当字符串'b'匹配, 即移动到'b'开始重新匹配
            """
            p += self.sdic[raw[n]] if raw[n] in self.sdic else self.length + 1
        return -1



