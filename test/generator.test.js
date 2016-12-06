let assert = require('assert');
let request = require('request');
let Promise = require('bluebird');
let level1 = require('../src/level1');
let level2 = require('../src/level2');
let iconv = require('iconv-lite');
let jsdom = require('jsdom');
let cheerio = require('cheerio');
let _jsdom = jsdom.jsdom;
let testSite = require('./testCase');
let os = require('os');

let osType = os.type();
let detectCharacterEncoding;

if (osType != 'Windows_NT') {
    detectCharacterEncoding = require('detect-character-encoding');
}

function getPageContent(item) {
    return new Promise((resolve, reject) => {
        request({
            url: item.url,
            method: 'GET',
            encoding: null
        }, function(err, response, data) {
            if (!err && response.statusCode === 200) {
                if (detectCharacterEncoding) {
                    let encoding = detectCharacterEncoding(data).encoding;

                    if (encoding != 'UTF-8') {
                        data = iconv.decode(data, encoding);
                    } else {
                        data = data.toString();
                    }
                }
                else {
                    date = date.toString();
                }

                if (item.parseJS) {
                    let document = _jsdom(data, {
                        url: item.url,
                        features: {
                            FetchExternalResources: ['script'],
                            ProcessExternalResources: ['script'],
                            SkipExternalResources: false
                        },
                        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
                    });

                    document.addEventListener('load', () => {
                        setTimeout(() => {
                            item.html = document.documentElement.innerHTML;
                            resolve(item);
                        }, 1000 * 2);
                    });
                } else {
                    item.html = data;
                    resolve(item);
                }
            } else {
                reject(err);
            }

        });
    });
}

describe('Auto Get Title Hook', () => {
    testSite.forEach(item => {
        it(`get ${item.url} title`, (done) => {
            console.log(item.url);
            getPageContent(item).then((result) => {
                return Promise.try(() => {
                    let $ = cheerio.load(result.html, {
                        decodeEntities: false,
                        normalizeWhitespace: true
                    });

                    let level1Result = level1($);
                    let contentSelector = level2($);
                    let titleSelector = level1Result.title;
                    let date = level1Result.date;

                    // level3($, title, content);
                    assert.equal(titleSelector, result.title);
                    assert.equal(contentSelector, result.content);
                }).then(() => {
                    done();
                }).catch(err => {
                    done(err);
                })
            }).catch(err => {
                done(err);
            })
        });
    });
});