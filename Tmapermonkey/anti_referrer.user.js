// ==UserScript==
// @name         anti_referrer
// @namespace    https://github.com/Kyouichirou
// @version      0.1
// @description  anti_refer, try avoid some site to block some specil referrer site, for example: baidu.com
// @author       HLA
// @match        https://*.coolshell.cn/*
// @include      https://*.qq.com*
// @include      https://baijiahao.baidu.com*
// @run-at       document-start
// @compatible   chrome
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
    "use strict";
    /* no standar, document.__defineGetter, this function is not adopted by browser
    // delete
    delete window.document.referrer;
    window.document.__defineGetter__('referrer', function () {
        return "yoururl.com";
    });
    */
    Object.defineProperty(document, "referrer", {
        get() {
            const rand_list = [
                "www.bing.com",
                "www.google.com",
                "cn.bing.com",
                "www.sogou.com",
                "search.yahoo.com",
                "www.google.com.hk",
                "www.baidu.com",
                "www.so.com",
                "www.ecosia.org",
            ];
            const i = Math.round(Math.random() * (rand_list.length - 1)); //Math.floor(Math.random()*10); 0-9
            return `https://${rand_list[i]}/`;
        },
    });
})();
