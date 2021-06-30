// ==UserScript==
// @name         Amazon_Assistant
// @namespace    https://github.com/Kyouichirou
// @version      1.0
// @description  make thing better and simpler
// @author       HLA
// @match        https://www.amazon.com/
// @connect      www.amazon.com
// @connect      www.amz123.com
// @connect      fanyi.youdao.com
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @noframes
// @require      https://cdn.bootcdn.net/ajax/libs/xlsx/0.17.0/xlsx.core.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==
(() => {
    const html2Dom = (html) => new DOMParser().parseFromString(html, 'text/html');
    const data2Excel = {
        s2ab(s) {
            let buf = new ArrayBuffer(s.length);
            let view = new Uint8Array(buf);
            for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        },
        sheet2blob(sheet, sheetName) {
            sheetName = sheetName || 'sheet1';
            let workbook = {
                SheetNames: [sheetName],
                Sheets: {}
            };
            workbook.Sheets[sheetName] = sheet;
            // 生成excel的配置项
            let wopts = {
                bookType: 'xlsx', // 要生成的文件类型
                bookSST: false, // 是否生成Shared String Table, 官方解释是, 如果开启生成速度会下降, 但在低版本IOS设备上有更好的兼容性
                type: 'binary'
            };
            let wbout = XLSX.write(workbook, wopts);
            let blob = new Blob([this.s2ab(wbout)], { type: "application/octet-stream" });
            // 字符串转ArrayBuffer
            return blob;
        },
        openDownloadDialog(url, saveName) {
            if (typeof url == 'object' && url instanceof Blob) url = URL.createObjectURL(url); // 创建blob地址
            let aLink = document.createElement('a');
            aLink.href = url;
            aLink.download = saveName || ''; // HTML5新增的属性, 指定保存文件名, 可以不要后缀, 注意, file:///模式下不会生效
            let event;
            if (window.MouseEvent) event = new MouseEvent('click');
            else {
                event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            }
            aLink.dispatchEvent(event);
            URL.revokeObjectURL(url)
        },
        json_toExcel(data, wbname, shname) {
            const sheet = XLSX.utils.json_to_sheet(data);
            this.openDownloadDialog(this.sheet2blob(sheet, shname), `${wbname}.xlsx`);
        },
        // dic => sheet, 表头在创建字典时, 首先放进去
        dic_toExcel(data, wbname, shname) {
            const sheet = XLSX.utils.aoa_to_sheet(Object.entries(data));
            this.openDownloadDialog(this.sheet2blob(sheet, shname), `${wbname}.xlsx`);
        }
    };
    const multi_search = {
        search(code, keyword) {
            const engines = {
                'Amazon': 'https://www.amazon.com/s?k='
            }
            const s = engines[code];
            s && GM_openInTab(s + keyword, { insert: true, active: true })
        },
        main(code) {
            const s = window.getSelection().toString();
            if (s && s.length > 1) this.search(code, s)
        }
    };
    const Youdao = {
        YoudaoRequest = (url, data, time = 10000, rType = false) => {
            //必须设置内容类型, 否则将导致50 error
            const header = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://fanyi.youdao.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; rv:51.0) Gecko/20100101 Firefox/51.0',
            }
            return new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: header,
                    timeout: time,
                    data: data,
                    cookie: 'OUTFOX_SEARCH_USER_ID=-803783997@10.169.0.81',
                    onload: (response) => {
                        if (response.status == 200)
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
            const c = 'Tbh5E8=q6U3EXe+&L[4c@';
            const a = 'fanyideskweb';
            return md5(a + keyword + salt + c)
        },
        main(keyword) {
            const salt = this.get_salt;
            const dic = {
                'i': keyword,
                'from': 'AUTO',
                'to': 'AUTO',
                'smartresult': 'dict',
                'client': 'fanyideskweb',
                'salt': salt,
                'sign': this.get_sign(salt, keyword),
                'doctype': 'json',
                'version': '2.1',
                'keyfrom': 'fanyi.web',
                'action': 'FY_BY_CL1CKBUTTON',
                'typoResult': 'true'
            }
            let data = "";
            for (const e of Object.entries(dic)) data = data + e[0] + '=' + e[1] + '&';
            data = data.slice(0, data.length - 1);
            const api = 'http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule';
            this.YoudaoRequest(api, data).then(
                (r) => {
                    const j = JSON.parse(r);
                    const r = j['smartResult']['entries'];
                    return r.join(';')
                },
                () => console.log('error')
            )
        }
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
        console.log('start: ' + url);
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: time,
                onload: (response) => {
                    if (response.status == 200)
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
    //注意url的参数要设置为字符串, 无法直接处理字典
    const google_trends = {
        async get_token(keyword) {
            const dic = {
                hl: "en-US",
                tz: -480,
                reg: {
                    comparisonItem: [{ keyword: keyword, geo: "US", time: "today 12-m" }], category: 0, property: ""
                },
                tz: -480
            }
            let data = "";
            const url = `https://trends.google.com/trends/api/explore?${data}`;
            try {
                const r = await xmlHTTPRequest(url);
                const j = JSON.parse(r.slice(4));
                return j['widgets'][0]['token']
            } catch (e) {
                console.log('fail to get google trends api token');
                return null;
            }
        },
        async get_data(token, keyword) {
            const dic = {
                hl: "en-US",
                tz: -480,
                req: {
                    time: "2020-06-30-2021-06-30",
                    resolution: "WEEK",
                    local: "en-US",
                    comparisonItem: [{
                        geo: { country: "US" },
                        complexKeywordsRestriction: {
                            keyword: [{ type: "BROD", value: keyword }]
                        }
                    }
                    ],
                    requestOptions: {
                        property: "",
                        backend: "IZG",
                        category: 0
                    }
                },
                token: token,
                tz: -480
            };
            const api = `https://trends.google.com/trends/api/widgetdata/multiline?${JSON.stringify(dic)}`
            try {
                const r = await xmlHTTPRequest(api)
                const j = JSON.parse(r.slice(4));
                const datas = j['default']['timelineData'];
                const arr = [];
                for (const data of datas) {
                    const tdic = {};
                    tdic.formattedAxisTime = data['formattedAxisTime']
                    tdic.value = data['value'][0];
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
                const data = await this.get_data(token, keyword)
                if (data) data2Excel.main(data, `google_trends_${keyword}_${Date.now()}`, 'data');
            }
        }
    };
    const amz123 = {
        async get_data(url) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = new DOMParser().parseFromString(r, 'text/html')
                const table = dom.getElementsByClassName('table-wrapper');
                if (table.length > 0) {
                    const datas = table[0].getElementsByClassName('listdata');
                    const arr = [];
                    for (const data of datas) {
                        const dic = {};
                        const items = data.children;
                        const link = items[0].children[0];
                        dic.keyword = link.innerText;
                        dic.nrank = items[1].innerText;
                        dic.lrank = items[2].innerText;
                        const tmp = items[3].children[0];
                        const tx = tmp.className;
                        if (tx.includes('shangsheng')) {
                            dic.crank = tmp.parentNode.innerText.trim();
                            dic.status = 'u';

                        } else if (tx.includes('xiajiang')) {
                            dic.crank = tmp.parentNode.innerText.trim();
                            dic.status = 'd';
                        } else {
                            dic.status = '-';
                            dic.crank = '-'
                        }
                        dic.url = link.href;
                        arr.push(dic);
                    }
                    data2Excel.json_toExcel(arr, 'Amazon热搜词Top500', 'hotwords');
                } else console.log('无相关热词检索数据');
            } catch (e) {
                console.log(e)
            }
        },
        async main(keyword) {
            const url = keyword ? `https://www.amz123.com/usatopkeywords-1-1-${keyword}.htm` : 'https://www.amz123.com/usatopkeywords';
            this.get_data(url);
        }
    }
    const Amazon = {
        storage: null,
        reg: null,
        review_content: null,
        title_content: null,
        description_content: null,
        get current_url() {
            return location.href;
        },
        async get_item_info(url) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = new DOMParser().parseFromString(r, "text/html");
                const title = dom.getElementById("productTitle");
                const dic = {
                    id: "N/A",
                    title: "N/A",
                    price: 0,
                    description: 'N/A',
                    rate: 0,
                    reviews: 0,
                    review: "N/A",
                    keyword: keyword,
                    url: url,
                };
                if (title) {
                    const ms = href.match(this.reg);
                    if (ms) {
                        dic.id = ms[0];
                        if (title) {
                            const tmp = title.innerText;
                            dic.title = title.tmp;
                            this.title.push(tmp)
                        }
                        const price = dom.getElementById("priceblock_ourprice");
                        if (price) {
                            const t = price.innerText;
                            const ms = t.match(t)
                            if (ms) {
                                let p = 0;
                                if (ms.length > 1) {
                                    const s = parseFloat(ms[0]);
                                    const e = parseFloat(ms[1]);
                                    p = ((s + e) / 2 * 100) / 100;
                                } else p = parseFloat(ms[0]);
                                dic.price = p;
                            }
                        }
                        const reviews = dom.getElementsByClassName(
                            "a-expander-content reviewText review-text-content a-expander-partial-collapse-content"
                        );
                        const arr = [];
                        for (const r of reviews) arr.push(r.innerText);
                        if (arr.length > 0) {
                            const tmp = arr.join("|\n");
                            dic.review = tmp;
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
                        const de = document.getElementById('feature-bullets');
                        if (de) {
                            const tmp = de.innerText;
                            dic.description = tmp;
                            this.description.push(tmp);
                        }
                        return dic;
                    } else console.log('no id of: ' + href);
                } else {
                    console.log("fail: " + href);
                }
            } catch (e) {
                console.log(e);
            }
            return null
        },
        /*
        从当前页抓取 => 指定截止页面(或最后的搜索页面)
        或者返回初始页抓取 =>
        指定任意两个页面
        */
        container_initial() {
            this.reg = /(?<=dp\/)\w+(?=\/)/;
            this.nreg = /\d+([\.,]\d+)?/g;
            this.kreg = /[a-z]{2,}/gi;
            this.storage = [];
            this.title_content = []
            this.review_content = [];
            this.description_content = [];
        },
        destroy_container() {
            this.reg = null;
            this.nreg = null;
            this.kreg = null;
            this.storage = null;
            this.title_content = null;
            this.review_content = null;
            this.description_content = null;
            alert('执行操作完毕');
        },
        search() {
            const href = this.current_url;
            if (!href.startsWith('https://www.amazon.com/s?k')) {
                alert('当前页面为非搜索页面');
                return;
            }
            const reg = /(?<=&page=)\d+(?=&)/;
            const ms = href.match(reg);
            if (ms) { }

        },
        async top_sell_list() {
            try {
                const r = await xmlHTTPRequest(url);
                if (!r) return null;
                const dom = html2Dom(r);
                const lists = dom.getElementsByClassName('zg-item-immersion');
                for (const item of lists) {
                    const dic = {
                        id: 'N/A',
                        title: 'N/A',
                        price: 'N/A',
                        url: 'N/A',
                    }
                    const title = item.getElementsByClassName('p13n-sc-truncate-desktop-type2 p13n-sc-truncated');
                    if (title.length > 0) dic.title = title[0].innerText;
                    const price = item.getElementsByClassName('p13n-sc-price');
                    if (price.length > 0) dic.price = price[0].innerText;
                    const url = item.getElementsByClassName('a-link-normal');
                    if (url.length > 0) {
                        dic.url = url[0].href;
                        const ms = dic.url.match(this.reg);
                        if (ms) dic.id = ms[0];
                    }
                    this.storage.push(dic);
                }
            } catch (e) {
                console.log(e);
                console.log('some error on get top sell');
            }
        },
        async to_sell_detail(url) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                const lists = dom.getElementsByClassName('zg-item-immersion');
                for (const item of lists) {
                    const a = item.getElementsByClassName('a-link-normal')
                    await this.get_item_info(a[0].href);
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
            this.container_initial();
            const links = document.getElementsByClassName('a-pagination');
            const method = mode ? 'to_sell_detail' : 'to_sell_list';
            if (links.length > 0) {
                const chs = links[0].children;
                for (const c of chs) {
                    const cn = c.className;
                    if (cn && (cn === 'a-normal' || cn === 'a-selected')) {
                        const a = c.children[0];
                        await this[method](a.href);
                    }
                }
            }
            this.destroy_container();
        },
        //提供两个位置爬取数据, 产品页面, 评论页面
        async get_review(url) {
            try {
                const r = await xmlHTTPRequest(url);
                const dom = html2Dom(r);
                const reviews = dom.getElementsByClassName('a-section review aok-relative');
                for (const review of reviews) {
                    const dic = {
                        stars: 0,
                        time: 'N/A',
                        country: 'N/A',
                        helpful: 0,
                        content: 'N/A',
                    }
                    const c = review.getElementsByClassName('a-size-base review-text review-text-content');
                    const r = review.getElementsByClassName('a-icon-alt');
                    if (r.length > 0) {
                        const t = r[0].innerText;
                        const ms = t.match(this.reg);
                        if (ms) dic.stars = ms[0];
                    }
                    if (c.length > 0) dic.content = c[0].innerText;
                    const co = review.getElementsByClassName('a-size-base a-color-secondary review-date');
                    if (co.length > 0) {
                        const t = co[0].innerText;
                        const isn = t.indexOf('in')
                        const esn = t.indexOf('on')
                        if (isn > 0 && esn > 0) dic.country = t.slice(isn + 1, esn).trim();
                        else if (esn > 0) dic.time = t.slice(esn + 1).trim();
                    }
                    const help = review.getElementsByClassName('a-size-base a-color-tertiary cr-vote-text');
                    if (help.length > 0) {
                        const t = help[0].innerText;
                        if (t) dic.helpful = t.slice(0, t.indexOf('people')).trim();
                    }
                    this.storage.push(dic)
                }
                const next = dom.getElementsByClassName('a-last');
                if (next.length > 0) {
                    const a = next[0].getElementsByTagName('a');
                    if (a.length > 0) {
                        const href = a[0].href;
                        if (href) await this.get_review(href);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        reviews() {
            const href = this.current_url;
            if (href.includes('/product-reviews/')) {
                console.log('')
            } else {
                this.reg = /\d[\.\d]?/;
                const f = document.getElementById('reviews-medley-footer');
                if (f) {
                    const a = f.getElementsByTagName('a');
                    if (a.length > 0) this.get_review(a[0].href)
                }
            }
        },
        start() {
            const href = this.current_url;
            if (href.includes('bestsellers') || href.includes('Best-Sellers')) {
                const button = '<button class="assist-button all" style="color: black;" title="抓取商品数据详情">全部数据</button>';
                createButton('数据摘要', '仅抓取商品的基础数据', '');
                setTimeout(() => {
                    document.getElementById('assist-button-container').addEventListener('click', (e) => {
                        const tc = e.target.className;
                        this.top_sellers(tc.endsWith('all'))
                    });
                }, 100);
            } else if (href.includes('/dp/')) {

            }
            document.addEventListener('keydown', (e) => {
                const code = e.code;
                if (!e.shiftKey || e.target.localName === 'input') return;
                if (code === 'keyA') multi_search.main('Amazon');
                else {
                    const s = window.getSelection().toString();
                    const reg = /[^\x00-\xff]/;
                    if (!s || s.match(reg)) return;
                    if (code === 'keyG') google_trends.main(s);
                    else if (code === 'keyK') amz123.main(s);
                }
            });
        }
    };
})();
