from bs4 import BeautifulSoup as bFs
import requests, time
from multiprocessing import Pool, cpu_count


def get_dom(url):
    headers = {
        'Connection': 'keep-alive',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.88 Safari/537.36',
        'Sec-Fetch-Dest': 'document',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    r = requests.get(url, headers=headers, timeout=(8, 8))
    return bFs(r.content.decode('gbk'), 'html.parser') if r.status_code == 200 else None


def get_content(url):
    d = get_dom(url)
    if not d:
        return ''
    content = d.find('div', class_='content-article')
    return content.text.strip() if content else ''


def get_list():
    d = get_dom('https://www.qq.com/')
    if not d:
        return None
    """
    qq.com页面采用异步加载数据
    """
    c = d.find('div', class_='layout qq-main cf')
    if not c:
        print('fail')
        return
    links = c.find_all('a')
    arr = []
    for a in links:
        if 'href' in a.attrs:
            href = a.attrs['href']
            if href.startswith('https://new.qq') and href.endswith('.html'):
                arr.append(href)
    return arr


def multi_core():
    arr = get_list()
    if not arr:
        print('fail')
        return
    p = Pool(cpu_count())
    mp = p.map_async(get_content, arr)
    p.close()
    p.join()
    with open(r'C:\Users\Lian\Desktop\test_news.txt', mode='w', encoding='utf-8') as f:
        for m in mp.get():
            f.writelines(m + '\n')


def normal():
    arr = get_list()
    if not arr:
        print('fail')
        return
    with open(r'C:\Users\Lian\Desktop\test_news.txt', mode='w', encoding='utf-8') as f:
        for e in arr:
            c = get_content(e)
            if c:
                f.writelines(c + '\n')


if __name__ == '__main__':
    start = time.time()
    normal()
    print(time.time() - start)
