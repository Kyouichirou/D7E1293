import wmi
from concurrent.futures import ThreadPoolExecutor
import pythoncom
from contextlib import contextmanager


def _format_device_id(device_id):
    id_str = device_id[-12:]
    return ':'.join(id_str[i:i + 2] for i in range(0, len(id_str), 2)).lower()


def _get_mac_address(w):
    for s in w.Win32_NetworkAdapter():
        if s.Name.startswith('Bluetooth Device') and s.MACAddress and s.PhysicalAdapter:
            return s.MACAddress.lower()


def _device_info() -> dict | None:
    w = wmi.WMI()
    if m := _get_mac_address(w):
        bluetooth_devices = w.Win32_PnPEntity(ClassGuid='{e0cbf06c-cd8b-4647-bb8a-263b43f0f974}')
        device_obj = {}
        for device in bluetooth_devices:
            name, device_id = device.Name, device.DeviceID
            if 'Transport' not in name and '&BLUETOOTHDEVICE_' in device_id:
                device_obj[name] = 'Bluetooth#Bluetooth' + m + '-' + _format_device_id(device_id)
        return device_obj


# 多线程使用pythoncom, 必须这样调用, 否则很容易导致内存泄漏
@contextmanager
def com_thread_decorator():
    pythoncom.CoInitializeEx(pythoncom.COINIT_MULTITHREADED)
    try:
        yield
    finally:
        pythoncom.CoUninitialize()


def _thread_target():
    with com_thread_decorator(): return _device_info()


def get_device_info():
    with ThreadPoolExecutor() as exe:
        f = exe.submit(_thread_target)
        return f.result()


if __name__ == '__main__':
    with com_thread_decorator():
        print(get_device_info())
