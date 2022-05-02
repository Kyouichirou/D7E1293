__all__ = ['AudioMetedata']

import os
import re
import time
import taglib
import pandas as pd
from .log_module import Logs
from .zh_module import Convertor

_logger = Logs()


class AudioMetedata:
    def __init__(self, output_file=''):
        # 匹配年份, 音轨序号
        self._reg = re.compile('\d+')
        # 匹配存在空格的中文
        self._reg_cn = re.compile('(\d+\.\s)?[\u4e00-\u9fa5]\s+[\u4e00-\u9fa5]')
        # 生成文件的路径
        desktop = os.path.join(os.path.expanduser('~'), "Desktop")
        self._output_file = output_file if output_file else fr'{desktop}\audio_library_{str(int(time.time() * 1000))}.xlsx'
        # 繁体字转换
        self._zh_convertor = Convertor()

    def _write_sheet(self, data: list):
        # 写入数据
        if data:
            df = pd.DataFrame(data=data)
            df.to_excel(self._output_file, index=False)

    def get_all_files(self, folder_path: str):
        # 遍历文件
        arr = []
        file_filters = ('.mp3', '.wav', '.flac', '.ape', '.m4a')
        for filepath, dir_names, filenames in os.walk(folder_path):
            for filename in filenames:
                if any(s_filter in filename.lower() for s_filter in file_filters):
                    if data := self._get_file_info(filepath, filename):
                        arr.append(data)
                    else:
                        print(f'some error: break {filename}')
                        return
        self._write_sheet(arr)

    def _get_tags(self, tags: dict, info: dict, data: dict, audio_file):
        # 获取标签的信息
        d_items = data.items()
        f = False
        for key, value in tags.items():
            t_k = ''
            if isinstance(value, list):
                if not value:
                    continue
                value = value[0]
            elif not isinstance(value, str):
                _logger.debug(f'{audio_file.path} 文件元数据异常')
                continue
            if not value:
                continue
            for k, v in d_items:
                if v == key:
                    t_k = k
                    break
            if key == "DATE" or key == 'TRACKNUMBER':
                if ms := self._reg.match(value):
                    info[t_k] = int(ms.group())
            else:
                c = False
                tmp = value.lower()
                if tmp != value:
                    c = True
                    value = tmp
                tmp = self._zh_convertor.convert(value)
                if tmp and tmp != value:
                    c = True
                    value = tmp
                if c:
                    f = True
                    audio_file.tags[key] = value
                if t_k: info[t_k] = value
        if f: audio_file.save()

    @_logger.decorator('元数据')
    def _get_file_info(self, filepath: str, filename: str) -> dict:
        # 提取文件的元数据
        print(f'working on {filename}')
        f = False
        # 初始的文件路径(文件名)
        file_path = os.path.join(filepath, filename)
        # 将文件名转为小写
        new_file = filename.lower()
        if new_file != filename:
            f = True
            filename = new_file
        # 拆开文件名和文件扩展名
        file_name, file_type = os.path.splitext(filename)
        # 将文件名转为简体
        zh = self._zh_convertor.convert(file_name)
        if zh and zh != file_name:
            f = True
            file_name = zh
        # 满足特定格式, 去掉空格, 中文
        if '周杰伦' in filepath or self._reg_cn.match(file_name):
            f = True
            file_name = file_name.replace(' ', '')
        # 修改新的文件名
        if f:
            new_file = os.path.join(filepath, file_name + file_type)
            os.rename(file_path, new_file)
            file_path = new_file
        # 转换为小写, 文件后缀名称
        info = {
            'file_name': file_name,
            'file_type': file_type[1:],
            'title': '',
            'artist': '',
            'album': '',
            'album_artist': '',
            'composer': '',
            'genre': '',
            'year': 1970,
            'track_number': 0,
            'bit_rate': 0,
            'sample_rate': 0,
            'channels': 0,
            'size': os.path.getsize(file_path),
            'length': '',
            'comment': ''
        }
        # 只提取此部分的数据
        data = {
            'title': 'TITLE',
            'artist': 'ARTIST',
            'album': 'ALBUM',
            'album_artist': 'ALBUMARTIST',
            'composer': 'COMPOSER',
            'genre': 'GENRE',
            'year': 'DATE',
            'track_number': 'TRACKNUMBER',
            'comment': 'COMMENT'
        }
        file = taglib.File(file_path)
        tags = file.tags
        # 统一将标签改为简体字
        self._get_tags(tags, info, data, file)
        # 音频文件只读属性, 文件长度, 比特率, 采样率, 声道
        info['length'] = file.length
        info['bit_rate'] = file.bitrate
        info['sample_rate'] = file.sampleRate
        info['channels'] = file.channels
        return info
