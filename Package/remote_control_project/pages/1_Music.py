import streamlit as st
from utils import music_module as mm

st.set_page_config(page_title="Music", page_icon=":material/queue_music:")
st.markdown('# Music')

st.html('<font size=3>foobar2000</font>')

st.markdown('---')


# 分块执行, 当操作在块中, 重新载入页面内容时只会执行块的内容
@st.fragment
def control():
    with st.container():
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            if st.button('next', icon=':material/skip_next:'):
                mm.next_p()
        with c2:
            if st.button(label='play', icon=f':material/play_circle:'):
                mm.play()
        with c3:
            if st.button('pause', icon=':material/pause_circle:'):
                mm.pause()
        with c4:
            if st.button('stop', icon=':material/stop_circle:'):
                mm.stop()


@st.fragment
def volume():
    st.markdown('---')
    with st.container():
        st.subheader('volume')
        c1, c2 = st.columns(2)
        with c1:
            if st.button('volume-', icon=':material/volume_down:'):
                mm.adjust_volume(False)
        with c2:
            if st.button('volume+', icon=':material/volume_up:'):
                mm.adjust_volume(True)


control()
volume()
