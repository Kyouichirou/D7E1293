import streamlit as st
from utils import vlc_module as vm

st.set_page_config(page_title="VLC", page_icon=":material/radio:")
st.markdown('''
# VLC
''')

st.html('<font size=3>vlc player</font>')

st.markdown('---')


# 分块执行, 当操作在块中, 重新载入页面内容时只会执行块的内容
@st.fragment
def control():
    with st.container():
        c1, c2, c3 = st.columns(3)
        with c1:
            if st.button('next', icon=':material/skip_next:'):
                vm.next_p()
        with c2:
            if st.button(label='play', icon=f':material/play_circle:'):
                vm.pause_play()
        with c3:
            if st.button('pause', icon=':material/pause_circle:'):
                vm.pause_play()


@st.fragment
def volume():
    st.markdown('---')
    with st.container():
        st.subheader('volume')
        c1, c2 = st.columns(2)
        with c1:
            if st.button('volume-', icon=':material/volume_down:'):
                vm.adjust_volume(False)
        with c2:
            if st.button('volume+', icon=':material/volume_up:'):
                vm.adjust_volume(True)


control()
volume()
