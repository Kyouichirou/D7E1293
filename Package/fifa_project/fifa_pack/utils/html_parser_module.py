__all__ = ['Parser']

from nanoid import generate
from bs4 import BeautifulSoup as bFs

from .log_module import Logs

_logger = Logs()


class Parser:
    def __init__(self):
        pass

    @staticmethod
    def _convert_to_int(text: str):
        try:
            return int(text)
        except ValueError:
            return str(text)

    def handle(self, html: str, s_date: str) -> list:
        dom = bFs(html, 'lxml')
        if rank := dom.find('span', id='rankData'):
            trs = rank.find_all('tr')
            i = 0
            datas = []
            for tr in trs:
                if i == 0:
                    i += 1
                    continue
                tds = tr.find_all('td')
                data = []
                for td in tds:
                    if td.text:
                        text = td.next
                        if type(text).__name__ != 'NavigableString':
                            text = text.text
                        data.append(self._convert_to_int(text))
                if len(data) == 5:
                    data.append(s_date)
                    datas.append(data)
            return datas

    @staticmethod
    def write_html(html: str, s_date: str):
        with open(f'{generate(size=10)}_{s_date}.html', encoding='utf-8', mode='w') as f:
            f.write(html)

