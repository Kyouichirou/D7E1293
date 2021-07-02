// ==UserScript==
// @name         Amazon_Assistan
// @namespace    https://github.com/Kyouichirou
// @version      1.0
// @description  make thing better and simpler
// @author       HLA
// @updateURL
// @match        https://www.amazon.com/*
// @match        http*://fanyi.youdao.com/*
// @connect      www.amazon.com
// @connect      www.amz123.com
// @connect      fanyi.youdao.com
// @connect      trends.google.com
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        window.close
// @noframes
// @require      https://cdn.bootcdn.net/ajax/libs/xlsx/0.17.0/xlsx.core.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==

(() => {
    //youdao, cookie problem
    const Notification = (
        content = "",
        title = "",
        duration = 2500,
        cfunc,
        ofunc
    ) => {
        GM_notification({
            text: content,
            title: title,
            timeout: duration,
            onclick: cfunc,
            ondone: ofunc,
        });
    };
    const clearCookie = () => {
        let cookie = document.cookie;
        if (cookie.length === 0) return false;
        let keys = cookie.match(/[^ =;]+(?==)/g);
        if (keys) {
            const expired = new Date(0).toUTCString();
            const domain = document.domain;
            const host = location.hostname;
            let ig = false;
            if (host !== domain) ig = true;
            let flag = false;
            if (domain.split(".").length > 2) flag = true; //youku.com
            let i = keys.length;
            for (i; i--;) {
                let tmp = keys[i];
                document.cookie = tmp + "=0;expires=" + expired; //清除非path路径的cookie
                document.cookie = tmp + "=0;path=/;expires=" + expired; //针对path路径
                if (flag)
                    document.cookie =
                        tmp +
                        `=0;path=/;domain=${domain.slice(domain.indexOf("."))};expires=` +
                        expired; //wwww.baidu.com, .baidu.com
                document.cookie =
                    tmp + `=0;path=/;domain=.${domain};expires=` + expired; //域名youku.com .youku.com
                document.cookie = tmp + `=0;path=/;domain=${domain};expires=` + expired; //域名
                if (ig) {
                    document.cookie =
                        tmp + `=0;path=/;domain=${domain};expires=` + expired; //域名
                    document.cookie =
                        tmp + `=0;path=/;domain=.${host};expires=` + expired;
                }
            }
        }
    };
    const youdao_clear = {
        setup() {
            GM_setValue("isclear", true);
            GM_openInTab("https://fanyi.youdao.com/");
            setTimeout(() => Notification("清理有道cookie成功", "提示"), 700);
        },
        action() {
            if (GM_getValue("isclear")) {
                clearCookie();
                GM_setValue("isclear", false);
                window.close();
            }
        },
    };
    const roundFun = (value, n) =>
        Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
    const escapeBlank = (target) => {
        const type = typeof target;
        if (type === "object") {
            const entries = Object.entries(target);
            for (const [key, value] of entries)
                target[key] = value.replace(/\s/g, "&nbsp;");
        } else {
            target = target.replace(/\s/g, "&nbsp;");
        }
        return target;
    };
    const escapeHTML = (s) => {
        const reg = /“|&|’|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
        return typeof s !== "string"
            ? s
            : s.replace(reg, ($0) => {
                let c = $0.charCodeAt(0),
                    r = ["&#"];
                c = c == 0x20 ? 0xa0 : c;
                r.push(c);
                r.push(";");
                return r.join("");
            });
    };
    const html2Dom = (html) => new DOMParser().parseFromString(html, "text/html");
    const common_words = [
        "the",
        "word",
        'not',
        "of",
        "it",
        "and",
        "is",
        "to",
        "this",
        "but",
        "in",
        "for",
        "so",
        "with",
        "on",
        "was",
        "were",
        "you",
        "your",
        "as",
        "be",
        "have",
        "or",
        "would",
        "am",
        "me",
        "that",
        "are",
        "my",
        "if",
        "at",
        "than",
        "will",
        "can",
        "do",
        "did",
        "no",
        "does",
        "doesn",
        "go",
        "amazon",
        "by",
        "something",
        "her",
        "his",
    ];
    const data2Excel = {
        s2ab(s) {
            let buf = new ArrayBuffer(s.length);
            let view = new Uint8Array(buf);
            for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
            return buf;
        },
        sheet2blob(sheet, sheetName) {
            sheetName = sheetName || "sheet1";
            let workbook = {
                SheetNames: [sheetName],
                Sheets: {},
            };
            workbook.Sheets[sheetName] = sheet;
            // 生成excel的配置项
            let wopts = {
                bookType: "xlsx", // 要生成的文件类型
                bookSST: false, // 是否生成Shared String Table, 官方解释是, 如果开启生成速度会下降, 但在低版本IOS设备上有更好的兼容性
                type: "binary",
            };
            let wbout = XLSX.write(workbook, wopts);
            let blob = new Blob([this.s2ab(wbout)], {
                type: "application/octet-stream",
            });
            // 字符串转ArrayBuffer
            return blob;
        },
        openDownloadDialog(url, saveName) {
            if (typeof url == "object" && url instanceof Blob)
                url = URL.createObjectURL(url); // 创建blob地址
            let aLink = document.createElement("a");
            aLink.href = url;
            aLink.download = saveName || ""; // HTML5新增的属性, 指定保存文件名, 可以不要后缀, 注意, file:///模式下不会生效
            let event;
            if (window.MouseEvent) event = new MouseEvent("click");
            else {
                event = document.createEvent("MouseEvents");
                event.initMouseEvent(
                    "click",
                    true,
                    false,
                    window,
                    0,
                    0,
                    0,
                    0,
                    0,
                    false,
                    false,
                    false,
                    false,
                    0,
                    null
                );
            }
            aLink.dispatchEvent(event);
            URL.revokeObjectURL(url);
        },
        json_toExcel(data, wbname, shname) {
            const sheet = XLSX.utils.json_to_sheet(data);
            this.openDownloadDialog(this.sheet2blob(sheet, shname), `${wbname}.xlsx`);
        },
        // dic => sheet, 表头在创建字典时, 首先放进去
        dic_toExcel(data, wbname, shname) {
            const sheet = XLSX.utils.aoa_to_sheet(Object.entries(data));
            this.openDownloadDialog(this.sheet2blob(sheet, shname), `${wbname}.xlsx`);
        },
    };
    const multi_search = {
        search(code, keyword) {
            const engines = {
                Amazon: "https://www.amazon.com/s?k=",
            };
            const s = engines[code];
            s && GM_openInTab(s + keyword, { insert: true, active: true });
        },
        main(code) {
            const s = window.getSelection().toString();
            if (s && s.length > 1) this.search(code, s);
        },
    };
    const wait_time = (time = 300) =>
        new Promise((resolve) => setTimeout(() => resolve(true), time));
    const random_range = (minNum, maxNum) =>
        parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
    const Youdao = {
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
        YoudaoRequest(url, data, time = 10000, rType = false) {
            /*
                  if the browser has cookies of youdao, thoese cookies will be send to youdao simultaneously;
                  */
            const header = {
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: "http://fanyi.youdao.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
            };
            return new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: header,
                    timeout: time,
                    data: data,
                    cookie: "OUTFOX_SEARCH_USER_ID=-803783997@10.169.0.81",
                    onload: (response) => {
                        if (response.status === 200)
                            resolve(rType ? response.finalUrl : response.response);
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
        get get_salt() {
            return (Date.now() + Math.floor(Math.random() * 10)).toString();
        },
        get_sign(salt, keyword) {
            const c = "Tbh5E8=q6U3EXe+&L[4c@";
            const a = "fanyideskweb";
            return md5(a + keyword + salt + c);
        },
        //not like python requests, the GM just post string data, does't treat dict data
        main(keyword) {
            const salt = this.get_salt;
            const dic = {
                i: keyword,
                from: "AUTO",
                to: "AUTO",
                smartresult: "dict",
                client: "fanyideskweb",
                salt: salt,
                sign: this.get_sign(salt, keyword),
                doctype: "json",
                version: "2.1",
                keyfrom: "fanyi.web",
                action: "FY_BY_CL1CKBUTTON",
                typoResult: "true",
            };
            let data = "";
            for (const e of Object.entries(dic))
                data = data + e[0] + "=" + e[1] + "&";
            data = data.slice(0, data.length - 1);
            const api =
                "http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule";
            return new Promise((resolve, reject) => {
                this.YoudaoRequest(api, data).then(
                    (r) => {
                        try {
                            const j = JSON.parse(r);
                            if (j["errorCode"] !== 0) {
                                reject(null);
                                console.log("error:" + j["errorCode"]);
                            }
                            const a = j["smartResult"];
                            const es = a && a["entries"];
                            resolve(
                                es && Array.isArray(es) && es.length > 0
                                    ? es.join(";")
                                    : j["translateResult"][0][0]["tgt"]
                            );
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
    const createButton = (name, title, otherButton = "", position = "right") => {
        title = escapeBlank(title);
        const html = `
        <div
            id = "assist-button-container"
            >
            <style>
                button.assist-button {
                    border-radius: 0 1px 1px 0;
                    border: rgb(247, 232, 176) solid 1.2px;
                    display: inline-block;
                    margin-top: 4px;
                    font-size: 14px;
                    height: 28px;
                    width: 75px;
                    box-shadow: 3px 4px 1px #888888;
                    justify-content: center;
                }
                div#assist-button-container {
                    opacity: 0.95;
                    ${position}: 4%;
                    width: 60px;
                    flex-direction: column;
                    position: fixed;
                    bottom: 7%;
                }
                div#assist-button-container:hover {
                    opacity: 1;
                    transition: opacity 2s;
                }
            </style>
            ${otherButton}
            <button class="assist-button abstract" style="color: black;" title=${title}>${name}</button>
        </div>`;
        document.documentElement.insertAdjacentHTML("beforeend", html);
    };
    const download = (filename, text) => {
        let element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(text)
        );
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        element = null;
    };
    const xmlHTTPRequest = (url, time = 10000, rType = false) => {
        console.log("start: " + url);
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: time,
                onload: (response) => {
                    if (response.status === 200)
                        resolve(rType ? response.finalUrl : response.response);
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
    };
    //take care of parameter of url, the GM doesn't have the ability to handle dict data
    const google_trends = {
        dateFormat(fmt, date) {
            const opt = {
                "Y+": date.getFullYear().toString(),
                "m+": (date.getMonth() + 1).toString(),
                "d+": date.getDate().toString(),
                "H+": date.getHours().toString(),
                "M+": date.getMinutes().toString(),
                "S+": date.getSeconds().toString(),
            };
            for (let k in opt) {
                const ret = new RegExp("(" + k + ")").exec(fmt);
                if (ret)
                    fmt = fmt.replace(
                        ret[1],
                        ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
                    );
            }
            return fmt;
        },
        //adjustable time gap
        async get_token(keyword) {
            const data = `hl=en-US&tz=-480&req={"comparisonItem":[{"keyword":"${keyword}","geo":"US","time":"today+12-m"}],"category":0,"property":""}&tz=-480`;
            const url = `https://trends.google.com/trends/api/explore?${data}`;
            try {
                const r = await xmlHTTPRequest(url);
                const j = JSON.parse(r.slice(4));
                const token = j["widgets"][0]["token"];
                return token;
            } catch (e) {
                console.log("fail to get google trends api token");
                return null;
            }
        },
        async get_data(token, keyword) {
            const par = `hl=en-US&tz=-480&req={"time":"${this.dateFormat(
                "YYYY-mm-dd",
                new Date(Date.now() - 1000 * 60 * 60 * 24 * 365)
            )}+${this.dateFormat(
                "YYYY-mm-dd",
                new Date()
            )}","resolution":"WEEK","locale":"en-US","comparisonItem":[{"geo":{"country":"US"},"complexKeywordsRestriction":{"keyword":[{"type":"BROAD","value":"${keyword}"}]}}],"requestOptions":{"property":"","backend":"IZG","category":0}}&token=${token}&tz=-480`;
            const api = `https://trends.google.com/trends/api/widgetdata/multiline?${par}`;
            try {
                const r = await xmlHTTPRequest(api);
                const j = JSON.parse(r.slice(6));
                const datas = j["default"]["timelineData"];
                const arr = [];
                for (const data of datas) {
                    const tdic = {};
                    tdic.formattedAxisTime = data["formattedAxisTime"];
                    tdic.value = data["value"][0];
                    arr.push(tdic);
                }
                return arr;
            } catch (e) {
                console.log(e);
                return null;
            }
        },
        async main(keyword) {
            const token = await this.get_token(keyword);
            if (token) {
                const data = await this.get_data(token, keyword);
                if (data)
                    data2Excel.json_toExcel(
                        data,
                        `google_trends_${keyword}_${Date.now()}`,
                        "data"
                    );
            }
        },
    };
    const amz123 = {
        async get_data(url, keyword) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                download("text", r);
                const table = dom.getElementsByClassName("table-wrapper");
                if (table.length > 0) {
                    const datas = table[0].getElementsByClassName("listdata");
                    const arr = [];
                    for (const data of datas) {
                        const dic = {};
                        const items = data.children;
                        const link = items[0].children[0];
                        dic.keyword = link.innerText;
                        dic.cwrank = items[1].innerText;
                        dic.lwrank = items[2].innerText;
                        const tmp = items[3].children[0];
                        const tx = tmp.className;
                        if (tx.includes("shangsheng")) {
                            dic.change = tmp.parentNode.innerText.trim();
                            dic.status = "u";
                        } else if (tx.includes("xiajiang")) {
                            dic.change = tmp.parentNode.innerText.trim();
                            dic.status = "d";
                        } else {
                            dic.status = "-";
                            dic.change = "-";
                        }
                        dic.url = link.href;
                        arr.push(dic);
                    }
                    if (arr.length > 0)
                        data2Excel.json_toExcel(
                            arr,
                            "hotword_" + (keyword || "Amazon热搜词Top500") + "_" + Date.now(),
                            "hotwords"
                        );
                    else console.log("无相关热词检索数据");
                } else console.log("无相关热词检索数据");
            } catch (e) {
                console.log(e);
            }
        },
        async main(keyword) {
            const url = keyword
                ? `https://www.amz123.com/usatopkeywords-1-1-${keyword.toLowerCase()}.htm`
                : "https://www.amz123.com/usatopkeywords";
            this.get_data(url, keyword);
        },
    };
    const Amazon = {
        storage: null,
        reg: null,
        nreg: null,
        review_content: null,
        title_content: null,
        description_content: null,
        get current_url() {
            return location.href;
        },
        get currnt_keyword() {
            const title = document.title;
            return title.slice(title.indexOf(':') + 1).trim();
        },
        //可选商品(变体)
        get_variation() {
            const v = document.getElementById("variation_color_name");
            if (v) {
                const vs = v.getElementsByClassName("swatchAvailable");
                const arr = [];
                for (const e of vs)
                    !arr.includes(e) && arr.push(e.attributes["data-defaultasin"].value);
                return arr;
            }
            return null;
        },
        //销售rank
        get_rank(dic) {
            const d = document.getElementById("detailBulletsWrapper_feature_div");
            if (d) {
                const a = d.getElementsByClassName(
                    "a-unordered-list a-nostyle a-vertical a-spacing-none detail-bullet-list"
                );
                for (const e of a[0].children) {
                    const t = e.innerText;
                    const l = t.toLowerCase();
                    if (l.includes("department"))
                        dic.department = t.slice(t.indexOf(":") + 1).trim();
                    else if (l.includes("date"))
                        dic.firstday = t.slice(t.indexOf(":") + 1).trim();
                    else if (l.includes("manufacturer"))
                        dic.manufacturer = t.slice(t.indexOf(":") + 1).trim();
                }
                dic.rank = a[1].innerText.trim();
            }
        },
        get_item_detail(dom, url, keyword) {
            if (!dom) return null;
            const title = dom.getElementById("productTitle");
            const dic = {
                id: "N/A",
                title: "N/A",
                price: 0,
                description: "N/A",
                rate: 0,
                reviews: 0,
                review_content: "N/A",
                keyword: keyword || 'N/A',
                url: url,
                img: 'N/A',
            };
            if (title) {
                const ms = url.match(this.reg);
                if (ms) {
                    dic.id = ms[0];
                    if (title) {
                        const tmp = title.innerText;
                        dic.title = tmp;
                        this.title_content.push(tmp);
                    }
                    //Amazon有时会出现隐藏价格的情况, 反爬?
                    const price =
                        dom.getElementById("priceblock_ourprice") ||
                        dom.getElementById("priceblock_saleprice") ||
                        dom.getElementById("priceblock_dealprice");
                    if (price) {
                        const t = price.innerText;
                        const ms = t.match(this.nreg);
                        if (ms) {
                            let p = 0;
                            if (ms.length > 1) {
                                const s = parseFloat(ms[0]);
                                const e = parseFloat(ms[1]);
                                p = (((s + e) / 2) * 100) / 100;
                            } else p = parseFloat(ms[0]);
                            dic.price = p;
                        }
                    } else {
                        const prices = dom.getElementsByClassName(
                            "a-size-medium a-color-price"
                        );
                        if (prices.length === 0)
                            prices = dom.getElementsByClassName("a-size-base a-color-price");
                        if (prices.length > 0) {
                            let p = 0;
                            let ic = 0;
                            for (const pr of prices) {
                                const t = pr.innerText;
                                if (t) {
                                    const ms = t.match(this.nreg);
                                    if (ms) {
                                        p += parseFloat(ms[0]);
                                        ic += 1;
                                    }
                                }
                            }
                            if (ic > 0) dic.price = roundFun(p / ic, 2);
                        } else download(Date.now(), dom.body.innerHTML);
                    }
                    const reviews = dom.getElementsByClassName(
                        "a-expander-content reviewText review-text-content a-expander-partial-collapse-content"
                    );
                    const arr = [];
                    for (const r of reviews) arr.push(r.innerText.trim());
                    if (arr.length > 0) {
                        const tmp = arr.join("|\n");
                        dic.review_content = tmp;
                        this.review_content.push(tmp);
                    }
                    const rdom = dom.getElementById("reviewsMedley");
                    let rate = rdom.getElementsByClassName("a-size-base a-nowrap");
                    if (rate.length > 0) {
                        let t = rate[0].innerText;
                        dic.rate = parseFloat(t.slice(0, t.indexOf(" ")));
                    }
                    const rnum = rdom.getElementsByClassName(
                        "a-row a-spacing-medium averageStarRatingNumerical"
                    );
                    if (rnum.length > 0) {
                        let t = rnum[0].innerText;
                        t = t.match(this.nreg)[0];
                        t = t.replace(",", "");
                        dic.reviews = parseInt(t);
                    }
                    const de = dom.getElementById("feature-bullets");
                    if (de) {
                        const tmp = de.innerText;
                        dic.description = tmp;
                        this.description_content.push(tmp);
                    }
                    const img = dom.getElementById('imgTagWrapperId');
                    if (img) {
                        const tmp = img.getElementsByTagName('img');
                        if (tmp.length === 0) dic.img = tmp[0].src;
                    }
                    return dic;
                }
            }
            return null;
        },
        async get_item_info(url, keyword) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                const dic = this.get_item_detail(dom, url, keyword || "N/A");
                dic ? this.storage.push(dic) : console.log("获取商品详情失败: " + url);
                await wait_time(random_range(25, 100));
            } catch (e) {
                console.log(e);
            }
            return null;
        },
        /*
        从当前页抓取 => 指定截止页面(或最后的搜索页面)
        或者返回初始页抓取 =>
        指定任意两个页面
        */
        container_initial() {
            if (this.storage) return;
            this.reg = /(?<=dp\/)\w+(?=\/)/;
            this.nreg = /\d+([\.,]\d+)?/g;
            this.kreg = /[a-z]{2,}/gi;
            this.storage = [];
            this.title_content = [];
            this.review_content = [];
            this.description_content = [];
        },
        async destroy_container(wbname, shname) {
            this.statistic();
            await this.title_translate();
            this.write_toExcel(wbname, shname);
            this.reg = null;
            this.nreg = null;
            this.kreg = null;
            this.storage = null;
            this.title_content = null;
            this.review_content = null;
            this.description_content = null;
            Notification("执行完成", '提示');
        },
        word_Segment(arr, name) {
            if (!arr || arr.length === 0) return;
            const content = arr.join("|").toLowerCase();
            const ms = content.match(this.kreg);
            const msd = { word: "count" };
            for (const item of ms)
                !common_words.includes(item) &&
                    (msd[item] ? (msd[item] += 1) : (msd[item] = 1));
            data2Excel.dic_toExcel(msd, name + "_" + Date.now(), "words");
        },
        async title_translate() {
            if (!this.title_content || this.title_content.length === 0) return;
            const content = this.title_content.join("|").toLowerCase();
            const ms = content.match(this.kreg);
            const arr = [];
            const dic = {};
            for (const m of ms) {
                if (common_words.includes(m)) continue;
                dic[m] ? (dic[m] += 1) : (dic[m] = 1);
            }
            console.log('开始抓取翻译数据, 稍等1-3分钟');
            for (const inf of Object.entries(dic)) {
                const di = {};
                di.word = inf[0];
                di.count = inf[1];
                try {
                    Youdao.is_anti
                        ? (di.translation = await Youdao.other(inf[0]))
                        : (di.translation = await Youdao.main(inf[0]));
                } catch (e) {
                    di.translate = "N/A";
                    console.log(e);
                }
                await wait_time(random_range(50, 350));
                arr.push(di);
            }
            data2Excel.json_toExcel(arr, "title_" + Date.now(), "data");
        },
        statistic() {
            this.word_Segment(this.review_content, "review");
            this.word_Segment(this.description_content, "description");
        },
        write_toExcel(wbname, shname) {
            if (this.storage && this.storage.length > 0)
                data2Excel.json_toExcel(
                    this.storage,
                    wbname + "_" + Date.now(),
                    shname
                );
        },
        //提取页面的所有产品链接
        async search_get_list(dom, keyword) {
            if (!dom) return;
            const m = dom.getElementsByClassName("s-matching-dir");
            if (m.length === 0) {
                this.no_more = true;
                return;
            }
            const links = m[0].getElementsByClassName("a-link-normal s-no-outline");
            for (const link of links) {
                const href = link.href;
                if (href.includes("picassoRedirect") || !href.includes('/dp/')) continue;
                await this.get_item_info(href, keyword);
            }
        },
        //抓取当前页面的数据
        async search_single_page(keyword) {
            await this.search_get_list(document, keyword || this.currnt_keyword);
            if (!keyword) this.destroy_container(this.currnt_keyword, 'detail');
        },
        /*
        假如当前页面是抓取页面的起始页面
        如果不指定起始页面, 则, 从1开始, 如果不指定截止页面则3截止(爬取3页, 约: 3 * 48 = 144)
        */
        async search_multi_page(start = 1, end = 3) {
            if (start === end) {
                alert("请指定合适的起始页和截止页面");
                return;
            }
            const reg = /(?<=&page=)\d+(?=&)/;
            const ms = href.match(reg);
            let href = this.current_url;
            const keyword = this.currnt_keyword;
            let index = href.indexOf("&qid");
            if (ms) {
                const cstart = parseInt(ms[0]);
                if (start === cstart) {
                    await this.search_single_page(keyword);
                    start++;
                }
            }
            if (0 > index) index = href.indexOf("&ref");
            if (index > 0) href = href.slice(0, index);
            end++;
            for (start; start < end; start++) {
                href = `${href}&page=${start}`;
                try {
                    const r = xmlHTTPRequest(href);
                    const dom = html2Dom(r);
                    await this.search_get_list(dom, keyword);
                } catch (e) {
                    console.log(e);
                }
                if (this.no_more) break;
            }
            this.destroy_container(keyword + start + '-' + end, 'detail');
        },
        //获取top sellers商品的基础信息
        async top_sell_list(url) {
            try {
                const r = await xmlHTTPRequest(url);
                if (!r) return null;
                const dom = html2Dom(r);
                const lists = dom.getElementsByClassName("zg-item-immersion");
                for (const item of lists) {
                    const dic = {
                        id: "N/A",
                        title: "N/A",
                        price: "N/A",
                        url: "N/A",
                        pic: "N/A",
                    };
                    const title = item.getElementsByClassName(
                        "p13n-sc-truncate-desktop-type2"
                    );
                    if (title.length > 0) dic.title = title[0].innerText.trim();
                    const price = item.getElementsByClassName("p13n-sc-price");
                    if (price.length > 0) dic.price = price[0].innerText;
                    const url = item.getElementsByClassName("a-link-normal");
                    if (url.length > 0) {
                        dic.url = url[0].href;
                        const ms = dic.url.match(this.reg);
                        if (ms) dic.id = ms[0];
                    }
                    const pic = item.getElementsByTagName("img");
                    if (pic.length > 0) dic.pic = pic[0].src;
                    this.storage.push(dic);
                }
            } catch (e) {
                console.log(e);
                console.log("some error on get top sell");
            }
        },
        //获取详细的top_sellers的信息
        async top_sell_detail(url) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                const lists = dom.getElementsByClassName("zg-item-immersion");
                for (const item of lists) {
                    const a = item.getElementsByClassName("a-link-normal");
                    const r = await this.get_item_info(a[0].href, "N/A");
                    this.storage.push(r);
                }
            } catch (e) {
                console.log(e);
            }
        },
        /*
            提供两种抓取模式:
            1. 仅抓基础的数据
            2. 抓取具体的数据
            */
        async top_sellers(mode) {
            const links = document.getElementsByClassName("a-pagination");
            if (links.length > 0) {
                if (!this.storage) this.container_initial();
                let title = document.title;
                const reg = /[,&]/g;
                title = title.slice(title.indexOf(": ") + 1).trim();
                title = title.replace(reg, "_");
                const [method, wbname, shname] = mode
                    ? ["top_sell_detail", title + "_detail_", "data"]
                    : ["top_sell_list", title + "_list_", "data"];
                const chs = links[0].children;
                for (const c of chs) {
                    if (this.icount_test > 10) break;
                    const cn = c.className;
                    if (cn && (cn === "a-normal" || cn === "a-selected")) {
                        const a = c.children[0];
                        await this[method](a.href);
                    }
                }
                this.destroy_container(wbname, shname);
            }
        },
        //提供两个位置爬取数据, 产品页面, 评论页面
        //抓取前7页的数据
        review_count: 0,
        async get_review(url) {
            if (this.review_count > 9) return;
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                const reviews = dom.getElementsByClassName(
                    "a-section review aok-relative"
                );
                for (const review of reviews) {
                    const dic = {
                        stars: 0,
                        time: "N/A",
                        country: "N/A",
                        helpful: 0,
                        content: "N/A",
                    };
                    const r = review.getElementsByClassName("a-icon-alt");
                    if (r.length > 0) {
                        const t = r[0].innerText;
                        const ms = t.match(this.nreg);
                        if (ms) dic.stars = parseFloat(ms[0]);
                    }
                    const c = review.getElementsByClassName(
                        "a-size-base review-text review-text-content"
                    );
                    if (c.length > 0) {
                        const tmp = c[0].innerText.trim();
                        this.review_content.push(tmp);
                        dic.content = tmp;
                    }
                    const co = review.getElementsByClassName(
                        "a-size-base a-color-secondary review-date"
                    );
                    if (co.length > 0) {
                        const t = co[0].innerText;
                        const isn = t.indexOf("in");
                        const esn = t.indexOf("on");
                        if (isn > 0 && esn > 0) dic.country = t.slice(isn + 2, esn).trim();
                        if (esn > 0) dic.time = t.slice(esn + 2).trim();
                    }
                    const help = review.getElementsByClassName(
                        "a-size-base a-color-tertiary cr-vote-text"
                    );
                    if (help.length > 0) {
                        const t = help[0].innerText;
                        if (t) dic.helpful = t.includes('One person') ? 1 : parseInt(t.slice(0, t.indexOf("people")).trim());
                    }
                    this.storage.push(dic);
                }
                const next = dom.getElementsByClassName("a-last");
                if (next.length > 0) {
                    const a = next[0].getElementsByTagName("a");
                    if (a.length > 0) {
                        const href = a[0].href;
                        if (href) {
                            this.review_count += 1;
                            await this.get_review(href);
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        async reviews() {
            const href = this.current_url;
            this.review_count = 0;
            if (!this.storage) this.container_initial();
            if (href.includes("/product-reviews/")) {
                console.log("");
            } else {
                const ms = href.match(this.reg);
                const id = ms ? ms[0] + '_review_' : 'review';
                const f = document.getElementById("reviews-medley-footer");
                if (f) {
                    const a = f.getElementsByTagName("a");
                    if (a.length > 0) {
                        await this.get_review(a[0].href);
                        this.destroy_container(id, 'review');
                    }
                }
            }
        },
        popup() { },
        start() {
            const href = this.current_url;
            //best selllers webpage
            if (
                !href.includes("gp/bestsellers/") &&
                (href.includes("bestsellers") || href.includes("Best-Sellers"))
            ) {
                const button =
                    '<button class="assist-button all" style="color: black;" title="抓取商品数据详情">全部数据</button>';
                createButton("数据摘要", "仅抓取商品的基础数据", button);
                setTimeout(() => {
                    document
                        .getElementById("assist-button-container")
                        .addEventListener("click", (e) => {
                            const tc = e.target.className;
                            this.top_sellers(tc.endsWith("all"));
                        });
                }, 100);
                //product listing webpage
            } else if (href.includes("/dp/")) {
                const button =
                    '<button class="assist-button all" style="color: black;" title="抓取商品数据详情">商品数据</button>';
                createButton("评论数据", "抓取商品的全部评论数据(默认抓取前10页)", button);
                setTimeout(() => {
                    document
                        .getElementById("assist-button-container")
                        .addEventListener("click", (e) => {
                            const tc = e.target.className;
                            const url = this.current_url;
                            if (tc.endsWith("all")) {
                                this.container_initial();
                                const dic = this.get_item_detail(document, url);
                                if (dic) {
                                    this.get_rank(dic);
                                    const arr = this.get_variation();
                                    arr
                                        ? (dic.variation = arr.join("; "))
                                        : (dic.variation = "N/A");
                                    this.storage.push(dic);
                                }
                                const id = url.match(this.reg)[0];
                                this.destroy_container(id + '_detail_', 'detail');
                            } else this.reviews();
                        });
                }, 100);
                // search webpage
            } else if (href.startsWith("https://www.amazon.com/s?k")) {
                const button =
                    '<button class="assist-button all" style="color: black;" title="抓取当前页面数据">单一页面</button>';
                createButton("多页面", "抓取多页面数据(默认抓取3页)", button);
                setTimeout(() => {
                    document
                        .getElementById("assist-button-container")
                        .addEventListener("click", (e) => {
                            const tc = e.target.className;
                            this.container_initial()
                            if (tc.endsWith("all")) this.search_single_page();
                            else this.search_multi_page();
                        });
                }, 100);
            }
            document.addEventListener("keydown", (e) => {
                const code = e.code;
                if (!e.shiftKey || e.target.localName === "input") return;
                if (code === "KeyA") multi_search.main("Amazon");
                else {
                    const s = window.getSelection().toString().trim();
                    const reg = /[^\x00-\xff]/;
                    if (!s || s.match(reg)) return;
                    if (code === "KeyG") google_trends.main(s);
                    else if (code === "KeyK") amz123.main(s);
                    else if (code === "KeyY") Youdao.main(s).then((r) => console.log(r));
                }
            });
            GM_registerMenuCommand("清理Youdao", youdao_clear.setup);
        },
    };
    location.hostname.startsWith("fanyi") ? youdao_clear.action() : Amazon.start();
})();
