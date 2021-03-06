let assert = require('assert');
let request = require('request');
let Promise = require('bluebird');
let generator = require('../index');
let iconv = require('iconv-lite');
let jsdom = require('jsdom');
let cheerio = require('cheerio');
let _jsdom = jsdom.jsdom;
let testSite = require('./testCase');
let devSite = require('./devCase');
let os = require('os');
let osType = os.type();
let detectCharacterEncoding;

let args = process.argv.slice(2);

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
                    data = data.toString();
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
    if (process.env.DEBUG === 'dev') {
        testSite = devSite;
    }
    else if (process.env.DEBUG === 'release') {
        testSite = devSite.concat(testSite);
    }

    testSite.forEach(item => {
        it(`get ${item.url} title`, (done) => {
            getPageContent(item).then((result) => {
                return Promise.try(() => {
                    let scanResult = generator(result.html);

                    assert.equal(result.title, scanResult.title);
                    assert.equal(result.content, scanResult.content);
                    // assert.equal(result.date, scanResult.date);
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