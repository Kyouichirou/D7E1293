import streamlit as st
import os
from utils.audio_module import adjust_volume as av
from utils.system_module import adjust_power_module

st.set_page_config(page_title="Setups", page_icon=':material/settings:')

st.markdown("# Setups")


@st.dialog('confirm! shutdown?')
def shutdown():
    if st.button('ok'):
        os.system('shutdown /s /t 0')


with st.container():
    st.subheader('system')
    c1, c2 = st.columns(2)
    with c1:
        if st.button('shutdown', icon=':material/power:'):
            shutdown()
    with c2:
        if st.button('restart', icon=':material/power_settings_circle:'):
            os.system('shutdown /r /t 0')

    st.markdown('---')
    with st.form('power'):
        st.subheader('power mode')
        p = st.selectbox('', ('balance', 'performance', 'energy'))
        if st.form_submit_button('apply', icon=':material/charger:'):
            adjust_power_module(p)

st.markdown('---')
with st.container():
    st.subheader('volume')
    c1, c2 = st.columns(2)
    with c1:
        if st.button('volume-', icon=':material/volume_down:'):
            av(False)
    with c2:
        if st.button('volume+', icon=':material/volume_up:'):
            av(True)
