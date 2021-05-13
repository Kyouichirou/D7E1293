// ==UserScript==
// @name         99_lib
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  try to take over the world!
// @author       HLA
// @match        file:///C:/Users/Lian/Documents/Tampermonkey/99_LIb.html
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      www.99csw.com
// @grant        unsafeWindow
// ==/UserScript==

(() => {
    "use strict";
    let bName = "";
    const xmlHTTPRequest = (url, time = 3500, rType = false) => {
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: time,
                onload: (response) => {
                    if (response.status == 200) {
                        resolve(rType ? response.finalUrl : response.response);
                    } else {
                        console.log(`err: code ${response.status}`);
                        reject("request data error");
                    }
                },
                onerror: (e) => {
                    console.log(e);
                    reject("something error");
                },
                ontimeout: (e) => {
                    console.log(e);
                    reject("timeout error");
                },
            });
        });
    };
    const scroll = {
        toTop() {
            let hTop =
                document.documentElement.scrollTop || document.body.scrollTop;
            if (hTop === 0) return;
            const rate = 8;
            let sid = 0;
            const scrollToTop = () => {
                hTop =
                    document.documentElement.scrollTop ||
                    document.body.scrollTop;
                if (hTop > 0) {
                    sid = window.requestAnimationFrame(scrollToTop);
                    window.scrollTo(0, hTop - hTop / rate);
                } else {
                    sid !== 0 && window.cancelAnimationFrame(sid);
                }
            };
            scrollToTop();
        },
        toBottom() {
            //take care this, if the webpage adopts waterfall flow design
            const height =
                document.documentElement.scrollHeight ||
                document.body.scrollHeight;
            const sTop =
                document.documentElement.scrollTop || document.body.scrollTop;
            if (sTop >= height) return;
            let sid = 0;
            let shTop = 0;
            let rate = 6;
            const initial = 100;
            const scrollToBottom = () => {
                const hTop =
                    document.documentElement.scrollTop ||
                    document.body.scrollTop ||
                    initial;
                if (hTop < height && hTop > shTop) {
                    shTop = hTop;
                    sid = window.requestAnimationFrame(scrollToBottom);
                    window.scrollTo(0, hTop + hTop / rate);
                    rate += 0.2;
                } else {
                    sid !== 0 && window.cancelAnimationFrame(sid);
                    sid = 0;
                    rate = 6;
                }
            };
            scrollToBottom();
        },
    };
    const monitor = () => {
        let mo = new MutationObserver((events) => {
            let i = events.length;
            if (i === 3) {
            }
        });
        mo.observe(document.getElementsByTagName("pre")[0], {
            childList: true,
        });
    };
    const auto_select = (node) => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = new Range();
        range.selectNodeContents(node);
        selection.addRange(range);
    };
    const base64 = {
        map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        decode(meta) {
            let d = "";
            for (const e of meta) {
                if (e === "=") break;
                const c = this.map.indexOf(e).toString(2);
                d +=
                    {
                        1: "00000",
                        2: "0000",
                        3: "000",
                        4: "00",
                        5: "0",
                        6: "",
                    }[c.length] + c;
            }
            const m = d.match(/[0-1]{8}/g);
            return m.map((e) => String.fromCharCode(parseInt(e, 2))).join("");
        },
    };
    const content = {
        get_code(dom) {
            return dom.getElementsByTagName("meta")[4].content;
        },
        load(dom, chs, start) {
            const code = base64.decode(this.get_code(dom)).split(/[A-Z]+%/);
            console.log(code);
            debugger;
            let j = 0,
                arr = [];
            code.forEach((e, i) => {
                e = parseInt(e);
                if (e < 3) {
                    arr[e] = chs[i + start];
                    j++;
                } else {
                    arr[e - j] = chs[i + start];
                    j = j + 2;
                }
            });
            return arr;
        },
        get_start(chs) {
            let i = 0,
                k = 0;
            for (const c of chs) {
                const lname = c.localName;
                if (lname === "h2") k = i + 1;
                else if (lname === "div" && c.className !== 'chapter') break;
                i++;
            }
            return k;
        },
        init(dom) {
            const chs = dom.getElementById("content").children;
            return this.get_text(this.load(dom, chs, this.get_start(chs)));
        },
        get_text(arr) {
            return arr
                .map((node) => {
                    if (node.nodeType === 1) {
                        const cs = node.childNodes;
                        let text = "";
                        for (const c of cs)
                            c.nodeType === 3
                                ? (text += c.textContent)
                                : ["strong", "small"].includes(c.localName) &&
                                  (text += c.innerText);
                        return text ? text + "\n" : "";
                    }
                    return "";
                })
                .join("");
        },
    };
    const escapeHTML = (s) => {
        const reg = /“|&|’|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
        return typeof s !== "string"
            ? ""
            : s.replace(reg, ($0) => {
                  let c = $0.charCodeAt(0),
                      r = ["&#"];
                  c = c == 0x20 ? 0xa0 : c;
                  r.push(c);
                  r.push(";");
                  return r.join("");
              });
    };
    const Editable_doc = {
        mode: false,
        edit() {
            document.getElementsByTagName("pre")[0].contentEditable = this.mode
                ? "false"
                : "true";
            this.mode = !this.mode;
        },
    };
    const titleSlice = (str) => {
        let length = 0;
        let newstr = "";
        for (const e of str) {
            length += e.charCodeAt(0).toString(16).length === 4 ? 2 : 1;
            newstr += e;
            if (length > 18) return `${newstr}...`;
        }
        return newstr;
    };
    const liTag = (info) => {
        const html = `
            <li style="font-weight: ${info.style};">
                <span class="list num">${info.id}</span>
                <a
                    href=${"http://www.99csw.com" + info.href}
                    target="_self"
                    title=${escapeHTML(info.title)}
                    >${titleSlice(info.title)}</a
                >
            </li>`;
        return html;
    };
    const cancel_li_bold = (node, i = -1, mode) => {
        const list = (
            node || document.getElementsByClassName("article_lists")[0]
        ).children;
        for (const c of list) {
            if (c.style.fontWeight === "bold") {
                c.style.fontWeight = "normal";
                break;
            }
        }
        if (i > -1) {
            list[i].style.fontWeight = "bold";
            !mode && list[i].scrollIntoView();
        }
    };
    const get_Text = (url) => {
        xmlHTTPRequest(url).then(
            (response) => {
                const dom = new DOMParser().parseFromString(
                    response,
                    "text/html"
                );
                const text = content.init(dom);
                if (text) {
                    const pre = document.getElementsByTagName("pre")[0];
                    pre.innerText = text;
                    setTimeout(
                        () => pre.focus(),
                        setTimeout(() => scroll.toTop(), 50),
                        50
                    );
                } else alert("get content fail");
            },
            (err) => alert(err)
        );
    };
    const change = (href, title, i, mode, sm) => {
        if (Editable_doc.mode) {
            alert("please close editable mode");
            return;
        }
        get_Text(href);
        document.title = "99藏书 - " + bName + " - " + title;
        if (mode < 3) GM_setValue("mIndex", i);
        if (mode !== 2) cancel_li_bold(null, i, sm);
    };
    const event = (node, i) => {
        setTimeout(() => {
            node.onclick = (e) => {
                const t = e.target;
                if (t.localName === "a") {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    if (t.parentNode.style.fontWeight === "bold") return;
                    change(
                        t.href,
                        t.innerText,
                        parseInt(t.previousElementSibling.innerHTML) - 1,
                        0,
                        true
                    );
                    return false;
                }
            };
            node.children[i].scrollIntoView();
            node = null;
        }, 50);
    };
    const add_List = (arr, index, book) => {
        const node = document.getElementById("column_lists");
        const header = node.getElementsByClassName("header current column")[0];
        const a = header.firstElementChild;
        a.innerText = (bName = book.title) + "- 章节";
        a.href = book.href;
        let art = node.getElementsByClassName("article_lists")[0];
        art.innerHTML = arr
            .map((e, i) => {
                e.id = i + 1;
                e.style = index === i ? "bold" : "normal";
                return liTag(e);
            })
            .join("");
        event(art, index);
    };
    const new_book = () => {
        let pro = prompt("please input menus url");
        if (!pro || !(pro = pro.trim())) return;
        xmlHTTPRequest(pro).then(
            (response) => {
                const dom = new DOMParser().parseFromString(
                    response,
                    "text/html"
                );
                const dir = dom.getElementById("dir");
                if (dir) {
                    const urls = dir.getElementsByTagName("a");
                    if (urls.length === 0) {
                        alert("get menus fail");
                        return;
                    }
                    const hrefSlice = (href) => href.slice(10);
                    bName = dom
                        .getElementById("book_info")
                        .getElementsByTagName("h2")[0].innerText;
                    const href = hrefSlice(urls[0].href);
                    const title = urls[0].innerText;
                    const book = {};
                    book.href = pro;
                    book.title = bName;
                    const arr = [];
                    for (const h of urls) {
                        const info = {};
                        info.title = h.innerText;
                        info.href = hrefSlice(h.href);
                        arr.push(info);
                    }
                    GM_setValue("menus", arr);
                    change("http://www.99csw.com" + href, title, 0, 2);
                    add_List(arr, 0, book);
                    GM_setValue("book", book);
                    alert("get menus successfully");
                } else alert("get menus fail");
            },
            (err) => alert(err)
        );
    };
    const next = (mode) => {
        const menus = GM_getValue("menus");
        if (menus) {
            const mIndex = GM_getValue("mIndex");
            let i = mIndex ? mIndex : 0;
            mode === true ? ++i : mode === false && --i;
            if (i === menus.length) {
                alert("all content have been played");
                return;
            } else if (i < 0) {
                alert("no more content");
                return;
            }
            let k = 0;
            !(mode === true || mode === false) &&
                (add_List(menus, i, GM_getValue("book")), (k = 3));
            change(
                "http://www.99csw.com" + menus[i].href,
                menus[i].title,
                i,
                k
            );
        } else new_book();
    };
    const menus_list = () => {
        const html = `
            <div
            id="column_lists"
            style="
                top: 24px;
                width: 12%;
                font-size: 14px;
                box-sizing: border-box;
                padding: 0 10px 10px 1px;
                box-shadow: 0 1px 3px #ddd;
                border-radius: 4px;
                transition: width 0.2s ease;
                color: #333;
                background: #fefefe;
                -moz-user-select: none;
                -webkit-user-select: none;
                user-select: none;
                display: flex;
                z-index: 1;
                position: absolute;
                left: 1%;
            "
        >
            <style type="text/css">
                button.button {
                    margin: 15px 0px 5px 0px;
                    width: 60px;
                    height: 24px;
                    border-radius: 3px;
                    box-shadow: 1px 2px 5px #888888;
                }
                div#column_lists .list.num {
                    color: #fff;
                    width: 18px;
                    height: 18px;
                    text-align: center;
                    line-height: 18px;
                    background: #fff;
                    border-radius: 2px;
                    display: inline-block;
                    background: #00a1d6;
                }
                div#column_lists ul a:hover {
                    color: blue;
                }
                div#column_lists ul {
                    overflow: hidden auto;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    display: block;
                    line-height: 1.9;
                    height: 300px;
                }
                div#column_lists .header {
                    font-weight: bold;
                    font-size: 8px;
                }
            </style>
            <span
                class="right_column"
                style="margin-left: 2%; margin-top: 5px; width: 100%"
            >
                <span class="header current column">
                    <a
                        class="column name"
                        target="_blank"
                        title="open the page in 99csw"
                        style="font-size: 16px"
                    ></a>
                    <span
                        class="tips"
                        style="
                            float: right;
                            font-size: 14px;
                            font-weight: normal;
                        "
                    ></span>
                    <hr style="width: 220px" />
                </span>
                <ul class="article_lists" style="padding-left: 10px"></ul>
            </span>
        </div>`;
        document.documentElement.insertAdjacentHTML("beforeend", html);
    };
    (function init() {
        menus_list();
        setTimeout(() => {
            next();
            let nav = document.getElementById("reader_navigator");
            nav.children[1].onclick = () => next(false);
            nav.children[2].onclick = () => next(true);
            nav = null;
            unsafeWindow.addEventListener(
                "keydown",
                (e) => {
                    if (e.ctrlKey && e.code === " KeyA") {
                        e.stopImmediatePropagation();
                        auto_select(document.getElementsByTagName("pre")[0]);
                    } else if (e.shiftKey) {
                        const code = e.code;
                        if (code === "KeyC") new_book();
                        else if (code === "KeyT") scroll.toTop();
                        else if (code === "KeyB") scroll.toBottom();
                        else if (code === "KeyE") Editable_doc.edit();
                        else if (code === "ArrowLeft") next(false);
                        else if (code === "ArrowRight") next(true);
                    }
                },
                true
            );
            unsafeWindow.addEventListener(
                "visibilitychange",
                () =>
                    !document.hidden &&
                    document.getElementsByTagName("pre")[0].focus()
            );
        }, 50);
    })();
})();
