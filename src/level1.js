/**
 * @file HTML 结构一级识别算法
 * 主要通过<title>和文章内容进行匹配，找出相似度最高的段落
 */

let each = require('lodash.forEach');
let GeneratorUtil = require('./util');
let plusElement = /^(h[1-5])$/;


class Level1 extends GeneratorUtil {
    constructor(options) {
        super(options);

        this.body = options.$('body')[0] || options.$('html')[0];
        this.docTitle = options.$('title').text().trim();
        this.date = null
    }

    validateTitle(searchedTitle, docTitle) {
        return this.getSimilarOfTwoString(searchedTitle, docTitle);
    }

    searchDateFromTitleNearBy(titleElement) {
        let dateString = null;

        while (!dateString && titleElement) {
            let text = this.$(titleElement).text();

            if (this.dateReg.test(text)) {
                let pattern = this.dateReg.exec(text);
                let year = pattern[1];
                let month = pattern[2];
                let day = pattern[3];
                let hour = pattern[4];
                let minute = pattern[5];
                let second = pattern[6];

                dateString = `${year}-${month}-${day}`;

                if (hour) {
                    dateString += ` ${hour}`
                }

                if (minute) {
                    dateString += `:${minute}`
                }

                if (second) {
                    dateString += `:${second}`
                }
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

            let percentage = self.validateTitle(elementText, docTitle);

            if (plusElement.test(nodeParentName)) {
                // 优先找出那些h[1-3]标签
                percentage -= 0.3;
            }

            if (percentage < minimum) {
                minimum = percentage;

                titleElement = ele;
                titleSelector = self.getNodeDriver(ele.parent);
            }
        });

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