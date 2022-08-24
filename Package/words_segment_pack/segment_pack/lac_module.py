__all__ = ['BaiduLac']

import re
import os
from LAC import LAC
from math import log10 as log
from collections import Counter


# @description: 分词部分将由百度lac负责, 切割效果比jieba好

class BaiduLac:
    def __init__(self, normal=True):
        self._tmp_cache = []
        # 清除指定词汇的正则
        self._clear_reg = re.compile('[\da-z.]+')
        self._colors = (
            "黑",
            "蓝",
            "水",
            "紫",
            "灰",
            "绿",
            "栗",
            "海",
            "橙",
            "红",
            "白",
            "银",
            "黄",
            '粉',
            '颜',
            '咖',
            '啡',
            '深',
            '浅',
            '框',
            '棕',
            '橘'
        )
        self._sex_reg = re.compile('([男女][性款式士]|儿童|幼儿)')
        # 辅助文件
        path = os.getcwd() + r'\assistance_files'
        self._user_dict_path = path + r'\user_dict.txt'
        self._stop_words_path = path + r'\stop_words.txt'
        self._noun_en_zh_path = path + r'\noun_en_zh.txt'
        # 载入lac
        # 支持的模型:
        '''
        seg, rank(重要性, 词性), lac(词性)
        seg的效果最好, 但是没有词性标注, 可以对文本进行非常细致的拆分, 精确到每个点
        另外两种处理符号不是很好
        '''
        self._lac = LAC(mode=('seg' if normal else 'lac'))
        # 载入自定义字典
        self._lac.load_customization(self._user_dict_path)
        # 载入停用词
        with open(self._stop_words_path, encoding='utf-8', mode='r') as f:
            self._stop_words = [line.rstrip('\n') for line in f.readlines()]
        # 载入特定的单词转为中文
        with open(self._noun_en_zh_path, encoding='utf-8', mode='r') as f:
            self._n_en_zh = [line.rstrip('\n').lower().split(',', 1) for line in f.readlines()]

    def _check_color(self, c):
        k = 0
        for i in c:
            for e in self._colors:
                if i == e:
                    k += 1
                    break
        if k == len(c):
            return True
        elif k > 0 and c[-1] == '色':
            return True
        return False

    def _pre_handle(self, content) -> str:
        content = content.lower()
        for e in self._n_en_zh:
            content = content.replace(e[0], e[1])
        return content

    def normal_segment(self, content: str) -> str:
        # 全部转为小写
        content = self._pre_handle(content)
        # 分词
        words = self._lac.run(content)
        # 清除掉停用词
        words = (w for w in words if w not in self._stop_words and len(w) > 1)
        # 需要得到整体, 然后才能计算后续部分
        # 清除掉干扰项(数字, 字母)
        words = (w for w in words if not self._clear_reg.search(w))
        words = (w for w in words if not self._sex_reg.search(w))
        # 清除颜色
        c_words = [w for w in words if not self._check_color(w)]
        # 返回关键词和比例
        data_set = set(c_words)
        self._tmp_cache.append(c_words)
        return ','.join(data_set)

    def lac_segment(self, content: str) -> str:
        content = self._pre_handle(content)
        # 将获得词组和词性
        content = content.replace(' ', '')
        data = self._lac.run(content)
        words = data[0]
        tmp = []
        # 将所有的名词部分提取出来
        for i, n in enumerate(data[1]):
            if 'n' in n and 'v' not in n:
                tmp.append(words[i])
        # 清除掉停用词
        words = (w for w in tmp if w not in self._stop_words and len(w) > 1)
        # 清除掉干扰项(数字, 字母)
        words = (w for w in words if not self._clear_reg.search(w))
        words = (w for w in words if not self._sex_reg.search(w))
        # 清除颜色
        c_words = (w for w in words if not self._check_color(w))
        # 返回关键词和比例
        data_set = set(c_words)
        self._tmp_cache.append(data_set)
        return ','.join(data_set)

    def tf_idf(self):
        # 计算出整体的文档情况
        idf_dic = dict(Counter(i for ii in self._tmp_cache for i in ii))
        w_sum = len(self._tmp_cache)
        tf_idf_arr = []
        tf_idf_max = []
        # 计算细分的项
        for e in self._tmp_cache:
            seg = dict(Counter(e))
            p_sum = sum(seg.values())
            p_arr = []
            m_i = 0
            m_k = 0
            m = -10
            for k, v in seg.items():
                # 词频
                tf = v / p_sum
                # 逆文档率
                idf = log(idf_dic.get(k, 0) / w_sum)
                t_i = tf * idf
                if t_i > m:
                    m_i = m_k
                    m = t_i
                m_k += 1
                p_arr.append(', '.join((k, str(t_i))))
            if p_arr:
                tf_idf_max.append(p_arr[m_i])
                tf_idf_arr.append('; '.join(p_arr))
            else:
                tf_idf_max.append('无')
                tf_idf_arr.append('无')
        return tf_idf_arr, tf_idf_max
