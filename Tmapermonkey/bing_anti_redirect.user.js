// ==UserScript==
// @name         bing_anti_redirect
// @namespace    https://github.com/Kyouichirou
// @version      0.1
// @description  fuck off bing redirect!
// @author       Lian
// @match        https://cn.bing.com/search?q=*
// @icon         https://cn.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico
// @grant        unsafeWindow
// @noframes
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';
    let tmp = null, i = 0, x = null;
    !unsafeWindow.sj_lc && Object.defineProperty(unsafeWindow, 'sj_lc', { value: (..._args) => null });
    !unsafeWindow.sj_cook && Object.defineProperty(unsafeWindow, 'sj_cook', {
        set(val) {
            if (val.set) val.set = new Proxy(val.set, { apply(...args) { i === 0 && args[args.length - 1][0] === 'SRCHHPGUSR' ? i++ : Reflect.apply(...args); } });
            tmp = val;
        },
        get: () => tmp,
        enumerable: true,
        configurable: true
    });
    !unsafeWindow.BM && Object.defineProperty(unsafeWindow, 'BM', {
        _target: null,
        set(val) {
            if (!val.wireup) {
                let z = null;
                Object.defineProperty(val, 'wireup', {
                    set(v) {
                        v = new Proxy(v, {
                            apply(...args) {
                                const d = args[args.length - 1];
                                if (d[0] === 'EVT') d[1].compute = (..._args) => null;
                                return Reflect.apply(...args);
                            }
                        });
                        z = v;
                    },
                    get: () => z,
                    enumerable: true,
                    configurable: true
                });
            }
            x = val;
        },
        get: () => x,
        enumerable: true,
        configurable: true,
    });
})();
