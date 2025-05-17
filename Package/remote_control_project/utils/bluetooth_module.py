import requests
import base64


def str_base64(text: str): return base64.b64encode(text.encode('utf-8')).decode('utf-8')


def _send_request(s_type: str, device_id: str):
    host_address = '192.168.2.108'
    port = 50080
    cookies = {'CSRF-Token': '60nX2ZHVkO0WAdtzGg0e+ISl1GMiVwFd'}
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,'
                  'application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Basic YWxleDoxMjM=',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                      'Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
    }
    params = {'deviceId': str_base64(device_id)}
    response = requests.post(
        f'http://{host_address}:{port}/api/bt/{s_type}',
        params=params,
        cookies=cookies,
        headers=headers,
        verify=False,
    )
    print('bluetooth request code: ' + str(response.status_code))


def disconnect(device_id: str): _send_request('disconnectdevice', device_id)


def connect(device_id: str): _send_request('connectdevice', device_id)


if __name__ == '__main__':
    disconnect('*')
