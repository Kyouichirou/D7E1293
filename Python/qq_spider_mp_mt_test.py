from bs4 import BeautifulSoup as bFs
import requests, time
from multiprocessing import Pool, cpu_count
import aiohttp, asyncio
from concurrent.futures import ProcessPoolExecutor as pPe
import concurrent.futures as cf
import random_ua
import threading

def get_dom(url):
    headers = {
        'Connection': 'keep-alive',
        'DNT': '1',
        'User-Agent': random_ua.rdua(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        "Accept - Encoding": "gzip, deflate, br",
        "Referer": 'https://www.qq.com'
    }
    try:
        r = requests.get(url, headers=headers, timeout=(8, 8))
        return bFs(r.content.decode('gbk'), 'html.parser') if r.status_code == 200 else None
    except requests.Timeout:
        print('timeout: ', url)
        return None


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


def multi_core_pool():
    arr = get_list()
    with pPe() as pool:
        mp = pool.map(get_content, arr)
    with open(r'C:\Users\Lian\Desktop\test_news.txt', mode='w', encoding='utf-8') as f:
        for m in mp:
            f.writelines(m + '\n')


def multi_thread_pool():
    arr = get_list()
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        mp = [pool.submit(get_content, url) for url in arr]
        with open(r'C:\Users\Lian\Desktop\test_news.txt', mode='w', encoding='utf-8') as f:
            for m in cf.as_completed(mp):
                    f.writelines(m.result() + '\n')


def multi_thread():
    arr = get_list()
    mp = [threading.Thread(get_content,args=(url,)) for url in arr]
    for m in mp:
        m.start()
    for m in mp:
        m.join()

async def async_craw(url, f):
    timeout = aiohttp.ClientTimeout(total=8)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as resp:
            if resp.status == 200:
                result = await resp.text(encoding='gbk')
                dom = bFs(result, 'html.parser')
                c = dom.find('div', class_='content-article')
                if c:
                    f.writelines(c.text.strip() + '\n')


def start_async():
    arr = get_list()
    f = open(r'C:\Users\Lian\Desktop\test_news.txt', mode='w', encoding='utf-8')
    loop = asyncio.get_event_loop()
    tasks = [
        loop.create_task(async_craw(url, f))
        for url in arr]
    loop.run_until_complete(asyncio.wait(tasks))
    f.close()


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
    start_async()
    print(time.time() - start)
