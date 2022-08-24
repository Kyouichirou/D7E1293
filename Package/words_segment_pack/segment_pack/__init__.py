__all__ = ['WordsSegment']

import os
import time
import pandas as pd
from .lac_module import BaiduLac


class WordsSegment:
    def __init__(self, file: str):
        self._baidu_seg = BaiduLac(normal=False)
        self._path = os.path.join(os.path.expanduser("~"), 'Desktop')
        self._file = file

    @property
    def _timestamp(self) -> str:
        return str(int(time.time()))

    def _read_listing(self):
        data_types = {
            'SKU': 'str',
            '品名': 'str'
        }
        df = pd.read_excel(self._file, usecols=data_types.keys(), dtype=data_types, keep_default_na=False)
        df.drop_duplicates(inplace=True)
        df.drop(df[df['SKU'].str.len() == 0].index, inplace=True)
        return df

    def main(self) -> bool:
        df = self._read_listing()
        df['分词'] = df['品名'].apply(self._baidu_seg.lac_segment)
        df['词频'], df['核心词汇'] = self._baidu_seg.tf_idf()
        df.to_excel(self._path + rf'\listing_cut_{self._timestamp}.xlsx', index=False)
        return True
