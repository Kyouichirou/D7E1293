__all__ = ['Network']

import json
import time
from . import log_module

# 断开网络连接以获取新的网络ip, 假如重新连接后ip相同则多次尝试

logger = log_module.Logs()


class Network:
    def __init__(self, session, pw='Sherlock1992'):
        self.__pw = pw
        self.__session = session

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.__session.close()
        self.__session = None
        self.__pw = None

    def __encrypt(self):
        consta = 'RDpbLfCPsJZ7fiv'
        constb = 'yLwVl0zKqws7LgKPRQ84Mdt708T1qQ3Ha7xv3H7NyU84p21BriUWBU43odz3iP4rBL3cD02KZciXTysVXiV8ngg6vL48rPJyAUw0HurW20xqxv9aYb4M9wK1Ae0wlro510qXeU07kV57fQMc8L6aLgMLwygtc0F10a0Dg70TOoouyFhdysuRMO51yY5ZlOZZLEal1h0t9YQW0Ko7oBwmCAHoic4HYbUyVeU3sfQ1xtXcPcf1aT303wAQhv66qzW'
        password = ''
        g = len(consta) - 1
        h = len(self.__pw) - 1
        k = len(constb)
        f = g if g > h else h
        for p in range(f):
            n = l = 187
            if p > g:
                n = ord(self.__pw[p])
            else:
                l = ord(consta[p])
                if p <= h:
                    n = ord(self.__pw[p])
            password += constb[(l ^ n) % k]
        return password

    @logger.decorator('get_json')
    def __get_json(self, url, data):
        headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Content-Type': 'application/json; charset=UTF-8',
            'DNT': '1',
            'Host': '192.168.2.1',
            'Origin': 'http://192.168.2.1',
            'Referer': 'http://192.168.2.1/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
        }
        r = self.__session.post(url, headers=headers, data=data, timeout=(93, 93))
        code = r.status_code
        if code == 200:
            return json.loads(r.text)
        else:
            print('fail to get json')
            return None

    def __login(self):
        url = 'http://192.168.2.1/'
        data = '{"method": "do", "login": {"password": "' + self.__encrypt() + '"}}'
        j = self.__get_json(url, data)
        if j:
            if 'stok' in j:
                print('successfully login router')
                return j['stok']
        else:
            print('failed to login router')
        return None

    @staticmethod
    def __waiting_show(counter):
        for i in range(counter):
            s = ' :' + ">" * (int(i / 3) + 1)
            print(s, end='')
            for ch in ['-', '\\', '|', '/']:
                print('\b' * (len(s) * 2) + ch, end='', flush=True)
                time.sleep(0.15)
        print('\nchecking new ip address')

    def reconnect(self):
        parameter = self.__login()
        if parameter:
            cip = self.__get_current_ip(parameter)
            if cip:
                logger.info(f'reconnect router: {cip}')
                timeas = timebs = 0
                while True:
                    # 等待路由器自动重新连接
                    r = self.__disconnect(parameter)
                    print('waiting the router to reconnect the network...')
                    self.__waiting_show(101)
                    if r:
                        nip = self.__get_current_ip(parameter)
                        while not nip and timebs < 2:
                            time.sleep(33)
                            nip = self.__get_current_ip(parameter)
                            timebs += 1
                        if nip:
                            if nip != cip:
                                print(f'switch to new ip: {nip}')
                                return True
                            print(f'try {timeas + 1} times of reconnection and ip address has not changed')
                    if timeas > 2:
                        break
                    timeas += 1
                    timebs = 0
        return False

    @logger.decorator('disconnect')
    def __disconnect(self, parameter):
        print('trying to disconnect the network...')
        data = '{"network":{"change_wan_status":{"proto":"pppoe","operate":"disconnect"}},"method":"do"}'
        url = f'http://192.168.2.1/stok={parameter}/ds'
        j = self.__get_json(url, data)
        return j['error_code'] + 1 if j and 'error_code' in j else 0

    @logger.decorator('get_current_ip')
    def __get_current_ip(self, parameter):
        print('get current ip address')
        data = '{"network": {"name": ["wan_status"]}, "method": "get"}'
        url = f'http://192.168.2.1/stok={parameter}/ds'
        j = self.__get_json(url, data)
        return j['network']['wan_status']['ipaddr'] if j else None


if __name__ == '__main__':
    import requests
    import win32com.client as wincl

    with Network(requests.session()) as net:
        speak = wincl.Dispatch("SAPI.SpVoice")
        speak.Speak(
            'congratulation, successfully reconnect the net work' if net.reconnect() else 'so sorry, failed to reset the network')
