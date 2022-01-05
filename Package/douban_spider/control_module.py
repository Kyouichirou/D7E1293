__all__ = ['Control']

import time
import msvcrt
import threading
from . import router_module
from . import other_module as om


# 控制, 暂停, 退出; 网络链接控制

class Control:
    def __init__(self):
        self.key_press = False
        self.reset_flag = False
        self.exit_flag = False
        self.is_cancel = False
        self.network_reset = False
        self.is_waiting = False
        self.__router = None
        self.spider, self.crawler = None, None

    def __reconnect_excute(self, session):
        with router_module.Network(session) as net:
            self.__router = net
            return net.reconnect()

    @property
    def __check_process(self):
        # 假如某些程序处于运行状态则不自动重新连接网络
        # any函数会自动处理返回的值, 假如其中函数的返回值为True, 则会自动退出
        return any(om.check_proc_exist(e) for e in ['javaw.exe', 'qbittorrent.exe'])

    # 需要修改
    def reconnect(self, session):
        self.network_reset = True
        self.reset_flag = False
        print('press "y" to reconnect the router and "n" to cancel the reconnection(default)')
        counter, wait_time = (150, 90) if self.__check_process else (100, 60)
        om.notification_voice(
            f'warning, your sipder has been found. Now, I need reset the rounter, you can cancel the operation within {wait_time} seconds')
        self.waiting_show(counter)
        if self.exit_flag or self.is_cancel:
            return False
        if self.reset_flag is not True and not self.key_press and counter == 100:
            self.reset_flag = True
            print('automatically reconnect the router...')
        self.network_reset = False
        return self.__reconnect_excute(session) if self.reset_flag else False

    def waiting_show(self, counter: int):
        i = 0
        for i in range(counter):
            if self.key_press:
                break
            s = ' :' + ">" * (int(i / 4) + 1)
            print(s, end='')
            for c in ['-', '\\', '|', '/']:
                if self.key_press:
                    break
                print('\b' * (len(s) * 2) + c, end='', flush=True)
                time.sleep(0.15)
        if self.is_cancel or self.exit_flag:
            return
        print(f'\n{"timeout" if i == counter - 1 else "......"}')
        self.key_press = False
        if self.is_waiting:
            self.spider.is_waiting = False
            self.is_waiting = False

    def __key_contrl(self):
        # keypress "q" to exit the progress
        # keypress "y", "n" to reset network
        # pause => pause, s => start
        # 设置独立的线程监听输入内容(在cmd/Powershell上可用, IDE不可用, Windows可用(msvcrt))用于退出程序
        # 注意线程安全, 必要时需要设置线程锁
        while True:
            k = ord(msvcrt.getch())
            if self.network_reset:
                if k == 121 or k == 89:
                    # y,  yes, reconnect
                    print('\nwaiting, your router will been reconnect within senconds')
                    self.reset_flag = True
                    self.key_press = True
                elif k == 78 or k == 110:
                    # no, cancel connect
                    print('\nyou have canceled the reconnection of router')
                    self.is_cancel = True
                    self.reset_flag = False
                    self.key_press = True
                    break
            else:
                if k == 113 or k == 81:
                    # q, exit
                    if self.spider.is_protect:
                        print('wait a few minutes before pressing stop')
                    else:
                        if self.is_waiting:
                            self.spider.is_waiting = False
                        if self.__router:
                            self.__router.is_concel = True
                        print('your task is being canceled and waiting seconds...')
                        self.exit_flag = True
                        self.spider.is_break = True
                        self.crawler.is_break = True
                        self.key_press = True
                        break
                elif k == 80 or k == 112:
                    # p, pause
                    if not self.is_waiting:
                        self.is_waiting = True
                        self.spider.is_waiting = True
                elif k == 83 or k == 115:
                    # s, start
                    if self.is_waiting:
                        self.spider.is_waiting = False
                        self.key_press = True
                elif k == 61:
                    self.__control_speed(True)
                elif k == 45:
                    self.__control_speed(False)

    def __control_speed(self, mode: bool):
        sp = self.spider.speed_ratio
        sp += 0.05 if mode else -0.05
        if sp < 0.1:
            if not mode:
                cp = self.crawler.speed_ratio - 0.04
                if cp > 0.3:
                    self.crawler.speed_ratio = cp
                    self.crawler.is_hand_speed = True
                    print(f'crawler speed ratio: {cp}')
                else:
                    print('speed of slow has reached the limit')
        else:
            if sp < 1.1:
                self.spider.speed_ratio = sp
                print(f'spider speed ratio: {sp}')
            elif mode:
                cp = self.crawler.speed_ratio + 0.08
                self.crawler.speed_ratio = cp
                self.crawler.is_hand_speed = False
                print(f'crawler speed ratio: {cp}')

    def start_key_event(self):
        th = threading.Thread(target=self.__key_contrl)
        # 设置线程守护, 当主线程退出时, 结束掉子线程, 需要在start前设置
        th.daemon = True
        th.start()
        print('keyress: q => exit; p => pause, s => start')
