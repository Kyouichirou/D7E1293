__all__ = ['convert']

import os
import base64
from io import BytesIO
from PIL import Image
import pyperclip as pc


def copy_data_to_clip(data_text: str):
    pc.copy(data_text)
    pc.paste()


def base64_template(image_base64: str) -> str:
    temp = f'<p><span class="md-image"><img alt="img" src="{image_base64}" referrerpolicy="no-referrer"></span></p>'
    return temp


def compress(file_path: str) -> str:
    with Image.open(file_path) as img:
        """
                Return image as a bytes object.
    
                .. warning::
    
                    This method returns the raw image data from the internal
                    storage.  For compressed image data (e.g. PNG, JPEG) use
                    :meth:`~.save`, with a BytesIO parameter for in-memory
                    data.
    
                :param encoder_name: What encoder to use.  The default is to
                                     use the standard "raw" encoder.
                :param args: Extra arguments to the encoder.
                :returns: A :py:class:`bytes` object.
        """

        x, y = img.size
        im_file = BytesIO()
        # 如果文件小于10k, 则设置75
        c_ratio = 0 if os.path.getsize(file_path) > 10 * 1024 else 75
        if x > 1440:
            img_resized = img.resize((1440, int(y * 1440 / x)))
            img_resized.save(im_file, format='webp', quality=c_ratio if c_ratio > 0 else 30)
        else:
            # 必须执行这步操作
            img.save(im_file, format='webp', quality=c_ratio if c_ratio > 0 else 40)

        im_bytes = im_file.getvalue()
        pre_fix = f'data:image/webp;base64,'
        return base64_template(pre_fix + base64.b64encode(im_bytes).decode('utf8'))



def convert(file_path: str):
    copy_data_to_clip(compress(file_path))
