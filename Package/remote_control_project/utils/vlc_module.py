from .handle_vlc_xml import convert_xml_to_json
import requests

HOST_ADDRESS = '192.168.2.108'
PORT = '8080'
PROTOL = 'http'

cookies = {
    'ajs_anonymous_id': 'd368a63f-69e0-46b2-9c3b-e5b458e937d5',
}

headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,'
              'application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Authorization': 'Basic OjEyMw==',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 '
                  'Safari/537.36 Edg/136.0.0.0',
    'client-ip': '218.57.191.139',
    'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'via': '218.57.191.139',
    'x-forwarded-for': '218.57.191.139',
}


def _combine_url(
        suffix: str) -> str: return f'{PROTOL}://{HOST_ADDRESS}:{PORT}/requests/status.xml?command={suffix}'


def _get_request(url: str) -> dict | None:
    r = requests.get(url, headers=headers, verify=False)
    return r.content if r.status_code == 200 else print(f'get: {r.status_code}')


def pause_play(): return _get_request(_combine_url('pl_pause'))


def prev(): return _get_request(_combine_url('pl_previous'))


def next_p(): return _get_request(_combine_url('pl_next'))


def adjust_volume(mode: bool):
    # 0 - 256
    if info := get_player_info():
        v = info['volume']
        x = min(v + 26, 256) if mode else max(v - 26, 0)
        return _get_request(_combine_url(f'volume&val={str(x)}'))
    print('fail to get the info of player')


def get_player_info() -> dict | None:
    return convert_xml_to_json(c) if (c := _get_request(_combine_url(''))) else None


def _action(action: str):
    action_map = {
        ('pause', '暂停', 'stop', '停止', '播放', 'play'): pause_play,
        ('音量', 'volume', '大', '小'): adjust_volume,
        ('下一', 'next'): next
    }

    for keys, func in action_map.items():
        if any(keyword in action for keyword in keys):
            return func(
                any(keyword in action for keyword in ('音量', 'volume', '调大'))) if func == adjust_volume else func()
    print("invalid arg input")


if __name__ == '__main__':
    import sys

    _action(arg) if (arg := sys.argv[1]) else print("no arg")
