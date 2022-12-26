__all__ = ['Spider']

from .crawler_module import Crawler
from .utils.html_parser_module import Parser
from .utils.data_to_excel_module import Workbook


class Spider:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._crawler.exit_crawler()

    def __init__(self):
        self._crawler = Crawler()
        self._parser = Parser()
        self._month_func = lambda m: str(m) if m > 9 else '0' + str(m)

    def start(self):
        refer = ''
        datas = []
        for y in range(1993, 2023):
            for m in range(1, 13):
                s_date = f'{y}-{self._month_func(m)}'
                url = f'https://data.7m.com.cn/fifarank/index_gb.aspx?type=All&d={s_date}'
                if html := self._crawler.request(url, refer):
                    if data := self._parser.handle(html, s_date):
                        datas.append(data)
                refer = url
        if datas:
            with Workbook('fifa_mens_rank') as wb:
                wb.write_to_sheet_with_style(
                    wb.data_to_frame([e for k in datas for e in k]),
                    sheet_name='fifa',
                    is_number_style=True
                )
