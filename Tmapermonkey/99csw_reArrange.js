/*
99藏书网内容重排
直接请求获取的内容是乱序的, 需要经过重排修正
*/
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
        let j = 0,
            arr = [];
        code.forEach((e, i) => {
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
            else if (lname === "div") break;
            i++;
        }
        return k;
    },
    init(dom) {
        const chs = dom.getElementById("content").children;
        return this.get_text(this.load(dom, chs, this.get_start(chs)));
    },
    get_text(arr) {
        let text = "";
        for (const node of arr) {
            if (node.nodeType !== 1) continue;
            const cs = node.childNodes;
            for (const c of cs) c.nodeType === 3 && (text += c.textContent);
            text += "\n";
        }
        this.childNode = null;
        return text;
    },
};
