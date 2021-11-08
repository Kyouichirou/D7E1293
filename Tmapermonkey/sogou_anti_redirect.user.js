// ==UserScript==
// @name         sogou_anti_redirect
// @namespace    https://github.com/Kyouichirou
// @version      1.0
// @description  remove the redirection of url in sogou
// @author       HLA
// @license      MIT
// @include      /https:\/\/(www|weixin)\.sogou\.com\/(web|sogou|weixin).+/
// @grant        none
// @compatiable  chrome; just test on chrome 80+
// @noframes
// ==/UserScript==

(() => {
    "use strict";
    const hostname = location.hostname;
    const options = {
        method: "GET",
        mode: "cors",
        credentials: "",
        redirect: "error",
        referrer: "no-referrer",
        timeout: 350,
    };
    const configs = {
        content_reg: null,
        protocol_reg: /^http:/,
        target_id: null,
        func: null,
    };
    [
        configs.content_reg,
        options.credentials,
        configs.target_id,
        configs.func,
    ] = hostname.includes("weixin")
        ? [
              /(?<=\+=\s').+(?=')/g,
              "same-origin",
              ".news-list h3 a[href^='/link?url=']",
              (...args) => (args[0].href = args[1].join("")),
          ]
        : [
              /window.location.replace\("(.+)"\)/,
              "omit",
              ".results a[href^='/link?url=']",
              (...args) => (args[0].href = args[1][1]),
          ];
    const anti_redirect = (node, url) => {
        const controller = new AbortController();
        let timeout_id = setTimeout(() => {
            timeout_id = null;
            controller.abort();
            console.log(`timeout error: ${url}`);
        }, options.timeout);
        fetch(url, { ...options, signal: controller.signal })
            .then((res) => {
                if (timeout_id) clearTimeout(timeout_id), (timeout_id = null);
                if (res.status === 200) return res.text();
                else throw new Error(`error, httpCode: ${res.status}`);
            })
            .then((res) => {
                const ms = res.match(configs.content_reg);
                if (ms && ms.length > 1) configs.func(node, ms);
                else console.log(`no found finalURL in ${url}`);
            })
            .catch((e) => {
                timeout_id && clearTimeout(timeout_id);
                console.log(`some errors in ${url}`);
                console.log(e);
            });
    };
    const nodes = document.querySelectorAll(configs.target_id);
    for (const node of nodes) {
        const href = node.href;
        if (href && href.includes(hostname))
            anti_redirect(node, href.replace(configs.protocol_reg, "https:"));
    }
})();
