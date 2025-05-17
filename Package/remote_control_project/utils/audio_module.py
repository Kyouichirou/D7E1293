__all__ = ['adjust_volume']

from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
from comtypes import CLSCTX_ALL
from comtypes import CoInitializeEx, CoUninitialize, COINIT_MULTITHREADED
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager


@contextmanager
def com_threadsafe_decorator():
    CoInitializeEx(COINIT_MULTITHREADED)
    try:
        yield
    finally:
        CoUninitialize()


def _thread_target(mode):
    with com_threadsafe_decorator(): return _adjust_volume(mode)


def adjust_volume(mode):
    with ThreadPoolExecutor() as exe:
        exe.submit(_thread_target, mode)


def _adjust_volume(mode: bool):
    # 获取音频设备接口
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = interface.QueryInterface(IAudioEndpointVolume)
    current_volume = volume.GetMasterVolumeLevelScalar()
    new_volume = min(current_volume + 0.1, 1) if mode else max(current_volume - 0.1, 0)
    volume.SetMasterVolumeLevelScalar(new_volume, None)
    print(f"volume has been adjusted：{new_volume * 100}%")


if __name__ == '__main__':
    import sys

    if arg := sys.argv[1]:
        adjust_volume(True)


