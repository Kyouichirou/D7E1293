// ==UserScript==
// @name         anti adblock check for zhenbuka, bde4 and nfmovies
// @namespace    https://github.com/Kyouichirou
// @version      1.0
// @description  anti adblock check, disbale anti debugger, speed up countdown, enable F12 keyboard debugger, working on inline scripts?
// @author       HLA
// @match        *://www.zhenbuka.com/vodplay/*
// @match        *://bde4.cc/*
// @match        *://www.nfmovies.com/*
// @match        *://www.pianku.li/*
// @grant        none
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(() => {
    "use strict";
    /*
    If @grant is followed by 'none' the sandbox is disabled and the script will run directly at the page context. In this mode no GM_* function but the GM_info property will be available.
    */
    const antiConsole = () => {
        window.console.log = new Proxy(window.console.log, {
            apply(target, thisArg, args) {
                const eType = Object.prototype.toString.call(args[0]);
                (eType === "[object HTMLImageElement]" ||
                    eType === "[object HTMLDivElement]") &&
                    (args[0] = null);
                return target.apply(thisArg, args);
            },
        });
    };
    //proxy document.body, => throw error, htmlelement
    const protectBody = () => {
        let id = setInterval(() => {
            if (document.body) {
                clearInterval(id);
                Object.defineProperty(document.body, "innerHTML", {
                    set(nev) {
                        if (!nev) return;
                    },
                });
            }
        }, 0);
    };
    const antiKeyboard = () => {
        if (!window.onkeydown) return;
        window.onkeydown = window.onkeyup = window.onkeypress = new Proxy(
            window.onkeydown,
            {
                apply(target, thisArg, args) {
                    if (args[0].keyCode === 123) {
                        window.Object.defineProperty(args[0], "keyCode", {
                            value: 112,
                            writable: false,
                            enumerable: false,
                            configurable: false,
                        });
                    }
                    return target.apply(thisArg, args);
                },
            }
        );
    };
    const speedup = () => {
        const reg = /.?/;
        const ratio = 0.05;
        //countdown
        const delay = 1000;
        window.setInterval = new Proxy(window.setInterval, {
            apply: (target, thisArg, args) => {
                //maybe can setup specific function
                const f = args[0];
                const t = args[1];
                t === delay && reg.test(f.toString()) && (args[1] = t * ratio);
                return target.apply(thisArg, args);
            },
        });
    };
    const setContant = (constantName, newValue) => {
        Object.defineProperty(window, constantName, {
            enumerable: true,
            value: newValue
        });
    }
    const hostname = location.hostname;
    const addStyle = (style) =>
        document.head.insertAdjacentHTML(
            "beforeend",
            `<style class="anti_ads">${style}</style>`
        );
    if (hostname.endsWith("zhenbuka.com")) {
        addStyle(".marquee_outer,.jq-toast-wrap{display: none !important;}");
        window.onload = () => {
            const ad_ids = ["ad01", "nice_u_know_img"];
            for (const ad_id of ad_ids) {
                const node = document.getElementById(ad_id);
                node && node.remove();
            }
        };
    } else if (hostname.endsWith("nfmovies.com")) {
        protectBody();
        speedup();
        //include sub framework, need to be executed multiple times
    } else if (hostname.endsWith("pianku.li")){
        location.pathname.includes('/py/') && speedup();
        //setContant('pycount', 0);
    } else {
        antiConsole();
        //window.console.log = () => null;
        location.pathname.includes("play") && speedup();
        Object.defineProperty(window, "dataLayer", {
            value: null,
            writable: false,
            enumerable: false,
            configurable: false,
        });
        window.onload = () => antiKeyboard();
    }
})();
