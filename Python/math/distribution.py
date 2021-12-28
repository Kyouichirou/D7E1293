__all__ = ["Distribute"]

import time
import os
import numpy as np
import pandas as pd
from scipy.stats import t
from scipy.stats import f
from scipy.stats import chi2
from scipy.integrate import quad

"""
1. np中的常量:
numpy.inf
numpy.Inf
numpy.Infinity
numpy.infty
numpy.PINF
注: Inf，Infinity，PINF 和 infty 是 inf 的别名
np.e, 欧拉常数, e
np.pi, 圆周率 π
np.nan
注意, NaN 和 NAN 是 nan 的别名
np.NINF, 负无穷
np.PZERO 表示正零, 正零被认为是有限数
np.NZERO 表示负零, 负零被认为是有限数
np.euler_gamma, 常数, 0.577....
np.newaxis, A convenient alias for None, useful for indexing arrays.
---------------------------
2.quad
https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.quad.html
quad, 计算定积分
"""


class Distribute:
    def __init__(self):
        self._c_probability = (0.995, 0.990, 0.975, 0.950, 0.900, 0.100, 0.050, 0.025, 0.010, 0.005)
        self._t_probability = (0.100, 0.050, 0.025, 0.010, 0.005, 0.001, 0.0005)
        self._f_df_a = (1, 2, 3, 4, 5, 6, 8, 12, 24)
        self._f_df_b = (*range(1, 30), 40, 60, 120)
        self._excel = None

    @property
    def _timestamp(self):
        return str(int(time.time() * 1000))

    def chi(self, df=30, file=''):
        # chi square distribution
        # 卡方分布
        dfi = range(1, df + 1)
        data = np.array([chi2.isf(self._c_probability, df=i) for i in dfi])
        df = pd.DataFrame(data=data, index=dfi, columns=self._c_probability)
        if file:
            self._creat_excel(df, 'chi', file)
        else:
            return df

    @staticmethod
    def _normal_probability_density(x):
        constant = 1.0 / np.sqrt(2 * np.pi)
        return constant * np.exp((-x ** 2) / 2.0)

    def normal(self, file=''):

        table = pd.DataFrame(data=[],
                             index=np.round(np.arange(0, 3.6, .1), 2),
                             columns=np.round(np.arange(0.00, .1, .01), 2))
        for index in table.index:
            for column in table.columns:
                z = np.round(index + column, 2)
                value = quad(self._normal_probability_density, np.NINF, z)[0]
                table.loc[index, column] = value
        # Formatting to make the table look like a z-table
        table.index = table.index.astype(str)
        table.columns = [str(column).ljust(4, '0') for column in table.columns]
        if file:
            self._creat_excel(table, 'noraml', file)
        else:
            return table

    @staticmethod
    def _creat_excel(datas, sheet_names, file):
        if isinstance(datas, tuple):
            excel = pd.ExcelWriter(file)
            for data, sheet in zip(datas, sheet_names):
                data.to_excel(excel, sheet)
            excel.close()
        else:
            datas.to_excel(file, sheet_name=sheet_names)

    def f(self, alpha=0.05, df_a=None, df_b=None, file=""):
        if not df_a:
            df_a = self._f_df_a
        if not df_b:
            df_b = self._f_df_b
        # 注意reshape的变化后的对应长宽比
        # reshape, Gives a new shape to an array without changing its data.
        # https://numpy.org/doc/stable/reference/generated/numpy.reshape.html
        data = np.array([f.isf(alpha, dfa, dfb) for dfa in df_a for dfb in df_b]).reshape(len(df_a), -1).T
        df = pd.DataFrame(data=data, columns=df_a, index=df_b)
        if file:
            self._creat_excel(df, 'f', file)
        else:
            return df

    def t(self, df=30, file=''):
        dfi = range(1, df + 1)
        data = np.array([t.isf(self._t_probability, df=i) for i in dfi])
        df = pd.DataFrame(data=data, columns=self._t_probability, index=dfi)
        if file:
            self._creat_excel(df, 't', file)
        else:
            return df

    def get_all_table(self, file=''):
        n = self.normal()
        tt = self.t()
        ft = self.f()
        if not file:
            file = os.path.join(os.path.expanduser("~"), fr"Desktop\stats_{self._timestamp}.xlsx")
        self._creat_excel((n, tt, ft), ('normal', 't', 'f'), file)
