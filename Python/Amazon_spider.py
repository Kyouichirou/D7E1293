from msedge.selenium_tools import Edge, EdgeOptions
import selenium.common.exceptions as es
import time, re, random
from collections import Counter as ic
import pandas as pd


# from selenium.webdriver.support.wait import WebDriverWait
# from selenium.webdriver.support import expected_conditions as ec
# from selenium.webdriver.common.by import By


class Amazon:
    def __init__(self, keywords, sku):
        self.sku = sku
        self.sreg = re.compile('[a-z]{2,}', re.I)
        self.ireg = re.compile('(?<=dp/)\w+?(?=/)')
        self.rreg = re.compile('(\d+[\.,]\d+|\d+)')
        options = EdgeOptions()
        prefs = {
            'profile.default_content_setting_values': {
                # 'images': 2,  # 屏蔽图片
                'notifications': 2,  # 屏蔽消息推送
                # 'javascript': 2
            }
        }
        options.add_experimental_option("prefs", prefs)
        options.binary_location = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        options.use_chromium = True
        # options.headless = True
        ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.3683.86 Safari/537.36'
        options.add_argument("user-agent=" + ua)
        options.add_argument("--lang=en-US")
        # options.add_argument("--kiosk")
        options.add_argument('--disable-gpu')
        options.add_argument("--disable-blink-features")
        options.add_argument('--incognito')
        options.add_argument('--start-maximized')
        options.add_argument("--disable-blink-features=AutomationControlled")
        self.driver = Edge(r"C:\Users\zxzy\edgedriver_win64\msedgedriver.exe", options=options)
        with open(r'C:\Users\zxzy\Documents\stealth.min.js') as f:
            js = f.read()
        self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": js
        })
        # self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        #     "source": """
        #         Object.defineProperty(navigator, 'webdriver', {
        #           get: () => undefined
        #         })
        #       """
        # })
        self.storage = []
        self.review = []
        self.title = []
        self.description = []
        self.key_value = []
        self.retry = 3
        self.url_ok = ''
        for key in keywords:
            links = self.get_links(key)
            if links:
                for link in links:
                    if 'redirect' in link:
                        continue
                    dic = self.get_detail(link, key)
                    if dic:
                        self.storage.append(dic)
            else:
                while self.retry != 3 and self.retry > 0 and self.url_ok:
                    self.driver.get(self.url_ok)
                    lr = self.get_links(key)
                    if lr:
                        for link in lr:
                            if 'redirect' in link:
                                continue
                            dic = self.get_detail(link, key)
                            if dic:
                                self.storage.append(dic)
                print(f'{key}, no search results')
        self.review_statistics()
        self.title_statistics()
        self.description_statistics()
        self.key_value_write()
        self.summery_write()
        self.driver.quit()

    # 获取搜索结果
    def get_links(self, key):
        link = f'https://www.amazon.com/s?k={key}&ref=nb_sb_noss'
        self.driver.get(link)
        print(f'start: {key}')
        time.sleep(random.uniform(1.5, 3.5))
        self.driver.delete_all_cookies()
        cookies = [{'domain': '.amazon.com',
                    'expiries': str(int(time.time() * 1000 + 60 * 1000 * 60)),
                    'httpOnly': False,
                    'name': 'i18n-prefs',
                    'path': '/',
                    'value': 'USD'
                    }, {'domain': '.amazon.com',
                        'expiries': str(int(time.time() * 1000 + 60 * 1000 * 60)),
                        'httpOnly': False,
                        'name': 'lc-main',
                        'path': '/',
                        'value': 'en_US'
                        }]
        for cookie in cookies:
            self.driver.add_cookie(cookie_dict=cookie)
        try:
            ele = self.driver.find_element_by_class_name('s-matching-dir')
        except es.NoSuchElementException:
            print(f'fail: {key}')
            self.retry -= 1
            return None
        dic = {
            'keyword': key,
            'counts': 0
        }
        self.retry = 3
        self.url_ok = link
        if ele:
            try:
                sc = self.driver.find_element_by_css_selector('h1.a-size-base.s-desktop-toolbar.a-text-normal')
                if sc:
                    t = sc.text
                    mc = self.rreg.findall(t)
                    if mc:
                        dic['counts'] = mc[len(mc) - 1]
            except es.NoSuchElementException:
                pass
            links = ele.find_elements_by_css_selector('a.a-size-base.a-link-normal.a-text-normal')
            arr = []
            for a in links:
                href = a.get_attribute('href')
                if href:
                    arr.append(href)
            self.key_value.append(dic)
            return arr
        else:
            self.key_value.append(dic)
            return None

    # 反馈
    def get_review(self):
        try:
            res = self.driver.find_element_by_id('cm-cr-dp-review-list')
            if res:
                contents = res.find_elements_by_css_selector(
                    '.a-expander-content.reviewText.review-text-content.a-expander-partial-collapse-content')
                arr = []
                for c in contents:
                    arr.append(c.text)
                return ';'.join(arr) if arr else None
        except es.NoSuchElementException:
            return None

    def get_price(self):
        try:
            r = self.driver.find_element_by_id('priceblock_ourprice')
            if r:
                t = r.text.strip()
                if t:
                    mc = self.rreg.findall(t)
                    if mc:
                        if '-' in t:
                            s = float(mc[0])
                            e = float(mc[1])
                            return (s + e) / 2
                        else:
                            return float(mc[0])
                    return None
        except es.NoSuchElementException:
            return None

    # 评分
    def get_rate(self):
        try:
            r = self.driver.find_elements_by_css_selector('span.a-size-base.a-nowrap')
            i = len(r) - 1
            if i > -1:
                t = r[i].text.strip()
                if t:
                    mc = self.rreg.findall(t)
                    if mc:
                        f = float(mc[0])
                        return f
            return None
        except es.NoSuchElementException:
            return None

    # 评分人数
    def get_reviews(self):
        try:
            r = self.driver.find_element_by_css_selector('.a-row.a-spacing-medium.averageStarRatingNumerical')
            t = r.text.strip()
            if t:
                # ',' 号剔除
                mc = self.rreg.findall(t)
                if mc:
                    f = float(mc[0].replace(',', ''))
                    return f
                return None
        except es.NoSuchElementException:
            return None

    # 产品标题
    def get_title(self):
        try:
            r = self.driver.find_element_by_css_selector('span#productTitle')
            return r.text if r else None
        except es.NoSuchElementException:
            return None

    # 产品描述
    def get_description(self):
        try:
            r = self.driver.find_element_by_id('feature-bullets')
            return r.text if r else None
        except es.NoSuchElementException:
            return None

    # 具体细节的获取
    def get_detail(self, link, key):
        """
        id,
        title,
        price,
        description,
        review,
        rate,
        reviews,
        url
        :return: dict or None
        """
        dic = {
            'id': 'N/A',
            'title': 'N/A',
            'price': 0,
            'description': 'N/A',
            'review': 'N/A',
            'rate': 0,
            'reviews': 0,
            'keyword': key,
            'url': link
        }
        sid = self.ireg.findall(link)
        if sid:
            dic['id'] = sid[0]
        else:
            return None
        link = link[0: link.find('/ref')]
        self.driver.get(link)
        time.sleep(random.uniform(0.35, 0.5))
        title = self.get_title()
        if title:
            self.title.append(title)
            dic['title'] = title
        else:
            if self.url_ok:
                self.driver.get(self.url_ok)
                time.sleep(random.uniform(0.25, 0.35))
                self.driver.get(link)
                time.sleep(random.uniform(0.35, 0.5))
                title = self.get_title()
                if title:
                    self.title.append(title)
                    dic['title'] = title
                else:
                    print(link)
                    print(f'{link} get title fail')
                    return None
            else:
                return None
        price = self.get_price()
        if price:
            dic['price'] = price
        else:
            return None
        rate = self.get_rate()
        if rate:
            dic['rate'] = rate
        reviews = self.get_reviews()
        if reviews:
            dic['reviews'] = reviews
        description = self.get_description()
        if description:
            self.description.append(description)
            dic['description'] = description
        rv = self.get_review()
        if rv:
            dic['review'] = rv
            self.review.append(rv)
        self.url_ok = link
        return dic

    # 反馈_统计
    def review_statistics(self):
        reviews = '|'.join(self.review).lower()
        ms = self.sreg.findall(reviews)
        self.statistics_write(ms, 'review')

    # 标题_统计
    def title_statistics(self):
        title = '|'.join(self.title).lower()
        ms = self.sreg.findall(title)
        self.statistics_write(ms, 'title')

    # 描述统计
    def description_statistics(self):
        de = '|'.join(self.description).lower()
        ms = self.sreg.findall(de)
        self.statistics_write(ms, 'description')

    # 概要输出
    def summery_write(self):
        df = pd.DataFrame(self.storage)
        df.to_excel(rf'C:\Users\zxzy\Downloads\{self.sku}.xlsx', sheet_name=f'{self.sku}', index=False)

    def key_value_write(self):
        if self.key_value:
            df = pd.DataFrame(self.key_value)
            df.to_excel(rf'C:\Users\zxzy\Downloads\{self.sku}_keywords.xlsx', sheet_name=f'{self.sku}', index=False)

    @staticmethod
    def statistics_write(ms, name):
        if ms:
            cx = ic(ms)
            df = pd.DataFrame.from_records(list(dict(cx).items()), columns=['word', 'count'])
            file_path = pd.ExcelWriter(rf'C:\Users\zxzy\Downloads\{name}.xlsx')  # 打开excel文件
            df.fillna(' ', inplace=True)
            df.to_excel(file_path, encoding='utf-8', index=False, sheet_name="word_frequency")
            file_path.save()
        else:
            print(f'fail to get statistics result from {name}')


if __name__ == '__main__':
    start = time.time()
    Amazon([
        'women attractive colorblock sweater',
        'women stylish stitching waffle knitwear',
        'women leisure long sleeve sweater',
        'women classic round neck sweater', 'women novelty camo print knitwear'], 'CH0729')
    print(time.time() - start)
