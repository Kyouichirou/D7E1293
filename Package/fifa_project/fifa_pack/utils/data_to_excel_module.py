__all__ = ['Workbook']

import time
from pandas import ExcelWriter, DataFrame

from .log_module import Logs

_logger = Logs()

'''
author: HLA
GitHub: https://github.com/Kyouichirou
version: 1.0
license: MIT
update: 2022-12-05
description: 自定义pandas的数据存储
'''


class Workbook:
    @property
    def sheet_index(self) -> int:
        return self._sheet_index

    @staticmethod
    def _time_stamp(is_thirteen=True) -> str:
        return str(int(time.time() * (13 if is_thirteen else 10)))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        # save方法已经被废弃, close()之前已经自动保存数据
        self._writer.close()

    def __init__(self, filename: str):
        _file = f'{filename}_{self._time_stamp()}.xlsx'
        self._writer = ExcelWriter(_file)
        self._workbook = self._writer.book
        self._sheet_index = 1
        # 数字样式
        # https://xlsxwriter.readthedocs.io/format.html#format
        # 格式直接参照vba的代码即可
        self._float_fmt = self._workbook.add_format({'num_format': '#,##0.00'})
        self._int_fmt = self._workbook.add_format({'num_format': '#,##0'})
        # 设置框线的大小(粗细)
        self._b_style = self._workbook.add_format({"border": 1})

    @staticmethod
    def _get_data_gb_len(data) -> int:
        text = str(data)
        try:
            return len(text.encode('gb18030'))
        except UnicodeError:
            return len(text.encode('utf-8'))

    def write_to_sheet(self, dataframe, sheet_name: str, is_index=False) -> bool:
        print(f'write data to worksheet: {sheet_name}')
        try:
            if dataframe is None or dataframe.empty:
                print('info: dataframe is null')
                return False
            if not sheet_name:
                sheet_name = f'sheet{self._sheet_index}'
            dataframe.to_excel(
                self._writer,
                sheet_name=sheet_name,
                index=is_index
            )
            self._sheet_index += 1
            print('write data to sheet, successfully')
            return True
        except Exception as error:
            print(error)
            print(f'warning: some error on writing data to {sheet_name}')

    @staticmethod
    def data_to_frame(datas: list):
        return DataFrame(data=datas, columns=['rank', 'country_name', 'rank_vol', 'points', 'points_vol', 'date'])

    def write_to_sheet_with_style(self, dataframe, sheet_name: str, is_index=False, start_row=0, start_col=0,
                                  is_number_style=False) -> bool:
        """

        :param dataframe: dataframe
        :param sheet_name: str, 表名
        :param is_index: bool, 是否需要序号
        :param start_row: int, 开始写入的行位置
        :param start_col: int, 开始写入的列位置
        :param is_number_style: bool, 是否调整数字的格式展示方式
        :return: bool, True, 写入成功
        """
        print(f'write data to worksheet: {sheet_name}')
        try:
            if dataframe is not None and not dataframe.empty:
                # 注意这里的对表格样式的调整, 需要安装有XlsxWriter这个库
                if not sheet_name:
                    sheet_name = f'sheet{self._sheet_index}'
                dataframe.to_excel(
                    self._writer,
                    sheet_name=sheet_name,
                    index=is_index,
                    startrow=start_row,
                    startcol=start_col
                )
                worksheet = self._writer.sheets[sheet_name]
                for r_index, c_index in enumerate(dataframe):
                    series = dataframe[c_index]
                    # 遍历每个格子内的内容长度, 取最长的和表头的长度进行比较, 取最长的
                    # 长度需要预先转成gbk, 因为中文的存在
                    # +5 是抵消实际写入时可能存在长度的缩水的问题
                    # openpyxl引擎设置字符宽度时会缩水0.5左右个字符
                    # set_column(first_col, last_col, width, cell_format, options)
                    # Set properties for one or more columns of cells.
                    # Parameters:
                    #  first_col (int) – First column (zero-indexed). 第一行的位置
                    #  last_col (int) – Last column (zero-indexed). Can be same as first_col., 第一列的位置
                    #  width (float) – The width of the column(s), in character units. 宽度, 字符单位
                    #  cell_format (Format) – Optional Format object. 格子的样式
                    #  options (dict) – Optional parameters: hidden, level, collapsed. 其他的样式
                    #  Returns:
                    #   0: Success.
                    #  Returns:
                    #   -1: Column is out of worksheet bounds.
                    max_len = max(series.apply(self._get_data_gb_len).max(), self._get_data_gb_len(series.name)) + 5
                    fm = None
                    if is_number_style:
                        # 数字增加千位符
                        # 假如需要调整格子的数字的显示样式, 浮点数, 展示两位小数
                        # 获取字段的类型
                        s_type = str(series.dtype).lower()
                        if 'int' in s_type:
                            fm = self._int_fmt
                        elif 'float' in s_type:
                            fm = self._float_fmt
                    worksheet.set_column(
                        r_index + start_col,
                        r_index + start_col,
                        max_len,
                        fm
                    )

                # 获得行列的范围
                last_row = start_row + len(dataframe.index)
                last_col = start_col + len(dataframe.columns)
                # 整体-添加样式
                # Write a conditional format to range of cells.
                worksheet.conditional_format(
                    start_row,
                    start_col,
                    last_row,
                    # 第一列, 假如有序列号
                    last_col - (0 if is_index else 1),
                    options={"type": "formula", "criteria": "True", "format": self._b_style},
                )
                self._sheet_index += 1
                _logger.info('info: write data to sheet with style, successfully')
                return True
            else:
                _logger.debug(f'info: dataframe is null _ {sheet_name}')
        except Exception as error:
            _logger.capture_except(error)
            _logger.warning(f'warning: some error on writing data to {sheet_name}')
