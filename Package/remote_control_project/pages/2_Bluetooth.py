import streamlit as st
from utils.get_bluetooth_module import get_device_info
from utils.bluetooth_module import *

st.set_page_config(page_title="Bluetooth", page_icon=":material/bluetooth:")

st.markdown("# Bluetooth")

if 'device_info' not in st.session_state:
    st.session_state.device_info = get_device_info()

with st.form("device list"):
    device = st.selectbox('choose device', st.session_state.device_info.keys())
    col1, col2 = st.columns(2)
    with col1:
        if st.form_submit_button("connect", icon=':material/bluetooth_connected:'):
            connect(st.session_state.device_info[device])
    with col2:
        if st.form_submit_button('disconnect', icon=':material/bluetooth_disabled:'):
            disconnect(st.session_state.device_info[device])
