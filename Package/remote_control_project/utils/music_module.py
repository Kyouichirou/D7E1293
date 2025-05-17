import requests
import json

HOST_ADDRESS = '192.168.2.108'
PORT = '8009'
PROTOL = 'http'

headers = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'http://192.168.2.108:9527',
    'Referer': 'http://192.168.2.108:9527/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5836.225 '
                  'Safari/537.36 OPR/100.0.4744.188',
}


def _combine_url(
        suffix: str) -> str: return f'{PROTOL}://{HOST_ADDRESS}:{PORT}/api/player{("/" + suffix) if suffix else ""}'


def _post_request(url: str, data: dict | str = None) -> bool | None:
    r = requests.post(url, data=data, headers=headers, verify=False)
    return True if r.status_code == 204 else print(f'{url}: {r.status_code}')


def _get_request(url: str) -> dict | None:
    r = requests.get(url, headers=headers, verify=False)
    return r.json() if r.status_code == 200 else print(f'get: {r.status_code}')


def pause(): return _post_request(_combine_url('pause/toggle'))


def play(): return _post_request(_combine_url('play'))


def stop(): return _post_request(_combine_url('stop'))


def next_p(): return _post_request(_combine_url('next'))


def adjust_volume(mode: bool) -> bool:
    if info := get_player_info():
        v = info['player']['volume']['value']
        a = 15 if v < -30 else 10 if v < -25 else 5 if v < -3 else 1 if v < 0 else 0.5
        x = min(v + a, 0) if mode else max(v - a, -100)
        return _post_request(_combine_url(''), data=json.dumps({'volume': x}))
    print('fail to get the info of player')


def get_player_info() -> dict: return _get_request(_combine_url(''))


def _action(action: str):
    action_map = {
        ('pause', '暂停', 'stop', '停止'): pause,
        ('播放', 'play'): play,
        ('音量', 'volume', '大', '小'): adjust_volume,
        ('下一', 'next'): next_p
    }

    for keys, func in action_map.items():
        if any(keyword in action for keyword in keys):
            return func(
                any(keyword in action for keyword in ('音量', 'volume', '调大'))) if func == adjust_volume else func()
    print("invalid arg input")


if __name__ == '__main__':
    import sys

    _action(arg) if (arg := sys.argv[1]) else print("no arg")
