import requests as req
from fake_useragent import UserAgent as ua
from bs4 import BeautifulSoup as bs
import re
import os
import time


def write_txt(arr, path, index):
    filename = path + '\\' + index + '.txt'
    f = open(filename, mode='w', encoding='utf-8')
    f.write("第 " + index + ' 部分' + "\n\n")
    f.write(''.join(arr))
    f.close()


def merger_txt(path, name, menus):
    slist = os.listdir(path)
    slist.sort(key=lambda x: int(x[:-4]))
    f = open(path + "\\" + name + '.txt', mode='w', encoding='utf-8')
    f.write(''.join(menus))
    for sf in slist:
        tp = path + "\\" + sf
        tmp = open(tp, encoding='utf-8', mode='r')
        for line in tmp:
            f.writelines(line)
        tmp.close()
        os.remove(tp)
        f.write("\n\n")
    f.close()


def create_folder(name):
    name = re.sub(r'[\*\|\?\.<>/:"]', '', name)
    downloads = os.path.join(os.path.expanduser("~"), 'Downloads')
    path = rf'{downloads}\{name}'
    if not os.path.exists(path):
        os.mkdir(path)
    return path


def get_content(url, path, index):
    dom = get_dom(url)
    if not dom:
        print('failed to download: ' + index)
        return None
    tmp = dom.find_all('meta')
    meta = tmp[4].attrs['content']
    code = base64(meta)
    arr = re_sort(dom, code)
    write_txt(arr, path, index)


def get_start(chs):
    i = 0
    k = 0
    for c in chs:
        name = c.name
        if name == 'h2':
            k = i + 1
        elif name == 'div':
            if 'class' in c.attrs:
                if not 'chapter' in c.attrs['class']:
                    break
            else:
                break
        i += 1
    return k


def re_sort(dom, code):
    """
    注意chs, 可迭代对象, 在使用后指针会发生移动, 不能直接使用可迭代对象
    :param dom: html dom
    :param code: string
    :return: array
    """
    tcode = re.split(r'[A-Z]+%', code)
    chs = dom.find('div', id="content").children
    clist = list(chs)
    istart = get_start(clist)
    lt = len(tcode)
    arr = lt * [None]
    i = 0
    j = 0
    for t in tcode:
        m = int(t)
        if m < 3:
            arr[m] = clist[i + istart]
            j += 1
        else:
            arr[m - j] = clist[i + istart]
            j += 2
        i += 1

    tmp = []
    for a in arr:
        if a.name == 'div':
            cs = a.children
            text = ''
            for c in cs:
                sp = type(c).__name__
                if sp == "NavigableString":
                    text += c.string
                elif sp == "Tag":
                    cname = c.name
                    if cname == 'span' and 'data-note' in c.attrs:
                        text += ('[备注: ' + c.attrs['data-note'] + ']')
                    elif cname == 'strong' or cname == 'small' or cname == 'h3':
                        text += c.text
            if text:
                tmp.append(text + '\n')
            else:
                tmp.append("")
    return tmp


def base64(meta):
    map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    d = ''
    prefix = {
        1: "00000",
        2: "0000",
        3: "000",
        4: "00",
        5: "0",
        6: "",
    }
    '''
    bin()函数生成的二进制字符串包含表示二进制的 0b开头的字符串
    '''
    for e in meta:
        if e == "=":
            break
        else:
            i = map.index(e)
            s = format(i, 'b')
            d = d + prefix[len(s)] + s
    '''
    match函数和js中的不一样, 不是多次匹配
    '''
    ms = re.findall("[0-1]{8}", d)
    result = ''
    for m in ms:
        result += chr(int(m, base=2))

    return result


def get_dom(url):
    headers = {
        "User-Agent": ua().random,
        "Host": "www.99csw.com",
        "Accept-Encoding": "gzip, deflate",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
    }
    response = req.get(url, headers=headers)
    if response.status_code != 200:
        print('failed to get menus')
        return None
    html = response.content.decode("utf-8")
    dom = bs(html, "html.parser")
    return dom


def get_menus(url):
    dom = get_dom(url)
    if not dom:
        return None
    title = dom.find('h2').text
    path = create_folder(title)
    menus = dom.find('dl', id="dir")
    alist = menus.find_all("a")
    i = 1
    marr = []
    marr.append(title + "\n\n")
    marr.append('目录' + '\n')
    for a in alist:
        if 'href' in a.attrs:
            s = str(i)
            marr.append("第 " + s + ' 部分' + '\n')
            get_content('http://www.99csw.com/' + a.attrs['href'], path, s)
            i += 1
    marr.append('目录' + "\n\n")
    merger_txt(path, title, marr)


def main():
    url = 'http://www.99csw.com/book/10478/index.htm'
    get_menus(url)


if __name__ == '__main__':
    start = time.perf_counter()
    main()
    print(f'running time: {time.perf_counter() - start} seconds')
