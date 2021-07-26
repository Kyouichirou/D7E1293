// ==UserScript==
// @name         WalMart_SKU_UPC
// @namespace    https://github.com/Kyouichirou
// @version      1.0
// @description  get product's upc with sku from specific api
// @author       HLA
// @updateURL    https://github.com/Kyouichirou/D7E1293/raw/Kyouichirou-patch-1/Tmapermonkey/walmart_sku_upc.user.js
// @match        https://www.walmart.com/ip/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      www.walmart.com
// @icon         https://www.walmart.com/favicon.ico
// @noframes
// ==/UserScript==

(function () {
    'use strict';
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
    //must setup sepcific format request content type
    //otherwise, this will cause 415 format problem
    //anonymous, disable send cookie to server
    const xmlHTTPRequest = (url, time = 3000, data) => {
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                timeout: time,
                data: data,
                anonymous: true,
                headers: { "Content-Type": "application/json" },
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
    };
    const walmart = {
        get_json() {
            //direct get upc from webpage, pay attention: some products do not have upc id;
            const item = document.getElementById('item');
            if (item) {
                const js = item.innerText;
                if (js) {
                    try {
                        const json = JSON.parse(js);
                        return json;
                    } catch (e) {
                        return null;
                    }
                }
            }
            return null;
        },
        inject(info) {
            const html = `
            <div
                id="sku_upc"
                style="
                    opacity: 0.95;
                    right: 8%;
                    width: 60px;
                    flex-direction: column;
                    position: fixed;
                    bottom: 35%;
                "
            >
                <div class="content">
                    <p style="min-width: 160px; font-weight: 600">Product_IDs:</p>
                    <table
                        class="content_table"
                        style="
                            border-radius: 0 1px 1px 0;
                            border: #888888 solid 1.2px;
                            display: inline-block;
                            margin-top: 4px;
                            font-size: 14px;
                            justify-content: center;
                            min-width: 160px;
                            min-height: 85px;
                            box-shadow: 1px 4px 1px #888888;
                            padding: 3.5px;
                        "
                    >
                        <tbody>
                            <tr class="sku">
                                <th>SKU:</th>
                                <td style="text-decoration: underline" title="点击复制内容">${info.sku}</td>
                            </tr>
                            <tr class="upc">
                                <th>UPC:</th>
                                <td style="text-decoration: underline" title="点击复制内容">${info.upc}</td>
                            </tr>
                            <tr class="product">
                                <th>PID:</th>
                                <td style="text-decoration: underline" title="点击复制内容">${info.pid}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
            document.documentElement.insertAdjacentHTML('beforeend', html);
            setTimeout(() => {
                this.node = document.getElementById('sku_upc').getElementsByClassName('content_table')[0];
                this.node.addEventListener('click', (e) => {
                    const t = e.target;
                    const c = t.innerText;
                    if (c) {
                        navigator.clipboard.writeText(c);
                        Notification('内容已复制到剪切板', '提示');
                    }
                })
            }, 100);
        },
        node: null,
        change(info) {
            const chs = this.node.children[0].children;
            chs[0].children[1].innerText = info.sku;
            chs[1].children[1].innerText = info.upc;
            chs[2].children[1].innerText = info.pid;
        },
        get_api_json(sku) {
            const API = "https://www.walmart.com/terra-firma/fetch?rgs=BUY_BOX_PRODUCT_IDML";
            const data = `{"itemId": "${sku}"}`;
            xmlHTTPRequest(API, 10000, data).then(
                (r) => {
                    const j = JSON.parse(r);
                    const item = j["payload"]["buyBox"]["products"][0];
                    const info = {
                        sku: 'N/A',
                        upc: 'N/A',
                        pid: 'N/A'
                    };
                    info.sku = sku;
                    const upc = item['upc'];
                    if (!upc) console.log(item);
                    info.upc = upc || '此商品缺失UPC';
                    info.pid = item['productId'];
                    this.node ? this.change(info) : this.inject(info);
                },
                (e) => {
                    console.log(`fail to get detail of ${sku}`);
                }
            )
        },
        event() {
            const flex = document.getElementsByClassName('variants__list contents__list');
            if (flex.length > 0) {
                const config = { childList: true, subtree: true, attributes: true };
                let time_id = null;
                const observer = new MutationObserver(() => {
                    if (time_id) clearTimeout(time_id);
                    time_id = setTimeout(() => {
                        let sku = this.get_sku();
                        if (sku !== this.current_sku) {
                            this.current_sku = sku;
                            this.get_api_json(sku);
                        }
                    }, 500);
                });
                observer.observe(flex[0], config);
            } else console.log('failed to create monitor');
        },
        get_info(json) {
            try {
                const info = {
                    sku: 'N/A',
                    upc: null,
                    pid: 'N/A'
                };
                const product = json['item']['product']['buyBox']['products'][0];
                if (product) {
                    info.sku = product['usItemId'];
                    info.pid = product['productId'];
                    info.upc = product['upc'];
                }
                info.upc ? this.node ? this.change(info) : this.inject(info) : this.get_api_json(this.current_sku);
            } catch (e) {
                this.get_api_json(this.current_sku);
                console.log(e)
            }
        },
        reg: null,
        current_sku: null,
        get_sku() {
            const ms = location.href.match(this.reg);
            return ms ? ms[0] : null;
        },
        initial() {
            this.reg = /\d+/;
            this.current_sku = this.get_sku();
            const json = this.get_json();
            json ? this.get_info(json) : console.log('no upc detail');
            this.event();
        }
    };
    walmart.initial();
})();
