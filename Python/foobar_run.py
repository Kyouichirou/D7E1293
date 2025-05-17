import subprocess
import psutil
import time
import winreg
import os


# 无法准确获取修改盘位的路径, os.environ['USERPROFILE'] + '\\Desktop'
def _get_desktop_path() -> str:
    try:
        # 打开注册表中用户Shell文件夹的键
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r'Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders') as key:
            # 读取Desktop键的值
            desktop_dir, _ = winreg.QueryValueEx(key, 'Desktop')
            # 展开可能存在的环境变量（如%USERPROFILE%）
            expanded_dir = os.path.expandvars(desktop_dir)
            return expanded_dir
    except FileNotFoundError:
        return os.environ['USERPROFILE'] + '\\Desktop'


def _writ_log_to_desktop(content):
    log_file = rf"{_get_desktop_path()}\{str(int(time.time() * 1000)).zfill(13)}_log.txt"
    with open(log_file, encoding='utf-8', mode='w') as f:
        f.write(content)


def check_port_usage(port):
    connections = psutil.net_connections(kind='inet')
    for conn in connections:
        if conn.laddr.port == port:
            process = psutil.Process(conn.pid)
            _writ_log_to_desktop(f"Port {port} is in use by process {process.name()} (PID: {process.pid})")
            return True


def run_foobar():
    if not check_port_usage(8009):
        f_path = r"C:\Program Files\foobar2000\foobar2000.exe"
        try:
            subprocess.Popen([f_path])
        except Exception as e:
            print(f"fail to run foobar2000: {e}")


if __name__ == "__main__":
    run_foobar()
