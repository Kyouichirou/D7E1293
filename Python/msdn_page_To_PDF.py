import json, requests, os, re, time, PyPDF2
from msedge.selenium_tools import Edge, EdgeOptions
from bs4 import BeautifulSoup as btF

"""
@name msdn_page_To_PDF
@author: HLA
@description:
利用selenium爬取msdn的文档, 将获取到的页面直接打印为PDF
pdfkit在针对较复杂页面的处理上, 效果较差
"""

class Spider:
    def __init__(self, url):
        self.reg = re.compile(r'[*|?.<>/:"]')
        links = self.__get_links(url)
        if not links:
            return
        path = os.path.join(os.path.expanduser("~"), 'Downloads') + '\\' + self.title
        if not os.path.exists(path):
            os.mkdir(path)
        options = EdgeOptions()
        options.binary_location = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
        options.use_chromium = True
        # options.headless = True, 在此模式下, 将无法生成pdf文件
        settings = {
            "recentDestinations": [{
                "id": "Save as PDF",
                "origin": "local",
                "account": ""
            }],
            'default_directory': path,
            "selectedDestinationId": "Save as PDF",
            "version": 2,
            "isHeaderFooterEnabled": False,
            "isCssBackgroundEnabled": True,
            "mediaSize": {
                "height_microns": 297000,
                "name": "ISO_A4",
                "width_microns": 210000,
                "custom_display_name": "A4 210 x 297 mm"
            },
        }
        options.add_argument('--enable-print-browser')
        options.add_argument("--kiosk")
        #全屏模式
        prefs = {
            'printing.print_preview_sticky_settings.appState': json.dumps(settings),
            'savefile.default_directory': path,
            "download.prompt_for_download": False,
        }
        options.add_argument('--kiosk-printing')
        #打印, 默认保存
        options.add_experimental_option('prefs', prefs)
        self.driver = Edge(rf"{os.path.expanduser('~')}\portablesoft\edgedriver_win64\msedgedriver.exe", options=options)
        pref = 'https://docs.microsoft.com/en-us/previous-versions/windows/desktop/'
        for index, link in enumerate(links):
            if 'href' in link.attrs:
                href = link.attrs['href']
                if href:
                    self.convert_pdf(pref + href, index)
                    self.driver.get('https://www.baidu.com/local')

        time.sleep(3)
        self.driver.quit()
        self.pdfs_merger(path)

    def __get_links(self, url):
        headers = {
            'authority': 'docs.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        }
        try:
            r = requests.get(url, headers=headers, timeout=(8, 8))
            if r.status_code != 200:
                print('fail to get links')
                return None
            d = btF(r.content.decode('utf-8'), 'html.parser')
            c = d.find('tbody')
            self.title = self.reg.sub('_', d.find('title').text)
            return c.find_all('a') if c else None
        except requests.Timeout:
            print('timeout error')
            return None

    def convert_pdf(self, url, index):
        self.driver.get(url)
        time.sleep(1)
        title = str(index) + '_' + self.reg.sub('_', self.driver.title) + '.pdf'
        js = 'document.title="{}";window.print();'.format(title)
        self.driver.execute_script(js)
        # --k模式下, 一个host只允许执行一次的window.print(), 右键ctrl + p则不会受到这个的影响
        # 故而需要交替切换URL来实现window.print()

    def pdfs_merger(self, path):
        pdm = PyPDF2.PdfFileMerger()
        r = PyPDF2.PdfFileReader
        #接受stream
        files = filter(lambda x: x if x.endswith('.pdf') else None, os.listdir(path))
        files = sorted(files, key=lambda x: int(x[0: x.find('_')]))
        files = map(lambda x: path + '\\' + x, files)
        for file in files:
            with open(file, 'rb') as f:
                pdm.append(r(f))
                #接受fileobj
        with open(path + '\\' + self.title.replace(' ', '_') + '.pdf', 'wb') as f:
            pdm.write(f)


if __name__ == '__main__':
    start = time.time()
    Spider('https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ms757828(v=vs.85)')
    print(time.time() - start)
