// ==UserScript==
// @name         zhihu optimizer
// @namespace    https://github.com/Kyouichirou
// @version      3.2.1.0
// @updateURL    https://github.com/Kyouichirou/D7E1293/raw/main/Tmapermonkey/zhihu%20optimizer.user.js
// @description  make zhihu clean and tidy, for better experience
// @author       HLA
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      www.zhihu.com
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_getTab
// @grant        GM_getTabs
// @grant        GM_saveTab
// @grant        window.onurlchange
// @grant        window.close
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
    const blackKey = ["留学中介", "肖战"];
    let blackName = null;
    let blackTopicAndQuestion = null;
    const Notification = (content = "", title = "", duration = 2500, func) => {
        GM_notification({
            text: content,
            title: title,
            timeout: duration,
            onclick: func,
        });
    };
    const installTips = () => {
        //first time run, open the usermanual webpage
        if (GM_getValue("initial")) return;
        const usermanual =
            "https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/zhihu_optimizer_manual.md";
        GM_setValue("initial", true);
        Notification(
            "thanks for installing, please read user manual carefully",
            "Tips",
            6000
        );
        GM_openInTab(usermanual, { insert: true });
    };
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
    //cut out part of title with specified length, take care of chinese character & english character
    const titleSlice = (str) => {
        let length = 0;
        let newstr = "";
        for (const e of str) {
            length += e.charCodeAt(0).toString(16).length === 4 ? 2 : 1;
            newstr += e;
            if (length > 27) return `${newstr}...`;
        }
        return newstr;
    };
    const createButton = (name, title, otherButton = "", position = "left") => {
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
                        opacity: 0.15;
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
                <button class="assist-button block" style="color: black;" title=${title}>${name}</button>
            </div>`;
        document.documentElement.insertAdjacentHTML("beforeend", html);
    };
    const xmlHTTPRequest = (url, time = 2500, rType = false) => {
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: time,
                onload: (response) => {
                    if (response.status == 200) {
                        if (rType) {
                            //after redirect, get the final URL
                            resolve(response.finalUrl);
                        } else {
                            resolve(response.response);
                        }
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
    const rndRangeNum = (start, end, count) => {
        if (end < 0 || start < 0) return null;
        if (end < start || end - start + 1 < count) return null;
        const tmpArr = [];
        const rndArr = [];
        end++;
        for (let i = start; i < end; i++) tmpArr.push(i);
        for (; count > 0; count--) {
            const ir = tmpArr.length - 1;
            const rnd = Math.floor(Math.random() * ir);
            rndArr.push(tmpArr[rnd]);
            tmpArr[rnd] = tmpArr[ir];
            tmpArr.pop();
        }
        return rndArr;
    };
    class Database {
        /*
        dname: name of database;
        tname: name of table;
        mode: read or read&write;
        */
        constructor(dbname, tbname = "", rwmode = false, version = 1) {
            this.dbopen =
                version === 1
                    ? indexedDB.open(dbname)
                    : indexedDB.open(dbname, version);
            this.RWmode = rwmode ? "readwrite" : "readonly";
            this.tbname = tbname;
            const getIndex = (fieldname) => this.table.index(fieldname);
        }
        Initialize() {
            return new Promise((resolve, reject) => {
                //if the db does not exist, this event will fired firstly;
                //adjust the version of db, which can trigger this event => create/delete table or create/delete index (must lauch from this event);
                this.dbopen.onupgradeneeded = (e) => {
                    this.store = e.target.result;
                    this.updateEvent = true;
                    this.storeEvent();
                    resolve(0);
                };
                this.dbopen.onsuccess = () => {
                    if (this.store) return;
                    this.updateEvent = false;
                    this.store = this.dbopen.result;
                    this.storeEvent();
                    resolve(1);
                };
                this.dbopen.onerror = (e) => {
                    console.log(e);
                    reject("error");
                };
                /*
                The event handler for the blocked event.
                This event is triggered when the upgradeneeded event should be triggered _
                because of a version change but the database is still in use (i.e. not closed) somewhere,
                even after the versionchange event was sent.
                */
                this.dbopen.onblocked = () => {
                    console.log("please close others tab to update database");
                    reject("conflict");
                };
                this.dbopen.onversionchange = (e) =>
                    console.log("The version of this database has changed");
            });
        }
        createTable(keyPath) {
            if (this.updateEvent) {
                const index = keyPath
                    ? { keyPath: keyPath }
                    : { autoIncrement: true };
                this.store.createObjectStore(this.tbname, index);
            }
        }
        createNewTable(keyPath) {
            return new Promise((resolve, reject) => {
                this.version = this.store.version + 1;
                this.store.close();
                if (this.storeErr) {
                    reject("database generates some unknow error");
                    return;
                }
                this.dbopen = indexedDB.open(this.store.name, this.version);
                this.Initialize().then(
                    () => {
                        this.createTable(keyPath);
                        resolve(true);
                    },
                    () => reject("database initial fail")
                );
            });
        }
        storeEvent() {
            this.store.onclose = () => {
                console.log("closing...");
            };
            this.store.onerror = () => (this.storeErr = true);
        }
        get checkTable() {
            return this.store.objectStoreNames.contains(this.tbname);
        }
        get Tablenames() {
            return this.store.objectStoreNames;
        }
        get Indexnames() {
            return this.table.indexNames;
        }
        get DBversion() {
            return this.store.version;
        }
        getTablecount(key) {
            return this.table.count(key);
        }
        //take care the transaction, must make sure the transaction is alive when you need deal with something continually
        openTable() {
            this.isfinish = false;
            this.transaction = this.store.transaction(
                [this.tbname],
                this.RWmode
            );
            this.table = this.transaction.objectStore(this.tbname);
            this.transaction.oncomplete = () => (this.isfinish = true);
        }
        get Table() {
            this.transaction = this.store.transaction(
                [this.tbname],
                this.RWmode
            );
            return this.transaction.objectStore(this.tbname);
        }
        rollback() {
            this.transaction && this.transaction.abort();
        }
        read(keyPath) {
            return new Promise((resolve, reject) => {
                if (!this.table || this.isfinish) this.openTable();
                const request = this.table.get(keyPath);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject("error");
            });
        }
        batchCheck(tables, keyPath) {
            return new Promise((resolve) => {
                const arr = [];
                for (const t of tables) {
                    const transaction = this.store.transaction(
                        this.store.objectStoreNames,
                        this.RWmode
                    );
                    const table = transaction.objectStore(t);
                    const rq = new Promise((reso, rej) => {
                        const req = table.get(keyPath);
                        req.onsuccess = () => reso(req.result);
                        req.onerror = () => rej("error");
                    });
                    arr.push(rq);
                }
                Promise.allSettled(arr).then((results) => {
                    resolve(
                        results.map((r) =>
                            r.status === "rejected" ? null : r.value
                        )
                    );
                });
            });
        }
        add(info) {
            return new Promise((resolve, reject) => {
                if (!this.table || this.isfinish) this.openTable();
                const op = this.table.add(info);
                op.onsuccess = () => resolve(true);
                op.onerror = (e) => {
                    console.log(e);
                    reject("error");
                };
            });
        }
        updateRecord(keyPath) {
            return new Promise((resolve, reject) => {
                this.read(keyPath).then(
                    (result) => {
                        if (result) {
                            result.visitTime = Date.now();
                            let times = result.visitTimes;
                            result.visitTimes = times ? ++times : 2;
                            this.update(result).then(
                                () => resolve(true),
                                (err) => reject(err)
                            );
                        } else resolve(true);
                    },
                    (err) => reject(err)
                );
            });
        }
        update(info, keyPath, mode = false) {
            //if db has contained the item, will update the info; if it does not, a new item is added
            return new Promise((resolve, reject) => {
                if (!this.table || this.isfinish) this.openTable();
                //keep cursor
                if (mode) {
                    this.read(info[keyPath]).then(
                        (result) => {
                            if (!result) {
                                this.add(info).then(
                                    () => resolve(true),
                                    (err) => reject(err)
                                );
                            } else {
                                const op = this.table.put(
                                    Object.assign(result, info)
                                );
                                op.onsuccess = () => resolve(true);
                                op.onerror = (e) => {
                                    console.log(e);
                                    reject("error");
                                };
                            }
                        },
                        (err) => console.log(err)
                    );
                } else {
                    const op = this.table.put(info);
                    op.onsuccess = () => resolve(true);
                    op.onerror = (e) => {
                        console.log(e);
                        reject("error");
                    };
                }
            });
        }
        clear() {
            if (!this.table) this.openTable();
            this.table.clear();
        }
        //must have primary key
        deleteiTems(keyPath) {
            return new Promise((resolve, reject) => {
                if (!this.table || this.isfinish) this.openTable();
                const op = this.table.delete(keyPath);
                op.onsuccess = () => {
                    console.log("delete item successfully");
                    resolve(true);
                };
                op.onerror = (e) => {
                    console.log(e);
                    reject("error");
                };
            });
        }
        //note: create a index must lauch from onupgradeneeded event;
        createIndex(indexName, keyPath, objectParameters) {
            if (!this.updateEvent) {
                console.log("this function must be through onupgradeneeded");
                return;
            }
            this.table.createIndex(indexName, keyPath, objectParameters);
        }
        deleTable() {
            if (!this.updateEvent) {
                console.log("this function must be through onupgradeneeded");
                return;
            }
            this.dbopen.deleteObjectStore(this.tbname);
        }
        deleIndex(indexName) {
            if (!this.updateEvent) {
                console.log("this function must be through onupgradeneeded");
                return;
            }
            this.table.deleteIndex(indexName);
        }
        close() {
            //The connection is not actually closed until all transactions created using this connection are complete
            this.store.close();
        }
        static deleDB(dbname) {
            return new Promise((resolve, reject) => {
                const DBDeleteRequest = window.indexedDB.deleteDatabase(dbname);
                DBDeleteRequest.onerror = (e) => {
                    console.log(e);
                    reject("error");
                };
                DBDeleteRequest.onsuccess = () => {
                    console.log("success");
                    resolve(true);
                };
            });
        }
    }
    const dataBaseInstance = {
        db: null,
        additem(columnID) {
            const info = {};
            info.pid = this.pid;
            info.update = Date.now();
            info.excerpt = "";
            info.visitTimes = 1;
            info.visitTime = info.update;
            const contentholder = document.getElementsByClassName(
                "RichText ztext Post-RichText"
            );
            if (contentholder.length > 0) {
                const chs = contentholder[0].childNodes;
                let excerpt = "";
                //take some data as this article's digest
                let ic = 0;
                for (const node of chs) {
                    if (node.localName === "p") {
                        excerpt += node.innerText;
                        if (excerpt.length > 300) {
                            excerpt = excerpt.slice(0, 300);
                            break;
                        }
                    }
                    ic++;
                    if (ic > 5) break;
                }
                info.excerpt = excerpt;
            }
            info.userName = "";
            info.userID = "";
            const user = document.getElementsByClassName(
                "UserLink AuthorInfo-name"
            );
            if (user.length > 0) {
                const link = user[0].getElementsByTagName("a");
                if (link.length > 0) {
                    const p = link[0].pathname;
                    info.userID = p.slice(p.lastIndexOf("/") + 1);
                    info.userName = link[0].text;
                }
            }
            info.ColumnID = columnID || "";
            const defaultV = "A B";
            const p = prompt(
                "please input some tags about this article, like: javascript python; multiple tags use blank space to isolate",
                defaultV
            );
            let tags = [];
            if (p && p !== defaultV && p.trim()) {
                const tmp = p.split(" ");
                for (let e of tmp) {
                    e = e.trim();
                    e && tags.push(e);
                }
            }
            const note = prompt(
                "you can input something to hightlight this article, eg: this article is about advantage python usage"
            );
            info.tags = tags;
            const title = document.title;
            info.note = note || "";
            info.title = title.slice(0, title.length - 5);
            this.db.update(info, "pid", false).then(
                () =>
                    Notification(
                        "add this article to collection successfully",
                        "Tips"
                    ),
                () =>
                    Notification(
                        "add this aritcle to collection fail",
                        "Warning"
                    )
            );
        },
        fold(info) {
            this.db.update(info, "name", true).then(
                () => console.log("this answer has been folded"),
                () => console.log("add this anser to folded list fail")
            );
        },
        get Table() {
            return this.db.Table;
        },
        batchCheck(tableNames) {
            const pid = this.pid;
            return new Promise((resolve) =>
                this.db
                    .batchCheck(tableNames, pid)
                    .then((results) => resolve(results))
            );
        },
        updateRecord(keyPath) {
            const pid = keyPath || this.pid;
            this.db.updateRecord(pid).then(
                () => console.log("update record finished"),
                (err) => console.log(err)
            );
        },
        check(keyPath) {
            const pid = keyPath || this.pid;
            return new Promise((resolve, reject) => {
                this.db.read(pid).then(
                    (result) => resolve(result),
                    (err) => reject(err)
                );
            });
        },
        get pid() {
            return location.pathname.slice(3);
        },
        dele(mode, keyPath) {
            const pid = keyPath || this.pid;
            this.db.deleteiTems(pid).then(
                () =>
                    mode &&
                    Notification(
                        `the article of ${pid} has been deleted from collection successfully`,
                        "Tips"
                    ),
                () => mode && Notification("delete article fail")
            );
        },
        update(info) {
            this.db.update(info);
        },
        close(mode = true) {
            mode && this.db.close();
            this.db = null;
        },
        initial(tableNames, mode = false, keyPath = "pid") {
            return new Promise((resolve, reject) => {
                if (!Array.isArray(tableNames)) {
                    reject("this parameter must be array");
                    return;
                }
                const dbname = "zhihuDatabase";
                const db = new Database(
                    dbname,
                    tableNames.length === 1 ? tableNames[0] : "",
                    mode
                );
                this.db = db;
                db.Initialize().then(
                    (result) => {
                        if (result === 0) {
                            for (const table of tableNames) {
                                db.tbname = table;
                                db.createTable(keyPath);
                            }
                        }
                        resolve(result);
                    },
                    (err) => reject(err)
                );
            });
        },
    };
    const zhihu = {
        qaReader: {
            firstly: true,
            readerMode: false,
            Reader(node, aid) {
                //adapted from http://www.360doc.com/
                let title = document.title;
                title = title.slice(0, title.lastIndexOf("-") - 1);
                const meta = node.getElementsByClassName(
                    "AuthorInfo AnswerItem-authorInfo AnswerItem-authorInfo--related"
                );
                const mBackup =
                    '<div class="AuthorInfo AnswerItem-authorInfo AnswerItem-authorInfo--related" itemprop="author" itemscope="" itemtype="http://schema.org/Person">No_data</div>';
                const content = node.getElementsByClassName(
                    "RichText ztext CopyrightRichText-richText"
                );
                const cBackup =
                    '<span class="RichText ztext CopyrightRichText-richText" itemprop="text">No_data</span>';
                const html = `
                <div
                    id="artfullscreen"
                    class="artfullscreen__"
                    style="display: block; height: -webkit-fill-available"
                >
                    <style type="text/css">
                        div#artfullscreen {
                            width: 100%;
                            height: 100%;
                            background: #e3e3e3;
                            z-index: 999;
                            position: fixed;
                            left: 0;
                            top: 0;
                            text-align: left;
                            overflow: auto;
                            display: block;
                        }
                        div#artfullscreen__box {
                            padding: 32px 60px;
                            height: auto;
                            overflow: hidden;
                            background: #fff;
                            box-shadow: 0 0 6px #999;
                            display: table;
                            margin: 20px auto;
                            min-height: 95%;
                        }
                        div#artfullscreen__box_scr {
                            word-break: break-word;
                            height: auto;
                            font-size: 16px;
                            color: #2f2f2f;
                            line-height: 1.5;
                            position: relative;
                        }
                        h2#titiletext {
                            font-size: 30px;
                            font-family: simhei;
                            color: #000;
                            line-height: 40px;
                            margin: 0 0 30px 0;
                            overflow: hidden;
                            text-align: left;
                            word-break: break-all;
                        }
                    </style>
                    <div
                        id="artfullscreen__box"
                        class="artfullscreen__box"
                        style="width: 930px"
                    >
                        <div class="hidden_fold" style="margin-right: -45px;">
                            <button class="fold_exit" title="exit reader mode">
                                Exit
                            </button>
                        </div>
                        <div class="artfullscreen__box_scr" id="artfullscreen__box_scr">
                            <table style="width: 656px">
                                <tbody>
                                    <tr>
                                        <td id="artContent" style="max-width: 1000px">
                                            <h2 id="titiletext">
                                                ${title}
                                            </h2>
                                            ${
                                                meta.length > 0
                                                    ? meta[0].outerHTML
                                                    : mBackup
                                            }
                                            <hr>
                                            <div
                                                style="
                                                    width: 1200px;
                                                    margin: 0;
                                                    padding: 0;
                                                    height: 0;
                                                "
                                            ></div>
                                            ${
                                                content.length > 0
                                                    ? content[0].outerHTML
                                                    : cBackup
                                            }
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML("afterend", html);
                this.aid = aid;
                this.Navigator();
                this.creatEvent();
            },
            Navigator() {
                //adapted from @vizo, https://greasyfork.org/zh-CN/scripts/373008-%E7%99%BE%E5%BA%A6%E6%90%9C%E7%B4%A2%E4%BC%98%E5%8C%96sp
                const css = `
                    .readerpage-l,
                    .readerpage-r {
                        width: 300px;
                        height: 500px;
                        overflow: hidden;
                        cursor: pointer;
                        position: fixed;
                        top: 0;
                        bottom: 0;
                        margin: auto;
                        z-index: 1000;
                    }
                    .readerpage-l.disa,
                    .readerpage-r.disa {
                        cursor: not-allowed;
                    }
                    .readerpage-l:hover,
                    .readerpage-r:hover {
                        background: rgba(100, 100, 100, 0.03);
                    }
                    .readerpage-l::before,
                    .readerpage-r::before {
                        content: '';
                        width: 100px;
                        height: 100px;
                        border-left: 2px solid #e7e9eb;
                        border-bottom: 2px solid #e7e9eb;
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        margin: auto;
                    }
                    .readerpage-l:hover::before,
                    .readerpage-r:hover::before {
                        border-color: #fff;
                    }
                    .readerpage-l {
                        left: 0;
                    }
                    .readerpage-l::before {
                        left: 45%;
                        transform: rotate(45deg);
                    }
                    .readerpage-r {
                        right: 0;
                    }
                    .readerpage-r::before {
                        right: 45%;
                        transform: rotate(225deg);
                    }
                    @media (max-width: 1280px) {
                        .readerpage-l,
                        .readerpage-r {
                            width: 150px;
                        }
                    }`;
                const [statusl, titlel] = this.prevNode
                    ? ["", "previous answer"]
                    : [" disa", "no more content"];
                const [statusr, titler] = this.nextNode
                    ? ["", "next answer"]
                    : [" disa", "no more content"];
                const html = `
                        <<div id="reader_navigator">
                            <div class="readerpage-l${statusl}" title=${escapeBlank(
                    titlel
                )}></div>
                            <div class="readerpage-r${statusr}" title=${escapeBlank(
                    titler
                )}></div>
                        </div>`;
                GM_addStyle(css);
                document.body.insertAdjacentHTML("afterend", html);
            },
            creatEvent() {
                const f = this.full;
                let button = f.getElementsByClassName("fold_exit")[0];
                button.onclick = () => this.ShowOrExit(false);
                button = null;
                let n = this.nav;
                n.children[0].onclick = () => this.prevNode && this.Previous();
                n.children[1].onclick = () => this.nextNode && this.Next();
                n = null;
                this.loadLazy(f);
            },
            changeNav(node) {
                const pre = node.children[0];
                const pName = pre.className;
                const [npName, titlel] = this.prevNode
                    ? ["readerpage-l", "previous answer"]
                    : ["readerpage-l disa", "no more content"];
                if (pName !== npName) {
                    pre.className = npName;
                    pre.title = titlel;
                }
                const next = node.children[1];
                const nextName = next.className;
                const [nnextName, titler] = this.nextNode
                    ? ["readerpage-r", "next answer"]
                    : ["readerpage-r disa", "no more content"];
                if (nextName !== nnextName) {
                    next.className = nnextName;
                    next.title = titler;
                }
            },
            changeContent(node) {
                const cName = "RichText ztext CopyrightRichText-richText";
                const aName =
                    "AuthorInfo AnswerItem-authorInfo AnswerItem-authorInfo--related";
                const content = node.getElementsByClassName(cName);
                const author = node.getElementsByClassName(aName);
                const f = this.full;
                f.getElementsByClassName(cName)[0].innerHTML =
                    content.length > 0 ? content[0].innerHTML : "No data";
                f.getElementsByClassName(aName)[0].innerHTML =
                    author.length > 0 ? author[0].innerHTML : "No data";
                this.loadLazy(f);
                this.navPannel = this.curNode = node;
                this.changeNav(this.nav);
            },
            Next() {
                this.changeContent(this.nextNode);
            },
            Previous() {
                this.changeContent(this.prevNode);
            },
            get nav() {
                return document.getElementById("reader_navigator");
            },
            get full() {
                return document.getElementById("artfullscreen");
            },
            ShowOrExit(mode) {
                const n = this.nav;
                const display = mode ? "block" : "none";
                n && (n.style.display = display);
                const f = this.full;
                f && (f.style.display = display);
                if (mode) {
                    this.changeNav(n);
                } else {
                    this.readerMode = mode;
                    this.overFlow = false;
                }
            },
            Change(node, aid) {
                aid === this.aid
                    ? this.ShowOrExit(true)
                    : this.changeContent(node);
            },
            //load lazy pic
            loadLazy(node) {
                const imgs = node.getElementsByTagName("img");
                for (const img of imgs) {
                    const name = img.className;
                    name &&
                        name.endsWith("lazy") &&
                        img.src.startsWith("data:image/svg+xml") &&
                        (img.src = img.dataset.actualsrc);
                }
            },
            /**
             * @param {any} mode
             */
            set overFlow(mode) {
                document.documentElement.style.overflow = mode
                    ? "hidden"
                    : "auto";
            },
            /**
             * @param {{ parentNode: any; }} pnode
             */
            set navPannel(pnode) {
                const className = pnode.className;
                if (className === "QuestionAnswer-content") {
                    this.prevNode = null;
                    const list = document.getElementsByClassName("List-item");
                    this.nextNode = list.length > 0 ? list[0] : null;
                } else {
                    const next = pnode.nextElementSibling;
                    if (next) {
                        const nextName = next.className;
                        this.nextNode = nextName === "List-item" ? next : null;
                    } else this.nextNode = null;
                    const pre = pnode.previousElementSibling;
                    if (pre) {
                        const pName = pre.className;
                        if (pName === "List-header") {
                            const c = document.getElementsByClassName(
                                "QuestionAnswer-content"
                            );
                            this.prevNode = c.length > 0 ? c[0] : null;
                        } else {
                            this.prevNode = pName === "list-item" ? pre : null;
                        }
                    } else this.prevNode = null;
                }
            },
            nextNode: null,
            prevNode: null,
            curNode: null,
            aid: null,
            main(pnode, aid) {
                //---------------------------------------check if the node has pre and next node
                const p = pnode.parentNode;
                this.navPannel = p;
                this.firstly
                    ? this.Reader(pnode, aid)
                    : this.Change(pnode, aid);
                this.curNode = p;
                this.firstly = false;
                this.readerMode = true;
                this.overFlow = true;
            },
        },
        getData() {
            blackName = GM_getValue("blackname");
            (!blackName || !Array.isArray(blackName)) && (blackName = []);
            blackTopicAndQuestion = GM_getValue("blacktopicAndquestion");
            (!blackTopicAndQuestion || !Array.isArray(blackTopicAndQuestion)) &&
                (blackTopicAndQuestion = []);
        },
        clipboardClear: {
            clear(text) {
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
                    /《/g,
                    /》/g,
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
                    "<",
                    ">",
                ];
                cs.forEach((s, i) => (text = text.replace(s, es[i])));
                this.write(text);
            },
            write(text) {
                window.navigator.clipboard.writeText(text);
            },
            event() {
                document.oncopy = (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    let copytext = getSelection();
                    if (!copytext) return;
                    this.clear(copytext);
                };
            },
        },
        turnPage: {
            main(mode) {
                const overlap = 100;
                const wh = window.innerHeight;
                let height = wh - overlap;
                height < 0 && (height = 0);
                let top =
                    document.documentElement.scrollTop ||
                    document.body.scrollTop ||
                    window.pageYOffset;
                if (mode) top += height;
                else top < height ? (top = 0) : (top -= height);
                window.scrollTo(0, top);
            },
            start(mode) {
                //n => scroll down ; u => scroll top
                window.requestAnimationFrame(this.main.bind(this, mode));
            },
        },
        scroll: {
            toTop() {
                let hTop =
                    document.documentElement.scrollTop ||
                    document.body.scrollTop;
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
                    document.documentElement.scrollTop ||
                    document.body.scrollTop;
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
                string_length(str) {
                    const lg = [...str].reduce(
                        (length, e) =>
                            (length +=
                                e.charCodeAt(0).toString(16).length === 4
                                    ? 2
                                    : 1),
                        0
                    );
                    return Math.floor(lg / 2);
                },
                Search(url, parameter = "") {
                    const select = getSelection();
                    //baidu restrict the length of search keyword is 38;
                    if (!select || this.string_length(select) > 38) return;
                    url += encodeURIComponent(select);
                    window.open(this.Protocols + url + parameter, "_blank");
                },
                Google() {
                    this.Search("www.dogedoge.com/results?q=");
                },
                Douban() {
                    this.Search("www.douban.com/search?q=");
                },
                Zhihu() {
                    this.Search("www.zhihu.com/search?q=", "&type=content");
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
            editable: false,
            disableSiderbar(pevent) {
                const column = document.getElementById("column_lists");
                if (column) column.style.pointerEvents = pevent;
            },
            EditDoc() {
                const [edit, tips, pevent] = this.editable
                    ? ["inherit", "exit", "inherit"]
                    : ["true", "enter", "none"];
                document.body.contentEditable = edit;
                Notification(tips + " page editable mode", "Editable");
                this.disableSiderbar(pevent);
                this.editable = !this.editable;
            },
            get Selection() {
                return window.getSelection();
            },
            setMark(text, type) {
                return `<mark class="AssistantMark ${type}">${text}</mark>`;
            },
            get createElement() {
                return document.createElement("markspan");
            },
            appendNewNode(node, type) {
                const text = node.nodeValue;
                const span = this.createElement;
                node.parentNode.replaceChild(span, node);
                span.outerHTML = this.setMark(text, type);
            },
            getTextNode(node, type) {
                node.nodeType === 3 && this.appendNewNode(node, type);
            },
            Marker(keyCode) {
                const cname = {
                    82: "red",
                    89: "yellow",
                    80: "purple",
                    71: "green",
                };
                const type = cname[keyCode];
                if (!type) return;
                const select = this.Selection;
                if (!select.anchorNode || select.isCollapsed) return;
                /*
                const colors = {
                    red: "rgb(255, 128, 128)",
                    green: "rgb(170, 255, 170)",
                    yellow: "rgb(255, 255, 170)",
                    purple: "rgb(255, 170, 255)",
                };
                const color = colors[type];
                */
                let i = select.rangeCount;
                const r = select.getRangeAt(--i);
                let start = r.startContainer;
                const end = r.endContainer;
                const offs = r.startOffset;
                const offe = r.endOffset;
                let nodeValue = r.startContainer.nodeValue;
                if (start !== end) {
                    //start part
                    let next = start.nextSibling;
                    let p = start.parentNode;
                    if (!p.className.startsWith("AssistantMark")) {
                        const text = nodeValue.slice(offs);
                        const span = this.createElement;
                        p.replaceChild(span, start);
                        span.outerHTML =
                            nodeValue.slice(0, offs) + this.setMark(text, type);
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
                        !p.className.startsWith("AssistantMark") &&
                            this.getTextNode(start, type);
                    }
                    //end part
                    nodeValue = start.nodeValue;
                    start = start.parentNode;
                    if (start.className.startsWith("AssistantMark")) return;
                    const text = nodeValue.slice(0, offe);
                    const epan = this.createElement;
                    start.replaceChild(epan, end);
                    epan.outerHTML =
                        this.setMark(text, type) + nodeValue.slice(offe);
                } else {
                    //all value in one node;
                    const text = nodeValue.slice(offs, offe);
                    const span = this.createElement;
                    start.parentNode.replaceChild(span, start);
                    span.outerHTML =
                        nodeValue.slice(0, offs) +
                        this.setMark(text, type) +
                        nodeValue.slice(offe);
                }
            },
            Restore(node) {
                const p = node.parentNode;
                if (p.className.startsWith("AssistantMark")) {
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
            zhuanlanAuto_mode: false,
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
                        : this.stopScroll(true);
                }
            },
            disableEvent(mode) {
                const h = document.getElementsByClassName(
                    "RichText ztext Post-RichText"
                );
                if (h.length === 0) return;
                h[0].style.pointerEvents = mode ? "none" : "inherit";
            },
            zhuanlanAuto() {
                if (zhihu.Column.targetIndex === 0) return;
                const text = `${
                    this.zhuanlanAuto_mode ? "exit" : "enter"
                } autoscroll mode`;
                Notification(text, "Tips");
                this.zhuanlanAuto_mode = !this.zhuanlanAuto_mode;
            },
            get article_lists() {
                const c = document.getElementById("column_lists");
                if (!c) return null;
                const a = c.getElementsByClassName("article_lists");
                return a.length === 0 ? null : a[0].children;
            },
            nextPage() {
                const ch = this.article_lists;
                if (!ch) return;
                const i = zhihu.Column.targetIndex;
                if (ch.length === 0 || i === ch.length) {
                    Notification(
                        "no more content, have reach the last page",
                        "tips"
                    );
                    return;
                }
                ch[i].children[2].click();
                setTimeout(() => {
                    this.keyCount = 2;
                    this.start();
                }, 1800);
            },
            //0-9 => click target article;
            key_Click(keyCode) {
                const ch = this.article_lists;
                let index = keyCode - 47;
                if (index > ch.length) return;
                ch[--index].children[2].click();
            },
            key_next_Pre(keyCode) {
                const c = document.getElementById("column_lists");
                if (!c) return;
                const n = c.getElementsByClassName("nav button");
                let i = keyCode - 188;
                n.length > 0 &&
                    (i === 0
                        ? n[0].children[i].click()
                        : n[0].children[--i].click());
            },
            popup() {
                const html = `
                <div
                    id="autoscroll-tips"
                    style="
                        top: 45%;
                        left: 45%;
                        position: fixed;
                        background: whitesmoke;
                        width: 210px;
                        height: 96px;
                        z-index: 1000;
                    "
                >
                    <div class="autotips_content" style="margin: 5px 5px 5px 22px">
                        <span class="tips-header">Auto Scroll Mode</span>
                        <br />
                        <span class="tips_show" style="font-size: 12px"
                            >After 3s, auto load next page</span
                        >
                        <br />
                        <button
                            style="
                                width: 60px;
                                height: 24px;
                                box-shadow: 3px 4px 1px #888888;
                                margin-top: 10px;
                                margin-right: 10px;
                                border: rgb(247, 232, 176) solid 1.2px;
                            "
                        >
                            OK
                        </button>
                        <button
                            style="
                                width: 60px;
                                height: 24px;
                                box-shadow: 3px 4px 1px #888888;
                                border: white solid 1px;
                            "
                        >
                            Cancel
                        </button>
                    </div>
                </div>`;
                document.documentElement.insertAdjacentHTML("beforeend", html);
                const tips = document.getElementById("autoscroll-tips");
                let buttons = tips.getElementsByTagName("button");
                const id = setTimeout(() => {
                    tips.remove();
                    zhihu.scroll.toTop();
                    this.nextPage();
                }, 3000);
                buttons[0].onclick = () => {
                    clearTimeout(id);
                    tips.remove();
                    zhihu.scroll.toTop();
                    this.nextPage();
                };
                buttons[1].onclick = () => {
                    clearTimeout(id);
                    tips.remove();
                    this.zhuanlanAuto_mode = false;
                    Notification("exit autoscroll mode successfully", "tips");
                };
                buttons = null;
            },
            stopScroll(mode = false) {
                if (this.scrollState) {
                    this.scrollPos = null;
                    this.scrollTime = null;
                    this.scrollState = false;
                    this.keyCount = 1;
                }
                if (mode) {
                    this.disableEvent(false);
                    this.zhuanlanAuto_mode && this.popup();
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
                    ? (this.stopScroll(), this.disableEvent(false))
                    : ((this.scrollState = true),
                      this.disableEvent(true),
                      window.requestAnimationFrame(this.pageScroll.bind(this)));
            },
            Others(keyCode, shift) {
                shift
                    ? keyCode === 67
                        ? this.noteHightlight.removeMark()
                        : keyCode === 219
                        ? this.Column.pagePrint()
                        : keyCode === 70
                        ? this.Column.follow()
                        : keyCode === 76
                        ? this.Column.columnsModule.recentModule.log("p")
                        : keyCode === 83
                        ? this.Column.subscribe()
                        : this.noteHightlight.Marker(keyCode)
                    : keyCode === 113
                    ? this.noteHightlight.EditDoc()
                    : keyCode === 78
                    ? this.turnPage.start(true)
                    : keyCode === 84
                    ? this.scroll.toTop()
                    : keyCode === 82
                    ? this.scroll.toBottom()
                    : keyCode === 85
                    ? this.turnPage.start(false)
                    : this.multiSearch(keyCode);
            },
            keyBoardEvent() {
                window.onkeydown = (e) => {
                    if (e.ctrlKey || e.altKey) return;
                    const className = e.target.className;
                    if (
                        (className && className.includes("DraftEditor")) ||
                        e.target.localName === "input"
                    )
                        return;
                    const keyCode = e.keyCode;
                    const shift = e.shiftKey;
                    if (keyCode === 68 || (shift && keyCode === 71)) {
                        //68, d, default is login shortcut of zhihu
                        //71, g, + shift, default is scroll to the bottom of webpage
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    shift
                        ? keyCode === 65
                            ? this.zhuanlanAuto()
                            : this.Others.call(zhihu, keyCode, shift)
                        : keyCode === 192
                        ? this.start()
                        : keyCode === 187
                        ? this.speedUP()
                        : keyCode === 189
                        ? this.slowDown()
                        : keyCode > 47 && keyCode < 58
                        ? this.key_Click(keyCode)
                        : keyCode === 188 || keyCode === 190
                        ? this.key_next_Pre(keyCode)
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
                                        src="data:image/webp;base64,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"
                                    />
                                </div>
                            </div>
                            <div class="timeout" style="font-size: 12px; padding: 3%">
                                15s, this Tips will be automatically closed or can you just click
                            </div>
                            <a
                                href="https://github.com/Kyouichirou/D7E1293/blob/main/Tmapermonkey/zhihu_optimizer_manual.md"
                                target="blank"
                                style="margin: ${mt}px 10px 0px 0px; float: right; font-size: 14px"
                                title="user manual"
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
            //only those links can be capture, which has the attribute of classname with ' external'
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
        //if has logined or the login window is not loaded when the page is loaded;
        hasLogin: false,
        antiLogin() {
            /*
            note:
            the timing of the js injection is uncertain, and for some reason the injection maybe late,
            so that the occurrence of the event cannot be accurately captured
            don't use dom load event =>
            */
            let mo = new MutationObserver((events) => {
                if (this.hasLogin) {
                    mo.disconnect();
                    mo = null;
                    return;
                }
                events.forEach((e) =>
                    e.addedNodes.forEach((node) => {
                        const type = node.nodeType;
                        if (
                            (type === 1 || type === 9 || type === 11) &&
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
                );
            });
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
            3, article page => check expand
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
            //block question
            get Topic_question_ID() {
                const href = location.href;
                const reg = /(?<=(question|topic)\/)\d+/;
                const match = href.match(reg);
                if (!match) return null;
                return match[0];
            },
            Topic_questionButton(targetElements) {
                const header_line = (event, mode) => {
                    let question = null;
                    if (event) {
                        const path = event.path;
                        for (const e of path) {
                            if (e.className === targetElements.headerID) {
                                question = e;
                                break;
                            }
                        }
                    } else {
                        question = document.getElementsByClassName(
                            targetElements.headerID
                        )[0];
                    }
                    if (!question) return;
                    const h = question.getElementsByClassName(
                        targetElements.headerTitle
                    );
                    if (h.length === 0) return;
                    h[0].style.textDecoration = mode ? "line-through" : "none";
                };
                let q = document.getElementsByClassName(
                    targetElements.inserButtonID
                );
                if (q.length === 0) return;
                const id = this.Topic_question_ID;
                if (!id) return;
                let mode = false;
                const type = targetElements.index === 2 ? "topic" : "question";
                let [name, title] = (mode = blackTopicAndQuestion.some(
                    (e) => e.id === id
                ))
                    ? ["Remove", `remove the ${type} from block list`]
                    : ["Block", `add the ${type} to block list`];
                const html = `
                <button
                    title=${escapeBlank(title)}
                    style="
                        font-size: 14px;
                        height: 22px;
                        width: 60px;
                        margin-left: 10px;
                        box-shadow: 1px 1px 4px #888888;
                    "
                >
                    ${name}
                </button>`;
                let button = document.createElement("button");
                q[0].insertAdjacentElement("beforeend", button);
                button.outerHTML = html;
                q[0].lastChild.onclick = function (event) {
                    if (mode) {
                        const index = blackTopicAndQuestion.findIndex(
                            (e) => e.id === id
                        );
                        if (index > -1) {
                            blackTopicAndQuestion.splice(index, 1);
                            GM_setValue(
                                targetElements.blockValueName,
                                blackTopicAndQuestion
                            );
                        }
                    } else {
                        if (blackTopicAndQuestion.some((e) => e.id === id))
                            return;
                        const info = {};
                        info.id = id;
                        info.type = type;
                        info.update = Date.now();
                        blackTopicAndQuestion.push(info);
                        GM_setValue(
                            targetElements.blockValueName,
                            blackTopicAndQuestion
                        );
                    }
                    mode = !mode;
                    [name, title] = mode
                        ? ["Remove", `remove the ${type} from block list`]
                        : ["Block", `add the ${type} to block list`];
                    this.title = title;
                    this.innerText = name;
                    header_line(event, mode);
                };
                button = null;
                q = null;
                mode && header_line(null, true);
                GM_addValueChangeListener(
                    targetElements.blockValueName,
                    (name, oldValue, newValue, remote) =>
                        remote && (blackTopicAndQuestion = newValue)
                );
            },
            check(item, targetElements, mode) {
                let result = false;
                if (targetElements.index === 3) {
                    //zhihu hot news(the whole) => don't treat
                    const h = item.getElementsByClassName("MinorHotSpot");
                    if (h.length > 0) return;
                    result = this.contentCheck(item, targetElements, 1);
                } else {
                    result = this.userCheck(item, targetElements);
                    result =
                        !result &&
                        this.contentCheck(item, targetElements, mode);
                }
                if (!result && this.dbInitial) {
                    if (targetElements.index < 2) {
                        this.foldAnswer.check(
                            item.className !== "ContentItem AnswerItem"
                                ? item.getElementsByClassName(
                                      "ContentItem AnswerItem"
                                  )[0]
                                : item
                        );
                    } else {
                        this.foldAnswer.Three.main(item);
                    }
                }
            },
            URL_hasChange: false,
            checkURL(targetElements, mode = false) {
                const href = location.href;
                if (mode && this.currentHREF !== href) {
                    this.URL_hasChange = true;
                    this.currentHREF = href;
                    return false;
                }
                return targetElements.index < 2
                    ? true
                    : targetElements.zone.some((e) => href.includes(e));
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
            colorIndicator: {
                lasttarget: null,
                index: 0,
                change: false,
                color(target) {
                    this.restore();
                    const colors = ["green", "red", "blue", "purple"];
                    target.style.color = colors[this.index];
                    target.style.fontSize = "16px";
                    target.style.letterSpacing = "0.3px";
                    if (target.style.fontWeight !== 600) {
                        target.style.fontWeight = 600;
                        this.change = true;
                    } else this.change = false;
                    this.index > 2 ? (this.index = 0) : (this.index += 1);
                    this.lasttarget = target;
                },
                restore() {
                    if (this.lasttarget) {
                        this.lasttarget.style.color = "";
                        this.lasttarget.style.fontSize = "";
                        this.lasttarget.style.letterSpacing = "";
                        if (this.change)
                            this.lasttarget.style.fontWeight = "normal";
                        this.lasttarget = null;
                    }
                },
            },
            clickMonitor(node, targetElements) {
                const tags = ["blockquote", "p", "br", "li"];
                node.onclick = (e) => {
                    const target = e.target;
                    const localName = target.localName;
                    if (tags.includes(localName)) {
                        if (target.style.color || this.foldAnswer.editableMode)
                            return;
                        this.colorIndicator.color(target);
                        return;
                    }
                    this.colorIndicator.restore();
                    const className = target.className;
                    if (
                        className &&
                        typeof className === "string" &&
                        className.startsWith("fold") &&
                        this.dbInitial
                    ) {
                        if (targetElements.index < 2) {
                            const ends = [
                                "block",
                                "temp",
                                "element",
                                "select",
                                "edit",
                                "reader",
                            ];
                            if (ends.some((e) => className.endsWith(e)))
                                this.foldAnswer.buttonclick(target);
                        } else {
                            const ends = [
                                "question",
                                "topic",
                                "element",
                                "temp",
                                "answer",
                                "article",
                            ];
                            if (ends.some((e) => className.endsWith(e)))
                                this.foldAnswer.Three.btnClick(target);
                        }
                        return;
                    }
                    let item = null;
                    //click the expand button
                    if (className === targetElements.buttonClass) {
                        item = this.getiTem(target, targetElements);
                        //click the ico of expand button
                    } else if (localName === "svg") {
                        const button = this.svgCheck(target, targetElements);
                        button && (item = this.getiTem(button, targetElements));
                        //click the answer, the content will be automatically expanded
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
                    if (item) this.clickCheck(item, targetElements);
                    else {
                        const path = e.path;
                        let ic = 0;
                        for (const c of path) {
                            if (c.localName === "a") {
                                const cl = c.className;
                                if (cl && !cl.endsWith("external")) {
                                    const s = c.search;
                                    if (s.startsWith("?target=")) {
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        const h = s.slice(s.indexof("=") + 1);
                                        c.href = h;
                                        window.open(h, "_blank");
                                        break;
                                    }
                                }
                            }
                            ic++;
                            if (ic > 4) break;
                        }
                    }
                };
            },
            topicAndquestion(targetElements, info) {
                const items = document.getElementsByClassName(
                    "ContentItem-meta"
                );
                let n = items.length;
                for (n; n--; ) {
                    const item = items[n];
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
                        targetElements.itemClass
                    );
                    let n = items.length;
                    for (n; n--; ) {
                        const item = items[n];
                        const a = item.getElementsByClassName(
                            targetElements.userID
                        );
                        let i = a.length;
                        if (i > 0) {
                            const name = a[--i].innerText;
                            name === info.username &&
                                this.setDisplay(item, info);
                        } else {
                            const content = item.getElementsByClassName(
                                targetElements.contentID
                            );
                            if (content.length === 0) continue;
                            const text = content[0].innerText;
                            const name = text.startsWith("匿名用户：")
                                ? ""
                                : text.slice(0, text.indexOf("："));
                            name &&
                                name === info.username &&
                                this.setDisplay(item, info);
                        }
                    }
                } else this.topicAndquestion(targetElements, info);
            },
            //standby, commmunication between others and column
            connectColumn() {
                const r = GM_getValue("removearticleA");
                if (r && Array.isArray(r) && r.length > 0) {
                    for (const e of r) dataBaseInstance.dele(false, e);
                    GM_setValue("removearticleA", "");
                }
                const b = GM_getValue("blockarticleA");
                if (b && Array.isArray(b) && b.length > 0) {
                    for (const e of b) dataBaseInstance.fold(e);
                    GM_setValue("blockarticleA", "");
                }
                GM_addValueChangeListener(
                    "blockarticleA",
                    (name, oldValue, newValue, remote) => {
                        if (remote) {
                            dataBaseInstance.fold(newValue[0]);
                            GM_setValue("blockarticleA", "");
                        }
                    }
                );
                GM_addValueChangeListener(
                    "removearticleA",
                    (name, oldValue, newValue, remote) => {
                        if (remote) {
                            debugger;
                            dataBaseInstance.dele(false, newValue[0]);
                            GM_setValue("removearticleA", "");
                        }
                    }
                );
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
                    if (
                        this.URL_hasChange ||
                        !this.checkURL(targetElements, targetElements.index > 1)
                    ) {
                        return;
                    }
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
                this.connectColumn();
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
            dbInitial: false,
            URL_change: false,
            currentHREF: null,
            main(index) {
                this.currentHREF = location.href;
                this.foldAnswer.initial().then((r) => {
                    this.checked = [];
                    this.dbInitial = r;
                    const targetElements = this.getTagetElements(index);
                    index !== 0 && this.firstRun(targetElements);
                    index !== 3 && this.Topic_questionButton(targetElements);
                    if (index > 1) {
                        unsafeWindow.addEventListener("urlchange", () =>
                            this.URL_change
                                ? (this.URL_change = false)
                                : setTimeout(() => {
                                      document.getElementsByClassName(
                                          "fold_element"
                                      ).length === 0 &&
                                          this.firstRun(targetElements, false);
                                  }, 300)
                        );
                        //monitor forward or backward, this operation will not fire dom event
                        window.onpopstate = () => (
                            (this.URL_change = true),
                            this.firstRun(targetElements, false)
                        );
                    }
                });
            },
            firstRun(targetElements, mode = true) {
                if (!this.checkURL(targetElements)) {
                    mode && this.monitor(targetElements);
                    return;
                }
                let ic = 0;
                let id = setInterval(() => {
                    const items = document.getElementsByClassName(
                        targetElements.itemClass
                    );
                    if (items.length > 4 || ic > 25) {
                        clearInterval(id);
                        for (const item of items)
                            this.check(item, targetElements, 0);
                        mode && this.monitor(targetElements);
                        this.URL_hasChange = false;
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
                this.clickMonitor(node[0], targetElements);
                const all = document.getElementsByClassName(
                    "QuestionMainAction ViewAll-QuestionMainAction"
                );
                for (const button of all)
                    button.onclick = () =>
                        setTimeout(() => this.firstRun(targetElements), 300);
                return targetElements;
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
                    headerID: "QuestionHeader",
                    headerTitle: "QuestionHeader-title",
                    expand: "RichText ztext CopyrightRichText-richText",
                    answerID: "ContentItem AnswerItem",
                    inserID: "LabelContainer-wrapper",
                    blockValueName: "blacktopicAndquestion",
                    inserButtonID: "QuestionHeaderActions",
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
                    headerID: "ContentItem-head",
                    headerTitle: "ContentItem-title",
                    contentID: "RichText ztext CopyrightRichText-richText",
                    expand: "RichContent-inner",
                    inserButtonID: "TopicActions TopicMetaCard-actions",
                    zone: ["/top-answers", "/hot", "newest"],
                    blockValueName: "blacktopicAndquestion",
                    index: index,
                };
                return targetElements;
            },
            foldAnswer: {
                Three: {
                    initialR: false,
                    btnClick(button) {
                        const text = button.innerText;
                        if (text.startsWith("show")) {
                            this.showFold(button);
                        } else {
                            let bid = "";
                            if (text !== "Fold") {
                                bid = this.getbid(button);
                                if (!bid) return;
                            }
                            this[text](button, bid);
                        }
                    },
                    getbid(button) {
                        const attrs = button.attributes;
                        if (!attrs) return null;
                        for (const e of attrs)
                            if (e.name === "bid") return e.value;
                        return null;
                    },
                    Answer_Article(button, bid, type, n, t, from = "") {
                        const p = button.parentNode.parentNode;
                        const user = p.getElementsByClassName("UserLink-link");
                        let i = user.length - 1;
                        const info = {};
                        info.userID = "";
                        info.userName = "";
                        if (i > 0) {
                            i = i > 1 ? 1 : i;
                            info.userName = user[i].innerText;
                            const pn = user[i].pathname;
                            info.userID = pn.slice(pn.lastIndexOf("/") + 1);
                        }
                        info.from = from;
                        info.name = bid;
                        info.update = Date.now();
                        info.type = type;
                        dataBaseInstance.fold(info);
                        this.changeBtn(button, n, t);
                    },
                    changeBtn(button, n, t) {
                        button.innerText = n;
                        button.title = t;
                        this.Fold(button, "show blocked");
                    },
                    Question_Topic(button, bid, type, n, t) {
                        if (blackTopicAndQuestion.some((e) => e.id === bid))
                            return;
                        const info = {};
                        info.id = bid;
                        info.type = type;
                        info.update = Date.now();
                        blackTopicAndQuestion.push(info);
                        GM_setValue(
                            "blacktopicAndquestion",
                            blackTopicAndQuestion
                        );
                        this.changeBtn(button, n, t);
                    },
                    Answer(button, bid) {
                        const from = this.getbid(button.nextElementSibling);
                        this.Answer_Article(
                            button,
                            bid,
                            "answer",
                            "Remove",
                            "unblock the answer",
                            from ? from : ""
                        );
                    },
                    Question(button, bid) {
                        this.Question_Topic(
                            button,
                            bid,
                            "question",
                            "Remove",
                            "unblock the question"
                        );
                    },
                    Article(button, bid) {
                        this.Answer_Article(
                            button,
                            bid,
                            "article",
                            "Remove",
                            "unblock the article"
                        );
                        let b = GM_getValue("blockarticleB");
                        if (b && Array.isArray(b)) {
                            for (const e of b) if (e.pid === bid) return;
                        } else b = [];
                        const r = GM_getValue("removearticleB");
                        if (r && Array.isArray(r)) {
                            const i = r.indexOf(bid);
                            if (i > -1) {
                                r.splice(i, 1);
                                GM_setValue("removearticleB", r);
                            }
                        }
                        const info = {};
                        info.userID = "";
                        info.from = "";
                        info.pid = bid;
                        info.value = 0;
                        info.update = Date.now();
                        b.push(info);
                        GM_setValue("blockarticleB", b);
                    },
                    Topic(button, bid) {
                        this.Question_Topic(
                            button,
                            bid,
                            "topic",
                            "Remove",
                            "unblock the topic"
                        );
                    },
                    Remove(button, bid) {
                        const className = button.className;
                        const method = {
                            changeBtn(n, t) {
                                button.innerText = n;
                                button.title = t;
                                button.parentNode.previousElementSibling.innerText =
                                    "show folded";
                            },
                            answer() {
                                dataBaseInstance.dele(false, bid);
                                this.changeBtn("Answer", "block the answer");
                            },
                            remove() {
                                let i = -1;
                                for (const e of blackTopicAndQuestion) {
                                    i++;
                                    if (e.id === bid) break;
                                }
                                if (i < 0) return;
                                blackTopicAndQuestion.splice(i, 1);
                                GM_setValue("", blackTopicAndQuestion);
                            },
                            topic() {
                                this.remove();
                                this.changeBtn("Topic", "block the topic");
                            },
                            article() {
                                dataBaseInstance.dele(false, bid);
                                this.changeBtn("Article", "block the article");
                                let r = GM_getValue("removearticleB");
                                if (r && Array.isArray(r) && r.length > 0) {
                                    if (r.includes(bid)) return;
                                } else r = [];
                                const b = GM_getValue("blockarticleB");
                                if (b && Array.isArray(b)) {
                                    const i = b.findIndex((e) => e.pid === bid);
                                    if (i > -1) {
                                        b.splice(i, 1);
                                        GM_setValue("blockarticleB", b);
                                    }
                                }
                                r.push(bid);
                                GM_setValue("removearticleB", r);
                            },
                            question() {
                                this.remove();
                                this.changeBtn(
                                    "Question",
                                    "block the question"
                                );
                            },
                        };
                        const n = className.slice(className.indexOf("_") + 1);
                        method[n]();
                    },
                    Fold(button, n = "") {
                        const p = button.parentNode;
                        p.previousElementSibling.style.display = "block";
                        p.nextElementSibling.style.display = "none";
                        p.style.display = "none";
                        n && (p.previousElementSibling.innerText = n);
                    },
                    showFold(button) {
                        button.style.display = "none";
                        const n = button.nextElementSibling;
                        if (!n) return;
                        n.style.display = "grid";
                        n.nextElementSibling.style.display = "block";
                    },
                    getInfo(item) {
                        const title = item.getElementsByTagName("h2");
                        if (title.length === 0) return null;
                        const a = title[0].getElementsByTagName("a");
                        if (a.length === 0) return null;
                        const p = a[0].pathname;
                        const info = {};
                        info.cblock = false;
                        info.ablcok = false;
                        info.qblock = false;
                        info.tblock = false;
                        const flags = ["/topic", "/p/", "/question"];
                        const index = flags.findIndex((e) => p.includes(e));
                        if (index === 0) {
                            info.type = "topic";
                            info.tid = p.slice(p.lastIndexOf("/") + 1);
                        } else if (index === 1) {
                            info.type = "column";
                            info.cid = p.slice(p.lastIndexOf("/") + 1);
                        } else {
                            info.type = "answer";
                            const tmp = p.split("/");
                            if (tmp.length !== 5) return null;
                            info.qid = tmp[2];
                            info.aid = tmp[4];
                        }
                        return info;
                    },
                    btnRaw(c, t, n, b) {
                        return `<button class="fold_${c}" title=${escapeBlank(
                            t
                        )} bid=${b}>${n}</button>`;
                    },
                    foldRaw(arr, info, adisplay, bdisplay, name) {
                        const d = JSON.stringify(info);
                        return `
                            <div
                                class="fold_element"
                                title="the ${info.type} has been folded"
                                data-info=${d}
                                style="display:${adisplay};"
                            >
                                show ${name}
                            </div>
                                <div class="hidden_fold" data-info=${d} style="display:${bdisplay};">
                                ${arr.join("")}
                                <button class="fold_temp" title="temporarily fold the item">Fold</button>
                            </div>`;
                    },
                    checkAnswerOrArticle(id) {
                        return new Promise((resolve, reject) => {
                            dataBaseInstance.check(id).then(
                                (result) => resolve(result),
                                (err) => {
                                    console.log(err);
                                    reject();
                                }
                            );
                        });
                    },
                    checkTAndQ(id) {
                        return blackTopicAndQuestion.some((e) => e.id === id);
                    },
                    answer(item, info) {
                        const exe = (r) => {
                            const f = this.checkTAndQ(info.qid);
                            const html = [];
                            info.qblock = f;
                            info.ablcok = r;
                            (r || f) && this.hide_content(item);
                            let [t, n] = r
                                ? ["unblock", "Remove"]
                                : ["block", "Answer"];
                            html.push(
                                this.btnRaw(
                                    "answer",
                                    t + " the answer",
                                    n,
                                    info.aid
                                )
                            );
                            [t, n] = f
                                ? ["unblock", "Remove"]
                                : ["block", "Question"];
                            html.push(
                                this.btnRaw(
                                    "question",
                                    t + " the question",
                                    n,
                                    info.qid
                                )
                            );
                            const [a, b, name] =
                                r || f
                                    ? ["grid", "none", "blocked"]
                                    : ["none", "grid", "folded"];
                            item.insertAdjacentHTML(
                                "afterbegin",
                                this.foldRaw(html, info, a, b, name)
                            );
                        };
                        this.initialR
                            ? this.checkAnswerOrArticle(info.aid).then(
                                  (r) => exe(r),
                                  () => console.log("check blocked answer fail")
                              )
                            : exe(false);
                    },
                    hide_content(item) {
                        item.firstChild.style.display = "none";
                    },
                    column(item, info) {
                        const exe = (r) => {
                            info.cblock = r;
                            r && this.hide_content(item);
                            const [t, n, a, b, name] = r
                                ? [
                                      "unblock",
                                      "Remove",
                                      "grid",
                                      "none",
                                      "blocked",
                                  ]
                                : [
                                      "block",
                                      "Article",
                                      "none",
                                      "grid",
                                      "folded",
                                  ];
                            item.insertAdjacentHTML(
                                "afterbegin",
                                this.foldRaw(
                                    [
                                        this.btnRaw(
                                            "article",
                                            t + " the article",
                                            n,
                                            info.cid
                                        ),
                                    ],
                                    info,
                                    a,
                                    b,
                                    name
                                )
                            );
                        };
                        this.initialR
                            ? this.checkAnswerOrArticle(info.cid).then(
                                  (r) => exe(r),
                                  () =>
                                      console.log("check blocked article fail")
                              )
                            : exe(false);
                    },
                    topic(item, info) {
                        const f = this.checkTAndQ(info.tid);
                        info.tblock = f;
                        f && this.hide_content(item);
                        const [t, n, a, b, name] = f
                            ? ["unblock", "Remove", "block", "none", "blocked"]
                            : ["block", "Topic", "none", "grid", "folded"];
                        item.insertAdjacentHTML(
                            "afterbegin",
                            this.foldRaw(
                                [
                                    this.btnRaw(
                                        "topic",
                                        t + " the topic",
                                        n,
                                        info.tid
                                    ),
                                ],
                                info,
                                a,
                                b,
                                name
                            )
                        );
                    },
                    main(item) {
                        const info = this.getInfo(item);
                        if (!info) return;
                        this[info.type](item, info);
                    },
                },
                //---------------------------------------------------------------------------------------
                buttonclick(button) {
                    const text = button.innerText;
                    text.startsWith("show")
                        ? this.showFold(button, text)
                        : this[text](button);
                },
                getcontent(button, pnode) {
                    const p = pnode || this.getpNode(button);
                    if (!p) return null;
                    const expand = p.getElementsByClassName(
                        "Button ContentItem-rightButton ContentItem-expandButton Button--plain"
                    );
                    if (expand.length > 0) expand[0].click();
                    const ele = p.getElementsByClassName(
                        "RichText ztext CopyrightRichText-richText"
                    );
                    return ele.length === 0 ? null : ele[0];
                },
                editableMode: false,
                Edit(button) {
                    const ele = this.getcontent(button);
                    if (!ele) return;
                    this.editableMode = true;
                    ele.contentEditable = true;
                    button.innerText = "Exit";
                    button.title = "exit editable mode";
                },
                Reader(button) {
                    const pnode = this.getpNode(button);
                    if (!pnode) return;
                    const aid = this.getid(pnode);
                    if (!aid) return;
                    zhihu.qaReader.main(pnode, aid);
                },
                Exit(button) {
                    const ele = this.getcontent(button);
                    if (!ele) return;
                    this.editableMode = false;
                    ele.contentEditable = false;
                    button.innerText = "Edit";
                    button.title = "edit the answer";
                },
                Select(button) {
                    if (this.editableMode) return;
                    const ele = this.getcontent(button);
                    if (!ele) return;
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    const range = new Range();
                    range.selectNodeContents(ele);
                    selection.addRange(range);
                },
                getid(item) {
                    const attrs = item.attributes;
                    if (!attrs) return null;
                    for (const a of attrs)
                        if (a.name === "name") return a.value;
                    return null;
                },
                getpNode(button) {
                    let pnode = button.parentNode;
                    let ic = 0;
                    while (pnode.className !== "ContentItem AnswerItem") {
                        pnode = pnode.parentNode;
                        ic++;
                        if (ic > 4 || !pnode) return null;
                    }
                    return pnode;
                },
                get from() {
                    const p = location.pathname;
                    const reg = /(?<=question\/)\d+/;
                    const m = p.match(reg);
                    return m ? m[0] : "";
                },
                Block(button, type = "answer") {
                    const p = this.getpNode(button);
                    if (!p) return;
                    const id = this.getid(p);
                    if (!id) return;
                    const info = {};
                    const user = p.getElementsByClassName("UserLink-link");
                    let i = user.length - 1;
                    if (i > 0) {
                        i = i > 1 ? 1 : i;
                        info.userName = user[i].innerText;
                        const pn = user[i].pathname;
                        info.userID = pn.slice(pn.lastIndexOf("/") + 1);
                    }
                    info.name = id;
                    info.update = Date.now();
                    info.type = type;
                    info.from = this.from;
                    dataBaseInstance.fold(info);
                    button.innerText = "Remove";
                    button.title = "remove the answer from block list";
                    this.insertShowFolded(p, "blocked");
                },
                Remove(button) {
                    //show temp button
                    const p = this.getpNode(button);
                    if (!p) return;
                    const id = this.getid(p);
                    if (!id) return;
                    dataBaseInstance.dele(false, id);
                    button.innerText = "Block";
                    button.title = "fold the answer forever";
                },
                Fold(button) {
                    const p = this.getpNode(button);
                    if (!p) return;
                    this.insertShowFolded(p, "folded");
                },
                showFold(button, text) {
                    const next = button.nextElementSibling;
                    next.style.display = "block";
                    button.style.display = "none";
                    if (text.endsWith("blocked")) this.insertButton(next, true);
                },
                check(item) {
                    if (!item) return;
                    if (this.initialR === 0) {
                        this.insertButton(item);
                        return;
                    }
                    const id = this.getid(item);
                    if (!id) return;
                    dataBaseInstance.check(id).then(
                        (r) => {
                            r
                                ? this.insertShowFolded(item, "blocked")
                                : this.insertButton(item);
                        },
                        (err) => console.log(err)
                    );
                },
                initialR: 0,
                initial() {
                    return new Promise((resolve) => {
                        const tables = ["foldedAnswer"];
                        dataBaseInstance.initial(tables, true, "name").then(
                            (result) => {
                                resolve(true),
                                    (this.Three.initialR = this.initialR = result);
                            },
                            (err) => {
                                console.log(err);
                                resolve(false);
                            }
                        );
                    });
                },
                insertShowFolded(item, name) {
                    //if it has already contained this element , to hide or show
                    const f = item.parentNode.getElementsByClassName(
                        "fold_element"
                    );
                    if (f.length === 0) {
                        const html = `
                        <div
                            class="fold_element"
                            title="the answer has been folded"
                        >
                            show ${name}
                        </div>`;
                        item.insertAdjacentHTML("beforebegin", html);
                        item.style.display = "none";
                    } else {
                        item.style.display = "none";
                        f[0].style.display = "block";
                        f[0].innerText = `show ${name}`;
                    }
                },
                insertButton(item, mode = false) {
                    const h = item.getElementsByClassName("hidden_fold");
                    if (h.length === 0) {
                        const obutton = `
                            <button class="fold_temp" title="temporarily fold the answer">Fold</button>
                            <button class="fold_edit" title="edit the answer">Edit</button>
                            <button class="fold_select" title="select the answer">Select</button>
                            <button class="fold_reader" title="open the answer in reader">Reader</button>`;
                        const html = `
                        <div class="hidden_fold">
                            <button class="fold_block" title="fold the answer forever">Block</button>
                            ${obutton}
                        </div>`;
                        const r = `
                        <div class="hidden_fold">
                            <button class="fold_block" title="remove the answer from block list">Remove</button>
                            ${obutton}
                        </div>`;
                        const label = item.getElementsByClassName(
                            "LabelContainer-wrapper"
                        );
                        if (label.length > 0)
                            label[0].insertAdjacentHTML(
                                "afterend",
                                mode ? r : html
                            );
                    }
                },
            },
        },
        addStyle(index) {
            const common = `
                span.RichText.ztext.CopyrightRichText-richText{text-align: justify !important;}
                body{text-shadow: #a9a9a9 0.025em 0.015em 0.02em;}`;
            const showfold = `
                .fold_element{
                    max-height: 24px;
                    margin-left: 45%;
                    margin-top: 3px;
                    width: 100px;
                    text-align: center;
                    border: 1px solid #ccc !important;
                }`;
            const contentstyle = `
                ${showfold}
                .hidden_fold:hover {
                     opacity: 1;
                     transition: opacity 2s;
                }
                .hidden_fold{opacity: 0.15;}
                .hidden_fold button {
                    float: right;
                    border: 1px solid #ccc!important;
                    box-shadow: 1px 1px 4px #888888;
                    height: 21px;
                    font-size: 14px;
                    width: 54px;
                    border-radius: 5px;
                }
                div.Question-mainColumn{
                    margin: auto !important;
                    width: 100% !important;
                    max-width: 1000px !important;
                    min-width: 1000px !important;
                }
                .RichText-MCNLinkCardContainer,
                div.Question-sideColumn,.Kanshan-container{display: none !important;}
                figure{max-width: 70% !important;}
                .RichContent-inner{
                    line-height: 30px !important;
                    margin: 40px 60px !important;
                    padding: 40px 50px !important;
                    border: 6px dashed rgba(133,144,166,0.2) !important;
                    border-radius: 6px !important;
                }
                a[href*="u.jd.com"],
                .Pc-word,
                span.LinkCard-content.LinkCard-ecommerceLoadingCard,
                .RichText-MCNLinkCardContainer{display: none !important;}
                .Comments{padding: 12px !important; margin: 60px !important;}`;
            const inpustyle = `
                input::-webkit-input-placeholder {
                    font-size: 0px !important;
                    text-align: right;
                }`;
            const hotsearch =
                ".Card.TopSearch{display: none !important;}.List-item{position: inherit !important;}";
            const topicAndquestion = `
                ${showfold}
                .hidden_fold {
                    opacity: 0.15;
                    float: right;
                }
                .hidden_fold:hover {
                     opacity: 1;
                     transition: opacity 2s;
                }
                .hidden_fold button {
                    border: 1px solid #ccc!important;
                    box-shadow: 1px 1px 0px #888888;
                    height: 18px;
                    font-size: 12px;
                    width: 54px;
                    border-radius: 5px;
                    margin-top: 2px;
                }`;
            GM_addStyle(
                common +
                    (index < 2
                        ? contentstyle + inpustyle
                        : index === 3
                        ? inpustyle + hotsearch + topicAndquestion
                        : index === 2
                        ? inpustyle + topicAndquestion
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
                            const url = `https://www.zhihu.com/search?q=${this.box.value}&type=content`;
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
        ErrorAutoClose() {
            const w = document.getElementsByClassName("PostIndex-warning");
            if (w.length === 0) return;
            const h = document.createElement("h2");
            w[0].insertAdjacentElement("afterbegin", h);
            setTimeout(() => window.close(), 6100);
            let time = 5;
            const dot = ".";
            h.innerText = `5s, current web will be automatically closed.....`;
            let id = setInterval(() => {
                time--;
                h.innerText = `${time}s, current web will be automatically closed${dot.repeat(
                    time
                )}`;
                if (time === 0) clearInterval(id);
            }, 1000);
        },
        zhuanlanStyle(mode) {
            //font, the pic of header, main content, sidebar, main content letter spacing, comment zone, ..
            //@media print, print preview, make the background-color can view when save webpage as pdf file
            const article = `
                mark.AssistantMark.red{background-color: rgba(255, 128, 128, 0.65) !important;box-shadow: rgb(255, 128, 128) 0px 1.2px;border-radius: 0.2em !important;}
                mark.AssistantMark.yellow{background-color: rgba(255, 250, 90, 1) !important;box-shadow: rgb(255, 255, 170) 0px 1.2px;border-radius: 0.2em !important;}
                mark.AssistantMark.green{background-color: rgba(170, 235, 140, 0.8) !important;box-shadow: rgb(170, 255, 170) 0px 2.2px;border-radius: 0.2em !important;}
                mark.AssistantMark.purple{background-color: rgba(255, 170, 255, 0.8) !important;box-shadow: rgb(255, 170, 255) 0px 1.2px;border-radius: 0.2em !important;}
                @media print {
                    mark.AssistantMark { box-shadow: unset !important; -webkit-print-color-adjust: exact !important; }
                    .CornerButtons,
                    .toc-bar.toc-bar--collapsed,
                    div#assist-button-container {display : none;}
                    #column_lists {display : none !important;}
                }
                body{text-shadow: #a9a9a9 0.025em 0.015em 0.02em;}
                .TitleImage{width: 500px !important}
                .Post-Main .Post-RichText{text-align: justify !important;}
                .Post-SideActions{left: calc(50vw - 560px) !important;}
                .RichText.ztext.Post-RichText{letter-spacing: 0.1px;}
                .Sticky.RichContent-actions.is-fixed.is-bottom{position: inherit !important}
                .Comments-container,
                .Post-RichTextContainer{width: 900px !important;}
                a[href*="u.jd.com"],
                .RichText-MCNLinkCardContainer,
                span.LinkCard-content.LinkCard-ecommerceLoadingCard,
                .RichText-MCNLinkCardContainer{display: none !important}`;
            const list = `.Card:nth-of-type(3),.Card:last-child,.css-8txec3{width: 900px !important;}`;
            if (mode) {
                const r = GM_getValue("reader");
                if (r) {
                    GM_addStyle(article + this.Column.clearPage(0).join(""));
                    this.Column.readerMode = true;
                } else {
                    GM_addStyle(article);
                }
                if (document.title.startsWith("该内容暂无法显示")) {
                    window.onload = () => this.ErrorAutoClose();
                    return;
                }
                this.Column.isZhuanlan = true;
                window.onload = () => {
                    this.colorAssistant.main();
                    this.autoScroll.keyBoardEvent();
                    this.Column.main(0);
                };
            } else {
                GM_addStyle(list);
                this.Column.main(2);
            }
        },
        Column: {
            isZhuanlan: false,
            authorID: "",
            authorName: "",
            get ColumnDetail() {
                const header = document.getElementsByClassName(
                    "ColumnLink ColumnPageHeader-TitleColumn"
                );
                if (header.length === 0) {
                    this.columnName = "";
                    this.columnID = "";
                    return false;
                }
                const href = header[0].href;
                this.columnID = href.slice(href.lastIndexOf("/") + 1);
                this.columnName = header[0].innerText;
                const post = document.getElementsByClassName("Post-Author");
                if (post.length > 0) {
                    const user = post[0].getElementsByClassName(
                        "UserLink-link"
                    );
                    const i = user.length - 1;
                    const p = user[i].pathname;
                    this.authorName = user[i].innerText;
                    this.authorID = p.slice(p.lastIndexOf("/") + 1);
                }
                return true;
            },
            updateAuthor(author) {
                const html = `
                <div
                    class="AuthorInfo"
                    itemprop="author"
                    itemscope=""
                    itemtype="http://schema.org/Person"
                >
                    <meta itemprop="name" content=${author.name} /><meta
                        itemprop="image"
                        content=${author.avatar_url}
                    /><meta
                        itemprop="url"
                        content=https://www.zhihu.com/people/${author.url_token}
                    /><meta itemprop="zhihu:followerCount" content="3287" /><span
                        class="UserLink AuthorInfo-avatarWrapper"
                        ><div class="Popover">
                            <div
                                id="Popover8-toggle"
                                aria-haspopup="true"
                                aria-expanded="false"
                                aria-owns="Popover8-content"
                            >
                                <a
                                    class="UserLink-link"
                                    data-za-detail-view-element_name="User"
                                    target="_blank"
                                    href="//www.zhihu.com/people/${author.url_token}"
                                    ><img
                                        class="Avatar Avatar--round AuthorInfo-avatar"
                                        width="38"
                                        height="38"
                                        src=${author.avatar_url}
                                        srcset=${author.avatar_url}
                                        alt=${author.name}
                                /></a>
                            </div></div
                    ></span>
                    <div class="AuthorInfo-content">
                        <div class="AuthorInfo-head">
                            <span class="UserLink AuthorInfo-name"
                                ><div class="Popover">
                                    <div
                                        id="Popover9-toggle"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                        aria-owns="Popover9-content"
                                    >
                                        <a
                                            class="UserLink-link"
                                            data-za-detail-view-element_name="User"
                                            target="_blank"
                                            href="//www.zhihu.com/people/${author.url_token}"
                                            >${author.name}</a
                                        >
                                    </div>
                                </div></span
                            >
                        </div>
                        <div class="AuthorInfo-detail">
                            <div class="AuthorInfo-badge">
                                <div class="ztext AuthorInfo-badgeText">
                                    ${author.headline}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                const authorNode = document.getElementsByClassName(
                    "AuthorInfo"
                );
                if (authorNode.length > 0) authorNode[0].outerHTML = html;
                this.authorID = author.url_token;
                this.authorName = author.name;
            },
            //column homepage
            subscribeOrfollow() {
                if (!this.ColumnDetail) return;
                let fn = "follow";
                let sn = "subscribe";
                const f = GM_getValue(fn);
                if (f && Array.isArray(f))
                    f.some((e) => this.columnID === e.columnID) &&
                        (fn = "remove");
                const s = GM_getValue(sn);
                if (s && Array.isArray(s))
                    s.some((e) => this.columnID === e.columnID) &&
                        (sn = "remove");
                let [a, b] =
                    fn === "remove" ? ["remove", "from"] : ["add", "to"];
                const ft = `${a}&nbsp;the&nbsp;column&nbsp;${b}&nbsp;follow&nbsp;list`;
                [a, b] = sn === "remove" ? ["remove", "from"] : ["add", "to"];
                const st = `${a}&nbsp;the&nbsp;column&nbsp;${b}&nbsp;subscribe&nbsp;list`;
                const html = `
                <div class="assistant-button" style="margin-left: 15px">
                    <style type="text/css">
                        .assistant-button button {
                            box-shadow: 1px 1px 2px #848484;
                            height: 24px;
                            border: 1px solid #ccc !important;
                            border-radius: 8px;
                        }
                    </style>
                    <button class="follow" style="width: 80px; margin-right: 5px;color: #2196F3;" title=${ft}>
                        ${fn}
                    </button>
                    <button class="subscribe" style="width: 90px" title=${st}>${sn}</button>
                </div>`;
                //const bhtml = `<button class="block" style="width: 70px" title="block the column">block</button>`;
                const user = document.getElementsByClassName(
                    "AuthorInfo AuthorInfo--plain"
                );
                if (user.length === 0) return;
                user[0].parentNode.insertAdjacentHTML("beforeend", html);
                let buttons = document.getElementsByClassName(
                    "assistant-button"
                )[0].children;
                const exe = (button, mode) => {
                    const name = button.innerText;
                    if (name === "remove") {
                        const vname = mode === 1 ? "follow" : "subscribe";
                        const arr = GM_getValue(vname);
                        if (arr && Array.isArray(arr)) {
                            const index = arr.findIndex(
                                (e) => e.columnID === this.columnID
                            );
                            if (index > -1) {
                                arr.splice(index, 1);
                                GM_setValue(vname, arr);
                                if (mode === 1 && this.columnsModule.node)
                                    this.columnsModule.database = arr;
                            }
                            Notification(`un${vname} successfully`, "Tips");
                        }
                        button.innerText = vname;
                        button.title = `add the column to ${vname} list`;
                    } else {
                        if (mode === 1) {
                            const i = this.follow(true);
                            if (i !== 1) {
                                button.innerText = "remove";
                                button.title =
                                    "remove the column from follow list";
                            }
                        } else {
                            this.subscribe();
                            button.innerText = "remove";
                            button.title =
                                "remove the column from subscribe list";
                        }
                    }
                };
                buttons[1].onclick = function () {
                    exe(this, 1);
                };
                buttons[2].onclick = function () {
                    exe(this, 2);
                };
                /*
                buttons[3].onclick =function () {
                    exe(this, 3);
                }
                */
                buttons = null;
            },
            //shift + f
            follow(mode) {
                if (!this.columnID) return;
                let f = GM_getValue("follow");
                if (f && Array.isArray(f)) {
                    let index = 0;
                    for (const e of f) {
                        if (this.columnID === e.columnID) {
                            const c = confirm(
                                `you have already followed this column on ${this.timeStampconvertor(
                                    e.update
                                )}, is unfollow this column?`
                            );
                            if (!c) return 0;
                            f.splice(index, 1);
                            GM_setValue("follow", f);
                            Notification(
                                "unfollow this column successfully",
                                "Tips"
                            );
                            return 1;
                        }
                        index++;
                    }
                } else f = [];
                const p = prompt(
                    "please input some tags about this column, like: javascript python; multiple tags use blank space to isolate",
                    "javascript python"
                );
                let tags = [];
                if (p && p.trim()) {
                    const tmp = p.split(" ");
                    for (let e of tmp) {
                        e = e.trim();
                        e && tags.push(e);
                    }
                }
                if (tags.length === 0 && !mode) {
                    const top = document.getElementsByClassName(
                        "TopicList Post-Topics"
                    );
                    if (top.length > 0) {
                        const topic = top[0].children;
                        for (const e of topic) tags.push(e.innerText);
                    }
                }
                const info = {};
                info.columnID = this.columnID;
                info.update = Date.now();
                info.columnName = this.columnName;
                info.tags = tags;
                f.push(info);
                this.columnsModule.node && (this.columnsModule.database = f);
                GM_setValue("follow", f);
                Notification(
                    "you have followed this column successfully",
                    "Tips",
                    3500
                );
                return 2;
            },
            //shift + s
            subscribe() {
                if (!this.columnID) return;
                let s = GM_getValue("subscribe");
                if (s && Array.isArray(s)) {
                    let i = 0;
                    for (const e of s) {
                        if (e.columnID === this.columnID) {
                            s.splice(i, 1);
                            break;
                        }
                    }
                } else s = [];
                const i = s.length;
                const info = {};
                info.columnID = this.columnID;
                info.update = Date.now();
                info.columnName = this.columnName;
                if (i === 0) {
                    s.push(info);
                } else {
                    i === 10 && s.pop();
                    s.unshift(info);
                }
                GM_setValue("subscribe", s);
                Notification(
                    "you have subscribed this column successfully",
                    "Tips",
                    3500
                );
            },
            Tabs: {
                get GUID() {
                    // blob:https://xxx.com/+ uuid
                    const link = URL.createObjectURL(new Blob());
                    const blob = link.toString();
                    URL.revokeObjectURL(link);
                    return blob.substr(blob.lastIndexOf("/") + 1);
                },
                save(columnID) {
                    //if currentb window does't close, when reflesh page or open new url in current window(how to detect the change ?)
                    //if open new url in same tab, how to change the uuid?
                    GM_getTab((tab) => {
                        const uuid = this.GUID;
                        tab.id = uuid;
                        tab.columnID = columnID;
                        sessionStorage.setItem("uuid", uuid);
                        GM_saveTab(tab);
                    });
                },
                check(columnID) {
                    return new Promise((resolve) => {
                        GM_getTabs((tabs) => {
                            if (tabs) {
                                //when open a new tab with "_blank" method, this tab will carry the session data of origin tab
                                const uuid = sessionStorage.getItem("uuid");
                                if (!uuid) {
                                    resolve(false);
                                } else {
                                    const tablist = Object.values(tabs);
                                    const f = tablist.some(
                                        (e) =>
                                            e.columnID === columnID &&
                                            uuid === e.id
                                    );
                                    resolve(f);
                                }
                            } else resolve(false);
                        });
                    });
                },
            },
            tocMenu: {
                change: false,
                appendNode(toc) {
                    if (toc.className.endsWith("collapsed")) return;
                    const header = document.getElementsByClassName(
                        "Post-Header"
                    );
                    if (header.length === 0) {
                        console.log("the header has been remove");
                        return;
                    }
                    header[0].appendChild(toc);
                    toc.style.position = "sticky";
                    toc.style.width = "900px";
                    this.change = true;
                },
                restoreNode(toc) {
                    if (!this.change) return;
                    document.body.append(toc);
                    toc.removeAttribute("style");
                    this.change = false;
                },
                main(mode) {
                    const toc = document.getElementById("toc-bar");
                    toc &&
                        (mode ? this.restoreNode(toc) : this.appendNode(toc));
                },
            },
            titleChange: false,
            clearPage(mode = 0) {
                const ids = [
                    "Post-Sub Post-NormalSub",
                    "Post-Author",
                    "span.Voters button",
                    "ColumnPageHeader-Wrapper",
                    "Post-SideActions",
                    "Sticky RichContent-actions is-bottom",
                ];
                if (mode === 0) {
                    const reg = /\s/g;
                    const css = ids.map(
                        (e) =>
                            `${
                                e.startsWith("span")
                                    ? e
                                    : `.${e.replace(reg, ".")}`
                            }{display: none;}`
                    );
                    return css;
                } else {
                    const style = mode === 1 ? "block" : "none";
                    ids.forEach((e) => {
                        const tmp = e.startsWith("span");
                        tmp &&
                            (e = e.slice(e.indexOf(".") + 1, e.indexOf(" ")));
                        const t = document.getElementsByClassName(e);
                        t.length > 0 &&
                            (tmp
                                ? (t[0].firstChild.style.display = style)
                                : (t[0].style.display = style));
                    });
                }
            },
            titleAlign() {
                if (this.modePrint && !this.titleChange) return;
                const title = document.getElementsByClassName("Post-Title");
                if (title.length === 0) return;
                if (this.modePrint) {
                    title[0].removeAttribute("style");
                } else {
                    if (title[0].innerText.length > 28) return;
                    title[0].style.textAlign = "center";
                }
                this.titleChange = !this.titleChange;
            },
            modePrint: false,
            pagePrint() {
                Notification(
                    `${this.modePrint ? "exit" : "enter"} print mode`,
                    "Print",
                    3500
                );
                !this.readerMode && this.clearPage(this.modePrint ? 1 : 2);
                this.tocMenu.main(this.modePrint);
                this.titleAlign();
                !this.modePrint && window.print();
                this.modePrint = !this.modePrint;
            },
            Framework() {
                const html = `
                <div
                    id="column_lists"
                    style="
                        top: 54px;
                        width: 380px;
                        font-size: 14px;
                        box-sizing: border-box;
                        padding: 0 10px 10px 0;
                        box-shadow: 0 1px 3px #ddd;
                        border-radius: 4px;
                        transition: width 0.2s ease;
                        color: #333;
                        background: #fefefe;
                        -moz-user-select: none;
                        -webkit-user-select: none;
                        user-select: none;
                        display: flex;
                        z-index: 1000;
                        position: absolute;
                        left: 2%;
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
                        div#column_lists ul a:hover{
                            color: blue;
                        }
                        div#column_lists ul {
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            display: block;
                            line-height: 1.9;
                        }
                        div#column_lists .header{
                            font-weight: bold;
                            font-size: 16px;
                        }
                    </style>
                    <span
                        class="right_column"
                        style="margin-left: 5%; margin-top: 5px; width: 100%"
                    >
                        <span class="header current column">
                            <a
                                class="column name"
                                href= https://www.zhihu.com/column/${
                                    this.columnID
                                }
                                target="_blank"
                                title=${
                                    this.isZhuanlan
                                        ? ""
                                        : escapeBlank("random column")
                                }
                                >${this.columnName}</a
                            >
                            <span class="tips" style="
                                float: right;
                                font-size: 14px;
                                font-weight: normal;
                            "></span>
                            <hr style="width: 340px" />
                        </span>
                        <ul
                            class="article_lists"
                        >
                        </ul>
                        <div class="nav button">
                            <button class="button last" title="previous page">Pre</button>
                            <button class="button next" title="next page">Next</button>
                            <button class="button hide" title="hide the menu">Hide</button>
                            <button class="button more" title="show more content">More</button>
                            <select class="select-pages" size="1" name="pageslist" style="margin-left: 20px; margin-top: 16px; height: 24px; position: absolute; width: 60px;box-shadow: 1px 2px 5px #888888;">
                                <option value="0" selected>pages</option>
                            </select>
                        </div>
                    </span>
                </div>`;
                document.body.insertAdjacentHTML("beforeend", html);
            },
            timeStampconvertor(timestamp) {
                if (!timestamp) return "undefined";
                if (typeof timestamp === "number") {
                    const s = timestamp.toString();
                    if (s.length === 10) timestamp *= 1000;
                    else if (s.length !== 13) return "undefined";
                } else {
                    if (timestamp.length === 10) {
                        timestamp = parseInt(timestamp);
                        timestamp *= 1000;
                    } else if (timestamp.length === 13) {
                        timestamp = parseInt(timestamp);
                    } else {
                        return "";
                    }
                }
                const date = new Date(timestamp);
                const y = date.getFullYear() + "-";
                const m =
                    (date.getMonth() + 1 < 10
                        ? "0" + (date.getMonth() + 1)
                        : date.getMonth() + 1) + "-";
                let d = date.getDate();
                d = d < 10 ? "0" + d : d;
                return y + m + d;
            },
            backupInfo: null,
            next: null,
            previous: null,
            index: 1,
            rqReady: false,
            requestData(url) {
                if (this.rqReady) {
                    Notification("please request data slowly...", "Tips");
                    return;
                }
                this.rqReady = true;
                xmlHTTPRequest(url).then(
                    (json) => {
                        typeof json === "string" && (json = JSON.parse(json));
                        const data = json.data;
                        let id = this.isReverse ? data.length : 1;
                        const html = [];
                        this.backupInfo = [];
                        const tips =
                            "click&nbsp;me,&nbsp;show&nbsp;the&nbsp;content&nbsp;in&nbsp;current&nbsp;webpage";
                        const HREF = location.href;
                        for (const e of data) {
                            const type = e.type;
                            if (type !== "article" && type !== "answer")
                                continue;
                            const info = {};
                            info.id = id;
                            let time = e.updated;
                            let title = e.title;
                            let className = '"list_date"';
                            let question = "";
                            info.url = e.url;
                            const tmp = {};
                            let fontWeight = "";
                            if (!time) {
                                time = e.updated_time;
                                className = "list_date_question";
                                title = e.question.title;
                                question =
                                    "this&nbsp;is&nbsp;a&nbsp;question&nbsp;page,&nbsp;do&nbsp;not&nbsp;show&nbsp;in&nbsp;current&nbsp;page";
                                info.url = `https://www.zhihu.com/question/${e.question.id}/answer/${e.id}`;
                            } else {
                                HREF === info.url &&
                                    ((fontWeight =
                                        ' style="font-weight:bold;"'),
                                    (this.targetIndex = id));
                                tmp.author = e.author;
                            }
                            info.excerpt = escapeHTML(
                                `${title} <摘要>: ` + e.excerpt
                            );
                            info.updated = this.timeStampconvertor(time);
                            title = titleSlice(title);
                            title = escapeHTML(title);
                            info.title = title;
                            html.push(
                                this.liTagRaw(
                                    info,
                                    question || tips,
                                    className,
                                    fontWeight
                                )
                            );
                            if (!question) {
                                tmp.content = e.content;
                                tmp.title = e.title;
                            }
                            this.backupInfo.push(tmp);
                            this.isReverse ? id-- : id++;
                        }
                        if (this.isReverse) {
                            this.backupInfo.reverse();
                            html.reverse();
                        }
                        const pag = json.paging;
                        const totals = pag.totals;
                        this.appendNode(html, totals);
                        this.previous = this.isReverse
                            ? pag.is_end
                                ? ""
                                : pag.next
                            : pag.is_start
                            ? ""
                            : pag.previous;
                        this.next = this.isReverse
                            ? pag.is_start
                                ? ""
                                : pag.previous
                            : pag.is_end
                            ? ""
                            : pag.next;
                        this.rqReady = false;
                    },
                    (err) => {
                        console.log(err);
                        this.rqReady = false;
                    }
                );
            },
            firstAdd: true,
            selectRaw(index, name) {
                return `<option value=${index}>${name}</option>`;
            },
            total_pages: 0,
            isReverse: false,
            //pages list
            appendSelect(node, pages, mode = false) {
                const select = node.getElementsByClassName("select-pages");
                if (select.length === 0) return;
                this.total_pages = Math.ceil(pages / 10);
                const end = this.total_pages > 30 ? 31 : this.total_pages + 1;
                const html = [];
                for (let index = 1; index < end; index++)
                    html.push(this.selectRaw(index, index));
                if (this.total_pages > 1)
                    html.push(this.selectRaw(html.length + 1, "reverse"));
                select[0].insertAdjacentHTML("beforeend", html.join(""));
                const optionNum = select[0].length + 1;
                const [ds, dh] =
                    optionNum < 9
                        ? [optionNum, 15 * optionNum + "px"]
                        : [8, "120px"];
                select[0].onmousedown = function () {
                    this.size = ds;
                    this.style.height = dh;
                };
                select[0].onblur = function () {
                    this.style.height = "24px";
                    this.size = 1;
                };
                //execute
                const exe = (opt) => {
                    if (this.total_pages === 1) return;
                    const i = opt.value * 1;
                    const tmp = i === this.total_pages + 1;
                    if (tmp) {
                        if (this.isReverse) return;
                        this.isReverse = tmp;
                        this.index = 1;
                        opt.value = 1;
                    } else {
                        if (i === 0) {
                            if (this.isReverse) {
                                this.isReverse = false;
                                this.index = 1;
                                opt.value = 1;
                            } else {
                                return;
                            }
                        } else this.index = i;
                    }
                    if (mode) {
                        Reflect.apply(this.homePage.add, this, [
                            this.homePage.initial,
                            "f",
                            true,
                        ]);
                    } else {
                        const m = this.isReverse
                            ? this.total_pages - this.index
                            : this.index - 1;
                        const URL = `http://www.zhihu.com/api/v4/columns/${
                            this.columnID
                        }/items?limit=10&offset=${10 * m}`;
                        this.requestData(URL);
                    }
                };
                select[0].onchange = function () {
                    this.size = 1;
                    this.style.height = "24px";
                    exe(this);
                };
            },
            changeSelect(mode) {
                this.index += mode ? 1 : -1;
                const column = document.getElementById("column_lists");
                const select = column.getElementsByTagName("select")[0];
                select.value = this.index;
            },
            appendNode(html, totals, mode = false) {
                const column = document.getElementById("column_lists");
                if (!column) {
                    console.log("the module of column has been deleted");
                    return;
                }
                const lists = column.getElementsByClassName("article_lists")[0];
                this.firstAdd
                    ? (lists.insertAdjacentHTML("afterbegin", html.join("")),
                      this.appendSelect(column, totals, mode),
                      this.clickEvent(column, mode))
                    : (lists.innerHTML = html.join(""));
                this.firstAdd = false;
            },
            liTagRaw(info, title, className = "list_date", fontWeight = "") {
                const html = `
                <li${fontWeight}>
                    <span class="list num">${info.id}</span>
                    <a
                        href=${info.url}
                        target="_blank"
                        title=${info.excerpt}>${info.title}</a
                    >
                    <span class=${className} style="float: right" title=${title}>${info.updated}</span>
                </li>`;
                return html;
            },
            nextPage: false,
            tipsTimeout: null,
            showTips(tips) {
                const column = document.getElementById("column_lists");
                if (!column) return;
                const tipNode = column.getElementsByClassName("tips")[0];
                tipNode.innerText = tips;
                this.tipsTimeout && clearTimeout(this.tipsTimeout);
                this.tipsTimeout = setTimeout(() => {
                    tipNode.innerText = "";
                    this.tipsTimeout = null;
                }, 2000);
            },
            /*
            need add new function => simple mode and content mode, if it is simple mode, all page direct show the menu of column?
            */
            followCursor: null,
            homePage: {
                follow: null,
                get ColumnID() {
                    const i = Math.floor(Math.random() * this.follow.length);
                    return this.follow[i].columnID;
                },
                get initial() {
                    this.follow = GM_getValue("follow");
                    if (
                        !this.follow ||
                        !Array.isArray(this.follow) ||
                        this.follow.length === 0
                    )
                        return false;
                    return this.follow;
                },
                add(follow, direction, page) {
                    if (!follow) return;
                    setTimeout(() => {
                        const html = [];
                        const k = follow.length;
                        if (this.isReverse) {
                            this.followCursor = (this.index - 1) * 10 - 1;
                        } else {
                            if (page) {
                                this.followCursor = k - (this.index - 1) * 10;
                            } else {
                                if (this.followCursor === null) {
                                    this.followCursor = k;
                                } else {
                                    if (direction === "r")
                                        this.followCursor += 20;
                                    if (this.followCursor > k)
                                        this.followCursor = k;
                                }
                            }
                        }
                        const className = "list_date_follow";
                        const title = "follow&nbsp;date";
                        let id = 1;
                        const prefix = "https://www.zhihu.com/column/";
                        const methods = {
                            r() {
                                this.followCursor += 1;
                                return this.followCursor < k;
                            },
                            f() {
                                this.followCursor -= 1;
                                return this.followCursor > -1;
                            },
                        };
                        const func = this.isReverse ? "r" : "f";
                        while (methods[func].call(this)) {
                            const e = follow[this.followCursor];
                            const info = {};
                            info.title = e.columnName;
                            info.updated = this.timeStampconvertor(e.update);
                            info.excerpt = e.tags.join(";&nbsp;");
                            info.url = prefix + e.columnID;
                            info.id = id;
                            html.push(this.liTagRaw(info, title, className));
                            id++;
                            if (id > 10) break;
                        }
                        this.appendNode(html, k, true);
                        this.previous = this.isReverse
                            ? this.index - 1
                            : !(this.followCursor + id - 1 === k);
                        this.next = this.isReverse
                            ? this.index === Math.ceil(k / 10)
                                ? 0
                                : 1
                            : this.followCursor > -1;
                        this.homePage.follow = null;
                    }, 0);
                },
            },
            targetIndex: 0,
            clickEvent(node, mode = false) {
                let buttons = node.getElementsByClassName("nav button")[0]
                    .children;
                let article = node.getElementsByTagName("ul")[0];
                let aid = 0;
                //prevent click too fast
                let isReady = false;
                //show content in current page;
                article.onclick = (e) => {
                    //if under autoscroll mode, => not allow to click
                    if (
                        Reflect.get(zhihu.autoScroll, "scrollState") ||
                        Reflect.get(zhihu.noteHightlight, "editable")
                    )
                        return;
                    if (isReady) {
                        Notification("please operate slowly...", "Tips");
                        return;
                    }
                    const href = e.target.previousElementSibling.href;
                    if (location.href === href) return;
                    const className = e.target.className;
                    if (className === "list_date_follow")
                        window.open(href, "_self");
                    else if (className !== "list_date") return;
                    const content = document.getElementsByClassName(
                        "RichText ztext Post-RichText"
                    );
                    if (content.length === 0) return;
                    const p = e.path;
                    let ic = 0;
                    for (const e of p) {
                        if (e.localName === "li") {
                            let id = e.children[0].innerText;
                            id *= 1;
                            if (id === aid) return;
                            aid = id;
                            break;
                        }
                        if (ic > 2) return;
                        ic++;
                    }
                    isReady = true;
                    const i = aid - 1;
                    const title = document.getElementsByClassName("Post-Title");
                    title.length > 0 &&
                        (title[0].innerText = this.backupInfo[i].title);
                    content[0].innerHTML = this.backupInfo[i].content;
                    zhihu.colorAssistant.main();
                    window.history.replaceState(null, null, href);
                    document.title = `${this.backupInfo[i].title} - 知乎`;
                    //refresh the menu
                    const toc = document.getElementById("toc-bar");
                    if (toc) {
                        const refresh = toc.getElementsByClassName(
                            "toc-bar__refresh toc-bar__icon-btn"
                        )[0];
                        refresh.click();
                    }
                    const author = this.backupInfo[i].author;
                    if (author && this.authorID !== author.url_token)
                        this.updateAuthor(author);
                    let pnode = e.target.parentNode;
                    let j = 0;
                    while (pnode.localName !== "li") {
                        pnode = pnode.parentNode;
                        j++;
                        if (j > 2) break;
                    }
                    j < 3 && (pnode.style.fontWeight = "bold");
                    if (this.targetIndex > 0) {
                        pnode.parentNode.children[
                            this.targetIndex - 1
                        ].style.fontWeight = "normal";
                    }
                    this.targetIndex = aid;
                    this.reInject();
                    isReady = false;
                    const links = content[0].getElementsByTagName("a");
                    for (const link of links) {
                        const href = decodeURIComponent(link.href).split(
                            "link.zhihu.com/?target="
                        );
                        if (href.length > 1) link.href = href[1];
                    }
                };
                article = null;
                //last page
                let isCollapsed = false;
                buttons[0].onclick = () => {
                    !isCollapsed &&
                        (this.previous
                            ? (mode
                                  ? Reflect.apply(this.homePage.add, this, [
                                        this.homePage.initial,
                                        "r",
                                        false,
                                    ])
                                  : this.requestData(this.previous),
                              (aid = 0),
                              this.changeSelect(false))
                            : this.showTips("no more content"));
                };
                //next page
                buttons[1].onclick = () => {
                    !isCollapsed &&
                        (this.next
                            ? (mode
                                  ? Reflect.apply(this.homePage.add, this, [
                                        this.homePage.initial,
                                        "f",
                                        false,
                                    ])
                                  : this.requestData(this.next),
                              (aid = 0),
                              this.changeSelect(true))
                            : this.showTips("no more content"));
                };
                //hide the sidebar
                buttons[2].onclick = function () {
                    const [style, text, title] = isCollapsed
                        ? ["block", "Hide", "hide the menu"]
                        : ["none", "Expand", "show the menu"];
                    this.parentNode.parentNode.children[1].style.display = style;
                    const more = this.parentNode.nextElementSibling;
                    if (more) {
                        more.style.display = style;
                        more.nextElementSibling.style.display = style;
                    }
                    this.innerText = text;
                    this.title = title;
                    isCollapsed = !isCollapsed;
                };
                let addnew = true;
                const createModule = (button) => {
                    const sub = GM_getValue("subscribe");
                    if (addnew) {
                        this.columnsModule.liTagRaw = this.liTagRaw;
                        this.columnsModule.isZhuanlan = this.isZhuanlan;
                        this.columnsModule.timeStampconvertor = this.timeStampconvertor;
                    }
                    let html = null;
                    let text = "";
                    if (sub && Array.isArray(sub)) {
                        let id = 1;
                        const prefix = "https://www.zhihu.com/column/";
                        const title = "subscribe&nbsp;time";
                        html = sub.map((e) => {
                            const info = {};
                            info.id = id;
                            info.url = prefix + e.columnID;
                            info.updated = this.timeStampconvertor(e.update);
                            info.title = e.columnName;
                            info.excerpt = "";
                            id++;
                            return this.liTagRaw(info, title);
                        });
                        text = "Subscribe";
                    } else text = "no more data";
                    addnew
                        ? this.columnsModule.main(
                              button,
                              html,
                              text,
                              escapeBlank(
                                  this.isZhuanlan
                                      ? "column/collection search"
                                      : "column search"
                              )
                          )
                        : this.columnsModule.appendNewNode(html, text);
                    addnew = false;
                };
                buttons[3].onclick = function () {
                    !isCollapsed && createModule(this);
                };
                //if webpage is column home, expand this menu
                mode && createModule(buttons[3]);
                buttons = null;
            },
            columnsModule: {
                recentModule: {
                    log(type) {
                        //history, pocket, recent collect: h, c, p
                        const href = location.href;
                        let r = GM_getValue("recent");
                        if (r && Array.isArray(r)) {
                            const index = r.findIndex((e) => e.url === href);
                            if (index > -1 && r[index].type === type) {
                                if (index === 0) return;
                                r.splice(index, 1);
                            }
                        } else r = [];
                        const info = {};
                        let title = document.title;
                        title = title.slice(0, title.length - 5);
                        info.title = title;
                        info.update = Date.now();
                        info.type = type;
                        info.url = href;
                        const i = r.length;
                        if (i === 0) {
                            r.push(info);
                        } else {
                            if (i === 5) r.pop();
                            r.unshift(info);
                        }
                        GM_setValue("recent", r);
                        type === "p" &&
                            Notification(
                                "add current article to read later successfully",
                                "Tips"
                            );
                    },
                    remove(type) {
                        const href = location.href;
                        const r = GM_getValue("recent");
                        if (r && Array.isArray(r)) {
                            const index = r.findIndex((e) => e.url === href);
                            if (r[index].type === type) {
                                r.splice(index, 1);
                                GM_setValue("recent", r);
                            }
                        }
                    },
                    addnew: true,
                    read(node, liTagRaw, timeStampconvertor) {
                        const r = GM_getValue("recent");
                        if (!r || !Array.isArray(r) || r.length === 0) return;
                        const html = r.map((e) => {
                            const info = {};
                            const type = e.type;
                            info.updated = timeStampconvertor(e.update);
                            info.id = type;
                            info.excerpt = "";
                            info.url = e.url;
                            info.title = titleSlice(e.title);
                            const title =
                                "recent&nbsp;" +
                                (type === "h"
                                    ? "read&nbsp;history"
                                    : type === "c"
                                    ? "collection"
                                    : "pocket");
                            return liTagRaw(info, title);
                        });
                        let ul = node.getElementsByTagName("ul")[0];
                        const pre = ul.previousElementSibling;
                        pre.style.display =
                            html.length === 0 ? "block" : "none";
                        ul.innerHTML = html.join("");
                        if (this.addnew) {
                            ul.onclick = (e) => {
                                if (e.target.className === "list_date") {
                                    const a =
                                        e.target.previousElementSibling.href;
                                    location.href !== a &&
                                        window.open(a, "_self");
                                }
                            };
                        }
                        ul = null;
                    },
                    main(node, liTagRaw, timeStampconvertor) {
                        const n = node.nextElementSibling;
                        this.read(n, liTagRaw, timeStampconvertor);
                        let button = n.getElementsByClassName(
                            "button refresh"
                        )[0];
                        button.onclick = () =>
                            this.read(n, liTagRaw, timeStampconvertor);
                        button = null;
                    },
                },
                database: null,
                node: null,
                liTagRaw: null,
                addNewModule(text, placeholder) {
                    const html = `
                        <div class="more columns">
                            <hr>
                            <div class="search module" style="margin-bottom: 10px">
                                <input
                                    type="text"
                                    placeholder=${placeholder}
                                    style="height: 24px; width: 250px"
                                />
                                <button class="button search" style="margin-left: 11px;">Search</button>
                            </div>
                            <hr>
                            <span class="header columns">${text}</span>
                            <ul class="columns list">
                            </ul>
                        </div>
                        <div class="recently-activity">
                            <hr>
                            <span class="header columns"
                                >Recent
                                <button
                                    class="button refresh"
                                    style="margin-top: 5px; margin-left: 210px; font-weight: normal"
                                    title="refresh recent content"
                                >
                                    refresh
                                </button>
                            </span>
                            <hr>
                            <span class="header columns">no recent data</span>
                            <ul></ul>
                        </div>`;
                    const column = document.getElementById("column_lists");
                    if (column)
                        column.children[1].insertAdjacentHTML(
                            "beforeend",
                            html
                        );
                },
                appendNewNode(html, text = "", node) {
                    let pnode = node || this.node;
                    pnode = pnode.parentNode.nextElementSibling;
                    const ul = pnode.getElementsByTagName("ul")[0];
                    ul.innerHTML = html.join("");
                    text && (pnode.children[3].innerText = text);
                },
                checkInlcudes(e, key) {
                    if (e.columnName.includes(key)) return true;
                    return e.tags.some((t) =>
                        key.length > t.length
                            ? key.includes(t)
                            : t.includes(key)
                    );
                },
                timeStampconvertor: null,
                commandFormat(str) {
                    const treg = /(?<=\$)[dmhyw][<>=][0-9]+/g;
                    const areg = /(?<=\$)a=\(.+\)/g;
                    const preg = /(?<=\$)p=[0-9]{5,}/g;
                    const t = str.match(treg);
                    const p = str.match(preg);
                    if (t && p) return null;
                    const a = str.match(areg);
                    if (p && a) return null;
                    if (!(a || p || t)) return null;
                    const sigs = ["=", ">", "<"];
                    const sign = {
                        0: "equal",
                        1: "great",
                        2: "less",
                    };
                    const type = {};
                    if (t) {
                        let cm = "";
                        let ecount = 0;
                        let lcount = 0;
                        let gcount = 0;
                        for (const e of t) {
                            if (cm && cm !== e[0]) return null;
                            if (!type[e[0]]) type[e[0]] = {};
                            if (type[e[0]]) {
                                const sg = e[1];
                                const index = sigs.findIndex((e) => e === sg);
                                if (index === 0) {
                                    ecount++;
                                    if (ecount > 1) return null;
                                } else if (index === 1) {
                                    gcount++;
                                    if (gcount > 1) return null;
                                } else {
                                    lcount++;
                                    if (lcount > 1) return null;
                                }
                                const n = sign[index];
                                if (type[e[0]][n]) return null;
                                type[e[0]][n] = e.slice(2);
                            }
                        }
                        if (a) {
                            if (a.length > 1) return null;
                            const tmp = a[0];
                            type[tmp[0]] = tmp
                                .slice(3, tmp.length - 1)
                                .split(" ");
                        }
                    } else if (p) {
                        if (p.length > 1) return null;
                        const tmp = p[0];
                        type[tmp[0]] = tmp[2];
                    } else if (a) {
                        if (a.length > 1) return null;
                        const tmp = a[0];
                        type[tmp[0]] = tmp.slice(3, tmp.length - 1).split(" ");
                    }
                    return type;
                },
                ExecuteFunc: {
                    Resultshow(e, i, liTagRaw, timeStampconvertor) {
                        const info = {};
                        info.id = i;
                        info.title = titleSlice(e.title);
                        info.excerpt = escapeHTML(e.excerpt);
                        info.updated = timeStampconvertor(e.update);
                        const title = escapeBlank("collect time");
                        const prefix = "/p/";
                        info.url = prefix + e.pid;
                        return liTagRaw(info, title);
                    },
                    less(a, b) {
                        return a < b;
                    },
                    equal(a, b) {
                        return a === b;
                    },
                    great(a, b) {
                        return a > b;
                    },
                    get now() {
                        return Date.now();
                    },
                    get nowDate() {
                        return new Date();
                    },
                    getUpdate(update) {
                        return new Date(update);
                    },
                    w(value, mode, info) {
                        const now = this.now;
                        const time = info.update;
                        const week = (now - time) / (86400000 * 7);
                        return this[mode](week, value * 1);
                    },
                    d(value, mode, info) {
                        const now = this.now;
                        const time = info.update;
                        const day = (now - time) / 86400000;
                        return this[mode](day, value * 1);
                    },
                    m(value, mode, info) {
                        const endDate = this.nowDate;
                        const beginDate = this.getUpdate(info.update);
                        const month =
                            endDate.getFullYear() * 12 +
                            endDate.getMonth() -
                            (beginDate.getFullYear() * 12 +
                                beginDate.getMonth());
                        return this[mode](month, value * 1);
                    },
                    y(value, mode, info) {
                        const endDate = this.nowDate;
                        const beginDate = this.getUpdate(info.update);
                        const year =
                            endDate.getFullYear() * 12 +
                            endDate.getMonth() -
                            (beginDate.getFullYear() * 12 +
                                beginDate.getMonth()) /
                                12;
                        return this[mode](year, value * 1);
                    },
                    h(value, mode, info) {
                        const now = this.now;
                        const time = info.update;
                        const hour = (now - time) / (1000 * 60 * 60);
                        return this[mode](hour, value * 1);
                    },
                    a(value, info) {
                        const content =
                            info.title +
                            " | " +
                            info.tags.join("") +
                            info.excerpt;
                        return value.some((v) => content.includes(v));
                    },
                    search(table, fs, liTagRaw, timeStampconvertor) {
                        return new Promise((resolve, reject) => {
                            let ic = 0;
                            const html = [];
                            const cur = table.openCursor(null, "next");
                            cur.onsuccess = (e) => {
                                const cursor = e.target.result;
                                if (cursor) {
                                    const info = cursor.value;
                                    const result = fs.every((f) => f(info));
                                    if (result) {
                                        ic++;
                                        html.push(
                                            this.Resultshow(
                                                info,
                                                ic,
                                                liTagRaw,
                                                timeStampconvertor
                                            )
                                        );
                                    }
                                    if (ic === 10) {
                                        resolve(html);
                                    } else {
                                        cursor.continue();
                                    }
                                } else {
                                    resolve(html);
                                }
                            };
                            cur.onerror = (e) => {
                                console.log(e);
                                reject("open db cursor fail");
                            };
                        });
                    },
                    funcs(
                        type,
                        liTagRaw,
                        timeStampconvertor,
                        node,
                        appendNewNode
                    ) {
                        const fs = [];
                        const keys = Object.keys(type);
                        for (const f of keys) {
                            const tmp = type[f];
                            if (Array.isArray(tmp) || typeof tmp !== "object") {
                                if (f === "p") {
                                    dataBaseInstance.check().then(
                                        (r) => {
                                            const html = [];
                                            if (r) {
                                                html.push(
                                                    this.Resultshow(
                                                        r,
                                                        1,
                                                        liTagRaw,
                                                        timeStampconvertor
                                                    )
                                                );
                                            }
                                            appendNewNode(
                                                html,
                                                html.length === 0
                                                    ? "no search result"
                                                    : "article search results",
                                                node
                                            );
                                        },
                                        (err) => console.log(err)
                                    );
                                    return;
                                }
                                fs.push(this[f].bind(this, tmp));
                                continue;
                            }
                            const tk = Object.keys(tmp);
                            for (const e of tk)
                                fs.push(this[f].bind(this, tmp[e], e));
                        }
                        return fs;
                    },
                    main(
                        table,
                        type,
                        liTagRaw,
                        timeStampconvertor,
                        node,
                        appendNewNode
                    ) {
                        const fs = this.funcs(
                            type,
                            liTagRaw,
                            timeStampconvertor,
                            node,
                            appendNewNode
                        );
                        if (fs.length === 0) {
                            dataBaseInstance.close();
                            return;
                        }
                        this.search(
                            table,
                            fs,
                            liTagRaw,
                            timeStampconvertor
                        ).then(
                            (html) => {
                                appendNewNode(
                                    html,
                                    html.length === 0
                                        ? "no search result"
                                        : "article search results",
                                    node
                                );
                                dataBaseInstance.close();
                            },
                            (err) => {
                                console.log(err);
                                dataBaseInstance.close();
                            }
                        );
                    },
                },
                initialDatabase(type) {
                    if (!type) return;
                    dataBaseInstance.initial(["collection"], false).then(
                        (result) => {
                            if (result === 0) {
                                this.appendNewNode([], "no search result");
                                return;
                            }
                            this.ExecuteFunc.main(
                                dataBaseInstance.Table,
                                type,
                                this.liTagRaw,
                                this.timeStampconvertor,
                                this.node,
                                this.appendNewNode
                            );
                        },
                        (err) => {
                            this.appendNewNode([], "open DB fail");
                            dataBaseInstance.close();
                        }
                    );
                },
                isZhuanlan: false,
                searchDatabase(key) {
                    if (key.startsWith("$") && this.isZhuanlan) {
                        const cm = ["a", "p", "d", "m", "y", "h", "w"];
                        const sc = key.slice(1, 2);
                        const f = cm.findIndex((e) => sc === e);
                        if (f < 0) return false;
                        this.initialDatabase(this.commandFormat(key));
                        return true;
                    }
                    return false;
                },
                search(key) {
                    //search follow columns & collection of article
                    if (this.searchDatabase(key)) return;
                    let i = 0;
                    const html = [];
                    const prefix = "https://www.zhihu.com/column/";
                    const title = "follow&nbsp;time";
                    for (const e of this.database) {
                        if (this.checkInlcudes(e, key)) {
                            i++;
                            const info = {};
                            info.id = i;
                            info.title = e.columnName;
                            info.excerpt = e.tags.join(";&nbsp;");
                            info.updated = this.timeStampconvertor(e.update);
                            info.url = prefix + e.columnID;
                            html.push(this.liTagRaw(info, title));
                            if (i === 10) break;
                        }
                    }
                    this.appendNewNode(
                        html,
                        html.length === 0
                            ? "no search result"
                            : "column search results"
                    );
                },
                event() {
                    const p = this.node.parentNode.nextElementSibling;
                    const input = p.getElementsByTagName("input")[0];
                    input.onkeydown = (e) => {
                        if (e.keyCode !== 13) return;
                        const key = input.value.trim();
                        key.length > 1 && this.search(key);
                    };
                    let button = p.getElementsByClassName("button search")[0];
                    button.onclick = () => {
                        const key = input.value.trim();
                        key.length > 1 && this.search(key);
                    };
                    button = null;
                    let ul = p.getElementsByTagName("ul")[0];
                    ul.onclick = (e) => {
                        if (e.target.className === "list_date") {
                            const a = e.target.previousElementSibling.href;
                            location.href !== a && window.open(a, "_self");
                        }
                    };
                    ul = null;
                    this.recentModule.main(
                        p,
                        this.liTagRaw,
                        this.timeStampconvertor
                    );
                },
                main(node, html, text, placeholder) {
                    this.node = node;
                    this.addNewModule(text, placeholder);
                    html && this.appendNewNode(html);
                    this.database = GM_getValue("follow");
                    if (!this.database || !Array.isArray(this.database))
                        this.database = [];
                    this.event();
                    GM_addValueChangeListener(
                        "follow",
                        (name, oldValue, newValue, remote) =>
                            remote && (this.database = newValue)
                    );
                },
            },
            assistNewModule: {
                preferenceModule(ainfo, binfo) {
                    const html = `
                    <div class="article_attitude" style="margin-left: 23px;">
                        <i
                            class="like"
                            style="
                                display: ${ainfo.ldisplay};
                                width: 26px;
                                content: url(data:image/webp;base64,UklGRoQBAABXRUJQVlA4IHgBAACQCACdASogAB8APm0ukUakIqGhKA1QgA2JaQATIBYgOyI1I/+d+2b49NA3z97A/6i/5f7VTVdqWUnQ+1B4fpukJQWsIUl77RwBlh9AYAD+/zKmH7r/7EJor7FchRHELu3xLyzt7tJsA4Kzo9o+jvdvg5F0PPnJ9h0T6ZLB/b/rf/u1ZNAgIjiz+e0teMM3r/7DFRJvl0h7Fp4PhhsogsSnsOevchiVl0v6jl73n1FPJaHvKz9qfJjC7VQCJTZ5/BAH9nF7hT/zjn+4fX8wnMmQGU9umlNySGfj4UGkhjkHpIds5Roy6Pi8eUA5zXCS8zCLf44zw/qXPgWSHfCrt+fmUapijvBoIn63X72ltR/wx3tHDi5gRr/wpBL8ERY3qmeKlMEBs9Km2Kg7BwpkKE4XNXjYQXuHn5bv7F0uxIKi2Ubgl/XO+BoeBlATzvrM24XeHW2/tv3nQ/z/wzbte4iSl5C3+7TrtUmPDs/XPieOK13LuZjgAAAA);
                                height: 26px;
                                margin-bottom: 5px;
                            "
                            title=${ainfo.ltitle}
                        ></i>
                        <i
                            class="dislike"
                            style="
                                content: url(data:image/webp;base64,UklGRmYBAABXRUJQVlA4IFoBAACQCQCdASogACAAPm0qkkWkIqGYDAYAQAbEtIAJ5c+RfUB0rJ7j9kpzPfcf1XiiNSX5s/7v5gPbD3Bv1F/0K6nH9glbEGQcDYiAI3S+NfKqNr+EMSyQAP7yUv/+QvpX0Z+oaIucX4be+hsni+QhcLK0f/ugn01LW17/NrkTFet/XNw/o/5+bPpPA3v7Ic8/NjVb4alH/V1LUJBkL7kko/v//XOzDfCaCoDzemP+zPNtC3dB6keXLJVpBMrLJgNzY/VUAKf+1SSCB/5BD/4Nf+lylTxAGWJl0/1twWPbOMbH0d+MQkF0fSsPqqBRpvc6FNf+PClifyl4OpWwfxGKiMm1C7O8/w0vDlPCbbwR4FKhQKuj2Fyul9WITHFC4fpzSNIBC39ZlySnghJRgDgCo/P+f9205ENaW+9XKyYLte/Gddtc43354MKLVHwYv44znVWV8gcjChTAAAAA);
                                display: ${ainfo.ddisplay};
                                width: 24px;
                                height: 24px;
                            "
                            title=${ainfo.dtitle}
                        ></i>
                    </div>
                    <button class="assist-button collect" style="color: black;" title=${binfo.title}>${binfo.name}</button>`;
                    return html;
                },
                create(module) {
                    const node = document.getElementById(
                        "assist-button-container"
                    );
                    node.children[0].insertAdjacentHTML("afterend", module);
                    return node;
                },
                main() {
                    return new Promise((resolve) => {
                        const tables = ["collection", "preference"];
                        //open db with r&w mode, if this db is not exist then create db
                        dataBaseInstance.initial(tables, true).then(
                            (result) => {
                                const ainfo = {};
                                ainfo.ltitle = "like this article";
                                ainfo.ldisplay = "block";
                                ainfo.ddisplay = "block";
                                ainfo.dtitle = "dislike this article";
                                const binfo = {};
                                binfo.title = "add this article to collection";
                                binfo.name = "Collect";
                                if (result === 0) {
                                    resolve(
                                        this.create(
                                            this.preferenceModule(
                                                escapeBlank(ainfo),
                                                escapeBlank(binfo)
                                            )
                                        )
                                    );
                                    dataBaseInstance.close(false);
                                } else {
                                    dataBaseInstance
                                        .batchCheck(tables)
                                        .then((results) => {
                                            const c = results[0];
                                            if (c) {
                                                binfo.title =
                                                    "remove this acticle from collection list";
                                                binfo.name = "Remove";
                                            }
                                            if (results[1]) {
                                                const pref = results[1].value;
                                                if (pref === 1) {
                                                    ainfo.ltitle =
                                                        "cancel like this article";
                                                    ainfo.ddisplay = "none";
                                                } else if (pref === 0) {
                                                    ainfo.dtitle =
                                                        "cancel dislike this article";
                                                    ainfo.ldisplay = "none";
                                                }
                                            }
                                            resolve(
                                                this.create(
                                                    this.preferenceModule(
                                                        escapeBlank(ainfo),
                                                        escapeBlank(binfo)
                                                    )
                                                )
                                            );
                                            dataBaseInstance.close();
                                        });
                                }
                            },
                            (err) => {
                                console.log(err);
                                resolve(null);
                            }
                        );
                    });
                },
            },
            syncData(mode, newValue) {
                dataBaseInstance.initial(["preference"], true).then(
                    () => {
                        mode
                            ? dataBaseInstance.update(newValue[0])
                            : dataBaseInstance.dele(false, newValue[0]);
                        dataBaseInstance.close();
                    },
                    (err) => console.log(err)
                );
            },
            communication() {
                const monitor = () => {
                    GM_addValueChangeListener(
                        "blockarticleB",
                        (name, oldValue, newValue, remote) => {
                            if (remote) {
                                this.syncData(true, newValue);
                                GM_setValue("blockarticleB", "");
                            }
                        }
                    );
                    GM_addValueChangeListener(
                        "removearticleB",
                        (name, oldValue, newValue, remote) => {
                            if (remote) {
                                this.syncData(false, newValue);
                                GM_setValue("removearticleB", "");
                            }
                        }
                    );
                };
                const r = GM_getValue("removearticleB");
                const b = GM_getValue("blockarticleB");
                r || b
                    ? dataBaseInstance.initial(["preference"], true).then(
                          () => {
                              if (r && Array.isArray(r) && r.length > 0) {
                                  for (const e of r)
                                      dataBaseInstance.dele(false, e);
                                  GM_setValue("removearticleB", "");
                              }
                              if (b && Array.isArray(b) && b.length > 0) {
                                  for (const e of b) dataBaseInstance.update(e);
                                  GM_setValue("blockarticleB", "");
                              }
                              monitor();
                              dataBaseInstance.close();
                          },
                          (err) => {
                              console.log(err);
                              dataBaseInstance.close();
                          }
                      )
                    : monitor();
            },
            creatAssistantEvent(node, mode) {
                const Button = (button, m) => {
                    if (m) {
                        if (!this.readerMode) return;
                        this.createFrame();
                        button.style.display = "none";
                        mode = false;
                    } else {
                        let text = "";
                        let style = "";
                        const column = document.getElementById("column_lists");
                        let i = 0;
                        let title = "";
                        if (this.readerMode) {
                            text = "Reader";
                            style = "none";
                            title = "enter";
                            if (column) column.style.display = style;
                            i = 1;
                            //show content;
                        } else {
                            style = "block";
                            text = "Exit";
                            title = "exit";
                            if (column) {
                                column.style.display = style;
                            } else {
                                //hide content
                                this.Tabs.check(this.columnID).then(
                                    (result) => !result && this.createFrame()
                                );
                            }
                            i = 2;
                        }
                        !this.modePrint && this.clearPage(i);
                        button.title = `${title} the reader mode`;
                        button.innerText = text;
                        this.readerMode = !this.readerMode;
                        GM_setValue("reader", this.readerMode);
                        mode &&
                            (button.previousElementSibling.style.display = style);
                    }
                };
                let i = node.children.length;
                //reder
                node.children[--i].onclick = function () {
                    Button(this, false);
                };
                //menu
                if (mode) {
                    node.children[--i].onclick = function () {
                        Button(this, true);
                    };
                }
                //collection
                let cReady = false;
                const collectionClick = (button) => {
                    if (cReady) return;
                    cReady = true;
                    dataBaseInstance.initial(["collection"], true).then(
                        (result) => {
                            const text = button.innerText;
                            let s = "",
                                t = "";
                            if (text === "Remove") {
                                s = "Collect";
                                t = "add this article to collection list";
                                dataBaseInstance.dele(true);
                                this.columnsModule.recentModule.remove();
                            } else {
                                s = "Remove";
                                t = "remove this article frome collection list";
                                dataBaseInstance.additem(this.columnID);
                                this.columnsModule.recentModule.log("c");
                            }
                            button.innerText = s;
                            button.title = t;
                            dataBaseInstance.close();
                            cReady = false;
                        },
                        (err) => {
                            cReady = false;
                            console.log(err);
                            dataBaseInstance.close();
                        }
                    );
                };
                node.children[--i].onclick = function () {
                    collectionClick(this);
                };
                //pref
                const cm = (mode) => {
                    const bid = location.pathname.slice(3);
                    if (mode) {
                        let b = GM_getValue("blockarticleA");
                        if (b && Array.isArray(b)) {
                            for (const e of b) if (e.name === bid) return;
                        } else b = [];
                        const r = GM_getValue("removearticleA");
                        if (r && Array.isArray(r)) {
                            const i = r.indexOf(bid);
                            if (i > -1) {
                                r.splice(i, 1);
                                GM_setValue("removearticleA", r);
                            }
                        }
                        const info = {};
                        info.name = bid;
                        info.type = "article";
                        info.from = this.columnID;
                        info.update = Date.now();
                        info.userID = this.authorID;
                        info.userName = this.authorName;
                        b.push(info);
                        GM_setValue("blockarticleA", b);
                    } else {
                        let r = GM_getValue("removearticleA");
                        if (r && Array.isArray(r) && r.length > 0) {
                            if (r.includes(bid)) return;
                        } else r = [];
                        const b = GM_getValue("blockarticleA");
                        if (b && Array.isArray(b)) {
                            const i = b.findIndex((e) => e.name === bid);
                            if (i > -1) {
                                b.splice(i, 1);
                                GM_setValue("blockarticleA", b);
                            }
                        }
                        r.push(bid);
                        GM_setValue("removearticleA", r);
                    }
                };
                let pReady = false;
                const prefclick = (button, other, mode) => {
                    if (pReady) return;
                    pReady = true;
                    dataBaseInstance.initial(["preference"], true).then(
                        (result) => {
                            let title = "";
                            let f = false;
                            let cl = false;
                            if (other.style.display === "none") {
                                dataBaseInstance.dele(false);
                                title = `${
                                    mode ? "like" : "dislike"
                                } this article`;
                                other.style.display = "block";
                                cl = mode;
                            } else {
                                const info = {};
                                info.pid = dataBaseInstance.pid;
                                info.update = Date.now();
                                info.userID = this.authorID;
                                info.from = this.columnID;
                                info.value = mode ? 1 : 0;
                                dataBaseInstance.update(info);
                                title = `cancel ${
                                    mode ? "like" : "dislike"
                                } this article`;
                                other.style.display = "none";
                                f = !mode;
                            }
                            button.title = title;
                            dataBaseInstance.close();
                            !cl && cm(f);
                            pReady = false;
                        },
                        (err) => {
                            pReady = false;
                            console.log(err);
                            dataBaseInstance.close();
                        }
                    );
                };
                node.children[--i].onclick = (e) => {
                    const target = e.target;
                    const className = target.className;
                    if (className === "like")
                        prefclick(target, target.nextElementSibling, true);
                    else if (className === "dislike")
                        prefclick(target, target.previousElementSibling, false);
                };
            },
            recordID: null,
            dataRecord() {
                this.recordID && clearTimeout(this.recordID);
                this.recordID = setTimeout(() => {
                    this.recordID = null;
                    const pid = dataBaseInstance.pid;
                    dataBaseInstance.initial(["collection"], true).then(
                        (result) => {
                            result === 1 && dataBaseInstance.updateRecord(pid);
                            dataBaseInstance.close();
                        },
                        () => console.log("open database fail")
                    );
                    if (this.columnID) {
                        const f = GM_getValue("follow");
                        if (f && Array.isArray(f) && f.length > 0) {
                            for (const e of f) {
                                if (e.columnID === this.columnID) {
                                    e.visitTime = Date.now();
                                    let times = e.visitTimes;
                                    e.visitTimes = times ? ++times : 2;
                                    GM_setValue("follow", f);
                                    break;
                                }
                            }
                        }
                    }
                }, 15000);
            },
            reInject() {
                let assist = document.getElementById("assist-button-container");
                if (assist) {
                    assist.remove();
                    assist = null;
                }
                this.injectButton();
            },
            injectButton(mode) {
                const name = this.readerMode ? "Exit" : "Reader";
                const mbutton =
                    '<button class="assist-button siderbar" style="color: black;" title="show the siderbar">Menu</button>';
                createButton(
                    name,
                    (this.readerMode ? "exit " : "enter ") + "the reader mode",
                    mode ? mbutton : "",
                    "right"
                );
                this.assistNewModule
                    .main()
                    .then(
                        (node) => node && this.creatAssistantEvent(node, mode)
                    );
                this.dataRecord();
            },
            readerMode: false,
            createFrame() {
                if (this.columnID) {
                    this.Framework();
                    //const pinURL = `https://www.zhihu.com/api/v4/columns/${this.columnID}/pinned-items`;
                    const url = `https://www.zhihu.com/api/v4/columns/${this.columnID}/items`;
                    this.requestData(url);
                    this.Tabs.save(this.columnID);
                }
            },
            columnID: null,
            columnName: null,
            main(mode = 0) {
                if (mode > 0) {
                    window.onload = () => {
                        const f = this.homePage.initial;
                        if (f) {
                            this.columnID = this.homePage.ColumnID;
                            this.columnName = "Follow";
                            this.Framework();
                            Reflect.apply(this.homePage.add, this, [
                                f,
                                "f",
                                false,
                            ]);
                        }
                        mode === 2 && this.subscribeOrfollow();
                    };
                    return false;
                }
                if (this.ColumnDetail) {
                    if (this.readerMode)
                        this.Tabs.check(this.columnID).then((result) =>
                            result
                                ? this.injectButton(true)
                                : (this.createFrame(), this.injectButton())
                        );
                    else this.injectButton();
                } else {
                    this.injectButton();
                }
                setTimeout(() => this.communication(), 5000);
            },
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
                    this.grad < 0 && (this.grad *= -1);
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
            nodeCount: 0,
            getItem(node) {
                //those tags will be ignored
                const localName = node.localName;
                const tags = ["a", "br", "b", "span", "code", "strong", "u"];
                if (localName && tags.includes(localName)) {
                    this.arr.push(node.outerHTML);
                    this.nodeCount += 1;
                    return;
                } else {
                    const className = node.className;
                    if (className && className === "UserLink") {
                        this.arr.push(node.outerHTML);
                        this.nodeCount += 1;
                        return;
                    }
                }
                if (node.childNodes.length === 0) {
                    const text = node.nodeValue;
                    text && this.textDetach(text);
                } else {
                    //this is a trick, no traversal of textnode, maybe some nodes will lost content, take care
                    for (const item of node.childNodes) this.getItem(item);
                    this.arr.length > 0 &&
                        node.childNodes.length - this.nodeCount <
                            this.nodeCount + 2 &&
                        (node.innerHTML = this.arr.join(""));
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
            rightClickCopyCode: {
                checkCodeZone(target) {
                    if (target.className === "highlight") {
                        return target;
                    }
                    let p = target.parentNode;
                    let className = p.className;
                    let i = 0;
                    while (className !== "highlight") {
                        p = p.parentNode;
                        if (!p || i > 2) return null;
                        className = p.className;
                        i++;
                    }
                    return p;
                },
                main(node) {
                    node.oncontextmenu = (e) => {
                        if (e.button !== 2 || !e.ctrlKey) return;
                        const code = this.checkCodeZone(e.target);
                        if (code) {
                            e.preventDefault();
                            zhihu.clipboardClear.clear(code.innerText);
                            Notification(
                                "this code has been copied to clipboard",
                                "clipboard"
                            );
                        }
                    };
                },
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
                let code = false;
                const tips = "Ctrl + Right mouse button to copy this code";
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
                        if (node.className === "highlight") {
                            this.codeHightlight(node);
                            node.title = tips;
                            code = true;
                        }
                        continue;
                    }
                    this.arr = [];
                    this.nodeCount = 0;
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
                code && this.rightClickCopyCode.main(holder);
                this.arr = null;
            },
        },
        userPage: {
            username: null,
            changeTitle(mode) {
                const title = document.getElementsByClassName(
                    "ProfileHeader-contentHead"
                );
                if (title.length === 0) return;
                title[0].style.textDecoration =
                    mode === "Block" ? "none" : "line-through";
            },
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
                createButton(name, name + " this user");
                let assist = document.getElementById("assist-button-container");
                assist.children[1].onclick = (e) => {
                    const button = e.target;
                    const n = button.innerText;
                    this.userManage(n);
                    button.innerText = n === "Block" ? "unBlock" : "Block";
                    this.changeTitle(button.innerText);
                    this.title = button.innerText + " this user";
                };
                assist = null;
                name === "unBlock" && this.changeTitle(name);
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
        QASkeyBoardEvent() {
            document.onkeydown = (e) => {
                if (e.ctrlKey || e.altKey || e.shiftKey) return;
                if (e.target.localName === "input") return;
                const className = e.target.className;
                if (className && className.includes("DraftEditor")) return;
                const keyCode = e.keyCode;
                keyCode === 192
                    ? this.autoScroll.start()
                    : keyCode === 187
                    ? this.autoScroll.speedUP()
                    : keyCode === 189
                    ? this.autoScroll.slowDown()
                    : null;
            };
        },
        pageOfQA(index, href) {
            //inject as soon as possible; may be need to concern about some eventlisteners and MO
            this.inputBox.controlEventListener();
            this.addStyle(index);
            index < 2 && this.antiLogin();
            this.clearStorage();
            window.onload = () => {
                if (index !== 8) {
                    this.getData();
                    this.blackUserMonitor(index);
                    (index < 4
                        ? !(index === 1 && href.endsWith("/waiting"))
                        : false) &&
                        setTimeout(() => {
                            this.Filter.main(index);
                            this.QASkeyBoardEvent();
                        }, 100);
                    (index === 6 || index === 7) && this.userPage.main();
                }
                this.inputBox.monitor();
                if (index < 2) {
                    document.documentElement.style.overflow = "auto";
                    setTimeout(() => (this.hasLogin = true), 3000);
                }
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
                "/org/",
                "/www",
            ];
            const href = location.href;
            const index = pos.findIndex((e) => href.includes(e));
            let w = true;
            let z = false;
            let f = true;
            (
                (z = index === 5)
                    ? href.endsWith("zhihu.com/")
                        ? (f = this.Column.main(1))
                        : (w = !href.includes("/write"))
                    : index === 4
                    ? true
                    : false
            )
                ? this.zhuanlanStyle(z && href.includes("/p/"))
                : index < 0
                ? null
                : f && this.pageOfQA(index, href);
            w && this.antiRedirect();
            this.shade.start();
            this.clipboardClear.event();
            installTips();
        },
    };
    zhihu.start();
})();
