import os
import inspect
from . import constants
import win32com.client as wincl
from . import log_module

__logger = log_module.Logs()


def notification_voice(contents):
    # text => speak
    speak = wincl.Dispatch("SAPI.SpVoice")
    speak.Speak(contents)


@__logger.decorator('get_ip')
def get_ip(session, ua):
    r = session.get('https://api.ipify.org/?format=json', headers={'User-Agent': ua},
                    timeout=(10, 10))
    code = r.status_code
    if code == 200:
        text = r.text
        if text:
            j = r.json()
            return j['ip'] if 'ip' in j else ''
    return ''


def get_function_name():
    # 获取当前运行函数的名称, 注意名称和dir列出的名称有所差异
    return inspect.stack()[1][3]


def check_proc_exist(process_name):
    # 检测程序是否在运行
    wmi = wincl.GetObject('winmgmts:')
    pid = wmi.ExecQuery('select * from Win32_Process where name=\"%s\"' % process_name)
    return len(pid) > 0


def write_error(arr):
    error_file = constants.Error_File
    if arr:
        with open(error_file, mode='w', encoding='utf-8') as f:
            f.write('\n'.join(arr))
    elif os.path.exists(error_file):
        os.remove(error_file)


def load_error_file():
    error_file = constants.Error_File
    if os.path.exists(error_file):
        with open(error_file, mode='r', encoding='utf-8') as f:
            return [e.strip() for e in f.readlines()]
    return []
