// ==UserScript==
// @name         zhihu optimizer _test
// @namespace    https://github.com/Kyouichirou
// @version      2.5.0
// @updateURL    https://github.com/Kyouichirou/D7E1293/raw/main/zhihu%20optimizer.user.js
// @description  make zhihu clean and tidy, for better experience
// @author       HLA
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @match        https://*.zhihu.com/*
// @compatible   chrome 80+; test on chrome 64(x86), some features don't work
// @license      MIT
// @noframes
// @note         more spam users of zhihu, https://zhuanlan.zhihu.com/p/127021293, it is recommended to block all of these users.
/* !*******************zhihu*******************************!
                www.zhihu.com/api/v4/creator/read_count_statistics*
                www.zhihu.com/api/v4/me?include=ad_type*
                www.zhihu.com/api/v4/search/top_search
                www.zhihu.com/zbst/events/r
                www.zhihu.com/api/v4/me/switches?include=is_creator
                www.zhihu.com/api/v4/commercial/ecommerce
                www.zhihu.com/api/v4/search/preset_words
                !*******************zhihu*******************************!*/
//note          add these rules to ublock or adblock => ensure the input box clear
// ==/UserScript==

(() => {
    "use strict";
    let blackName = null;
    const blackKey = ["留学中介", "肖战"];
    const mergeArray = (origin, target) => {
        origin = origin.concat(target);
        const newArr = [];
        const tmpObj = {};
        for (const e of origin) {
            if (!tmpObj[e]) {
                newArr.push(e);
                tmpObj[e] = 1;
            }
        }
        return newArr;
    };
    const getSelection = () => {
        const select = window.getSelection();
        return select ? select.toString().trim() : null;
    };
    const Notification = (content = "", title = "", duration = 2500, func) => {
        GM_notification({
            text: content,
            title: title,
            timeout: duration,
            onclick: func,
        });
    };
    const zhihu = {
        getData() {
            blackName = GM_getValue("blackname");
            (!blackName || !Array.isArray(blackName)) && (blackName = []);
        },
        clipboardClear() {
            const cs = [
                /。/g,
                /：/g,
                /；/g,
                /？/g,
                /！/g,
                /（/g,
                /）/g,
                /“/g,
                /”/g,
                /、/g,
                /，/g,
            ];
            const es = [
                ". ",
                ": ",
                "; ",
                "? ",
                "! ",
                "(",
                ")",
                '"',
                '"',
                ", ",
                ", ",
            ];
            document.oncopy = (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                let copytext = getSelection();
                if (!copytext) return;
                cs.forEach((s, i) => (copytext = copytext.replace(s, es[i])));
                window.navigator.clipboard.writeText(copytext);
            };
        },
        multiSearch(keyCode) {
            const Names = {
                65: "AboutMe",
                68: "Douban",
                71: "Google",
                72: "Github",
                77: "MDN",
                66: "BiliBili",
                90: "Zhihu",
            };
            const methods = {
                Protocols: "https://",
                Search(url) {
                    const select = getSelection();
                    if (!select || select.length > 75) return;
                    url += encodeURIComponent(select);
                    window.open(this.Protocols + url, "_blank");
                },
                Google() {
                    this.Search("www.dogedoge.com/results?q=");
                },
                Douban() {
                    this.Search("www.douban.com/search?q=");
                },
                Zhihu() {
                    this.Search("www.zhihu.com/search?q");
                },
                MDN() {
                    this.Search("developer.mozilla.org/zh-CN/search?q=");
                },
                Github() {
                    this.Search("github.com/search?q=");
                },
                BiliBili() {
                    this.Search("search.bilibili.com/all?keyword=");
                },
                AboutMe() {
                    zhihu.shade.Support.main();
                },
            };
            const name = Names[keyCode];
            name && methods[name]();
        },
        noteHightlight: {
            editable: null,
            EditDoc() {
                const m =
                    document.body.contentEditable === "true"
                        ? "inherit"
                        : "true";
                document.body.contentEditable = m;
                this.editable = m;
                const t =
                    m === "true" ? "page editable mode" : "exit editable mode";
                Notification(t, "Editable");
            },
            get Selection() {
                return window.getSelection();
            },
            setMark(color, text) {
                return `<mark class="AssistantMark" style="box-shadow: ${color} 0px 0px 0.35em;background-color: ${color} !important">${text}</mark>`;
            },
            get createElement() {
                return document.createElement("markspan");
            },
            appendNewNode(node, color) {
                const text = node.nodeValue;
                const span = this.createElement;
                node.parentNode.replaceChild(span, node);
                span.outerHTML = this.setMark(color, text);
            },
            getTextNode(node, color) {
                node.nodeType === 3 && this.appendNewNode(node, color);
            },
            Marker(keyCode) {
                const cname = {
                    82: "red",
                    89: "yellow",
                    80: "purple",
                    71: "green",
                };
                let color = cname[keyCode];
                if (!color) return;
                const select = this.Selection;
                if (!select.anchorNode || select.isCollapsed) return;
                const colors = {
                    red: "rgb(255, 128, 128)",
                    green: "rgb(170, 255, 170)",
                    yellow: "rgb(255, 255, 170)",
                    purple: "rgb(255, 170, 255)",
                };
                let i = select.rangeCount;
                const r = select.getRangeAt(--i);
                let start = r.startContainer;
                const end = r.endContainer;
                const offs = r.startOffset;
                const offe = r.endOffset;
                color = colors[color];
                let nodeValue = r.startContainer.nodeValue;
                if (start !== end) {
                    //start part
                    let next = start.nextSibling;
                    let p = start.parentNode;
                    if (p.className !== "AssistantMark") {
                        const text = nodeValue.slice(offs);
                        const span = this.createElement;
                        p.replaceChild(span, start);
                        span.outerHTML =
                            nodeValue.slice(0, offs) +
                            this.setMark(color, text);
                    }
                    //mid part
                    while (true) {
                        if (next) {
                            start = next;
                        } else {
                            next = p.nextSibling;
                            while (!next) {
                                p = p.parentNode;
                                next = p.nextSibling;
                            }
                            start = next;
                        }
                        //get the deepest level node
                        while (start.childNodes.length > 0)
                            start = start.childNodes[0];
                        if (start === end) break;
                        p = start.parentNode;
                        next = p.nextSibling;
                        p.className !== "AssistantMark" &&
                            this.getTextNode(start, color);
                    }
                    //end part
                    nodeValue = start.nodeValue;
                    start = start.parentNode;
                    if (start.className === "AssistantMark") return;
                    const text = nodeValue.slice(0, offe);
                    const epan = this.createElement;
                    start.replaceChild(epan, end);
                    epan.outerHTML =
                        this.setMark(color, text) + nodeValue.slice(offe);
                } else {
                    //all value in one node;
                    const text = nodeValue.slice(offs, offe);
                    const span = this.createElement;
                    start.parentNode.replaceChild(span, start);
                    span.outerHTML =
                        nodeValue.slice(0, offs) +
                        this.setMark(color, text) +
                        nodeValue.slice(offe);
                }
            },
            Restore(node) {
                const p = node.parentNode;
                if (p.className === "AssistantMark") {
                    p.parentNode.innerHTML = p.parentNode.innerText;
                    return true;
                }
                return false;
            },
            removeMark() {
                const select = this.Selection;
                if (!select.anchorNode || select.isCollapsed) return;
                let i = select.rangeCount;
                const r = select.getRangeAt(--i);
                let start = r.startContainer;
                const end = r.endContainer;
                if (start !== end) {
                    let t = start.nodeType;
                    if (t !== 3 && r.collapsed) {
                        const nodes = start.getElementsByClassName(
                            "AssistantMark"
                        );
                        let i = nodes.length;
                        if (i > 0) {
                            for (i; i--; ) {
                                const p = nodes[i].parentNode;
                                p.innerhHTML = p.innerText;
                            }
                        }
                        return;
                    }
                    while (start.childNodes.length > 0)
                        start = start.childNodes[0];
                    let p = start.parentNode.parentNode;
                    let next = start.nextSibling;
                    let result = this.Restore(start);
                    //if this is mark node, will be removed, so we need get the parentnode to backup, if it is not mark node, restore the parentnode
                    !result && (p = start.parentNode);
                    while (true) {
                        if (next) {
                            start = next;
                        } else {
                            next = p.nextSibling;
                            while (!next) {
                                p = p.parentNode;
                                next = p.nextSibling;
                            }
                            start = next;
                        }
                        while (start.childNodes.length > 0)
                            start = start.childNodes[0];
                        if (start === end) break;
                        p = start.parentNode.parentNode;
                        next = start.nextSibling;
                        result = this.Restore(start);
                        !result && (p = start.parentNode);
                    }
                }
                this.Restore(start);
            },
        },
        autoScroll: {
            stepTime: 40,
            keyCount: 1,
            scrollState: false,
            scrollTime: null,
            scrollPos: null,
            bottom: 100,
            pageScroll(TimeStamp) {
                const position =
                    document.documentElement.scrollTop ||
                    document.body.scrollTop ||
                    window.pageYOffset;
                if (this.scrollTime) {
                    this.scrollPos =
                        this.scrollPos !== null
                            ? this.scrollPos +
                              (TimeStamp - this.scrollTime) / this.stepTime
                            : position;
                    window.scrollTo(0, this.scrollPos);
                }
                this.scrollTime = TimeStamp;
                if (this.scrollState) {
                    let h =
                        document.documentElement.scrollHeight ||
                        document.body.scrollHeight;
                    h = h - window.innerHeight - this.bottom;
                    position < h
                        ? window.requestAnimationFrame(
                              this.pageScroll.bind(this)
                          )
                        : this.stopScroll();
                }
            },
            stopScroll() {
                if (this.scrollState) {
                    this.scrollPos = null;
                    this.scrollTime = null;
                    this.scrollState = false;
                    this.keyCount = 1;
                }
            },
            speedUP() {
                this.stepTime < 5 ? (this.stepTime = 5) : (this.stepTime -= 5);
            },
            slowDown() {
                this.stepTime > 100
                    ? (this.stepTime = 100)
                    : (this.stepTime += 5);
            },
            start() {
                this.keyCount += 1;
                if (this.keyCount % 2 === 0) return;
                this.scrollState
                    ? this.stopScroll()
                    : ((this.scrollState = true),
                      window.requestAnimationFrame(this.pageScroll.bind(this)));
            },
            Others(keyCode, shift) {
                shift
                    ? keyCode === 67
                        ? this.noteHightlight.removeMark()
                        : this.noteHightlight.Marker(keyCode)
                    : keyCode === 113
                    ? this.noteHightlight.EditDoc()
                    : this.multiSearch(keyCode);
            },
            keyBoardEvent() {
                window.onkeydown = (e) => {
                    if (e.ctrlKey || e.altKey) return;
                    const className = e.target.className;
                    if (className && className.includes("DraftEditor")) return;
                    const keyCode = e.keyCode;
                    const shift = e.shiftKey;
                    if (keyCode === 68 || (shift && keyCode === 71)) {
                        //68, default is login shortcut of zhihu
                        //71 + shift, default is scroll to the bottom of webpage
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    shift
                        ? this.Others.call(zhihu, keyCode, shift)
                        : keyCode === 192
                        ? this.start()
                        : keyCode === 187
                        ? this.speedUP()
                        : keyCode === 189
                        ? this.slowDown()
                        : this.Others.call(zhihu, keyCode);
                };
            },
        },
        shade: {
            Support: {
                interval: 0,
                support: null,
                tips: null,
                opacity: null,
                opacityChange(opacity) {
                    const target = document.getElementById(
                        "screen_shade_cover"
                    );
                    target &&
                        (this.opacity === null
                            ? (this.opacity = target.style.opacity)
                            : target.style.opacity !== opacity) &&
                        (target.style.opacity = opacity);
                },
                creatPopup() {
                    this.opacityChange(0);
                    const mt = -5;
                    const html = `
                        <div
                            id="support_me"
                            style="
                                background: darkgray;
                                text-align: justify;
                                width: 700px;
                                font-size: 16px;
                                height: 468px;
                                position: fixed;
                                left: 31%;
                                top: 25%;
                                z-index: 100000;
                            "
                        >
                            <div style="padding: 2.5%; font-weight: bold; font-size: 18px">
                                Support Me!
                            </div>
                            <div style="font-style: italic; font-size: 16px; padding-left: 2%">
                                Make Thing Better &amp;&amp; Simpler!
                                <img
                                    src="data:image/png;base64,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GEuv6XUAs4ZuQ4CCK840bndhAoCprELkC6QkFHzJHG5R+v2/y78BmfVhpxDogDsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjAtMDctMTlUMDM6Mzk6MjArMDA6MDCGZw5cAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTAxLTA4VDE3OjI5OjQxKzAwOjAwZ4bKzwAAACB0RVh0c29mdHdhcmUAaHR0cHM6Ly9pbWFnZW1hZ2ljay5vcme8zx2dAAAAGHRFWHRUaHVtYjo6RG9jdW1lbnQ6OlBhZ2VzADGn/7svAAAAF3RFWHRUaHVtYjo6SW1hZ2U6OkhlaWdodAA2NLzgqYQAAAAWdEVYdFRodW1iOjpJbWFnZTo6V2lkdGgANjRET2kJAAAAGXRFWHRUaHVtYjo6TWltZXR5cGUAaW1hZ2UvcG5nP7JWTgAAABd0RVh0VGh1bWI6Ok1UaW1lADE1NDY5Njg1ODEI9oyUAAAAEXRFWHRUaHVtYjo6U2l6ZQAxMzU2QtzgBkMAAABYdEVYdFRodW1iOjpVUkkAZmlsZTovLy9kYXRhL3d3d3Jvb3Qvd3d3LmVhc3lpY29uLm5ldC9jZG4taW1nLmVhc3lpY29uLmNuL2ZpbGVzLzU2LzU2Mjk0OC5wbmdNCDr0AAAAAElFTkSuQmCC"
                                    style="
                                        float: left;
                                        height: 42px;
                                        width: 42px;
                                        margin: -10px 4px 0 0px;
                                    "
                                />
                            </div>
                            <div
                                class="support_img"
                                style="padding-top: 4%; width: 100%; padding-left: 7.5%"
                            >
                                <div class="qrCode">
                                    <img
                                        src="data:image/webp;base64,UklGRqpmAABXRUJQVlA4IJ5mAADwVAGdASpWAhoBPm0uk0ekIiQhptHNmIANiWVu4WeQ64DH4m7o91L8kfyx5QEws7B/zvr1/xn+S9pP5o/1/uAfqn0mvMB/MP7T+xnu5/4r9cvdN/i/Rp/zvWk+iz5aP7jfD5+3v7Z+0znIf+l/mv49e5n51+yf2P8Wf2r9dfyX6N+3f3j9c/7p/vv85+B99/5z+581vom9k/u365f2T9gfwj/D/4P8e/7F+xftP+1fuf+i/Fr8N/sF/Nv5f/Yv7L+yH9n/Z/79n5XT6gL8Z/mn+S/vn+O/8H90+RD6z/b/5/94P618EfY7/IfmX/gv//+AH8c/mX+N/t/7zf2n/////7s/8vh9/bf+T9JP2CfyH+n/9T+7f6z9tvqL/zf+x/pP9J/2/9x///jl9af9n/Qf6f/y/6r///gv/Ov6//vP79/of+1/jv///8vKkaRb2t6mP/vnsy3qsmE4VICP/rRvTRyq6ZtimCRhvZ6bP9/fPZlvVZMJwqQEf4HINwuVHlHqnUm+7lnwtJJuSZBYOpvEqo/do7uNGdMjv90bez4GWwBMbt75VZDWGg4y7dRCJXn0TmzlDUjv+D01fwxZ0BseF5xnnndMIoDku6TZD3LDyqd5LCSbPLptvfxpgvT1/UVgqq/c+WrlQnrf0Y+X1g//YSR8wee66LfdYSVoju6Tbh3GOOvheC1GrBGLI4sb9jBQurA9iAFUvumtWsmeac4H7oaFWtw0f0PkbY4xwJAW55601gKeEYCm5tzqoXvtpFdlUbZ8wJXxuTy97M9Ip1x6E/8q1WYhtIJWIlLP37GBsp+rfytlX+dQIZC5wahhiUDec7+6deMKTIBPrIPnYaW2TlxbpJiJlSYjS9wlcTj3E4pJLFe/0ZxFifadp2ChMmN88+hCcLceN03sw4lqS2AMxiv3rKms7yt5a5i2FfDL8VpnwkEOIWDfYldIkyZLJQsKmYBT9sp7bLsTFN6mm6fGddcwcHpEwY2Lhlyj7ncGs40ReiM8138AXDt+XfukA9pKGtqdbpSJWFkD8cbr8QxLAG89GfUpkgUBlqDQX3p2jy3kHTpy7vSCG4Ejw2i54zW3w9MS9n3NENDbZC6M1l0wWRO2dTr9VVPrkeGiTeEStUuJbS1fdj2TwaR1rFw4iSdax6cHzLNukQfMKB5nhdMDwpS9Ng27meHNVkS/Nh1o1Mw219OmBMHvWGbveCjcGfiZ7Woepr57GUDR/YMkUcDdhXxjOwqm6gUkvzq5s4DbvKx70xDQ9k12xuTVRpipmTVibSxaQtMcmoJuUMaymWTHDjXdl6fgdPJemk+rRIGDXb2cc/YpJmmXPDo7mpaAAcYAFqCLxWtvLeMlInGzdNRpHNrHaj4v7KbGFfZmWl7BaladnINKKEOcKwDCW8P24UJOgJ5S8yOISwR/pj4EfLhhPP2MPBIE53bBsGOtFyr3D3VjXVA2U3+uxGiIbMNHu8tN8kGat0GNHnpISILVZSznqTgsj1B5qIEHZi0x5UwO/8q8jD18c26m9d3kbzpnNXc4Iu7HScrOX4BkHth0OkBujBznyHr6VR7PAUZW6/sX6IO91799qQp81MVKu4vU6dop0gB6G+t6Rz02tlX0HuX8Wz9m2nPC1O0T6uHL/InOgbWedA2+rV5O1611cCN74luJHsjbB3OILkmZuBDkslaFIlGClYvMG7QkAt0fxAjcekPGkI8Z+/lOWln6Jryo13+CFfgbp3BrFczstXII4Y2XPHYMZcSsl5tZghfnLQR02WRu1QBfvpYtHxTQJm6UJaDPW/T8fj2QmHZ5oFjyLlyaHXlGc46gfm9uBU9Ubyp57iDD6KOnIlA2OiVkm34Hujf525O5wmUmvLoByt0EiW5w3orbp8GKTiSp7wpgh86CtXEiGnOzkfdnzJeTR8fWy/C8hhMI261JxfKcePhvLx/GOEZPdEmHuv+UePORwCFITP2XHMfPkLGyFZXmSgrPHCcaxpp+jsQxUe0WMhDXYKrE1XCspxVyp50w4Z+NXBU0Xaxv8CYEZUQNpKT6NSArgESbsovaupGtng9z/lX1HdMQMdllsBPXtpPFB5dFFJzqr04mb6UTjpj/66FMMQGxlkzYGh6j9ZLpSyuO8F7D8o3dcRI5hL+Bq0qFr5i1kRsP/GAYQ230AXVXLdejBXvmXHflTDGUoI7t1DDehcoEsQgm15wDMC6kgWGq2Z0bW4mKDpJFKdeTk0ORWaONqBWAOrMdPo1VDa2AZxU1EF7/1JIpgqos8SO3KXMQnl+hP+3Ps3fG+/tOhhogX3FLhovhGTv35RHRQ1fFb9gKeQjZ9Ha1GTwZbu4ac7+aK51VsjfpyFZRCW7OoEZbFUYNH6xBVjTnqElk1fWi0eNIcokNvqhxQJkf0IBRVtSNpPbUIbyGLIjPKXJxN7tjcL0UthpCX/9ZmKBdLbokEY0E6e3eeo4SFAyHrG5bJKgMt1sOaBwWFuQb9C46yKXP5hY5wJPy5kyUGdKXCvbzQU+ZUbxNcGlUCb4cCUjr+sOAoTbNEymIuNuvHS2PdZT2PmLvsecTKVg0AXP94BxU9vIWpl6IyfIiYpZEDj/qnNymjTxYTR22hQOJ0SWwuRT+oTQPl0OEb3FR0wk8XbtpOxWcAPJIxYFJjnh/nTAZUetLm1VPTE+a5OnubG6klukiFKmgao0D4hm2pJJ8fzmEjAQuJbR+NFzhKWb1f41lMtbEzt1uA6MzvrAZIacSe5ab6Xbl1M3g/Gay7NdLMsDRAjSMtgaLf1SAyrKqvzeEYq+7c2/f7Yrk43fup2MXJlwJTf8ZM7Hp9ebobBzvK1ZcuuA1AsTm28UB3b/Zt/6JKAxGBlLBtZXg6q8Kzazrtm6Z2DDmMOVzhDjwgM6cq+scWEfAbnWe8j/CeL8fUdw7c/tKmDN2H/IS4ZAUKjLCisEmVL4l1jv+LqL7kwppzaMdtaOdVZYId1gQa260I10dlJY8CApR+0d4uGK2qw2ZVIUMAXY8McIiybvsebn+lKwFRsU9Z3lWrJZb8BvrcDDpg/548H6Y4ckF4OUvkfeL5RZiiXDYmxlPixedWd6ff0ILSV5TBOtVf8UXntVx+v1/7hgJPqgyzrB+r+tsR+ooc5HCXz8hYCEudjfzbQlKpwJYpSfuP4NmBzILCSM4fxNwFxUAVqZcpcqQav9mF+fn5veqGS1VxWgwzhC/uQmft0QhNlOg1BZkFkMlUq8eHne+lPyTd7FCTLnIeNJIB+pzEH0tgQb6aaLB2INsFsRwCZcvu1CAP9y+0UlFpMXSZ9alA57JvdUMmB8VK/n/SdvvyYMAzGK/esXLMqjVC7ofVbeffgHbr7ym2ffk8HBmrK6Tk0zWHXmQ7Z+yBl+Q4F1nkWDSxXXK5f2J6wTr47t4p2Iwq+abdFDPP+eAy5O5EyK8o/+ktjtuB4WwnFy75JuBbHpoyEeS2TAdnEJRNDPxFw/XcufW+hgi51CjMYeatyfAXit1n5x28FeUDy1whrNSzgMiC9VFl6iggSfVMvypR1tEtgpvuGdv4buCcT50oksodOC3t5QVBUJDhZkmnKTlJwqrp0OyZ21Idbk9JrrAR/5I9mW9I+QnCo+BBB2tk8tVLQXbmkv4zVIAE2JHiK3pHyE3I82+NlDVsAAA85b1hHPitl6kkMePZ9fieJ3lF//vtGtaAyyYpM11H0P8CSYQZNH5z8FzpD1B1NqbwPJPOQIQglEsaYIHAzsL2oNJ+q0f3AsvOP7gWXnH9wLLzj+4Fl5yBdlvC4YWTcser6ZRAJAkwCW1i6EOIX8wHne0Jz/P6qN5FFCE6Zm1TZjn0DFXga5f8y4FFEdn/54X8YBFkS3X4B8Eh4MZ+K31nAY9+H6BjFIN2yI9qyBKJQvVwv0Nhfa6rdolybscmuHFtpA6MHQsDt/Ri52hr3zC/LcIYm7EColP7cEQXUSC6iQXUSC6iQXUSC46xWRQGVFcvJUp94lqSQOCnzb4CGPJ+yqHpomfgrBkMbiVLdCxoT/KbvGpUkD8WVmWw+CJSS/CrkG9CPNS5E0YAAsHhZB8CByBE+WkTWMeP4bzrAKXvlmiGDd9uf2J4rylh62Js7Fbgd99JfCSxIJdYPZNBlZqQNxIAvcfa54RZg34dZ1Rj+sPDX8D/c+5853tH4ydJVW8WH+YNX0yGOdQgQo85IL6pGXicDdfDHLNAknd+I6Qe7NNgnzCJkbRRwnjkIwnDDLBZjvd+5wVqZ4NmPustUImdqJj0rRdBj1y5lQT3HLkUT7GoLNRequtJW05U5cRkbbGJafAGr8xvPun0StwFCEBaAzwA0JrjmRyEx8u8TVRLG9WwEZMSL4cg4Y1VSq+k+3pLpuqs1jc0u5VnxfgrDdKoAqpPe+aV/QNh5sGLT82OceSgOwZEMSmpgmTyFK/LvV/vgvEqqwKy5G0sWK5F0SKSxwBXOCvJexp1K3z/tHw/GI7OVz21HS2MgST7rst3eEg7Q5YeMSOWN4xtPbCvCoOjKum6fnQgRlSknGtI9dbfDHHL1ZJHZKDWSKTtBZr/VJ50f5hmwf+c16jtskYoWcVjrzaxcqSGEAvkjVP1wE+aYn9Q6w0Rda5BCkA4wJOsDz6U4EJSL4n8gWkHzI1xKfAbAG5fGuh++9kbHFgTHjNhh14aeoGtipYmpF1nKV8fZh5Q5mkgN0XrWjH5Z53o6wkhQjd+RurV+jTkjIlsiU0RVWOdPCRanjTIwURdHmsYys4zLY+REavHjnHVByp4SMsWb3NB/8PJfZEMuVRINCdklxbW6XzEauka8ecwwdJPX6T39upn/vBBIg9FgjHU7tWJebh/iDAApjmujeIy9bw690Q/+1wiqybU32cpqRr+r+hCoY9EJBdqDomQkFCsoQytKtq0QzbDTBQDPyVk372TIWZopdZrA7qbZlUSYME2lM8ZprJVtzVvql99F5xq1HcZKhrVqDvtq+BXzg19eue5mxF+8EXiWX44tWIjYtOXY6//xv+mM03e2zxSUSmLdafCeq2kA6fzFz+wVW4mOkABJBPuE+BNFt4Bu4rBxqAvC/sBs+0bQvBVs0iiYnJYBLgmnYP+gbfnndwW1ZL53Q4+ZFRxnfftjbUXrMIyKsxFQtPUXxZ1WwN6m4T8TCGcYLeTph/r25aN8MPtJZIQCUVVt1zJQZM5G6b0uhRNzDuYLsMX/0unrWujIQvXvioUdohBhXBVKYugQu7VfXgSB6JzISyMdxi4+t3cPvlhhicQPa1Gb43KlPKRFMzILMfqxe1+PPmxVK1g34AmTeS8vvHdAyHflESrdxJYQN4Sqv4vmh+tXsSeHz0B7EU5IUJeyjUdfL+MamjTE+6DfYlRCK6PONV/86xo1nHGbcMRo6Z4Mh3i7l4lDfSfqZ2sBPu2hjYMYrIfY80wCCq2RWtKoTufi71JY3Ask7q33XtaI9yow0+Tu+IOOY1aqLtKLdDEFpZvQk1G6HWojlKAObWj+fqqZhNjLXwzL1LLD5+wtnALBi4n7YGHXHjaA+B4Jpx4ytNTKEqWuiU6zsuXVJK+YNiuAviyx5rTzi/unF+E0XJBT0DSnZ6+x+/G+LM1cIwPflP/YQbaKgCO0AaYc9ZCjuOij3emYofE1jner6zg0qiPYjOKJuJC++q7bjOhl+nkJEhZBc5vA6on61eOT/IaHRNK5DafEaS3c5GCIiUk7l9uvUeUGuFtZ0jOc2JYq/wBl4eq1GGM2w54Dys+jMV5HmUuWAoazanJ0QSCXQTqSM1sTLuufsmAqyNPxOUFCQ7CJj4afcB+9utXOxJ8OJAVNXFHbQlc7Khwe2Y7J/9BH42AL2Zjufq7LxWAvho3hj6HdlSTcMAFjDgVrToOhUZI6VxlfXGS/qqWyAzN6zRDgruDvEHkLtw4Erw2sOjPhf+his99k7Qhj5zML+ZU3aOkIqSgnvVv6QsvJb82DgVjE1jgzil94lUNP2Fr82Ew1YpR1k9gfesLuqEwBoqW3WRiLxngCneytExBfeizbgUYnC934PcNYVEER6Xv5FcFbPv1qa6Xx6irVopdtCUWcFOtvKIAXFFdz82ZFEDVFCIDpWkf4JlBSxaU3zviRk8WldDb0k8OzFzjguKPupcGHOBh0TSVcx7I6SGVJ51ouw9G8GFMVndV3kbtS2dLDmsxKQds3k43D0vh+TTjKsDujfLD1LFUHVEOQtLSbxd8/9n9oJ9UA/QXWFUxnOjS02pMAl5M8QHJHSy9Tb5H2fIIzVbCU5dimsgWsoPhxglBIRxav9v7++dGCzLQxzIUoW6tMNhU9qf1BLsuuP1IUnJqGYHBnk1D5UqCBOFKCZopkkys99S2RCMwa+SBoHQrKKAcAjY0/ezS5ljhFxodje26v7z2nYaWqmqROCndLUUvwY6IQOkUc4olXjN0+h2aN6Jt5zAiQMWR1runyk38WaM8RI1DDSVpdC74YOPNM9+RhP5vUpxuk2dzMMnHQQyudjTs+LlQjDoj/0+Cgan6/+kRidkCIAMULPXbf/LCR3LvEJ7ZCynpKqtKDMHMDGK81YMUOjhV2SErVcr1InoZmafhDvynJKg06jDUpIF7BWHntsSDU5E6nmVEb5/HAIkf9TT3fPV/CPrTv1tQcuk7mMeKQ1WZGw6ZYJYPF/9oeKRjldX0G8VcpNPYIEe2Hic4+IvRbzIJ6S9GEMQKHathCYoPmreZjufXfKCv0OP9uju8jVsKAxXxcgKQ/ApEkpogm2qheJVY5rbbevddIFxVSmLDdmxX/9lW68lR+F7ICd/hEkl4TrwRxeAG/innp06u8VHqNzKJRuYg+6Lc+3INwud1aS9TGvYF3UhhdQplbP3n5znwErax4jzaH9K3OsXEwGcj/AgfJo2vhVCruNFC2JE3qsxc5Y6OClCkV1cEbvMX2m18YgwZydHSJ7QSlin709dT44ryMauok6B6tFswT6kHq5r+/nGBPWJb3VKSWdxtLcHJrfBPIhwMkGTNcQYz6dgII2j9wt1koysWkEibVTpC6EETTVout+Wfkl2uOVLfoe9InJlEnSh4u3BpOGYB826fb4pKAOlD+95aCz2lAiKwKBXpbTgb91gRfKk5yeT63slp60z2Z1BMzTL2LeE6HYABRH8XIOuFk4xWaUYwdkZOy67Wzwh1Lqyt+kQBvTTz9zOQpRxScDd2FTSzKaiyrCpavmIhOT2ACKf9P7FyMkSGs+EjG2+4R7vLWtyc8dRJuNQzfGGAayQjCjVE7ae3iTZttP7FPqz4Ta1AZ4qFAl9X/E9pn0OWl+W+sde2rYOECSwwMYlNe73D9ocqAQ1XL4zFSETwhkspRm24RUm/JsJL5QJAvlk2QOM3w0FMtSNeCrfy4K1Zx/FpGwUXvWH4abTf5FZm+1egDevGH5KoCUN2UnYYGpjvrhJaWxciYEupRQu+FlOdUPVM1OAYbGm/cbS8DZ6xGX/HEIakhJKMFX7Wkl7EgO5WQ6wRuBTu7lMRjLR9nKXHFYTzC6EGhE0xlVWqd34Ia4PA8Wqay4iDHUnGbolE2tDMqbt4b/14QED4l8VyAijDtgT9Zy07mty5BvawsYsjHeUH+ztYn/aB48Nk6rkWqPPgBwihj6qc2LEf+eSFK0gSUO2NRf0az459nzI4Y1+BWg4D52XUH46W9LO5vIamnZH2vianqJj4Maj9QnPTaMfk1eAnIycrk/WytJwVzNDZdlb3Pa0PSjr30CBgMuz/dEQ61b/+M8FdOxDzQs0eL5lGLJrxIRkClYFJI0aSmd6zbPgjzshpDsxn45xy/2heYiaxAfw6yolRcRdmZ7Q4FEW6U0Kz1PNneJDJF1ayENPrQef8dogHVJltXRUIUZdTuOVwCukhxYJ7lvpGWJmwQwgVJCkSWfqRGA946VI6Uu/0ysLLz8wtIydAoVqGr80L0R+2h1zY9aA3CqpO3DP3ktaUHvbovTguNzLP1Rm7RSBlEsBbcHcHYaNR50QIZrakHeXcZboNkOmww/JEFcVcP14JofHLTu3gMLRAYClPTXjX3CVXJz+YZHQnk8ARhOiwMzD0iAmOymuTTDGR0C9IbQ5h5r6uex4EkfKBsd7ydfl7QcW3Pqj5RV8UGSnEno3o+evKM/vPeSaUkTM1LMEbuo4irVXa8pTBm9Rn9CK517COxEi7sYFqGIkGt5FU9cN2W4nvWH2vgRCWXAZ3ywMqiBC8iwgDgcWc+F7kRJl8iyrbBQzmkQSdBSIoydzF8AHlVmxhsXD1wCfyzMzEl7pcVBt0Kw0/ieNkD1LyAjcxMM/HJoRLv6YFcIAdEs8q8Cno7NxdgxBzAyMxHDK9PZELgKQUGuN2GS7wvm383hXaoPdlOF11yuhGTDFLXjepDHH0QhAZymB2uRof5FbISpxI4flLE9Hd2ysmApdjKzUMhpMHI3d3Dq9wieqYUYGrX0AbqxDV6B0h7rMLe9sHrL9+KWUwtET44GRhfCwGtKFqcstcgX4OlWTrvOJ9Kl0MnCEBoWxcScfto0UuX7oe+4svgMbNDpzarS0Dy2E5uX7CyTyMogKWND3poEk4ln1FA3NvNLALBZoYafCcLMR8qgkRl9szp2lzRfzYPng2Nf+OOPCb1GnFOXITRvkPZVCV7GwEDxsev96JNi0b5b1XJC+qnlMvtvpNSidBiFw29Ci/+dDwfCHGa/xY3Tk5z+39PlneBmXWfpOk+mRaLEmFtglme/SBKtEMYVNS1adV03lvcvFcZH1y7xmK+2mTCepkuHdHfrMcniSCXV4yz/SK9co0kJRXXwnJLDOSD19umxsWJ/DSgUqFxve+wBoLg5MxSEI3vuxTR5HwrW+i3/Y/luUljlqhqpBeELJ0zoHDrsUvV0lwbmg6drkd0S28BEcDCJYlYhlAXNcoZWLE/lHuQd2obLSy3DMOCm88Wq63dY8Ujnhw+nvkH6vWwMnjQcQJxphbTwYS+ISXdMpWnhp9V1SNxMiBQdq8kRgu+Mx2cFLjy2A0AtaCUsmAYXLy6Rv1XBXDyILja20FYSwrGmnOkLFG1pbTIRvSL5WfBvAU1WIfFdwrS79ICdTWoSDN+v9Lj121bAcrX1MiXUQGiqpJoZloxp6GZg0tW72AZx2VRSlq4j6S5HvzEMo+tbGtfw2wfuK6XhMje7vMiiJbs0EV8IBGzQFIE4dihG8S0LLNlRka4Bi7gNjuLw2CzwFMOfym6H8jWhCUaaqCy6MRvGal8+Gw9ofAdXv8aZtMbK0Le2hbcxABdle3hJTab1qNxFRBBInAErgnPw3ziYAIE1TJv1dIjUD/Q7xiqunHNbdI/E7FYztqT2/Kh+CtBda7ZfZGDkXc5j8eHrMhbhypmTuzxupKrv7WcmzDIGTOSgRdBqmm6ReDuqmir2xnT5S9vwuqEzd2y1LsINi/jdpPgsShxD5VPuKPcOWDpTe/tQaJV34X90ijl6wF+Bw5a3FXKXe1cpVceoCrhRZqvE1gZnah4+VNDU3NAECo+R9Ay0/rNWVin8FZJXxEIA4GvpXPQw1mWmngYZU2FC34gZbYYoeuB/+ZHq/7CEQFoDSpnGnILmF9jMrmIGhbvZi6jauSVls3WvGUD8w84mItukkxInaZd+rZy/iS3E9HnPYc12ACPI489fmWqrj3JV5Wwkx+Wfl/EPWDPJoGb008TKlRar3jUX5Y6AM1EV6DGtgdCsMSCYLGPWBTdOxtFLx1MLrQf6Ic/cj8mCUPxf2hbf3Qvckr8lg5Do2q0UWKNo5v66KlYqxFJLyqN5ZZFTPO3ZSzBuSwUjs2dUJjIWhbdx62DGMmzcOj/jWveL7GODkGOsFyq64Mc5huqZNqVv9nyH/QpxtE0/ofuihFQsJjO0FJppNoCC9KuGa+02hR3g7eRf7zso2l2yYmjdN3q0KiT40AWSHU9dqoK3DI5THK6f5Gl2B9QvOt/bcHG6j+aOApm8GLDqb0Kned78+/OZG6iijVT9X44B2Wnm6hABLRapiS4q6Cvxhn6hJGxKLSRGOCF0BFyvL1ozrId6EjN85gZjivCyy5iucBgAvumKQxvReyVW/oeBzzq3AajBIJnPNiIkukwvYH4dImr9t2jtwSHthVzBJjQwJyzqtQjlMkfHF21zTfl9+b6vlWnjYrtl5Yqm1o4wzoWD8/TQI3NJZqYsLkwKxcv1shk08wk/3qefz20UJclMRdGnQTg4uySxQDua4JtwgcPyTToxr7W4kha9zuw7wOalLbNxjywbFiahGZB1aK0VDZUWN/YaBda+GhCNxox/lbqUudsJidC3ue0Y8P97UmngjHf948ancvkjBI4DjBPY4y8JsvnwUq+ZWoZHIlhUhSrMN70xbhRbMQ/noZvCT1KR05SaLnBB/tod1cOME5F6mvlFPMWbC4EebmejmGSGFd71702NXqoOpcYW8cnZC+OvfIlvcSwAZsdbwX7KhCIKeVTpnlYPenwgg31GfFl2RfuSBetiOB3zHocWdcvPlNL2K4GDlrFMqW+PI9xsAJpjDjjHSSaEbSxYYDG+dHfUlIuz9sxNT94BVW9j1W0G7lIySNg25x191jbq5v/+w3mvOLbeDRr7IJYQvMkETXBzNsWt3KXFFpqzWG0l/lROjhFaVam2EMoRLGLR6NlzPyrArfmIEuE31Jv+aFCePaiCOtSb1j24WpGxDHGY+a2XxFw6OnLSaH5GH4Zm1Sw3R3dduNZWeCzjd1cGABTiKnudsXlgmhJTiSUiJebDX0DB5WtCnW6TkiXyaVBNLlLkNVxG1vzNyv2fgJMvj1v4oPGWvTWBjqrCFBbRrA59xw3lT8f+coVIVb+MSkzZGoGKSmIMLtgKtVMt2juPn7yCuJuufiZ1TshLbGb0xIXP5RQcoZleEh/VVJG8Bmav4PNHadHPvTBnbcYmsEAIs7Xk0xJttiadG8M3AN3g2EwR9TMZKkgadXsevmPOlHN/xO2rIl/OoRpDOJ9ZD9SZ3hXbQnu6YVqSo01kKIkAvKTt/83WMOviv//wfDBsqdW8cnEYzLH1fhgJAdG9oi/1wUvm0qLtUuZCKpd3Sopcf1Yh1jIx6g+0k27SjkiuZVMILByxB7cygU8cxQd465/y2856x4JpK6+OM95KKVE/NEisNX3Q9oPxabGs/71X2sKg3x3MuwlTMhT3AnDtzxs2CPTrjLZDFuSkWWJ+IEEf5Fs+3+/ByIdIyyFPXNx9MwHwQiHy34q2o/GraLP26Z34tlXCZujQnslZmR7lIS/BpRMHMfVHkB9km4aYifVVA2KjlzcwbbhVNlw6O46ImVK41mun8Mj2GhEE+WDeQKG6pUpEVu8cvb2ZulmK3vPR57eCcjP1uGPeEQomiOk8KXtj8ez2hp7elNKdr425DbwSoLgwcL+YGilfxApzlf449F6eyt7vjRg9j8Hc3XAenjcKH0/YABC/6s7pFSSvvdj3lRhgglcwPk+n+W7GQTGaNM6qW7DnoeD9ZPKAN/a3ktkPvOYInDkgHC+FrPACnegrgxM4+L6Xk7HljUca/qfa5q15dVSdpgMFiOltDYwxcsapBGebmXKF3J5LUrydtBDsTJdRtbwNuZZJqXU+jb2JMzEtv9dji/iVqRpSwcUs70rrf3EjE5OImTCUQ87g8zDk4DVCYZPq7bbdmGdTtplOl3qwdMOPjIf/hxGH2T35QdqnNLMW5UrVDQIe2KsEMnYaBf7VMVWLFKZVy7+JXVvY0N8Y8izj1s/QkpTD6zgm861EAZxICePV/fFdkgglq+ZvbKcvgwgUBwhkpVef5BmqIPgAwH56vsATcLX0JmYLPoNUypGk4KqLRd0rgH5330/i+N87WeLY3uRXYF3vOgg5EtSkBVD/lI76IaTnuoTq/sh3PF9NNx3YTscZRvap0Otei6pJaDBJFDfrWypdaVRNPD8iLC1gR4MvYT9bxEddi9ZyBJZsyyS1banEgXdxUYGk/DMxx5SoeOyxkvWgw/+57mFr2EMxOwM9lk1SZiF+ZUHS6NgkY/G2YuiVTRq15kzYX0XyDgO/NtLycDa63Ovlisyb+tH+5bVPpOywsjMLIi+v/UAnwUkhOqxEAXp0MAeIfCNoTUH7xpnjSSjcqEAOsDN4gq4oN6SN4B//Q/xFZkBKAkkxvQyqoezMdQG/m68GphWt8b/19b8dT0DsUX1UmY/TZzReUQ7PFZQ0EDIPqYz4ge2MVc8X+o0nkM67LDa+2B3/gc5kil6ZRWWWWZ5I0q5MACbq2xzzdHjVOVVsJKUgTh1hTXoaEwDh5fCo1DLynNDLlfvveohlfvUvbQniqekmeTt+C+ExBThBn8FzharLzoKSlOrVu8BR59+zkKIU241mpoGqkWVbIbjmU/AfUYOUx3lo+Kt2I+DpDry5MB7nFvnp5+974t7JmjsvYJRZ4qk0aVRbITQ29MPIfNe1jwN+HJzTctKNUZtTwnY+vvUgLakf7LjAZMo4VDGn6mrHM5RO4V/pfR6JXtlCcBlRZeCM7F5P+y/fg2P1s9VNWawnWTELxlSud/sQtFv/D03KQPzSKblMx0hhwj6Bgto4AMMKcYJ2qWFyIQEk+eX7uEZSW4ENP0nNDADHW7BNIuvnydvP2ToBD+XAP6IEqxe7bGDo13qrW+nSDG8N+358Wf5P2ODVu1DuSQPozhuVXYqlFWuk8dJu3+ZQxB+zg+GDAI0Y6tSqt2UwHszyVA44sGDWyRYeCd0wJG6RPrhH2x9/LtL8UHX/68X/7/88lX0/brsCMiuMSvJi0q1F4Pib6txR5U+6Z3+ylYhB4XMa8Fodkre7fvC9ZFJMth4ID4nZ7W4fGUUTg72D/jtT8tqyuInudQ3upYWFJIm1HqAf51ZnVm0ABde86080q0BS+G7qU7F6D5mt5I6Gdz+NvIy5Z+M/HsM9H1leEicVI6Mujn9p2C+6UfAYK/+92QNrlVfIFxxziGO/Oufr/mpcTNXvUY0fMqNi/+sqLOrn84Eg7cV+vZRrOh+IXV5m2pMwkZwMNeIkki0r9uxOYGMNjibHjm2BIXkTh/P8EDiBrcE9l6O+gTzXjUJi0wx2drW5vM1FDUAyRjLSglHf1Y+J5t8KeF/UhKH1UX8/xZ0Tm8Yucqz8RkcRDO4Nv7xIIOccxRV46vWE9p7Gbd5yJdCW1LRoH55fOkT1d9hx/VoEORoLCyiLaPJPZz6BVdu7eC9V+fNC0qHAeArqYRU4YnE7L60IrUb6inf3KdGZDvGLxZ8Xs9uKT+Jo6cHwxDhGxBke3wR0PbNjWAa2uWRniHqg5H5GZul/dfHVqCjfT2NfMmCJzgLffTyjl3x8qmXHpML1MzVgxJzxrEVrtQoCv/rZ+NjdZHD+RYG+XO8rdRcZxqyYGKzWcObD/8V4Ftv8yfs70ChWHSN0IU0dJ3gp2swkS6MRUnhs+ESCdUxPlp0qaGLED2coszVpF8A4Rb1Sg8ZqtU11rjE4Akk5QXDtpUAo3vR9SpVuu+WhaXl2FN3e9UWHlhOpBUy1WA1T2wCCSG/Yi/SdgKa1vf65ujfeHdZfg8K+9rgfmVG1zki/RSwSbs28ZeAClGcEy92mO9JqTu4vrRHUOZ+yaChgbRMczVezDhIbKGaSVbd6n1sEEjGtdNcTX7ftO5FL5jVOtxx0rSj9gU8tRmP6iz3/ZpvQ/GG/171CuGw1COCO4QSAZJnfY6TLEJF8ZnB+VqEKy17BSpzu5t7clH+G5Ktcbc+FQZB0wnp0m0AAiJ3jC4aPnqI7VeXhBjgdoGimuDEGQc34vuq7R8sKzFfNRlnRzvHWaTi1nj2Itl8a2G017iljftOlJ3a500x7ZcowXKc2owip3H7L0jBtOzzzNAPHRc9mpfSeONqiEYKP3J1JHpTL1z+GjzvVLYIuxpY9QWHAXIqegplxzUD1aYX5zMibVY/ptnudHR+V7EQOT6xWxGQywCLiYhEB3Dr/uXKj23e0XsMH8rY28nRHxJ7BeROPBmtZ6smOTpl8BhQSCj8UtVPQP0iSSVtgLrrzbu5H87YsKG85pyziJuxNoQRtJNDG6lTl4Nq9RwrQtzkbvnSH/QGJsvC3SlYaN5MIq+aByUYKFYG6nr8zSfVOK4ntP91GQ3qEe8liq1eJxuyhnMEZogJFGFkTTmvuhRl2VABeBmCuL9dzUskR1Mrfbqe314oVPSu2jyFjeFJIn1XaknDGy1VzBnuiohgYH10NxdQB9Peb/DZyTsZO98uPUzf8+4HovuzJOukVi0NYRudViMpQk7PCOS70cidmI4AUh3JsFFr5sQNzsguLjgu8I+550Ga2T40+kyp0SV3GBhbybKx9nz3z3tgJiQButYHUOIMVt8EFyJJm6T7estF1rFdLTeDmOV1VMNZyQS4PyboP+ZKFgNn5hjJKa63WEQ8ZMPVlpUPHh/Wp/lkHt7dcNFFQe1SAge1VX1IfC8py8OBgxOwSZgZ0+z7CLEi8n3PT6DY2qGXQnvuZMwB6cSvRv+6qXwhcnTRNmV6X6CdGtOuZhOJ+48TyrKTJWefSYzLGAg9jOkhPN+IjfMYEBR4mC9RMpjNgZYe4iKTg0k8drGl0myfDdFMqlZf5SRxds2ZR2EWGmaVvipF5ZSoRkcKMIs685i3Mq8kG1WJXsPZBoa78qgfaBo1lOW2LFunpvuMP0IhwU1TjTlYG+eAhT5U62o/TDZeDxVlwlZuNuhIbvVrFtPa3YRMwGMCjuxBvujW1Hz7B9I8HNlxWHTBBjhZQ1bijR0CmmBAZBPxOXKdAy1S/5v1ucDLyMbGx8RJy0mNiHQ0aFwHfWSGqZJps1pemBJ9d53l9osS8cUvwdyfMSp9/A2wUT4QIby0an0MWdqbpF5qGJRKBaAqNYEWnmQIJti7zfMr2SSEtnwDf5/SfmSCNKCn2I0MCSN88ZpCcUSwbLGQQZNbKhv8V94J2eE0zu4oQbl2HeymlauAbOHqznV+Pz/tNl2zTjfd3GlPahkWkEhpmD2TzPFQNPCTukIuIPZi9DHlbQwyHREihEeYLN1EhtcWt/1Bvrin/ZrsqdwbuZwhxUGyNHbWjJzDCAJuNeq/wKVLGS1zFMt4ByIECvo+zB2wJyMlo4UdLkjog8+BUdrV35Lddx3yaP2lLbZlAJo/onYmFjD9HjaMidQGbvp/unwNpxeP3TnM29qCD277MFQsDgjyOoZoBZNi6yfCzAMPBCYPxqMASBcuD30DDotroZz7B9ygZ2GxejE5HRgSpEKPE/optB1rC/8O3qrJbSh/jQCYHJ+5/6hriOBFIU2rxKVStEYYP1CGjOmf/oY/822SiAqe/XLqoQlMIO4uxb4e1Zu5sujHzIj/77DutgmlMWVReYwnWuF5ddScJ7gb1A/onchY03snIHcV/wp+0bnccsX5c+Kz0KYw2U2Mxqz1Fz1tRfVSWulgzS/B9QC12GsHNbY4Zcp3jUsK9wOQO/LZhwXqGmY71ZMbcIOub6m/y2GVTQCY4EsSd9G4ydvuF0v+NMT4k5qbaxYRv8BJ1doQv+ekar447HSBpSzCDExnxMMODoYbMTF7BPh/uKEb+MV6rKSRdb3tlklMyv2QhpR7htVZq+mAUtXfx8eTQP/kYqhj/MmIh12H0aTZf3VVcr6B50X04MAhdOM8+7jTkUEh2xoQboorbDbNjPjCJp13Gp3E7HogN/PBhKdkAJ22Lo02bgMyga9z8TO4pWFPdbPbs3VFbXQ0WzyNa+sEPxdA28LkuCXTHNpdTmVyJyd4WftBJkUoYta7IJuE3gZxWqnVSfixtmTtUL84QTGrnu11F9uPc7xJJLganjKW8DdQYiuToMsaawOLwPcSyE8UOYV3k15mV8vcikjGKbYyc8vvSjcCKuSyuoyiUDIFE3UNVg/KxCFNtYPHuC4RGMl1jG5BC80fEoUVSiy5SUHe5OS/VN0Un2Y9mJRDp16jX+9IaNCIX/i1U9yioLUDkZwSYfnVk0OzvQvKnV4i4jPDVlV7nllbrGAzU5TljWpKUHf6txIUhO+Zj0GyoylRu6TkQUaV+Sy7a4Gmx8Yl2GnH1V8Fa7utLsE3lsD74rSd+ZTydhR5rm2HcijnugMEjwFaF7EIw9CGCUzs7twzEyBl4LUXbmU7cvh/qDsGpcXTI/vVtFAVnjxr9DdTnvvctr9rUyVQ52rTjm/aI6ZKGQCmkoRxzbyfccqwYprLGut4Vm5PxcEqSKiQUpucXBRxOOV8T6dFYgfw+UZC5pEDIYZivKzwR8nnHQY10ofuORJypyDywx32gbnAxfgQjoFPfLZhJW9Flb8b8HqKnFL940sKtk+MMgBPaxfy582qY1ZuMPUOoNSJZfRgBF6+8AcRU9dKzcAesbqh3H3uCnTw7m0r8OgVtOxtZ5gisQR7tuV1sGl54p+i34SzBEEuoG9x0yLCLg13HIn4gc4v3fo1GOa1aEaSgzuHE3hMyrh2FmKXytVjGR3vUV438TpFCGlPosVTKxOGpZ/hSxwl5cb4FOAYxUjiMT71BM+QnVbxbo4zPjCcuPPkczIIFtBUUeU2HLTc4FIaJD0TMj9/BnuV+OTG63MgmmLe75JehqCZUXMhIXzwGYBtCYRkLnR0nuiyFWdpi8sK2oRc9E6RyvjZUPM+IikJKz48B56TO5XqtX96lXAu0hgfXMzCq78wCDJZyb6XCa9YVMa5R5sDAwIiR7O+JnExeef62kWMpbrHWlXkyKzxYb+Rhe20lMLF2mtVfKS5mi4dizTkt+93ksapmKuTW9rj+vLVrY1MOFQ/OPeXCbMfR/nuw/A8INwHy6IKbTUi+LtYc0WDcQN2w7X9ND33KHWBpNUoqvQcL0FNlKhi5JCdhk160w+EfI9zz9L6tTWayDnTZ5eoCc7/Mwi9JXDohNv4etS9yWtRWH3Jr0cTFRSgLoOwDE6Wk66YBdZYVcM5PCEqWMWZJkum07VV0eu2LQBrLblimqVV8o7LZUhibqCs5F5HiHW0y9L8P2VvZYZvLq5J/Hnp3bSiwrOr5XVE4tJtMf970M85HZBNUZ+iJmHESxlkTDxU1bsQxcctnRGK2JWpO1Obm7mLSu0qsGy7ioTfBEl3X4zixTcsX2a9zz1pL/ZrlS6ZalAPzP/D3Sks54CoB82f7cxgNiB5XJJGEgqtsHBQvS9T5Wi1u/SF0eCFvy+i+lh8hbbu+LjfacGh8Yg++6B7CNwwxKpd3ZIMhKsngzkfJ/l/O0d01ozlF71qf14zICnhZO/8wxVtqgu/l0n7cB/Ne9Ep4K3XP85mDnReon7qvBGMBbp4pEBrjMC+3TTnf70ZgoJrw5NT6ajoZU2/hXPhgoXkQh4oABCfuEG5VneBoUh4HxKK4oQ7gwiCOVupyBO5efPXKcVkJyPlY5rC4pdoJ/ODkdtK3936iSF0wcmUX2fo2Re39pEZuzOezyxhyooPuFXqkYgDZnr/eJM3RM7GROn10XaX3Zb6Yma04gZpOOq1Q4Lm9EoB4mhAbA0r4jLmdJLyKaLxuZsHaYy5T7y7B5zihCF/gH+ioLf8sje7Y8RAw7LMzSPGkAQYiCzKl4nh7A5btwabiUMa2uD4sYssuRPSTwvWtcGNH+mAh4r8vsqTGGVDd7oQdeUatPSSkhIIKMzHLSc+v/TUkRuVtWR1mmJwZOFkL9srxQlOFeuK9UGoWnQ6diYVvSsrT66brQg5cYpn7Qpe0gP5mQMjtceHof0G//QpA9VW8MuoxH+GSIEj9odAi5CuFFTX7Nyo7fTNONF7lwE05UrTFyK/7bSfB58sQCXoR6JDAlGt3ASrpMHT9GwNQuFRAw0ov57Y8J6/K1VWBuX66/0PdLgxGgwyZoQp5p4sqIGi0RgJhcKnQ67RSbKseekahjL6QKCROS1AyGGd6M/4siO/2ztmuA0+RJqFIaXcIh7tF9g4IJud3Ii5U1dDevfwHx4EE1xnfd2gk3aiaZKAljZ80QAh/fYLkXjZD/uAyFm7zwrhvj/8hdgnuwsrtvmDET3iy2z1GivA+Mk7Hqa6g+Ode9FCi52yU4VdYvZRm+HzZKuGjzC4mF/4yNu6CT2IaRmWSztHoxRRyGayeEEwYIGl2i8pxZuCfDRVYMq1FohFuj3y5O4V3EyBEkXxTAtqeEJPtCKYO992ENFppzWqri6rEsRno26JyQ3+G/p6ubFFRK+z2lEwgoN33Ee1373S8NRXeaoVC/gqtyRdjq7HfEjitvQEus8Bof0PGOrtniU4lFQOmk4X0mggzqeBnhRgppOKyy6avBjQGLKgNtRdJTz2ZjsVwbl0Gj6VmdRRtCg0L9wbJYf8loRUtMju+1UNGFA2Guuf6/gF0Yb7x5301Xc6ZN1q6KYiluKBJf5P4aAfJjZo9aUaP/uKG20gBHNXH8tntGDdG6sxvJNJjQ3HnzwPNWnNN63XJiVLZPEipANZLKi1Nl+ZyaqOQU6mo38f99uteHJ49vzxboTNXwSLSByRCOjE1YG46e2OvbgM5HdFPlbnqegeAhUrSE/svbNt9JF/TB42ugDYpjvgaROVppysTIFiWWdUSzdP6x1+YJZ2JxlDm2VR/0e9uIRxMlnDSDfH9RkM4BhuZmeBSFQXykbbvNnHhTLw+SMhyvuVgy0enwh2MVmp6YfaNE2pZDk0Vcq3A0CDL3nCJq5l/icnJKd4IRtvQRLym9LDAbdDyryJRZTUnDrhtEz9fGcrp1fP36HYvzHBcgEV/kTca2PdOX1DKNaYSAJvi7D6zSYxN3pDWrVe9r9QC0OAoN3PRjTRnFKXYb3WB/joQCfNHLiteMDG32bc25fq/mPwFGmHbVf5gml3B3DoaiwTKDSWekypVji2ynnRI6Ucmt7Il15sTTwQo7bY1wBnxrHovryNhKpIW7b1KhYT57qx8u+qyZvBV4MWPN3ejzTVMNjPTv5JWCAH1EMLbU3q89eAvKPC6DmMGLuLzKw5pxG8/hBTbNMb7ZR3uS0oqdv26HufYluVpykNBbT7D7gUQMv9Xe/4ewI1CDiVWmluTbdTFikk3RGqhB8O1JTEqQ3W+PI50wy4RNPVBBevNJMUSyH5Aj/JzshamJKJnlhJiz/UcLKHqENsHLkiMEK7jQVlw2RJoqeh/d/5o4xh7UnUtQLIeF48OLt2In5oghqzGWAdO+MHQMth9Z6x7mCfYHl8ODvSOl7eIMJfvLQfE4j5Ib2CJXpYdnMC2ac6+5ktzuyr5SHlHpgGklgn9wilseIxuSaGb3jrIKSj9yIT8AhT5yD/RHArbtaIVX54pdVus6l9iRcIHBge62VmqNFzz9wAG3ERVFzkhvL3Gy8nXx75i3HdXm95RG0mOH+eXdOsevdxfpsApzLooqbKquY117oMM8uhiF+aigirCh8rxt+EMZXuXH/B/Z1BC0cPrKNgjmYCWAUrB4Kbwo/zcWU/VPFKRNxTotYmH1RTzgLqfkPTB2vb20U49ewtdp/Q1BL7gF3BNZsU37d4MECc+cdNQP0Bicm1tqzYzzm8RYHOtH6RW4sVp9PJsuEJU3wwKcUawAHVoNbXLCbmeeA/x8QORHpmefpGQDhpbhDDZ0ozK/vZR5yMJhSKCVHZrAKR1RLXHzlLH7Sz1zuXIdixa21UsBYNt1rZ/ezr56WDzml7pngsdYpmh6nIlEJtuZrlrS+eSNatnoia5PyU3JErVeCbhYRc2ewi05aKIu1BwdRSpqk5+pbtIiDxBGGez1amNb3Ib9zC/QwWDcWhxfXjDFS2ylJg8NGgyIRwyzrDLC7NXnWl/YkOBSi0mvVV+lyxB/SA0JhhzrgjJ5geqHPnnKaA1211t9cTI39V7fva9udvLzGyGWN6TVhBwEdSrrmJPss2Y0JgIPF0U9Qe4jaGn6/WtJbnTWj7pZtDyC1I22krtz1VlvslzrV5I+1GdRrQpaPk9pNSybVrGT5XzOWH8G7PLMktgqZJi6sWLeE3kJ6uoh7qX9oFYf97oHnhjnVE1Tz1zbLzwGLFVVQjKQyLujo1RU19bfrLqU6uYI84Bkn+eLf2ShtXgRl++zTghhmNhxN0bDeg+T0K83XjvhDOLe/85KcNPihB7JITvAmmeksUXKfx8rL90n48tyjWIeuv3Lw5KIO9RQuM6/XdkMwb4ujFfETACZCl89Qh3CabB/18tkEnsXQ0JrHuikv6ae/VWvkvUau7yIL/Ch63xsFejyoaIMNZnA7GlRNitwoXaFijqsn8Fh3v0jFhDjs4ubIvKOiITDuRcwr450pwzT7CZ88R6tXTENMZp1Wvr2JRkAQQjFDsUFg2hyN442fC10+PAPErQuhEnHKb0xCTGqyuTtjdYxEKT4d/6kYF93k4teafbU2im6W+H59ce2KmKwdJdmc1wL2aUYMR3fXGds34QpsUi+vRRorTznoYCz67QxpWQbOsLqQaZWF3R4ZKLm2CEgvKbezBiL9MkjlhRiLr6zU1sf9XGxC+AMUr6Wxe4KBgpqvDkrDfiwnclX8hh5T0evuw2OLqqOzrPhx8KK1887IcJQo2qJ5xtiWUOu/8S2fioe3vN0zF00TcpPAxFoWE56AxRz+5zFpzX5h2L7T5fxC/MlnGADB86iO6ONxw3YLtJlaWKiXkyDyhBiUq8m0tz5PJFdxdBO5B6qWSoyx0f/DJ3Tpx2MJ496gaNvXyuvngnP5avnVaAFJeBPgilDysmtbRpO8h+g4Val+KrZN04bwmoZeNiQUQyOTclz8hCSQh/5gSPnOtUOozvYroBT+0EoIqrY6VXQhe+7hngKdvqrH91ecoSZsPnmqKTXndoaL0L44+HE0/RGfrSduxrWiSmJB05sekGreneXZ/lRICwl16XPEtrCrZm4/jsDooboACzWIJDx+ERW4IMg9y6/nCKKBTsbdhSeVkJxhiHfhoGDRKhyKxJthsrUYOGN/bupP9hiUf5zGfw+9OtpkFG6iPvYRhKVvirCcKQHMmkAXSp3qOVj1jYPJjItZqD32OdGony1Dvwdo/SP7xr2gr8486i8nf2Xo2uuJeG1I8n6WG8NSJ3WscRlMIydjH3ARk2l+AkQN8KgTbptZADUR5QupnhpUIv31HxjWmtJfNlqIJR0ybjGn/bsKDaVLwLB6zlgJH+EjWoOxtXSxjkdRY2TsFOZNmqNlYGBjWEPkPNkooTeVvZQ5GqEFMCB7c/2Tt6rqTbz4hfv17C0VmRtSJdmziefRpwQmVsNRMopwyLhsCS42+UhZNs5AyNYmqF4nIBRlUZXV143KgKbACe/oWz9x2m23VBiJMCDBkcAdI1E6ndrLyTenvPD13qZqJb2DNs4Aq6Ce4Cb/zUhIs0NVyul/NqKcgslAIH37rL/phL/U55Le0Dnb45ikyTjPnG8XvO5FRytQo1XcoT9t2TRJSnCmh6C6xeInoCH1296OK5M70ttQfnluGv9BIwHaMiSWzuXuTMxSHUCysWqgcZyYW6aeqdb5l0zTVaveMpFHDxMXp3k+gS9ADIFVzgZrC6aMjpnH+nsQBhw91l9SPvpKN5H9lvEAtKYffyF3b2ynk2k683cin1eERyR2oo8PpjS+rWEjqOBN5ufxfgDX04MjLyGhmBp/9HJ+iMwcPSEHJteRy+t39PjYareXp8H3q9KXZTHrc/dGF1v15GQbnuKYR/KkdEEEpb30rL4hm8+UuzXwhpFwmjF0x7PzUMJJsP9O34Z4Wb0eoGuCecmxVbKiSbQzNPn9OqxqnCJm7OLB/fxwLKGCKuQB9hFrnMZbC3Su+XwCjit18Nwm0afAan8kcF5OZKDemytn12pPyCWLyWDq0CXLctUmK7u2gB/XGBDpnspVuMG+4JBpgoPjCjJ3bYtGKepue4qOn7aoJZlua5d1h2pijoQF2QICLCDV803D7L8a+Wu+7B3RW2dQBlVQDoyxjbb21yorhtZIXTFyPi7mk4IYIRpfiPcAJDIp3QhEdtEkjgAqj67unwuZVy1kl+zGCIYD1Gcy40VF9KMBgHxwKb4IbVV/wiTAmfSx0TGi1AHVpMv8FT629lIxQn5/NXOn0/tbmm+UpwjO4gXHMBNJH9iBjZuNxVwTkNlHxfvJLbeOFIZfQvuU2QnHomwJ55QTflKRuqYmDd1khGm0hu+tV6yV5Z+jR0ezVolwxjhcUoe6lSP4/hF9JTOggZa+kyFIcoagEUF8df/Jtbe0kBR04ggO+uePI93t8Fz84SoZNXQGJ7q/8GwWEvbdXXwuNgmRlvqlJY1xpoa2KuQl4FVgjqJL0tMgltmrCTcDxncW7tNrWNT5jr6JBRziiy0Bh/QoZudqaWzxmwUy5xI3XbUJeWlzl3N9hwC90VftDXMfonZAGGX6JQB8PlpdzofI1H55ZNIYyB54/UxVdJ1ck3pymFKxyXRRBDx9gVDbLh5fAE1nKWK1/R3SctEirajewpxaso7oLzURSrqIopRnHbdRAKzuNp88d6+2Kk6UNll9mo0a2WLfvpP3+6qXZC+0YGR0IX/3IaxdJBSS8eyRoeN4I2PUelnqA/cNgm9il+S5sgHsnzEBvnwMVe3cJIE9L7eEHHsSHo0J+jogRgQl1KmwimIyXQsNkcyuMQSwzkZdQSPx1lVNMASrvmPBVANqQTWA+QGnX0ceGo1iCAfs0Bzu8BGpT/eFA+Axpdh3ztyrCDQaAoHHMwNJd3Yv3AT8pJSZ1J3eivkS3tsMFurrGtRTRNOOXlpGfuxS0pitjE1kfnGChUXY/5n6TTP7oOAUh1nq954eHGdOUc0DBrgmsiskXNCut0cVOm7L39ZrjmQD/HrOlL+0nUXQrgGTD3RrxMmLN0LvijoKDNSy0m62uPswd9wU/pNJuHlNWhNq6Po8IeSJ6oXXYlgkLrbljBkVaIlHtIDh0f8bm6Uf1WX9yzLE5/9N9gwywam4aluXpPccGUYTqxxHvEtGy/cVfU/SwniIUgAYas+bU+qt51qmDW6149aJYgzD4U+MBJZKjYk1f6PDIpFRuZNCXuX1UJ+/xnfI1tWG9tMEjR85W/7s7583PY7TkYfYoQ7qSUy1XSe1z1qcSt+8PXaryi7ghfe3bdS5RMX1C29VLk/LHEujb2pRjrE6vfaNfTVJc8n8Y/Kul5qN40GsaRbcm9CPEI8zALV6GIFaX8F/jn5nsZbwF9hTY+abgEzzkTmNtylI/tVM1MxxiCjef0zacWIoXuyDkPdbN/o6WtM1gOPkQABiwQZ1A3zSZi+xxS3bh58Nl0PMhBp2cIA42x30M9Rd7ed8kaz92R05kL1QZxd3di5yX2YdqM0zIZF/q2FZS05IxeHT+azF5ndFHnQc0lZ1IxE/HFn4vLK5kPmMDRlPlKzM59DBnxNS1fMuL68gkPnjz2iMh3/BI8RsMAtfAWtU2fan3/+llI+dq3NyZatvlF2mnjQxLu0KKlIS0s85j82furJk2ioJWrx9aQTwtB6X+C6z+e7QrJcTdj2gHzT6LDJZkztQlo6YVLqoIphqd2YDENSJ/OIn5hu43jgkXCaMm5PjfCJ2oGewe+UTTg+lBcYNeysfPpIpfDIzVnvWxh5ptzYzP6DlXvVvAhe8w5HZfGwHKf/ySurSkv6aej34ngadIse4T07jiygKy+h5uTOGpX8gnQUUUmm6hDFgRl0QzoTLbrCLqKGhoVX71jqWXtgzDmedok/7rgbj8ur3PZT2DSoy5B/qZWTX9igviMpEQE+JLMefysQYF3+/L0MYkTLHLxNBAYpejxEi2gTDmO+lEkBbbNLuIEtZ7nxBOM4zyRteha6eotsjEWsjgN9G73+S/YFQI2COw9mM0NW9c21QbUoGZSWlACIcNQxBAlxXsZ5VSA8lqeqQoOR6cUxAjPUqLqbyBNc9yF0hK475bWRicwEyuBJldEsb5m/KGAGeqiwX4f2p0V1nAPN4aEV8XnQh8uhk45JH+ZsAZj5yQuvm9PwSNsVMG9VB/V5mJFAU7e4mEh0tKEn9pwrviXs+phvjP3c5RR6h/Oxnl+TV5eiD2cxDI7cZNuVh9F8qoxJ6soCaAD/6dfctF14V0ddsipMX2H0N1FY+3fw8Jbld0UelLrW8sFSFl0MHHinJUqUhxLHtP0c8+8AiXqGLuFt/rHcnfOY35HQ8QpnAbkRY93112qGNdoyNfPrhHf9d7xybxX1Q6nXi+5JdrXazlJGx4XxW7AUdR5w4YJQTJcPN05b3vrnhxky71KGVvTAi6DM1xfDalDMh3O97oCJtTPBImCu6DhND/LuSEJhl9Ti7+zA1mDLObA9SsKvLvYwV10z05aMGqtiBnjniCVGWWtDt9TpOlx+M+40QPMYaY8VF6cT6KfP6Uk6gVXkAUTpmjRcPxnLXYuacMr+JTf9ZmqcTBC4DVb2KMqH52cOpI6A8z5N1KNUd6ivlOOXWE0nkAjZwgP4V8cfCmniJIWgAEsVkT2tlzDOpYcXbLC/o/ecxJWCg+UaoEPHvgJiNJ+HHHGSrRgabgryplHrVynATMGRjxEOM9ok1rUFM1y8tOCzEPK9ZrVcez3G97QzOKqM8+plHuf8l2BxFQCILMbzU59Dq0WTnHEt3dirg/9R36OLCuctC+gZyPG7j7at/XsGL9D27YN9KcxZ3YB0MF6OVmogS8KYgnCrR9WsKveFF7K4WX7r9Rvj7bE5w1Nh1zXoYprZWtUwW4pdArIBsFTj5LH0MufF46n2g2vDGyQd49NGcTf+NHpJS4TtFFWmNqOKvPOg2DQOVW5ieAMKiAZPmz+/MDgSome4/F3uPwJ+1tYKHnQtVdkTF4DhPEnsq/7M7uwnBxcS+BJ/UnPMoMoscNtbGwryZ+gYIv5KWrTQmWrs1DNTR8u9+CV1bCOoYVtzMaB3NGSaH9TIKMRn4WRaWT842cmHNo2R/qE/LQlAP4VbSjWfzx1VA13eijR1FIE+S/tlFsM4eOy+JQEocatAoFtM1t8RZ1NrhPuty+J+O+LgtXLeo1/pQLn+pcN/WxN8312qZzUOjKVpuGor/UEJUMiVD69bbV43gkPqtPCwsErDnOsdHI9JgZTPTrOWFWdJjgVJmBQ8vPL7/cMpZxVhCLTf0Rg6cVXUBYYAXDt6c0VomuFJBX9g3HWGrgZ22fB9GhhZjhJrEb3yGDwSBZycf6uui5h/ctYNnO9nXmEpcJNgEBVgLHtPmZUXFI9JRSguVsYYTt/4GZJq4NNbLHMAOVXz6xuEX6suSUunT3pdSLUpr6v0wKPlVk9NZJkOzMUIuE93A/fNakN+Ccs3KtHGAN9bBtc+treKNKINuZ1XUS/CYBAnThSzJYrJ1CHX7nsc7DKNtReLDp5yzRqWXSN0tX9y3Q+EiudN67MRTadn6okLxVJTrN2t5Lyyq5dI307lH/w8gR2ZkQ8j1YGYf58XRmLGBegMxocK/7JZfKAXC7I0XKKkdqNLFwdPmew3VxookI9bYayE/vCVY9TYuOtZezMf5QqU2kf53uAhJImrbrw/psXoJxlDazFz/rg7fcJ5/87klocJFsvvqGl0YBJvq7v03AaGlse9QeYh6jtg5QvK1YopfnXL6u8rVpBicu/xrSFyLSQ2GqS7kZBTX3Rch1Qb6MdqGCFrPiVQJKXddEQYELbdZctItRjT5kS3j4N1K8rkX96JiJ4ObE1liDxX/G9SkGO2RoFMnw517tWmp0adASzndXJJEXFVC7cUeJTNOv4UGU8AkuvEDdf/s/00XnZ9YODUD6uI36PHqlfFz8vyWklW2JAwQlhCF32fu/Yp/V1uedtxYHRg4rF1ELeEU4ekUSjKLw53IIoxa+N6jFfzUidbIMyJRxs74jr8AYJzotFbYaphf26w1PAmnL07mLfpkfvB2pKlqpmTarKcjmuMRaIT8fL50eSO47a+8qI2XunjqIaMD4+liRguUUXJodLima0Xg2hzlg6XqeXVN2v3j7OAkkKY4vfL4bw9jrGCxCK3ZcmtfS6KWs3DeiAaEOABSWLZqBMfKlhxhiS4vlthjdJkr8e85/Y+vJ6dg56MzuQxxVzf8MLAjV7UtchEutLOG7csVzrq3JLrnFL9pF6y8cV5A9lMeG3o0tOCvKmg/Ai3TYsxt8rG0PsmlMiB9JYrfjGvVOB5XWxlx2oG/ENywAfRawezwp/kkFi8UBw58VSaE5h099DTWN+lKnEZR3tG33HCEWHRIXXMuwGFdwTzSTihGoQFsbAAaU4iMAzYA5xHIPg/MfUi3PHIEgLa3/KPi7RN4zQkezdqs4xQy1pQZcpMfNbcWfXGT8NFS06vRpECb6p599FJSQA1rXd1AkbC3NexTJU2EfmDFxu/BgVgr2FK1DvMqNL/koDhDR5y7n2Yeu/NBx8L721WUoic09Qw8UI1KF2IfgMmNpnuChRaw0m4BLf4N2Hi1F+fpYFkOpYhZaFtx1MvK48MlpmpN3tBvIs52l/bSY6dlQvo0Ap8Uu7gAoPjaQ5Utruv16xoq7XLgjSp5ar6MsmyyMlnXZYpbj45WMk6utYtqfvp6pSydgRyHeS26nhYYwB6x9u31G1VMOUoehwhC0ZUC/wZPtEGErLs7KDYu9U7b+pI/JfCpa3lJJ0w825HyU56c0/4dxq1fcGJDDxELRHbAbHkgmB4Au7/yJNX3T3j7UwyFJibb5wyZaylA6aYOdobX4xkjE+/AQvdig4uEx10pnF+346g2M7Cv/8D0e7DdNUPaDlgIaLAINfDo2q/D+Cmnzzk378KOW2S3ouiuWBBe+sVp+9tlyMm3P7JF0jl/S5rYjvX+F1GZDa7K1jhtFjOKRC6OvPl7eyCVtoY6fIVrhbx3zl5WjNaWWkFRAvKWXAT4F+Up2vMy2WRMCssFBGpMMdNkAbbElW2g3Prqddt2+AK04N6OG6BGF1/J3nFWM2W6Balt5ODD1mAtjEockGNiW+FnKh/Nafgy9VLWo5AeNFrK42wHsrWEnDrVzGkHGpuziYmV5nl80WEY0GQsXrYllQEfV44fySk6QlswXzicvdQ4TplecOONMsWksUASD0IyiQX1nJEIXdYczhTJjTIqw05QP2A55h8f/zNTXw/xjzSPl/FxUJHSVBN/fGkTemGmW5zPOxdfb5OXL8C8X5sfKr1yn/sG/zZEeEjZbv62OgpqnTxBe3AMCtLpbJdwtrZtiTZv6sBvsZhW5R+KWcOjAus8A3yFv8GxYBbtoWg5/KRy9TBWSisZKsKDcr6A4Ly1XLxRG0lyVJzRkG3+etzhgN1nf8NAmpMLrkHjxR5pjwgVDr4Dco0DHunx1VNoUJzhr00kvsh0CreZyBjT4+Hds5WZV2EvSeocao9n5HeSTGA/+bc9TXcNHcinra9/0O4KUSEQLbHKkjw9Gg6g9JqIkM4l8k809bEGFKPTFaC8+oXHVzPoNAx6lpf9rOykZbPyRdde2vHi9qr/Xjk2X2qHmsXmB9NKh7XDsOa+45OAkPyEt74T6t78eZHrJ+iNd1IHC7ZxJPANp3JB62dQLnKCwDcjU5wALen15HHPO8RrrboWNAiiPfSdpIIgb+25z1aiFZmlRi6qfiKWgKhra7AshCi9/pirYKM3TpSkP/lFLKpTrvasSxGCTlYEhhQHXREjLu+kZdKNrzR8Usol7PH6WL5K7W0zdNIcxcvua+2X04FIfnPAh80JTas85xfhJdQCYuqlsmB0JuPubZ5PIwwdueC0FVELR5VxtPX+qoU0FGBa7XICuCH5sL70MHLMCb1JApn8YWj774FkPZtDcDmUK/vHw6eTQkTSzyXxgMACADY7Xnc82GR8kM6mt25/Epxi9azczXliaSFfO1pVrBe4BJzHLOpGqy1oSRNwf59ABxaXyA5YYeTPfeVsCwt16RFKenLVuiRFbAWmh3Zof/V8Gh4YAlruYE+LQoQKfZvL5Remb8iZfK+Tqk7TD4yFjejlhmkpaF4dD/hpBi76KI3fSS3ASMGfjEjooPy/HAXfBA2fzSGvmrnSR4LI5ympTftLWV+GckrGeeRfvvGot5h1dwh4fQesMBopIEnVAjbAewHvFf8K0k1Um6CXVZD5ozbz1x+S7ZbYoDW5FVdFRpIfZw43w8Fs/07t+JG3+tOs/cnAo8oi9eTJrFfmPiAN+T7vMd+FKI+QwwGG4wC0vpOpnuQ1pzmr957LZVKegqczg0xgHla0nja5FFi9VWl4ie7iWbhU/Ud++7m1kw++Cp+8JWSdA8H4m3ZisUn6PmTRzAh1I5T3x5l4Ke3VN6JQKFLYuEL0/nijPgG2fVjetRXthxOqpVvBYNKJt136Z/pVNwC5jM+wJH27PYHnmzfAWYUY+vqb1ylt8eYAUTd5lFvq4pAzlviUOkl8desxrgjtRi+RUz5a8aAbUNEaHopN6qURvjAnczDMLi/La6n5qqUr98Haa+kQWOBj0HlhR6l+jc2xG0RcxfS3UpcahPCyNzeErMZiBZ0/OQxrWyh44R3zlwb6/eNeT2uWO+CoAmLz2PwkNvFW7oM9rs6+2I98zVOZwq6bXw/But5xBIsqjD5fa4PSJJL85kY62J1ccvE6o7tdT4kE+/bQVYe1C/y6QBhDotLakEFutYWYVPaPZ1Ae9WyPkUtOFhxRZoGOY5QeMDtrQ26I7C11ktBDYvgyJdMWj7z6mOt2MWzDRxtapc2i9e/dqrOcqRDqQWTS3oSMVvO3sE5THdvY/nBezgeYw4G8n2fwQHGkBnMECpLt90rubkIkYDHQ7tckliY8KRxj75RK6ytzlM3L/F6uUVhg4ghQ7Vgp2Hkmj5GSNqw13F8KyD2NVO8iXNYuQJTKnPzsSGvciIptk81bmoH6AecDOr7s8AykvFbLbaI6ki9MsiYshcwSM/gs4s3b/f3YX22av9f5F/mbHIiWMcF41blTSfe0R90dwyuEmTlUzGjdNsn8DPsKPU/xE5ikxUAw3UgKqgCKUBa0xzCFqGyPgY7b6vkWf0AGK1lOq61/FRPQrMFbQE6XMgRBaMZc3R73MiVizv0hiSTRpVDbDXblxPY+0+/3WZnAZS2izdy2Hyb29oPkk4B/EKZhLxUVN4AgOHJKfzZWdKxCRZ1b4+bijWpr25ZHaH6CnjSdbqy7Wse1t9g44ufVc9F2UfiU3vjhSJZdyZQexesopWIzMKmBO4KAm4ru1LVPe0ewWimrhf9lrhRYDjOuOtnXA3Y4rfR39nJPzP5BhcpyRKzWz6PJQVj5T+K2LeIwgNS3Ik1ekUCqsiN3VTEKvcAJgQwl0LYBA/SUszIx5gh2liO5F97Qw7zlUrU4wUx6nd4p7d2olXwz8/Ag1r/3TDEXFhioh5bFbzXadpoVWHN6sXQqqvZxU/vcCExa3FWTMKG05gjR2a/7VJzcAaIPY0XaAEwvzpXdDeXXeNgCrHl7ycYTPTslfDB4TxfkzfwtmyzvptT5NVAR7Q0M5gIBIuJE6XSSBJOPSd7GgYFHv5WimnL2W4mQTEYWfoVYv7i3gIWJKZVJ/knG+3d3IXnNy8L9JxYuwjDEX2lEakz0+U1PdVsCHbDa4X3TzPvPrQz1eiOz9tU2nZy2efPPVnupbcyky+tn52H7jZ03jH6kMPDDzvIkaikFW1imCM4Sv1Jxzu63SNicoub2+ZddIWlfzTHiNuqj/kyV3pofOGH5qchF3kFv56H5d9PCOJz4v8MFwowfbR72SlYwORZmGXtWRf7wg+/rEmhmYMYH8vaXDBEEzxoBwErRax7Z2Uc8n1wdxUlUsOnl8PXchrHvsLcTMv0nl73vlcAytpVf8P4NSNZ6w6FLgdGFDbUSeaApGrrw9q2RQLfg9MIZRA3BrCa0ZqfDN5yfjuAYkx+JPXJj7N13/PkdsiCivq/oUr3i0U8m030jaDbfMaVFSCyWKxHZS9WMVct2voGOVMVnDAJfNIiGfuwIJcXhNnZCNNpvx01a8fbxaz+wowOoasNUX+SRW0C3qvaUtIeEg9upSgQR4RcAdq8OXrrifF3eGEOt5+VWlXV0DHBDb+hxghWEB6G3yz09dfud6mM1kLJNFfNgSiThBnaCMKibytyp+Rl9NgLMyi6U+1Hl6VBkkeEi1Oq1CGFtjUt33BJUZqFoHPZfBXQpfBP99oIWsUV7/aiphWQhPmDP9Zf+tTbPuRIZC7PtEyjgnFp3ucKNHqKvDJCmdddTpSaUsQmUXjCftyxcHm4RP4lPvLMTh2R07yfRo4J4rD0GXYgbiLGuOH+XczzjvTXSQq37gojdrgMi28V/tdZh8Git4hCvGBOMr3sjjrTa/NdbU5A83cTf/TvKnIR8QMWvpIShsZg4dMl/MVAd5kFx/10DIaZKvcA4wugjDVCRpCZXmd5dgYoMXh/mccGuJFY8G0CrkIAes0aVEvm66/X3f/u86ZVuEtVdqBWpz1HAqL4L2RM2D9+8S/uS/72xjbyuCjyk8eDBVnKUGyWM9V4uqGYZeGFTsTDVDNQxqJ3cdg+MopIPbLYalwK/EEpOOwbACYh35+bdxeOp+zu2QPABDnfTHkGdmGoIv6Bn7EATnUGtONdwLCJF+fleazBPDWCTpQKYYNNvijfecBA2nJpqRDSKOch7jnudUQc9aO9jC+lzx0JL25oNrfiLBmeKb5eh7zvW+/kSm2E19HPVb/jV6loBw0F498/BKVtaF47GEgQBmbgUkvsQ7npDpT8bj1yDMWvvsls4ysgliL9UWXpydIjJZlJY1iv3WCKHU+/6TzclKrKuIsJYftnaslFuUuTJJy7hegCOjfThr4RII9Sako6VsWEtzSR9XzTMOxyvNXUdpzOddeMNb6eev5w2LDLcKhWktwKeDLYD0Hx6m2+nJX9ZiY1QNrhzOPhNJL3Kyq/5FgBLwYjnyIo4he8MJ2sauQvyMVM5iDKDgfe5JXabYK6s4VH8Pc6yoI5WnCWQJhRTQ8QPxdHiZfpDlX0kLNs9+NoZEnZrvVpGBKf92M0ebYI0lLHhrUqxg7AQad3BBDFPN/tDyxbdnetJhy+un5WEHc/DP+hjoHOPJP3OgEim9Q3tg1nxXVpwYksuxtP1XnCERFxnW3rs0sqhsIGKtrXDyRbjcIdO9mRlhqIwnv5B4ONLAex3/fBloykMq1tpWgrL6wxhyxURKBY7g8qgRwXKiUZdpgl+qDgQArEFKmBDvf53HrTVM8uvqvLeE7UyxHGFgDas4jeiXjucA+NDxwfVfNI6aN9aLPFBQOtmds7SyjMyiZh9Xb7chOPNwJLKgZuQP0pxFNYQtA2LTEix136Po6HTDcjK0G7e4QwDy8ELrH7epylAD2WhDYwPs8FqOCOgj8RlYopD5vBK4Hj9v6+TSSxjSDbE2oencEhWtCwHNnGw9Oh0GhbXXabboXP3Sg8oFz/rSESomk7Y6Ff9oDU5hInxpayKJF/S6R3Dq1DsAGbpg16dLH4PrQN7zVdUbJh/u+tUsHL9W2QZhhGIenO9uRyV3hE5NzU0207MlsJUiFMokRaIsWOupkkGVKuMNyHgTw6EOa4wT82QPK7z7rXOb1kEsIhOmHyNg65rHAlpjziClH0I+YzklkWrqVFxp6gtcWNnzxZSdKOPoPCMyo/wngCG7ENKV5CZyD6eWEOWGLmB/YS2Hug3uzdVGVxS/nTITa2GK8G0MpizerQLKXsCDFxf1hk+QanZbpPn2Jjnd85om2lhOpIcnOe7QkkObK5LnxrMjYUP3LyBhQLBP0QyqPlnap3yWObS/bTttSW7PBaskwT3NzEFEBxQ7TxjzRnvMFOjafoHdBkyOnk7WXDAZNE2GngQQW2PmeFVFG1d5Weoklxprlw2biudt4Gs7xFm9jxZJefnI0BH+hT+FN4ZusyunVKn7FMALQtyD8WaJXgdhUrh2EOh18O6lt1bD4kddr9Wyc1IIYrZ/vVRFcP0B0ja2H+Kd1Dgpedotl4hXZc+Sa/9j0dRHrddSfNZco2J56gFUldw2teGzKLDShNYuBx39ooeO0TqZP+r1zXeTgDEXLA65ZFeIaoE2EKzqzL7oqxDnqwDFV3ExtE9H6N88NX6rmMaryUlC82mSydCjPBTBu3DCy7xsAd8xUynkp32PxVmzADVbFH7ErH2UHtUAoPpa2vFdLDolb3iotdZI5IgWVPjYq97LsDEYFrJ2WP/WH/cBZTqTrdjnDw8biPxFLmmlU0OJFHpcvvvwz6JcSMirpqskp3sp49kFLvGkC2v4rAPEh8LhxNC6R3/rRnBYb6HLfe5LDEeIWefQhDPlPkHjdHmJGdDmXXQxI5cW7Lsdkp2UuFMrn8G1voD4Zm2GXz6EiIneHKrtY1VpYl2H/WH/cfOESPdF7b+ahrCsuG3Cy2goI9WDpnnuz+QyjJH5H9X6Bhz1VoSE/BP80rUgXJ1ggoJ2HrOSpAMOhebXaWKvTNxHl9dm4pxjNE+JT+gF79VGj7GoqE1xu3FH8yAmIsbRWiE07e8e50413IUWvsaJvCXG03uQettou3iGHn05KOPj8a1Rg3MANB0pbA1e7u7EBbvmr8ls+7G4ZhTpr9dtODcdn7j2N6VdBZmVAxBnxsS2nZcAs7G9RmsCaEL1frDoOgxa9hrzdW1B5fqfAVd7S7mZstGw3cLJ7PngkPvRMzVEg0YWpRt1VxT1RtMG2zfx17xxZ16b9HST75+Qku/dvjHw3g9zZPwbQuO0CNB6SU8CUdIcDR6/fACAZuzmqp6VQ+Ou+9bRrgSmX3G2qhm7O3Yt/eDanDYPm09l7BaDnIWLFAPaL7L9qa/B2h0si3J/s99Auw6jvExfVlZkt1HwT761ciQqjHkPCsROSrCj8oSRg4q9dut7JcgHHizDEmFGMQ8Li1KFOUTeX55ZclpzBLFMJUATacP23IrA7NVpBeTvibHGJKwMsdBmUNmL8/FouD2OO+LXljr5EIpe54CKCJ0a23rLfHvOVtaN0QYrpRMxCh+ZLuSx9y8S6+zkzYiAEQpXh+rBDIi4x/GHB69aHG47Au9Qdy8qB/IVwRF/ghtlH49fJj+yNl3UlG0X6bx+GSc1WoaO4h/gtmL8WQsx8BfGQ7atS52obaHQCqdHGg7dAggbbzy13q5m3Xj06ey61tWz3qvBNaJCpSoKi3rcbNHAsi4jWd2h5vgVEuBNY3mSzKEpOw88kKkyQZvxJuf5MVeleJDhcgEB01v84W0JrNniQwWbbZ6SzI8pf8f9Q9fg5yeQ6F6tBP+5PwbthF9qQg4LSoVf4QbG50atRkRSOOW/yytz35JKe4m5efq+BwC1nZztN1OXkWZR4noTZ75VYx7pRiovV6IxHGwtEG0PebsdbcFYyzBvVkgnimsKLPKIVxJF3GYCeWoh+Os0PxmzlDTBBowJvztDVKiJMjLBDzhRIUYK621mU7ua5wnFI8zGpZf6RKrNiClkZ4zK024RTfteibzZsMGZCxxVXJeD/QdNCPT61j1V2Ah5UcMSmX0y7RexuzkP22DNj7+18sqoFGgmZpAPAJwAsAHpWiDMjpka09tBlr9ZIyzpS2VmiINk9KYZqYlNpeufFcXv4MHdN9UGJmaDHhbbIYekiw47MUTLHjUYL9w8Y0cwXAI23lCy77/6bCKSwts4EZ3uSn19D4opMK28JbygGZC5BSt+gxBJZtFbZWpp8BkAzmTwF19GSFj6Y0QIRhGCFjSiPNUAm4772sv190ab+y0mo6DiaitUT3oK88p2sjCA/ub6j0MydgfmfyFn1srHskT3Cyl12roL7lrfTiwT/K4S20iGn+PPte7k3sD7Hd6iWl02et03/kyIsm/Xk3f5H4403PtcJYQRSQZwoLYX9DnVmZ4gUEuxU6j90cY4rMi8D23I3NNbc5yBocyKaBI3WyRymQovMexyinmhwPuwferIGMfhWeRjvFdTB5EtB5wB8NbgrjeoK99sLElGmwPj/YkIPLV2BejrT7sNYQzTHf2qiGu/WKgbC4g2TdM3O9eIjDj44t3NOWPrRiZAshq5qBMVTHi25dJ3MGATLe8/owA2TCJxrbV78oKjcKxXCthqEoVBZpdy90J2AcntqE40iQSb1Xc/itjyxLFB4slJM8zdpKUIqAgObmQ+263Mqzoq+rtq4825WOZMFR5V3FFhL3fxiQ41P1icT2aJ/FaY20O9YSyUpWNnZkyzLVVkO4sx2wBCzfBene4ymgsrlQdGg3jFfMUA0Q/CxYHgTsaO9fmdWecFMyenNDiK15j6idKhC+TneDuZf7EdYN461wu8XmMT6ZQ8Qn7mADT217YpHpseslR4oMjn7xVGvejzlK0oou2j2dnpOh6y40qh9s/Zq+vXplz1zhj+tQyhe3M4GwNwKur120MWHdQJDOTMUKWy8r09CsQq/N3vpDmhnk6Xq7Gr+mwvW2PPTXZ27RrDEFGjzudrVL0jiOqfK/weOlEZh2wTKtrURvvRTjgUEE6T3OI1qokcsft4bOLmAmA870dKRAAMXynADS4rWt8vMl5GYpWIDH2eaVkhjyC2Fwbtsf53ALOxGDsjVo+8pUuWGYhkq/VnoABiCG8l6N/ZLS69ImzADSfXd7J1cVHRrHyHYyQiVDnjRAV785eBAFpBunYUGr6wM8HFwPzSe/zqKmPmCAro7tgMFh0e92jwihmD0SBAdwS7jKo4EOx7ZFixiTgrS5o6iskZMYSPCSgmFqrqs9fHy2XRpCnTz+UIKQKVVPQ5uoMGNyalIJZOV50Cf9L4fdhtN0J/fWwRC3zfLZkoOhgsMI7rGgy1vvQuZdrAc4ijfoHWz+Y+Crhw7w3dpcIoVdlXxpTH1oVXhAJXRv6CfiUwkC1EYwmjpJbzLLs02i+3d+HTX+5U+l4btp2QgeWDCUAkCHuoGrxZ+AdF6PJ/XvAAmX6AwKXBuuTgB0ZW89QgscpttNnD3aH51OO6g4sjMqgcQSCl1K5ZQmI8lxVAggIm0Ck2dEtrrod4xKZSH4yv1vst8yBgOXodSNa3Z9au9qaHeldQ6sbGzfEGZviDM3xBmcGNQw3nojgrTNokn5W65ULcA3fCjfEaglXKGIHnyfp4bW8QN4biGbVfoMBTpC++/uqDkBECMDJLYIEbBHaK1p+nOhlh64Sf+aJB+NU8hK7O+LOnEp/iQ8ZWDoDN6M0tEqjjJLgExKSKrATEpIqsBMSkiqwEzTlOrQjfjhbhv5RfMSp8kP4dtudlSzeCY8MaIAAA=="
                                    />
                                </div>
                            </div>
                            <div class="timeout" style="font-size: 12px; padding: 3%">
                                15s, this Tips will be automatically closed or can you just click
                            </div>
                            <a
                                href="https://github.com/Kyouichirou"
                                target="blank"
                                style="margin: ${mt}px 10px 0px 0px; float: right; font-size: 14px"
                            >
                                Github: Kyouichirou
                            </a>
                        </div>`;
                    document.documentElement.insertAdjacentHTML(
                        "beforeend",
                        html
                    );
                    this.support = document.getElementById("support_me");
                    this.tips = this.support.getElementsByClassName(
                        "timeout"
                    )[0];
                    let time = 15;
                    this.interval = setInterval(() => {
                        time--;
                        this.tips.innerText = `${time}s, this Tips will be automatically closed or you can just click`;
                        time === 0 && this.remove();
                    }, 1000);
                    this.support.onclick = () =>
                        setTimeout(() => this.remove(), 120);
                },
                remove() {
                    clearInterval(this.interval);
                    this.opacityChange(this.opacity);
                    this.opacity = null;
                    this.interval = null;
                    this.support.remove();
                    this.support = null;
                    this.tips = null;
                },
                main() {
                    this.support ? this.remove() : this.creatPopup();
                },
            },
            cover(color, opacity = 0.5) {
                const html = `
                    <div
                        id="screen_shade_cover"
                        style="
                            transition: opacity 0.1s ease 0s;
                            z-index: 10000000;
                            margin: 0;
                            border-radius: 0;
                            padding: 0;
                            background: ${color};
                            pointer-events: none;
                            position: fixed;
                            top: -10%;
                            right: -10%;
                            width: 120%;
                            height: 120%;
                            opacity: ${opacity};
                            mix-blend-mode: multiply;
                            display: block;
                        "
                    ></div>`;
                document.documentElement.insertAdjacentHTML("afterbegin", html);
            },
            menu(e) {
                const target = document.getElementById("screen_shade_cover");
                target &&
                    target.style.background !== this[e] &&
                    (target.style.background = this[e]) &&
                    arguments.length === 2 &&
                    GM_setValue("color", e);
            },
            get opacity() {
                const date = new Date();
                const m = date.getMonth();
                const h = date.getHours();
                const [start, a] = m > 9 ? [15, 0.08] : [16, 0.12];
                let opacity =
                    h > 20
                        ? h > 22
                            ? 0.6
                            : 0.5
                        : h < 8
                        ? 0.65
                        : h > start
                        ? h === 18
                            ? 0.35
                            : h === 19
                            ? 0.45
                            : h === 20
                            ? 0.5
                            : 0.3
                        : 0.15;
                return (opacity += opacity < 0.2 ? 0 : a);
            },
            opacityMonitor() {
                const opacity = GM_getValue("opacity");
                const target = document.getElementById("screen_shade_cover");
                target &&
                    opacity &&
                    target.style.opacity !== opacity &&
                    (target.style.opacity = opacity);
            },
            supportID: null,
            SupportMenu() {
                this.supportID = GM_registerMenuCommand(
                    "Support || Donation",
                    this.Support.main.bind(this.Support),
                    "d4"
                );
            },
            disableShade: {
                id: null,
                cmenu() {
                    this.id = GM_registerMenuCommand(
                        "Switch",
                        this.func.bind(this),
                        "s5"
                    );
                },
                rmenu() {
                    GM_unregisterMenuCommand(this.id);
                },
                func() {
                    const target = document.getElementById(
                        "screen_shade_cover"
                    );
                    target &&
                        (target.style.display =
                            target.style.display === "block"
                                ? "none"
                                : "block");
                },
            },
            menuID: null,
            Switchfunc() {
                const target = document.getElementById("screen_shade_cover");
                let result = false;
                if (target) {
                    if (arguments.length > 0 && !arguments[0]) return;
                    target.remove();
                    result = true;
                    this.disableShade.rmenu();
                    let i = this.menuID.length;
                    GM_removeValueChangeListener(this.opacitylistenID);
                    GM_removeValueChangeListener(this.colorlistenID);
                    for (i; i--; ) GM_unregisterMenuCommand(this.menuID[i]);
                    this.menuID = null;
                } else {
                    //rebuild menu
                    if (arguments.length > 0 && arguments[0]) return;
                    if (this.menuID) return;
                    GM_unregisterMenuCommand(this.switchID);
                    GM_unregisterMenuCommand(this.supportID);
                    this.createShade();
                    this.SwitchMenu();
                    this.SupportMenu();
                }
                arguments.length === 0 && GM_setValue("turnoff", result);
            },
            switchID: null,
            SwitchMenu() {
                this.switchID = GM_registerMenuCommand(
                    "Turn(On/Off)",
                    this.Switchfunc.bind(this),
                    "t6"
                );
            },
            turnoffID: null,
            start() {
                !GM_getValue("turnoff") && this.createShade();
                this.SwitchMenu();
                this.SupportMenu();
                this.turnoffID = GM_addValueChangeListener(
                    "turnoff",
                    (name, oldValue, newValue, remote) => {
                        if (!remote || oldValue === newValue) return;
                        this.Switchfunc(newValue, true);
                    }
                );
            },
            colorlistenID: null,
            opacitylistenID: null,
            createShade() {
                const colors = {
                    yellow: "rgb(247, 232, 176)",
                    green: "rgb(202 ,232, 207)",
                    grey: "rgb(182, 182, 182)",
                    olive: "rgb(207, 230, 161)",
                };
                let color = GM_getValue("color");
                (color && (color = colors[color])) || (color = colors.yellow);
                const opacity = this.opacity;
                this.cover(color, opacity);
                const UpperCase = (e) =>
                    e.slice(0, 1).toUpperCase() + e.slice(1);
                this.menuID = [];
                for (const c of Object.entries(colors)) {
                    const id = GM_registerMenuCommand(
                        UpperCase(c[0]),
                        this.menu.bind(colors, c[0], true),
                        c[0]
                    );
                    this.menuID.push(id);
                }
                //note, who is the "this" in the GM_registerMenuCommand? take care of "this", must bind (function => this)
                this.colorlistenID = GM_addValueChangeListener(
                    "color",
                    (name, oldValue, newValue, remote) => {
                        if (!remote || oldValue === newValue) return;
                        this.menu.call(colors, newValue);
                    }
                );
                GM_setValue("opacity", opacity);
                this.opacitylistenID = GM_addValueChangeListener(
                    "opacity",
                    this.opacityMonitor
                );
                this.disableShade.cmenu();
            },
        },
        antiRedirect() {
            const links = Object.getOwnPropertyDescriptors(
                HTMLAnchorElement.prototype
            ).href;
            Object.defineProperty(HTMLAnchorElement.prototype, "href", {
                ...links,
                get() {
                    let href = decodeURIComponent(links.get.call(this));
                    href = href.split("link.zhihu.com/?target=");
                    if (href.length > 1) {
                        this.href = href[1];
                        return href[1];
                    }
                    return href[0];
                },
            });
        },
        antiLogin() {
            /*
            note:
            the timing of the js injection is uncertain, and for some reason the injection maybe late,
            so that the occurrence of the event cannot be accurately captured
            don't use dom load event =>
            */
            let mo = new MutationObserver((events) =>
                events.forEach((e) =>
                    e.addedNodes.forEach((node) => {
                        if (
                            node.getElementsByClassName("signFlowModal")
                                .length > 0
                        ) {
                            node.style.display = "none";
                            setTimeout(() => {
                                const cancel = node.getElementsByClassName(
                                    "Modal-backdrop"
                                );
                                if (cancel.length === 0) {
                                    console.log("get cancel login id fail");
                                    return;
                                }
                                cancel[0].click();
                                mo.disconnect();
                                mo = null;
                            }, 0);
                        }
                    })
                )
            );
            document.body
                ? mo.observe(document.body, { childList: true })
                : (document.onreadystatechange = () =>
                      mo && mo.observe(document.body, { childList: true }));
        },
        Filter: {
            checked: null,
            //click the ico of button
            svgCheck(node, targetElements) {
                let pnode = node.parentNode;
                if (pnode.className === targetElements.buttonClass) {
                    return pnode;
                } else {
                    pnode = pnode.parentNode;
                    let className = pnode.className;
                    let ic = 0;
                    while (className !== targetElements.buttonClass) {
                        pnode = pnode.parentNode;
                        if (!node || ic > 2) return null;
                        className = pnode.className;
                        ic++;
                    }
                    return pnode;
                }
            },
            getiTem(target, targetElements) {
                let item = target.parentNode;
                if (item.className === targetElements.itemClass) {
                    return item;
                } else {
                    item = item.parentNode;
                    let ic = 0;
                    let className = item.className;
                    while (className !== targetElements.itemClass) {
                        item = item.parentNode;
                        if (!item || ic > 3) return null;
                        className = item.className;
                        ic++;
                    }
                    return item;
                }
            },
            //get the url id of the answer || article
            getTargetID(item) {
                const a = item.getElementsByTagName("a");
                if (a.length === 0) return null;
                const pathname = a[0].pathname;
                return pathname.slice(pathname.lastIndexOf("/") + 1);
            },
            //checks if the part of answer is expanded
            checkExpand(item) {
                return (
                    item.getElementsByClassName(
                        "RichContent is-collapsed RichContent--unescapable"
                    ).length > 0
                );
            },
            /*
            0, normal
            1, searchpage => check username
            2, click => check all content
            3, articel page => check expand
            if the item has been checked, return
            */
            contentCheck(item, targetElements, mode) {
                let id = "";
                if (mode === 2) {
                    id = this.getTargetID(item);
                    if (id && this.checked.includes(id)) return false;
                }
                const content = item.getElementsByClassName(
                    targetElements.contentID
                );
                if (content.length === 0) {
                    console.log("get content fail");
                    return false;
                }
                const text = content[0].innerText;
                if (mode === 1) {
                    const name = text.startsWith("匿名用户：")
                        ? ""
                        : text.slice(0, text.indexOf("："));
                    if (name && blackName.includes(name)) {
                        console.log(
                            `%cuser of ${name} has been blocked`,
                            "color: red;"
                        );
                        item.style.display = "none";
                        return true;
                    }
                }
                const result = blackKey.some((e) => text.includes(e));
                if (result) {
                    console.log("%citem has been blocked", "color: red;");
                    item.style.display = "none";
                } else if (
                    mode === 2 ||
                    (targetElements.index < 2 && !this.checkExpand(item))
                ) {
                    (id || (id = this.getTargetID(item))) &&
                        this.checked.push(id);
                }
                return result;
            },
            userCheck(item, targetElements) {
                const user = item.getElementsByClassName(targetElements.userID);
                if (user.length === 0) {
                    console.log("get user fail, anonymous user");
                    return false;
                }
                let i = user.length - 1;
                i = i > 1 ? 1 : i;
                /*
                const pathname = user[i].pathname;
                if (!pathname) return false;
                const id = pathname.slice(pathname.lastIndexOf("/") + 1);
                let result = blackID.includes(id);
                if (result) {
                    console.log(
                        `%cuser of ${id} has been blocked`,
                        "color: red;"
                    );
                    item.style.display = "none";
                    return result;
                }
                */
                const name = user[i].innerText;
                const result = blackName.includes(name);
                if (result) {
                    console.log(
                        `%cuser of ${name} has been blocked`,
                        "color: red;"
                    );
                    item.style.display = "none";
                }
                return result;
            },
            check(item, targetElements, mode) {
                let result = false;
                if (targetElements.index === 3) {
                    result = this.contentCheck(item, targetElements, 1);
                } else {
                    result = this.userCheck(item, targetElements);
                    !result && this.contentCheck(item, targetElements, mode);
                }
            },
            checkURL(targetElements) {
                if (targetElements.index < 2) return true;
                const href = location.href;
                return targetElements.zone.some((e) => href.includes(e));
            },
            clickCheck(item, targetElements) {
                // user without userid when in the search page, if the answer is not expanded
                if (targetElements.index === 3) {
                    const result = this.userCheck(item, targetElements);
                    if (result) return;
                }
                setTimeout(
                    () => this.contentCheck(item, targetElements, 2),
                    300
                );
            },
            //check the content when the content expanded
            clickMonitor(node, targetElements) {
                node.onclick = (e) => {
                    const target = e.target;
                    const className = target.className;
                    let item = null;
                    //click the expand button
                    if (className === targetElements.buttonClass) {
                        item = this.getiTem(target, targetElements);
                        //click the ico of expand button
                    } else if (target.localName === "svg") {
                        const button = this.svgCheck(target, targetElements);
                        button && (item = this.getiTem(button, targetElements));
                        //click the answser, the content will be automatically expanded
                    } else {
                        if (className !== targetElements.expand) return;
                        for (const node of e.path) {
                            const className = node.className;
                            if (
                                className === targetElements.itemClass ||
                                className === targetElements.answerID
                            ) {
                                item = node;
                                break;
                            }
                        }
                    }
                    item && this.clickCheck(item, targetElements);
                };
            },
            topicAndquestion(targetElements, info) {
                const items = document.getElementsByClassName(
                    "ContentItem-meta"
                );
                for (const item of items) {
                    const a = item.getElementsByClassName("UserLink-link");
                    let i = a.length;
                    if (i > 0) {
                        const username = a[--i].innerText;
                        if (username === info.username) {
                            const t = this.getiTem(item, targetElements);
                            t && this.setDisplay(t, info);
                        }
                    }
                }
            },
            setDisplay(t, info) {
                if (info.mode === "block") {
                    t.style.display !== "none" && (t.style.display = "none");
                } else {
                    t.style.display === "none" && (t.style.display = "block");
                }
            },
            userChange(index) {
                debugger;
                const info = GM_getValue("blacknamechange");
                if (!info) return;
                const targetElements = this.getTagetElements(
                    index === 0 ? 1 : index
                );
                index === 0 &&
                    (targetElements.itemClass = "ContentItem AnswerItem");
                if (!this.checkURL(targetElements)) return;
                if (index === 3) {
                    const items = document.getElementsByClassName(
                        targetElements.contentID
                    );
                    for (const item of items) {
                        const text = item.innerText;
                        const name = text.startsWith("匿名用户：")
                            ? ""
                            : text.slice(0, text.indexOf("："));
                        if (name && name === info.username) {
                            const t = this.getiTem(item, targetElements);
                            t && this.setDisplay(t, info);
                        }
                    }
                } else this.topicAndquestion(targetElements, info);
            },
            monitor(targetElements) {
                let node = document.getElementById(targetElements.mainID);
                if (!node) {
                    node = document.getElementsByClassName(
                        targetElements.backupClass
                    );
                    if (node.length === 0) {
                        console.log("%cget main id fail", "color: red;");
                        return;
                    } else {
                        node = node[0];
                    }
                }
                const mo = new MutationObserver((e) => {
                    if (!this.checkURL(targetElements)) return;
                    e.forEach((item) => {
                        if (item.addedNodes.length > 0) {
                            const additem = item.addedNodes[0];
                            if (additem.className === targetElements.itemClass)
                                this.check(additem, targetElements, 0);
                        }
                    });
                });
                mo.observe(node, { childList: true, subtree: true });
                this.clickMonitor(node, targetElements);
            },
            getTagetElements(index) {
                const pos = {
                    1: "questionPage",
                    2: "topicPage",
                    3: "searchPage",
                    0: "answerPage",
                };
                this.checked = [];
                const targetElements = this[pos[index]](index);
                return targetElements;
            },
            main(index) {
                this.checked = [];
                const targetElements = this.getTagetElements(index);
                targetElements && this.firstRun(targetElements);
            },
            firstRun(targetElements) {
                if (!this.checkURL(targetElements)) {
                    this.monitor(targetElements);
                    return;
                }
                let ic = 0;
                let id = setInterval(() => {
                    const items = document.getElementsByClassName(
                        targetElements.itemClass
                    );
                    if (items.length > 4 || ic > 10) {
                        clearInterval(id);
                        for (const item of items)
                            this.check(item, targetElements, 0);
                        this.monitor(targetElements);
                    }
                    ic++;
                }, 20);
            },
            answerPage() {
                const targetElements = this.questionPage(1);
                const items = document.getElementsByClassName(
                    targetElements.header
                );
                for (const item of items) this.check(item, targetElements, 0);
                const node = document.getElementsByClassName(
                    targetElements.backupClass
                );
                this.clickMonitor(node, targetElements);
                const all = document.getElementsByClassName(
                    "QuestionMainAction ViewAll-QuestionMainAction"
                );
                for (const button of all)
                    button.onclick = () =>
                        setTimeout(() => this.firstRun(targetElements), 300);
            },
            questionPage(index) {
                const targetElements = {
                    button:
                        "Button ContentItem-rightButton ContentItem-expandButton Button--plain",
                    itemClass: "List-item",
                    mainID: "QuestionAnswers-answers",
                    contentID: "RichText ztext CopyrightRichText-richText",
                    userID: "UserLink-link",
                    backupClass: "Question-main",
                    header: "ContentItem AnswerItem",
                    expand: "RichText ztext CopyrightRichText-richText",
                    answerID: "ContentItem AnswerItem",
                    index: index,
                };
                return targetElements;
            },
            searchPage(index) {
                const nocontent = document.getElementsByClassName(
                    "SearchNoContent-title"
                );
                if (nocontent.length > 0) return null;
                const targetElements = {
                    buttonClass: "Button ContentItem-more Button--plain",
                    itemClass: "Card SearchResult-Card",
                    mainID: "SearchMain",
                    contentID: "RichText ztext CopyrightRichText-richText",
                    expand: "RichContent-inner",
                    userID: "UserLink-link",
                    zone: ["type=content"],
                    index: index,
                };
                return targetElements;
            },
            topicPage(index) {
                const targetElements = {
                    buttonClass: "Button ContentItem-more Button--plain",
                    itemClass: "List-item TopicFeedItem",
                    mainID: "TopicMain",
                    userID: "UserLink-link",
                    contentID: "RichText ztext CopyrightRichText-richText",
                    expand: "RichContent-inner",
                    zone: ["/top-answers", "/hot"],
                    index: index,
                };
                return targetElements;
            },
        },
        addStyle(index) {
            const common = `
                span.RichText.ztext.CopyrightRichText-richText{text-align: justify !important;}
                body{text-shadow: #a9a9a9 0.025em 0.015em 0.02em;}`;
            const contentstyle = `
                html{overflow: auto !important;}
                div.Question-mainColumn{margin: auto !important;width: 100% !important;}
                div.Question-sideColumn,.Kanshan-container{display: none !important;}
                figure{max-width: 70% !important;}
                .RichContent-inner{
                    line-height: 30px !important;
                    margin: 40px 60px !important;
                    padding: 40px 50px !important;
                    border: 6px dashed rgba(133,144,166,0.2) !important;
                    border-radius: 6px !important;
                }
                .Pc-word,
                .RichText-MCNLinkCardContainer{display: none !important;}
                .Comments{padding: 12px !important; margin: 60px !important;}`;
            const inpustyle = `
                input::-webkit-input-placeholder {
                    font-size: 0px !important;
                    text-align: right;
                }`;
            const hotsearch = ".Card.TopSearch{display: none !important;}";
            GM_addStyle(
                common +
                    (index < 2
                        ? contentstyle + inpustyle
                        : index === 3
                        ? inpustyle + hotsearch
                        : inpustyle)
            );
        },
        clearStorage() {
            const rubbish = {};
            rubbish.timeStamp = Date.now();
            rubbish.words = [];
            //localstorage must storage this info to ensure the history show
            for (let i = 0; i < 5; i++)
                rubbish.words.push({ displayQuery: "", query: "" });
            localStorage.setItem("search::top-search", JSON.stringify(rubbish));
            localStorage.setItem("search:preset_words", "");
            localStorage.setItem("zap:SharedSession", "");
        },
        inputBox: {
            box: null,
            controlEventListener() {
                const windowEventListener = window.addEventListener;
                const eventTargetEventListener =
                    EventTarget.prototype.addEventListener;
                function addEventListener(type, listener, useCapture) {
                    //take care
                    const NewEventListener =
                        this instanceof Window
                            ? windowEventListener
                            : eventTargetEventListener;
                    //block original keyboard event to prevent blank search(ads)
                    if (
                        type.startsWith("key") &&
                        !listener.toString().includes("(fuckzhihu)")
                    )
                        return;
                    Reflect.apply(NewEventListener, this, [
                        type,
                        listener,
                        useCapture,
                    ]);
                    //this => who lauch this function, eg, window, document, htmlelement...
                }
                window.addEventListener = EventTarget.prototype.addEventListener = addEventListener;
            },
            monitor() {
                this.box = document.getElementsByTagName("input")[0];
                this.box.placeholder = "";
                unsafeWindow.addEventListener(
                    "popstate",
                    (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    true
                );
                unsafeWindow.addEventListener(
                    "visibilitychange",
                    (e) => {
                        e.preventDefault();
                        this.box.placeholder = "";
                        e.stopPropagation();
                    },
                    true
                );
                let button = document.getElementsByClassName(
                    "Button SearchBar-searchButton Button--primary"
                );
                if (button.length > 0) {
                    button[0].onclick = (e) => {
                        if (this.box.value.length === 0) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    };
                }
                button = null;
                this.box.addEventListener(
                    "keydown",
                    (fuckzhihu) => {
                        if (fuckzhihu.keyCode !== 13) return;
                        if (
                            this.box.value.length === 0 ||
                            this.box.value.trim().length === 0
                        ) {
                            fuckzhihu.preventDefault();
                            fuckzhihu.stopImmediatePropagation();
                            fuckzhihu.stopPropagation();
                        } else {
                            const url = `http://www.zhihu.com/search?q=${this.box.value}&type=content`;
                            window.open(url, "_blank");
                        }
                    },
                    true
                );
                this.box.onfocus = () => {
                    this.box.value.length === 0 && (this.box.placeholder = "");
                    localStorage.setItem("zap:SharedSession", "");
                };
                this.box.onblur = () => (this.box.placeholder = "");
                this.firstRun();
            },
            firstRun() {
                let mo = new MutationObserver((e) => {
                    if (e.length !== 1 || e[0].addedNodes.length !== 1) return;
                    const target = e[0].addedNodes[0];
                    const p = target.getElementsByClassName("Popover-content");
                    if (p.length === 0) return;
                    const tmp = p[0].getElementsByClassName(
                        "AutoComplete-group"
                    );
                    if (tmp.length === 0) return;
                    this.AutoComplete = tmp[0];
                    if (p[0].innerText.startsWith("知乎热搜"))
                        this.AutoComplete.style.display = "none";
                    mo.disconnect();
                    mo = null;
                    this.secondRun(p[0].parentNode);
                });
                mo.observe(document.body, { childList: true });
            },
            AutoComplete: null,
            secondRun(target) {
                const mo = new MutationObserver((e) => {
                    if (e.length === 1) {
                        if (e[0].addedNodes.length !== 1) {
                            this.AutoComplete = null;
                            return;
                        }
                        const t = e[0].addedNodes[0];
                        this.AutoComplete = t.getElementsByClassName(
                            "AutoComplete-group"
                        )[0];
                        if (t.innerText.startsWith("知乎热搜"))
                            this.AutoComplete.style.display = "none";
                    } else {
                        const style =
                            this.box.value.length > 0 ? "inline" : "none";
                        this.AutoComplete.style.display !== style &&
                            (this.AutoComplete.style.display = style);
                    }
                });
                mo.observe(target, { childList: true, subtree: true });
            },
        },
        zhuanlanStyle(mode) {
            const article = `
                 body{text-shadow: #a9a9a9 0.025em 0.015em 0.02em;}
                .Post-Main .Post-RichText{text-align: justify !important;}
                .Post-SideActions{left: calc(50vw - 560px) !important;}
                .RichText.ztext.Post-RichText{letter-spacing: 0.1px;}
                .Comments-container,
                .Post-RichTextContainer{width: 900px !important;}
                span.LinkCard-content.LinkCard-ecommerceLoadingCard,
                .RichText-MCNLinkCardContainer{display: none !important}`;
            const list = `.Card:last-child,.css-8txec3{width: 900px !important;}`;
            GM_addStyle(mode ? article : list);
            mode &&
                (window.onload = () => {
                    this.colorAssistant.main();
                    this.autoScroll.keyBoardEvent();
                });
        },
        colorIndicator() {
            let lasttarget = null;
            const colors = ["green", "red", "blue", "purple"];
            let i = 0;
            let change = false;
            const tags = ["blockquote", "p", "br", "li"];
            document.onclick = (e) => {
                const target = e.target;
                const localName = target.localName;
                if (!tags.includes(localName)) return;
                if (target.style.color) return;
                if (lasttarget) {
                    lasttarget.style.color = "";
                    lasttarget.style.fontSize = "";
                    lasttarget.style.letterSpacing = "";
                    if (change) lasttarget.style.fontWeight = "normal";
                }
                target.style.color = colors[i];
                target.style.fontSize = "16px";
                target.style.letterSpacing = "0.3px";
                if (target.style.fontWeight !== 600) {
                    target.style.fontWeight = 600;
                    change = true;
                } else {
                    change = false;
                }
                i = i > 2 ? 0 : ++i;
                lasttarget = target;
            };
        },
        colorAssistant: {
            index: 0,
            arr: null,
            blue: true,
            grad: 5,
            get rgbRed() {
                this.index -= this.grad;
                if (this.index < 0 || this.index > 255) {
                    this.index = 0;
                    this.blue = true;
                }
                const s =
                    this.index > 233
                        ? 5
                        : this.index > 182
                        ? 4
                        : this.index > 120
                        ? 3
                        : this.index > 88
                        ? 2
                        : this.index > 35
                        ? 1
                        : 0;
                return `rgb(${this.index}, ${s}, 0)`;
            },
            redc: false,
            get rgbBlue() {
                this.index += this.grad;
                if (this.index > 255) {
                    this.blue = false;
                    if (this.redc) {
                        this.index = 0;
                        this.grad *= -1;
                        this.redc = false;
                    } else {
                        this.grad < 0 && (this.grad *= -1);
                        this.index = 255;
                        this.redc = true;
                    }
                }
                return `rgb(0, 0, ${this.index})`;
            },
            get textColor() {
                return this.blue ? this.rgbBlue : this.rgbRed;
            },
            setColor(text, color) {
                return `<colorspan class="color-node" style="color: ${color} !important;">${text}</colorspan>`;
            },
            setcolorGrad(tlength) {
                this.grad =
                    tlength > 500
                        ? 1
                        : tlength > 300
                        ? 2
                        : tlength > 180
                        ? 3
                        : tlength > 120
                        ? 4
                        : tlength > 80
                        ? 5
                        : 6;
            },
            num: 0,
            textDetach(text) {
                this.setcolorGrad(text.length);
                const reg = /((\d+[\.-\/]\d+([\.-\/]\d+)?)|\d{2,}|[a-z]{2,})/gi;
                let result = null;
                let start = 0;
                let end = 0;
                let tmp = "";
                result = reg.exec(text);
                const numaColors = ["green", "#8B008B"];
                if (result) {
                    while (result) {
                        tmp = result[0];
                        end = reg.lastIndex - tmp.length;
                        for (start; start < end; start++)
                            this.arr.push(
                                this.setColor(text[start], this.textColor)
                            );
                        start = reg.lastIndex;
                        this.arr.push(this.setColor(tmp, numaColors[this.num]));
                        this.num = this.num ^ 1;
                        result = reg.exec(text);
                    }
                    end = text.length;
                    for (start; start < end; start++)
                        this.arr.push(
                            this.setColor(text[start], this.textColor)
                        );
                } else {
                    for (let t of text)
                        this.arr.push(this.setColor(t, this.textColor));
                }
            },
            level: 0,
            getItem(node) {
                //tags will be ignored
                const localName = node.localName;
                const tags = ["a", "br", "b", "span", "code"];
                if (localName && tags.includes(localName)) {
                    this.arr.push(node.outerHTML);
                    return;
                } else {
                    const className = node.className;
                    if (className && className === "UserLink") {
                        this.arr.push(node.outerHTML);
                        return;
                    }
                }
                if (node.childNodes.length === 0) {
                    const text = node.nodeValue;
                    text && this.textDetach(text);
                } else {
                    for (const item of node.childNodes) this.getItem(item);
                    this.arr.length > 0 && (node.innerHTML = this.arr.join(""));
                    this.arr = [];
                }
            },
            resetColor() {
                this.blue = !this.blue;
                this.index = this.blue ? 0 : 255;
            },
            codeHightlight(node) {
                const keywords = [
                    "abstract",
                    "arguments",
                    "await",
                    "boolean",
                    "break",
                    "byte",
                    "case",
                    "catch",
                    "char",
                    "class",
                    "const",
                    "continue",
                    "debugger",
                    "default",
                    "delete",
                    "do",
                    "double",
                    "else",
                    "enum",
                    "eval",
                    "export",
                    "extends",
                    "false",
                    "final",
                    "finally",
                    "float",
                    "for",
                    "function",
                    "goto",
                    "if",
                    "implements",
                    "import",
                    "in",
                    "instanceof",
                    "int",
                    "interface",
                    "let",
                    "long",
                    "native",
                    "new",
                    "null",
                    "package",
                    "private",
                    "protected",
                    "public",
                    "return",
                    "short",
                    "static",
                    "super",
                    "switch",
                    "synchronized",
                    "this",
                    "throw",
                    "throws",
                    "transient",
                    "true",
                    "try",
                    "typeof",
                    "var",
                    "void",
                    "volatile",
                    "while",
                    "with",
                    "yield",
                ];
                const code = node.getElementsByClassName("language-text");
                if (code.length === 0 || code[0].childNodes.length > 1) return;
                let html = code[0].innerHTML;
                const reg = /(["'])(.+?)(["'])/g;
                const keyReg = /([a-z]+(?=[\s\(]))/g;
                const i = html.length;
                const h = (match, color) =>
                    `<hgclass class="hgColor" style="color:${color} !important;">${match}</hgclass>`;
                html = html.replace(
                    reg,
                    (e) => e[0] + h(e.slice(1, -1), "#FA842B") + e.slice(-1)
                );
                html = html.replace(keyReg, (e) => {
                    if (e && keywords.includes(e))
                        return h(e, "rgb(0, 0, 252)");
                    return e;
                });
                const Reg = /\/\//g;
                html = html.replace(Reg, (e) => h(e, "green"));
                i !== html.length && (code[0].innerHTML = html);
            },
            main() {
                let holder = document.getElementsByClassName(
                    "RichText ztext Post-RichText"
                );
                if (holder.length === 0) {
                    console.log("get content fail");
                    return;
                }
                this.blue = Math.ceil(Math.random() * 100) % 2 === 0;
                !this.blue && (this.index = 255);
                holder = holder[0];
                const tags = ["p", "ul", "li", "ol", "blockquote"];
                const textNode = [];
                let i = -1;
                for (const node of holder.childNodes) {
                    i++;
                    const type = node.nodeType;
                    //text node deal with separately
                    if (type === 3) {
                        textNode.push(i);
                        continue;
                    } else if (!tags.includes(node.tagName.toLowerCase())) {
                        //the continuity of content is interrupted, reset the color;
                        this.resetColor();
                        if (node.className === "highlight")
                            this.codeHightlight(node);
                        continue;
                    }
                    this.arr = [];
                    this.level = 0;
                    this.getItem(node);
                }
                i = textNode.length;
                if (i > 0) {
                    for (i; i--; ) {
                        let node = holder.childNodes[textNode[i]];
                        const text = node.nodeValue;
                        if (text) {
                            this.arr = [];
                            this.textDetach(text);
                            const iNode = document.createElement("colorspan");
                            holder.insertBefore(iNode, node);
                            iNode.outerHTML = this.arr.join("");
                            node.remove();
                        }
                    }
                }
                this.arr = null;
            },
        },
        userPage: {
            username: null,
            userManage(mode) {
                let text = "";
                const info = {};
                if (mode === "Block") {
                    info.mode = "block";
                    blackName.push(this.username);
                    text = "add user to blackname successfully";
                } else {
                    info.mode = "unblock";
                    const i = blackName.indexOf(this.username);
                    i > -1 && blackName.splice(i, 1);
                    text = "remove user from blackname successfully";
                }
                info.username = this.username;
                GM_setValue("blacknamechange", info);
                GM_setValue("blackname", blackName);
                Notification(text, "blackName");
            },
            injectButton(name) {
                const html = `
                    <div
                        id = "assist-button-container"
                        >
                        <style>
                            button.assist-button {
                                border-radius: 0 1px 1px 0;
                                border: rgb(247, 232, 176) solid 1.2px;
                                display: flex;
                                margin-top: 2px;
                                height: 28px;
                                width: 75px;
                                box-shadow: 3px 4px 1px #888888;
                                justify-content: center;
                            }
                            div#assist-button-container {
                                opacity: 0.15;
                                left: 4%;
                                width: 60px;
                                flex-direction: column;
                                position: fixed;
                                bottom: 10%;
                            }
                            div#assist-button-container:hover {
                                opacity: 1;
                                transition: opacity 2s;
                            }
                        </style>
                        <button class="assist-button block" style="color: blue;">${name}</button>
                    </div>`;
                document.documentElement.insertAdjacentHTML("beforeend", html);
                let assist = document.getElementById("assist-button-container");
                assist.children[1].onclick = function () {
                    const n = this.innerText;
                    zhihu.userPage.userManage(n);
                    this.innerText = n === "Block" ? "unBlock" : "Block";
                };
                assist = null;
            },
            changeButton(mode) {
                const button = document.getElementById(
                    "assist-button-container"
                );
                if (!button) return;
                const name = button.children[1].innerText;
                if ((mode && name === "unBlock") || (!mode && name === "Block"))
                    return;
                button.children[1].innerText = blackName.includes(this.name)
                    ? "unBlock"
                    : "Block";
            },
            main() {
                const profile = document.getElementsByClassName(
                    "ProfileHeader-name"
                );
                if (profile.length === 0) {
                    console.log("get usename id fail");
                    return;
                }
                this.username = `${profile[0].innerText}`;
                this.username &&
                    this.injectButton(
                        blackName.includes(this.username) ? "unBlock" : "Block"
                    );
            },
        },
        pageOfQA(index, href) {
            //inject as soon as possible; may be need to concern about some eventlisteners and MO
            this.inputBox.controlEventListener();
            this.addStyle(index);
            index < 2 && this.antiLogin();
            this.clearStorage();
            window.onload = () => {
                if (index !== 7) {
                    this.getData();
                    this.blackUserMonitor(index);
                    (index < 4
                        ? !(index === 1 && href.endsWith("/waiting"))
                        : false) &&
                        (setTimeout(() => this.Filter.main(index), 100),
                        this.colorIndicator());
                    index === 6 && this.userPage.main();
                }
                this.inputBox.monitor();
            };
        },
        blackUserMonitor(index) {
            GM_addValueChangeListener(
                "blackname",
                (name, oldValue, newValue, remote) => {
                    if (!remote) return;
                    //mode => add user to blockname
                    blackName = newValue;
                    if (index === 6) {
                        const mode =
                            !oldValue || oldValue.length < newValue.length;
                        this.userPage.changeButton(mode);
                    } else {
                        this.Filter.userChange(index);
                    }
                }
            );
        },
        start() {
            const pos = [
                "/answer/",
                "/question/",
                "/topic/",
                "/search",
                "/column",
                "/zhuanlan",
                "/people/",
                "/www",
            ];
            const href = location.href;
            const index = pos.findIndex((e) => href.includes(e));
            let w = true;
            let z = false;
            (
                (z = index === 5)
                    ? (w = !href.includes("/write"))
                    : index === 4
                    ? true
                    : false
            )
                ? this.zhuanlanStyle(z && href.includes("/p/"))
                : index < 0
                ? null
                : this.pageOfQA(index, href);
            w && this.antiRedirect();
            this.shade.start();
            this.clipboardClear();
        },
    };
    zhihu.start();
})();
