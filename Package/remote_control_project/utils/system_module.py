import os


def adjust_power_module(mode: str):
    p_dict = {
        'balance': '381b4222-f694-41f0-9685-ff5bb260df2e',
        'performance': '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
        'energy': 'a1841308-3541-4fab-bc81-f71556f20b4a'
    }
    os.system(f"powercfg /{p_dict[mode]}")
