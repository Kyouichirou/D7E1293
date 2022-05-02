# 音频文件信息提取和数据标准化

1. 将文件的信息进行统一整理, 繁体 => 简体; 英文大写 => 小写
2. 提取文件的元数据

## 调用方法
```python
from audio_pack import start

# 支持格式: file_filters = ('.mp3', '.wav', '.flac', '.ape', '.m4a')

if __name__ == '__main__':
    start(r'你的音频文件夹所在路径')
```