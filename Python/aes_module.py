__all__ = ['aes_encrypt']

import base64
from hashlib import md5
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

'''
key: 标准长度
'''


def aes_encrypt(content: str, key):
    s_content = md5(content.encode('utf-8')).hexdigest().upper()
    p = pad(s_content.encode('utf-8'), AES.block_size, style='pkcs7')
    aes = AES.new(key.encode('utf-8'), AES.MODE_ECB)
    ec = aes.encrypt(p)
    bc = base64.b64encode(ec)
    return bc.decode('utf-8')


if __name__ == '__main__':
    print(aes_encrypt('hello, world', 'abcd' * 4))
