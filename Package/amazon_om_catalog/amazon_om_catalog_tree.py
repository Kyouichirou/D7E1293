__all__ = ['DictTree']

import json
import time
from pyecharts import options as opts
from pyecharts.charts import Tree


# @name: amazon_catalog_to_tree
# @author: hla
# @description: 这里展示的以amazon户外和运动产品相关的目录的数据
# document: https://pyecharts.org/#/zh-cn/intro

class DictTree:
    def __init__(self, r_level=3):
        self._level = r_level

    @property
    def _time_stamp(self):
        return str(int(time.time()))

    @staticmethod
    def _get_tree(data):
        # 获得树状图
        # 配置树状图
        configs = opts.TooltipOpts(trigger='item', trigger_on="mousemove")
        # 这里的data接收的是列表型的数据, 不支持直接将字典传入
        fig = (Tree().add('amazon户外/体育产品目录', data=[data]).set_global_opts(tooltip_opts=configs))
        return fig

    def _recursion(self, total_obj: dict, obj: dict, index: int):
        # 由于数据量较大, 难以直接全部渲染, 只渲染制定层级的
        if index > self._level:
            return
        # 数据在原json结构中的存储方式是: [dict, dict], 字典再嵌套数组的套娃模式
        c = obj['catalog']
        for e in c:
            for key, val in e.items():
                item = {'name': key, 'children': []}
                total_obj['children'].append(item)
                index += 1
                self._recursion(item, val, index)
                index -= 1

    def load_json(self, json_file, mode):
        # mode = true, 输出树状图为html文件
        total_obj = {'name': 'amazon户外/体育产品目录', 'children': []}
        with open(json_file, encoding='utf-8', mode='r') as f:
            obj = json.load(f)
        self._recursion(total_obj, obj, 0)
        fig = self._get_tree(total_obj)
        # 保存生成经过清洗的数据
        with open(f'amazon_om_tree_{self._time_stamp}.json', encoding='utf-8', mode='w') as fs:
            json.dump(total_obj, fs, indent=4, ensure_ascii=False)
        if mode:
            fig.render(f'amazon_om_tree_{self._time_stamp}.html')
        else:
            # 在Jupiter notebook上直接展示数据
            fig.render_notebook()
