# Recognize image file formats based on their first few bytes.
__all__ = ["what"]

from os import PathLike, path

# 装饰器, 将需要执行的func标记为True, 集中批量执行一个class中被标记的func
def wrap_method(func):
    func._add_mark = True
    return func


def call_all_class_methods(c):
    # dir, 如果没有实参，则返回当前本地作用域中的名称列表。如果有实参，它会尝试返回该对象的有效属性列表。
    # getattr, 返回对象命名属性的值。name 必须是字符串。如果该字符串是对象的属性之一，则返回该属性的值。
    # 例如， getattr(x, 'foobar') 等同于 x.foobar。如果指定的属性不存在，且提供了 default 值，则返回它，否则触发 AttributeError。
    # callable, 如果参数 object 是可调用的就返回 True，否则返回 False。
    # 如果返回 True，调用仍可能失败，但如果返回 False，则调用 object 将肯定不会成功。
    # 请注意类是可调用的（调用类将返回一个新的实例）；如果实例所属的类有 __call__() 则它就是可调用的。
    for name in dir(c):
        func = getattr(c, name, None)
        if func and callable(func) and getattr(func, "_add_mark", False):
            if result := func():
                return result
    return None


class TypeImg:
    def __init__(self, data):
        self.data = data

    @wrap_method
    def test_jpeg(self):
        """JPEG data in JFIF or Exif format"""
        if self.data[6:10] in (b'JFIF', b'Exif'):
            return 'jpeg'

    @wrap_method
    def test_png(self):
        if self.data.startswith(b'\211PNG\r\n\032\n'):
            return 'png'

    @wrap_method
    def test_gif(self):
        """GIF ('87 and '89 variants)"""
        if self.data[:6] in (b'GIF87a', b'GIF89a'):
            return 'gif'

    @wrap_method
    def test_tiff(self):
        """TIFF (can be in Motorola or Intel byte order)"""
        if self.data[:2] in (b'MM', b'II'):
            return 'tiff'

    @wrap_method
    def test_rgb(self):
        """SGI image library"""
        if self.data.startswith(b'\001\332'):
            return 'rgb'

    @wrap_method
    def test_pbm(self):
        """PBM (portable bitmap)"""
        if len(self.data) > 2 and \
                self.data[0] == ord(b'P') and self.data[1] in b'14' and self.data[2] in b' \t\n\r':
            return 'pbm'

    @wrap_method
    def test_pgm(self):
        """PGM (portable graymap)"""
        if len(self.data) > 2 and \
                self.data[0] == ord(b'P') and self.data[1] in b'25' and self.data[2] in b' \t\n\r':
            return 'pgm'

    @wrap_method
    def test_ppm(self):
        """PPM (portable pixmap)"""
        if len(self.data) > 2 and \
                self.data[0] == ord(b'P') and self.data[1] in b'36' and self.data[2] in b' \t\n\r':
            return 'ppm'

    @wrap_method
    def test_rast(self):
        """Sun raster file"""
        if self.data.startswith(b'\x59\xA6\x6A\x95'):
            return 'rast'

    @wrap_method
    def test_xbm(self):
        """X bitmap (X10 or X11)"""
        if self.data.startswith(b'#define '):
            return 'xbm'

    @wrap_method
    def test_bmp(self):
        if self.data.startswith(b'BM'):
            return 'bmp'

    @wrap_method
    def test_webp(self):
        if self.data.startswith(b'RIFF') and self.data[8:12] == b'WEBP':
            return 'webp'

    @wrap_method
    def test_exr(self):
        if self.data.startswith(b'\x76\x2f\x31\x01'):
            return 'exr'


def what(filepath, byte=None):
    try:
        if byte is None:
            if isinstance(filepath, (str, PathLike)):
                if not path.exists(filepath):
                    print('file does not exist')
                    return None
                with open(filepath, 'rb') as f:
                    byte = f.read(32)
            else:
                location = filepath.tell()
                byte = filepath.read(32)
                filepath.seek(location)
        if byte:
            if type(byte).__name__ != 'bytes':
                raise TypeError('the parameter of "byte" must be bytes')
            tm = TypeImg(byte)
            return call_all_class_methods(tm)
    except Exception as error:
        print(error)
    return None
