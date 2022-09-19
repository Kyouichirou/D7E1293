/*
    在CryptJs中, 其秘钥的处理: CryptoJS.enc.Utf8.parse(key), 得到的是WordArray类型的数据
    这里将其复原为对应的字符串
*/

// WordArray转为Uint8Array
const CryptJsWordArrayToString = (wordArray) => {
    const w_slen = wordArray.sigBytes;
    const words = wordArray.words;
    const result = new Uint8Array(w_slen);
    // dst
    let i = 0;
    // src
    let j = 0;
    while (true) {
        // here i is a multiple of 4
        if (i === w_slen)
            break;
        const w = words[j++];
        result[i++] = (w & 0xff000000) >>> 24;
        if (i === w_slen)
            break;
        result[i++] = (w & 0x00ff0000) >>> 16;
        if (i === w_slen)
            break;
        result[i++] = (w & 0x0000ff00) >>> 8;
        if (i === w_slen)
            break;
        result[i++] = w & 0x000000ff;
    }
    return Uint8ArrayToString(result);
};
// Uint8Array转为字符串
const Uint8ArrayToString = (arr) => {
    let tmp_str = "";
    for (let i = 0; i < arr.length; i++) tmp_str += String.fromCharCode(arr[i]);
    return tmp_str;
};

console.log(CryptJsWordArrayToString({ words: [ 1633837824 ], sigBytes: 3 }));