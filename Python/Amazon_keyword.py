import requests
import time


def amazon_keyword(key):
    headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://www.amazon.com/',
        'Origin': 'https://www.amazon.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36', }
    params = (
        ('mid', 'ATVPDKIKX0DER'),
        ('alias', 'aps'),
        ('prefix', key),
        ('_', str(int(time.time() * 1000))),)
    response = requests.get('https://completion.amazon.com/api/2017/suggestions', headers=headers, params=params)
    suggestions = response.json()['suggestions']
    for i in suggestions:
        value = i['value']
        print(value)


if __name__ == '__main__':
    amazon_keyword('tops for women')
