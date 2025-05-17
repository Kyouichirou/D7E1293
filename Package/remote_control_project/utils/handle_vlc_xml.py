__all__ = ['convert_xml_to_json']

import xml.etree.ElementTree as ET


def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False


def is_boolean(s): return s.lower() in ['true', 'false']


def convert_value(value):
    if value is None or value.strip() == '':
        return ''
    elif is_boolean(value):
        return value.lower() == 'true'
    elif is_number(value):
        num = float(value)
        return int(num) if num.is_integer() else num
    return value


def process_info_elements(info_elements): return [convert_value((info.text if info.text else '').strip()) for info in
                                                  info_elements]


def xml_to_dict(element):
    result = {}
    children = list(element)
    if children:
        # 按标签名分组子元素
        child_groups = {}
        for child in children:
            tag = child.tag
            if tag not in child_groups:
                child_groups[tag] = []
            child_groups[tag].append(child)

        # 处理分组后的子元素
        for tag, group in child_groups.items():
            # 特殊处理info元素
            if tag == 'info':
                result[tag] = process_info_elements(group)
            # 处理有多个相同标签的情况
            elif len(group) > 1:
                result[tag] = [xml_to_dict(child) for child in group]
            # 处理单个标签的情况
            else:
                result[tag] = xml_to_dict(group[0])

    # 处理文本内容
    if element.text and element.text.strip():
        text = element.text.strip()
        result = convert_value(text)

    # 处理元素的属性
    if element.attrib:
        # 对于category元素，将name属性作为键
        if element.tag == 'category':
            name = element.attrib.get('name')
            if name:
                if result:
                    return {name: result}
                else:
                    return {name: {}}
        # 其他情况将属性添加到结果中
        else:
            for attr, value in element.attrib.items():
                result[f'@{attr}'] = convert_value(value)

    return result


def convert_xml_to_json(xml_content):
    try:
        root = ET.fromstring(xml_content)
        xml_dict = xml_to_dict(root)
        return xml_dict
    except Exception as e:
        print(f"Error converting XML to JSON: {str(e)}")
        return None


def main():
    # 示例XML内容
    xml_content = '''
    <?xml version="1.0" encoding="utf-8" standalone="yes" ?>
        <root>
        <fullscreen>0</fullscreen>
        <seek_sec>10</seek_sec>
        <apiversion>3</apiversion>
        <currentplid>4</currentplid>
        <time>3427</time>
        <volume>156</volume>
        <length>11214</length>
        <random>false</random>
        <audiofilters>
          <filter_0></filter_0></audiofilters>
        <rate>1</rate>
        <videoeffects>
          <hue>0</hue>
          <saturation>1</saturation>
          <contrast>1</contrast>
          <brightness>1</brightness>
          <gamma>1</gamma></videoeffects>
        <state>playing</state>
        <loop>false</loop>
        <version>3.0.21 Vetinari</version>
        <position>0.3056500852108</position>
        <audiodelay>0</audiodelay>
        <repeat>false</repeat>
        <subtitledelay>0</subtitledelay>
        <equalizer></equalizer><information>
            <category name="meta">
            <info name='album'>【有声书】《鬼吹灯》全集  原版未删减</info><info name='filename'>[P01]《精绝古城》1.m4a</info><info name='description'>..................................</info><info name='title'>《精绝古城》1</info><info name='artwork_url'>file:///C:/Users/Lian/AppData/Roaming/vlc/art/artistalbum/%E6%B8%85%E9%A3%8E%E6%9C%89%E5%A3%B0%E4%B9%A6/%E3%80%90%E6%9C%89%E5%A3%B0%E4%B9%A6%E3%80%91%E3%80%8A%E9%AC%BC%E5%90%B9%E7%81%AF%E3%80%8B%E5%85%A8%E9%9B%86%20%20%E5%8E%9F%E7%89%88%E6%9C%AA%E5%88%A0%E5%87%8F/art.png</info><info name='artist'>清风有声书</info><info name='encoded_by'>Lavf60.16.100</info>    </category>
          <category name='Stream 0'><info name='Codec'>MPEG AAC Audio (mp4a)</info><info name='Channels'>Stereo</info><info name='Bits per sample'>32</info><info name='Sample rate'>48000 Hz</info><info name='Type'>Audio</info></category>  </information>
          <stats>
          <lostabuffers>16</lostabuffers>
        <readpackets>8189</readpackets>
        <lostpictures>0</lostpictures>
        <demuxreadbytes>81171512</demuxreadbytes>
        <demuxbitrate>0.023395074531436</demuxbitrate>
        <playedabuffers>160707</playedabuffers>
        <demuxcorrupted>0</demuxcorrupted>
        <sendbitrate>0</sendbitrate>
        <sentbytes>0</sentbytes>
        <displayedpictures>0</displayedpictures>
        <demuxreadpackets>0</demuxreadpackets>
        <sentpackets>0</sentpackets>
        <inputbitrate>0.020533999428153</inputbitrate>
        <demuxdiscontinuity>1</demuxdiscontinuity>
        <averagedemuxbitrate>0</averagedemuxbitrate>
        <decodedvideo>0</decodedvideo>
        <averageinputbitrate>0</averageinputbitrate>
        <readbytes>83844544</readbytes>
        <decodedaudio>321447</decodedaudio>
          </stats>
    </root>'''

    # 转换并打印结果
    json_output = convert_xml_to_json(xml_content)
    if json_output:
        print(json_output)


if __name__ == "__main__":
    main()
