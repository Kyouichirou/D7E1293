// ==UserScript==
// @name         Youdao_Translation
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @connect      fanyi.youdao.com
// @noframes
// @require      https://cdn.bootcdn.net/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js
// ==/UserScript==

(() => {
    'use strict';
    const Youdao = {
        //backup translation api, but this api jsut has few features, which can not support translate language by automatically sense the type of language
        other(keyword) {
            const api =
                "http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&smartresult=ugc&sessionFrom=null";
            const dic = {
                type: "AUTO",
                i: keyword,
                doctype: "json",
                version: "2.1",
                keyfrom: "fanyi.web",
                ue: "UTF-8",
                action: "FY_BY_CLICKBUTTON",
                typoResult: "true",
            };
            let data = "";
            for (const e of Object.entries(dic))
                data = data + e[0] + "=" + e[1] + "&";
            data = data.slice(0, data.length - 1);
            return new Promise((resolve, reject) => {
                this.YoudaoRequest(api, data).then(
                    (r) => {
                        try {
                            const j = JSON.parse(r);
                            resolve(j["translateResult"][0][0]["tgt"]);
                        } catch (e) {
                            console.log(e);
                            reject(null);
                        }
                    },
                    () => reject(null)
                );
            });
        },
        is_anti: false,
        YoudaoRequest(data, time = 10000) {
            // if the browser has cookies of youdao, thoese cookies will be send to youdao simultaneously;
            const header = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://fanyi.youdao.com/",
                "Origin": "https://fanyi.youdao.com",
                "Accept": "application/json, text/javascript, */*; q=0.01"
            };
            const url = "https://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule";
            return new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: header,
                    timeout: time,
                    data: data,
                    onload: (response) => {
                        if (response.status === 200) resolve(response.response);
                        else {
                            console.log(`err: code ${response.status}`);
                            reject("request data error");
                        }
                    },
                    onerror: (e) => {
                        console.log(e);
                        reject("something error");
                    },
                    ontimeout: (e) => {
                        console.log("timeout error: " + url);
                        reject("timeout error");
                    },
                });
            });
        },
        get _salt() {
            return Math.floor(Math.random() * 10).toString();
        },
        get_sign(salt, keyword) {
            const c = "Y2FYu%TNSbMCxc3t2u^XT";
            const a = "fanyideskweb";
            return md5(a + keyword + salt + c);
        },
        //not like python requests, the GM just post string data, does't treat dict data
        main(keyword) {
            const timestamp = Date.now().toString();
            const salt = timestamp + this._salt;
            const postdata = {
                i: encodeURIComponent(keyword).replace(/%20/g, '+'),
                from: "AUTO",
                to: "AUTO",
                smartresult: "dict",
                client: "fanyideskweb",
                salt: salt,
                sign: this.get_sign(salt, keyword),
                lts: timestamp,
                bv: "1b31e1f5e3e687f8cbb5320699f8834e",
                doctype: "json",
                version: "2.1",
                keyfrom: "fanyi.web",
                action: "FY_BY_REALTlME",
            };
            const data = Object.entries(postdata).reduce((total, e) => (total += e[0] + '=' + e[1] + '&'), '').slice(0, -1);
            return new Promise((resolve, reject) => {
                this.YoudaoRequest(data).then(
                    (r) => {
                        try {
                            const j = JSON.parse(r);
                            const ec = j["errorCode"];
                            if (ec !== 0) {
                                resolve(ec === 40 ? '提示: 没有获取到有效的翻译结果' : "警告: " + ec);
                                return;
                            }
                            const a = j["smartResult"];
                            const es = a && a["entries"];
                            let text = '';
                            if (es && Array.isArray(es) && es.length > 0) {
                                const m = es.filter((e) => e.trim() && e);
                                //this content has contained newline charactor
                                m.length > 0 && (text = '智能翻译:\n' + m.join(''));
                                if (!text.endsWith('\n')) text += '\n';
                            }
                            const result = j["translateResult"];
                            if (result) {
                                const tmp = result[0];
                                let txt = '';
                                if (tmp) {
                                    if (Array.isArray(tmp) && tmp.length > 1) {
                                        const tp = tmp.map((e) => e["tgt"]).filter((e) => e);
                                        txt = tp.length > 0 ? tp.join(';\n') : '';
                                    } else {
                                        const tx = tmp[0];
                                        txt = tx['tgt'] || '';
                                    }
                                }
                                if (txt) text += '机器翻译:\n' + txt;
                            }
                            resolve(text ? text : '获取翻译失败');
                        } catch (e) {
                            console.log(e);
                            reject(null);
                        }
                    },
                    () => {
                        this.is_anti = true;
                        this.other(keyword).then(
                            (r) => {
                                resolve(r);
                            },
                            () => {
                                console.log("error");
                                reject(null);
                            }
                        );
                    }
                );
            });
        },
    };
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyT') return;
        const s = window.getSelection().toString().trim();
        if (s) Youdao.main(s).then(
            (r) => console.log(r),
            () => console.log('fail')
        );
    })
})();
