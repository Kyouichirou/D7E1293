// ==UserScript==
// @name         remove_iqiyi_AI_recognition_ico
// @namespace    https://github.com/Kyouichirou
// @version      0.1
// @description  remove iqiyi AI recognition
// @author       HLA
// @license      MIT
// @match        https://www.iqiyi.com/v_*
// @grant        none
// @run-at       document-start
// @compatiable  chrome; just test on chrome 80+
// @noframes
// ==/UserScript==

(() => {
    "use strict";
    /*
    firstly, set the trap to get the obj, get the value of "param", then set the trap to get the final value
    */
    const trap = (v) => {
        Object.defineProperty(v, "isSupportAI", {
            configurable: true,
            enumerable: true,
            get() {
                return false;
            },
        });
    };
    let o = null;
    Object.defineProperty(window, "param", {
        set(a) {
            o = a;
            trap(a);
        },
        get() {
            return o;
        },
    });
})();
