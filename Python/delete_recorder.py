import os, hashlib, sys

"""
@name: delete_recorder
@author: HLA
@description:
删除文件的同时, 留下记录
"""

class RemoveRecord:
    def __init__(self, path):
        self.__path = path
        if self.__check_file_open_status:
            return
        self.__bin = r'D:\Delete_Record'
        bn = os.path.basename(path)
        k = bn.rfind('.')
        en = bn[k + 1:]
        nn = bn[0: k] + '(' + en + ')'
        if self.__get_size < 1024 * 1024 * 96:
            md5 = self.__get_md5
            x = self.__check_md5(md5)
            if not x:
                self.__create_record(md5 + '_' + nn)
        else:
            if not self.__check_name(nn):
                self.__create_record(nn)
        self.__remove()

    def __remove(self):
        os.remove(self.__path)

    @property
    def __check_file_open_status(self):
        try:
            with open(self.__path, mode="ab"):
                return False
        except Exception as e:
            return "[Errno 13] Permission denied" in str(e)

    @property
    def __get_size(self):
        return os.path.getsize(self.__path)

    def __create_record(self, name):
        with open(self.__bin + "\\" + name + '.txt', mode='w', encoding='utf-8'):
            pass

    @property
    def __file_list(self):
        return os.listdir(self.__bin)

    def __check_name(self, name):
        slist = self.__file_list
        return any(name == e[e.find("_") + 1: e.rfind('.')] for e in slist)

    def __check_md5(self, shash):
        slist = self.__file_list
        return any(shash in e for e in slist)

    @property
    def __get_md5(self):
        md5 = hashlib.md5()
        buffer = 512 * 1024
        with open(self.__path, mode='rb') as f:
            while d := f.read(buffer):
                md5.update(d)
        return md5.hexdigest()


if __name__ == '__main__':
    RemoveRecord(sys.argv[1])
