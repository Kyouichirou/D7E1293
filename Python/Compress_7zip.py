import sys
import os
import hashlib


def get_password(name):
    md = hashlib.md5()
    md.update(name.encode('utf-8'))
    return md.hexdigest()


def init(path):
    """
    a, 添加到压缩
    -t, 设置压缩包格式
    -p, 设置密码
    -os.system()在执行cmd时, 不清楚其输入格式要求
    配合菜单右键使用, 方便加密压缩指定的文件
    """
    exepath = r"C:\Program Files\7-Zip\7z.exe"
    if not os.path.exists(exepath):
        print('please setup 7ip path')
    else:
        istart = path.rfind('\\') + 1
        iend = path.rfind('.')
        name = path[istart: iend]
        fppath = path[0:istart]
        cmd = '"' + exepath + '"' + " a " + '-t7z ' + "-p" + get_password(
            name) + " " + '"' + fppath + "c_" + name + '.7z' + '"' + " " + '"' + path + '"'
        os.popen(cmd)


if __name__ == '__main__':
    init(sys.argv[1])
