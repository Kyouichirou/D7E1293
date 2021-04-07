// ==UserScript==
// @name         doc88 free copy conetnt without vip or login
// @namespace    https://github.com/Kyouichirou
// @version      0.1
// @description  doc88 freely copy conetnt without vip or login
// @author       HLA
// @match        https://www.doc88.com/p-*
// @grant        none
// @run-at       document.start
// @compatible   chrome
// @license      MIT
// @noframes
// ==/UserScript==

(() => {
    "use strict";
    Object.defineProperty(window, "u_v", {
        value: 1,
    });
    Object.defineProperty(window, "logined", {
        value: 1,
    });
    window.onload = () => {
        const c = window.Core.Annotation.api;
        let timeID = null;
        c
            ? Object.defineProperty(c, "_aV", {
                  configurable: true,
                  enumerable: true,
                  set(v) {
                      timeID && clearTimeout(timeID);
                      timeID = setTimeout(
                          () => (
                              (timeID = null), navigator.clipboard.writeText(v)
                          ),
                          300
                      );
                  },
              })
            : console.log("something has changed");
        window.DOC88Window = () => null;
        window.copyText = () => null;
        window.onkeydown = (e) => {
            if (e.ctrlKey || e.keyCode === 67) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
    };
})();
