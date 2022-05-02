from .audio_module import AudioMetedata

def start(folderpath: str, output_file=''):
    mete = AudioMetedata(output_file)
    mete.get_all_files(folderpath)
