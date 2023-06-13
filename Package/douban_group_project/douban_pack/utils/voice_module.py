import win32com.client as win_client


def notification_voice(contents):
    # text => speak
    speak = win_client.Dispatch("SAPI.SpVoice")
    speak.Speak(contents)
