__all__ = ['SogouScelTxt']

import os
import time
import struct


# @description: 将https://pinyin.sogou.com/dict/, 搜狗词库的文件的内容转为TXT

class SogouScelTxt:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.write_data_to_txt_file()

    def __init__(self):
        self._start_py = 0x1540
        self._start_chinese = 0x2628

        self._table_arr = []
        self._py_table_dict = {}

    @staticmethod
    def _byte_to_str(raw_data) -> str:
        pos = 0
        i = len(raw_data)
        tmp = []
        while pos < i:
            c = chr(struct.unpack('H', bytes([raw_data[pos], raw_data[pos + 1]]))[0])
            if c != chr(0):
                tmp.append(c)
            pos += 2
        return ''.join(tmp)

    def _get_py_table(self, raw_data):
        pos = 0
        data = raw_data[4:]
        i = len(data)
        while pos < i:
            key = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
            pos += 2
            y = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
            pos += 2
            py = self._byte_to_str(data[pos:pos + y])
            self._py_table_dict[key] = py
            pos += y

    def _get_word_py(self, data) -> str:
        pos = 0
        i = len(data)
        tmp = []
        while pos < i:
            key = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
            tmp.append(self._py_table_dict[key])
            pos += 2
        return ''.join(tmp)

    def _get_chinese(self, data):
        pos = 0
        i = len(data)
        while pos < i:
            # 同音词数量
            same = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
            # 拼音索引表长度
            pos += 2
            py_table_len = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
            # 拼音索引表
            pos += 2
            py = self._get_word_py((data[pos: pos + py_table_len]))
            # 中文词组
            pos += py_table_len
            for _ in range(same):
                # 中文词组长度
                c_len = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
                # 中文词组
                pos += 2
                word = self._byte_to_str(data[pos: pos + c_len])
                # 扩展数据长度
                pos += c_len
                next_i = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
                # 词频
                pos += 2
                count = struct.unpack('H', bytes([data[pos], data[pos + 1]]))[0]
                # 词频, 拼音, 词组
                self._table_arr.append((count, py, word))
                # 到下个词的偏移位置
                pos += next_i

    @property
    def _timestamp(self):
        return str(int(time.time()))

    def write_data_to_txt_file(self, output_file='', w_mode=0):
        if self._table_arr:
            # 没有输入指定的文件位置
            if not output_file:
                output_file = os.path.join(os.path.expanduser("~"), 'Desktop') + rf'\sogou_scel_{self._timestamp}.txt'

            # 修正写入模式
            if w_mode < 0 or w_mode > 3:
                w_mode = 0

            # 根据条件写入数据, 多个内容以逗号作为间隔符号
            if w_mode == 0:
                # 只写入文字
                content = (w for c, py, w in self._table_arr)
            elif w_mode == 1:
                # 文字 + 词频
                content = (w + ',' + str(c) for c, py, w in self._table_arr)
            elif w_mode == 2:
                # 文字 + 拼音
                content = (w + ',' + py for c, py, w in self._table_arr)
            else:
                # 全部写入
                content = (','.join((str(e) for e in data)) for data in self._table_arr)

            with open(output_file, 'w', encoding='utf8') as f:
                f.write('\n'.join(content))

    def main(self, scel_file: str) -> bool:
        try:
            with open(scel_file, 'rb') as f:
                data = f.read()
            print('提取数据中...')
            print("词库名：", self._byte_to_str(data[0x130:0x338]))
            print("词库类型：", self._byte_to_str(data[0x338:0x540]))
            print("描述信息：", self._byte_to_str(data[0x540:0xd40]))
            print("词库示例：", self._byte_to_str(data[0xd40:self._start_py]))

            self._get_py_table(data[self._start_py:self._start_chinese])
            self._get_chinese(data[self._start_chinese:])
            return True
        except Exception as error:
            print(error)
