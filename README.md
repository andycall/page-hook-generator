# page-hook-generator
通用解析算法，可识别任意新闻站点的页面结构，识别出标题和内容区域块

## How it work
此插件仅支持分析新闻类网站。

新闻类网站的生成通常都是通过后台的富文本编辑器生成
但是不同的富文本编辑器之间都有一个相同的特性 ---- 生成的HTML结构平整，嵌套结构层级简单，同时一个新闻最重要的是： 文字多。

## try by yourself

[page-hook-generator-plugin](./demo/page-hook-generator.crx) 

去百度feed上随便找个新闻 https://www.baidu.com/

点下这个按钮 ![button](./demo/icon.png)

然后就能得到结果：
![screenshot](./demo/screenshot.png)

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