# page-hook-generator
通用解析算法，可识别任意新闻站点的页面结构，识别出标题和内容区域块

# How to test
```bash
npm run test
```

# How to install
```
npm install page-hook-generator
```

# How to use
```javascript
var generator = require('page-hook-generator');
var request = require('request');

request({
	url: 'http://tech.hexun.com/2016-12-06/187208491.html',
	method: 'GET'
}, function(err, response, str) {
    if (!err && response.statusCode === 200) {
        let info = generator(str);
        
        console.log('the title selector is', info.title);
        console.log('the content selector is', info.content);
        console.log('the page created time is', info.date);
    }
})

```