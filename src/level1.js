/**
 * @file HTML 结构一级识别算法
 * 主要通过<title>和文章内容进行匹配，找出相似度最高的段落
 */

let each = require('lodash.foreach');
let GeneratorUtil = require('./util');
let plusElement = /^(h[1-5])$/;


class Level1 extends GeneratorUtil {
    constructor(options) {
        super(options);

        this.body = options.$('body')[0] || options.$('html')[0];
        this.docTitle = options.$('title').text().trim();
        this.titleSplit = /\||-|@/;
        this.date = null
    }

    validateTitle(searchedTitle, docTitle) {
        return this.getSimilarOfTwoString(searchedTitle, docTitle);
    }

    normalizeTime (date) {
        date = parseInt(date);

        if (!date) {
            return '00'
        }

        if (date < 10) {
            return `0${date}`
        }

        return date;
    }

    searchDateFromTitleNearBy(titleElement) {
        let dateString = null;

        while (!dateString && titleElement) {
            let text = this.$(titleElement).text();

            if (this.dateReg.test(text)) {
                let pattern = this.dateReg.exec(text);
                let year = this.normalizeTime(pattern[1]);
                let month = this.normalizeTime(pattern[2]);
                let day = this.normalizeTime(pattern[3]);
                let hour = this.normalizeTime(pattern[4]);
                let minute = this.normalizeTime(pattern[5]);
                let second = this.normalizeTime(pattern[6]);



                dateString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            }

            titleElement = titleElement.parent;
        }

        this.date = dateString;
    }

    searchForTitle() {
        let body = this.body;
        let allElements = this.getTextElement(body);
        let docTitle = this.docTitle;
        let titleElement = null;
        let titleSelector = null;
        let minimum = 1;
        let self = this;

        each(allElements, ele => {
            let nodeParentName = ele.parent.name;
            let elementText = ele.data.trim();
            let percentage = null;

            if (this.titleSplit.test(docTitle)) {
                let titleChunk = docTitle.split(this.titleSplit);

                percentage = titleChunk.reduce((total, next, index) => {
                    let chunk = titleChunk[index];
                    let per = this.validateTitle(elementText, chunk);

                    return total + per / (index + 1);
                }, 0);
            }
            else {
                percentage = self.validateTitle(elementText, docTitle);
            }

            if (plusElement.test(nodeParentName)) {
                // 优先找出那些h[1-3]标签
                percentage -= 0.3;
            }

            if (percentage < minimum) {
                minimum = percentage;

                titleElement = ele;
            }
        });

        titleSelector = self.getNodeDriver(titleElement.parent);

        this.searchDateFromTitleNearBy(titleElement);

        return titleSelector;
    }
}

module.exports = function($) {
    let level1 = new Level1({
        $: $
    });

    let title = level1.searchForTitle();
    let date = level1.date;

    return {
        title: title,
        date: date
    }
};