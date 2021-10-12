__all__ = ['convertor']

from PIL import Image
import os
from PIL import features
from check_img_format import what


def split_filepath(filepth):
    return os.path.splitext(filepth)


def check():
    return features.check_module('webp')


def convertor(filepath, extension=".jpg", isdelet=False, quality=95, mode=False):
    # required for png.split()
    # 255,255,255, RGB, 白色
    # rgba和rgb的区别, a为透明度
    try:
        file, suffix = split_filepath(filepath)
        save_path = file + extension
        if os.path.exists(save_path):
            return 'file has already existed'
        if (suffix.lower() == '.webp' or (mode and what(filepath) == 'webp')) and not check():
            return 'your python doest not support webp format'
        with Image.open(filepath) as im:
            if im.mode == "RGBA":
                im.load()
                background = Image.new("RGB", im.size, (255, 255, 255))
                background.paste(im, mask=im.split()[3])
            im.save(save_path, None, quality=quality)
            if isdelet:
                os.remove(filepath)
            return True
    except Exception as error:
        print(error)
        return None
