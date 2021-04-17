password: 
```javascript
md5(filename.slice(filename.indexOf('_') + 1, filename.lastIndexOf('.'))).toLowerCase(), 32
```
