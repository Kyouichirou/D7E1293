// ==UserScript==
// @name         baidu_ad_clear
// @namespace    https://github.com/Kyouichirou
// @version      0.1
// @description  clear the pages' ad of baidu search
// @author       HLA
// @license      MIT
// @match        https://www.baidu.com/s?*
// @grant        none
// @compatiable  chrome; just test on chrome 80+
// @noframes
// @run-at       document-start
// ==/UserScript==

(() => {
    "use strict";
    const reg = /display:(table|block)\s!important/;
    const clearAD = () => {
        const mAds = document.querySelectorAll(".ec_wise_ad,.ec_youxuan_card");
        for (const mAd of mAds) mAd.remove();
        const list = document.body.querySelectorAll(
            "#content_left>div,#content_left>table"
        );
        for (const item of list) {
            const s = item.getAttribute("style");
            if (s && reg.test(s)) item.remove();
            else {
                const span = item.querySelector("div>span");
                span && span.innerHTML === "广告" && item.remove();
                [].forEach.call(
                    item.querySelectorAll("a>span"),
                    (span) =>
                        span &&
                        (span.innerHTML === "广告" ||
                            span.getAttribute("data-tuiguang")) &&
                        item.remove()
                );
            }
        }
        const eb = document.querySelectorAll(
            "#content_right>table>tbody>tr>td>div"
        );
        for (const e of eb) e.id !== "con-ar" && e.remove();
    };
    const MutationObserver =
        window.MutationObserver ||
        window.WebKitMutationObserver ||
        window.MozMutationObserver;
    const observer = new MutationObserver(() => clearAD());
    const option = {
        childList: true,
        subtree: true,
    };
    document.onreadystatechange = () =>
        document.readyState === "interactive" &&
        observer.observe(document.body, option);
    setTimeout(() => clearAD(), 2000);
})();
