# NodeJS使用手册

## Node环境

![node](https://p0.meituan.net/dpplatform/52e4924c2169cdd69a3c4027ecde965e8335.png)

## [npm](https://www.npmjs.com.cn/)

包管理工具

```bash
-- 正常的安装包方式
npm install <package_name>

-- 全局安装
npm install -g <package_name>

-- 查看全局安装的包
npm ls -g

-- 卸载全局安装的包
npm uninstall -g <package>

-- 查看包的安装
npm list <package>

// 查看当前包镜像源
npm config get registry

// 切换为淘宝源
npm config set registry=https://registry.npm.taobao.org/

// 检查是否成功
npm config get registry
```

## 解决node环境下SyntaxError: Cannot use import statement outside a module的问题

参考[CSDN](https://blog.csdn.net/sinat_36521655/article/details/109863364)文章的解决方法

### 问题

今天刷[leetcode](https://so.csdn.net/so/search?q=leetcode&spm=1001.2101.3001.7020)的时候，发现有些函数老是重复书写，于是单独写了一个uitls.js模块，通过import的方式导入，没想到居然报错了。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201120201457249.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3NpbmF0XzM2NTIxNjU1,size_16,color_FFFFFF,t_70#pic_center)

### 解决方案

错误警告其实已经给出了解决方案，在package.json文件中设置`"type": "module"`。

所以执行一下下面的命令，默认所有配置为‘y’，从而快速生成package.json，然后修改文件即可。

[命令行](https://www.cnblogs.com/WD-NewDemo/p/11141384.html)的作用,  生成初始化配置文件

```
npm init -y
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201120202345826.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3NpbmF0XzM2NTIxNjU1,size_16,color_FFFFFF,t_70#pic_center)

```json
{
  "name": "leetcode",
  "version": "1.0.0",
  "description": "",
  "main": "107. 二叉树的层次遍历 II.js",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

最后执行文件，果然就可以了，不过也还有一个warning，这是啥子实验性的东西？？
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201120202618450.png#pic_center)

### 问题原因

[node](https://so.csdn.net/so/search?q=node&spm=1001.2101.3001.7020)早先只支持CommonJS的模块化方案，所以ES6的模块化特性用不了。但是在Node V13.2.0之后开始实验性的支持ESM模块化，不过需要创建package.json文件指明type类型为module。
