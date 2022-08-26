(() => {
    "use strict";
    /*
        @author: hla
        @version: 1.0
        @update: 2022-08-26
        @description: tampermonkey跨域请求组件, 支持GET, POST; 返回文本 or dom object or json.
    */
    const xmlHTTPRequest = {
        // 访问次数
        total_visited_time: 0,
        // 是否缓存上次访问过的链接
        is_cached_visited: false,
        // 已访问列表
        visited_cache: [],
        // 是否缓存上次访问的结果
        is_cache_last: null,
        // 上次访问缓存
        last_cache: null,
        pop_visited_url(url) {
            this.visited_cache = this.visited_cache.filter((e) => e !== url);
        },
        // 检查是否曾今访问过
        _check_visited_url(url) {
            return this.is_cached_visited && this.visited_cache.includes(url);
        },
        // 将数据转为dom
        _html2dom: (html) => new DOMParser().parseFromString(html, "text/html"),
        _request(configs, url, result_type) {
            console.log(
                `${configs["method"]}(${++this.total_visited_time}): + ${url}`
            );
            return new Promise((resolve, reject) => {
                if (this._check_visited_url(url)) {
                    reject("visited error");
                    return;
                }
                GM_xmlhttpRequest({
                    ...configs,
                    onload: (response) => {
                        const code = response.status;
                        if (code === 200) {
                            const tmp = response.response;
                            try {
                                const ret =
                                    result_type === "dom"
                                        ? this._html2dom(tmp)
                                        : result_type === "json"
                                        ? JSON.parse(tmp)
                                        : tmp;
                                this.last_cache = this.is_cache_last
                                    ? ret
                                    : null;
                                if (this.is_cached_visited)
                                    this.visited_cache.push(url);
                                resolve(ret);
                            } catch (error) {
                                console.log(
                                    `data convert to ${result_type} error`
                                );
                                reject("convert error");
                            }
                        } else {
                            console.log(`err: code ${code}`);
                            reject(`request data error: ${code}`);
                        }
                    },
                    onerror: (e) => {
                        console.log(e);
                        reject("something error");
                    },
                    ontimeout: () => {
                        console.log("timeout error: " + url);
                        reject("timeout error");
                    },
                });
            });
        },
        download_as_text(filename, text) {
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
        },
        POST(url, data, time = 60000, result_type = "html") {
            const configs = {
                method: "POST",
                url: url,
                timeout: time,
                data: data,
                headers: {
                    "content-type":
                        "application/x-www-form-urlencoded;charset=UTF-8",
                },
            };
            return this._request(configs, url, result_type);
        },
        GET(url, time = 180000, result_type = "html") {
            const configs = {
                method: "GET",
                url: url,
                timeout: time,
            };
            return this._request(configs, url, result_type);
        },
    };
})();
