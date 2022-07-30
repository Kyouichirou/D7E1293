# JavaScript元编程示例-以qq.com beacon拦截为示例

[元编程(meta programming)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Meta_programming) 

>  是一种编程技术，编写出来的计算机程序能够将其他程序作为数据来处理。意味着可以编写出这样的程序：它能够读取、生成、分析或者转换其它程序，甚至在运行时修改程序自身。

简而言之, 就是在代码层, 对代码进行二度的**控制**, 修改.

元编程不仅在代码优化有非常重要的应用, 更重要的是依赖Tampermonkey可以对很多网站页面进行掌控(反制站点的反广告, 强制会员登录, 反复制, 扫描关注公众号, 弹窗, 反调试等等).

*注: 某些站点为了规避广告拦截, 使用动态元素ID, 使得ublock origin无法通过元素过滤*

JavaScript实现元编程主要依赖于:

- [Object](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)

## 脚本实现的功能

[Greasyfork](https://greasyfork.org/zh-CN/scripts/435528-disable-qq-com-beacon)

有很长一段时间, qq.com下的系列站点对广告拦截进行对抗, 假如用户启用广告拦截, 对某些脚本进行拦截, 脚本将在后台触发报错机制, 不停的报错, 导致CPU一直处于高负载运转的状态.

这个脚本的目的在于控制这种**恶意**的行为.

*现在这种情况qq.com已经主动解决这个问题了*

## 代码解析

- ### Object

```javascript
const trap = (v) => {
    Object.defineProperties(v.prototype, {
        fail: {
            value: () => {
                throw new Error("fuck tencent");
            },
        },
        action: {
            value: () => null,
        },
        check: {
            value: () => null,
        },
    });
};
let o = null;
Object.defineProperty(window, "Beacon", {
    set(a) {
        o = a;
        trap(a);
    },
    get() {
        return o;
    },
});
```

这里使用的[Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty), 目的在于捕获原代码在执行对window对象的"Beacon"进行的赋值.

对捕获的func的prototype下的若干个func进行干预, 改变其原来的作用, 达到控制原代码执行的目的.

![prototype](https://images0.cnblogs.com/blog2015/683809/201508/201728184569708.jpg)

- ### Proxy & Reflect

在ES6+中引入的Proxy和Reflect, 大大增强了对于元编程的能力, 使之实现的方法变得更为简单易用, 和Reflect的搭配使用, 形成一个控制的闭环

```javascript
document.createElement = new Proxy(document.createElement, {
    apply(...args) {
        const node = Reflect.apply(...args);
        if (args.length === 3 && args[2][0] === "img")
            Object.defineProperty(node, "src", { set(v) {} });
        return node;
    },
});
window.Image = new Proxy(window.Image, {
    construct(target, args) {
        let img = new target(...args);
        if (args.length === 2 && args[1] === 1 && args[0] === 1)
            Object.defineProperty(img, "src", { set(v) {} });
        return img;
    },
});
```

qq.com为了实现页面用户点击的追踪, 会生成大量的像素点的小图片(不可见), 这些小图片的加载URL会被ublock origin拦截, 这也是报错的一个主要来源.

在分析代码后发现这些小图片是通过new Image和document.createElement的方式生成的.

故此通过拦截Image的原型构造和document.createElement, 来阻止图片的生成.

```javascript
window.setInterval = new Proxy(window.setInterval, {
    apply(...args) {
        if (args.length === 3) args[2][1] = 10000000;
        Reflect.apply(...args);
    },
});
```

*注: "....", 解包符*

在某些页面会循环执行某些非必要的动作, 依赖于window.setInterval来实现(拦截setInterval是对付很多反广告站点的重要手段), 这里的拦截很简单, 就是将等待的时间设置到无限长即可(即该动作是不可能执行)

Reflect.apply等价于传统的写法

```javascript
apply(taget, thisarg, args) {
    return target.apply(thisarg, args)
}
```

- ### 数据请求拦截

```javascript
anti_fecth() {
    const fetch = window.fetch;
    window.fetch = (...args) =>
    (async (args) => {
        const url = args[0];
        const ad_list = ["trace", "beacon"];
        if (ad_list.some((e) => url.includes(e)))
            throw new SyntaxError("fuck tencent");
        else return await fetch(...args);
    })(args);
},
anti_xmlHTTP() {
    window.XMLHttpRequest = class extends window.XMLHttpRequest {
        open(...args) {
            const url = args[1];
            const ad_list = ["trace", "beacon"];
            if (ad_list.some((e) => url.includes(e)))
                throw new SyntaxError("fuck tencent");
            else return super.open(...args);
        }
    };
},
```

对于大部分的网页而言, 多采用异步的方式动态加载数据, 传统的方式为: XMLHttpRequest, 现在逐步向fetch迁移(fetch现在很多功能还不是很完善), 通过对这两种请求数据方式进行改写.

对XMLHttpRequest的open方法, 采用的方式为对class进行改写, [class extends](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/extends).



