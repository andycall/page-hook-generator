/**
 * @file 工具函数
 */

let isString = require('lodash.isstring');
let isArray = require('lodash.isarray');
let each = require('lodash.foreach');
let Levenshtein = require('levenshtein');

class GeneratorUtil {
    constructor(options) {
        this.$ = options.$;
        this.hasDisplayNone = /\s?display\s?:\s?none\s?;?|visibility\s?:\s?hidden\s?;?/;
        this.isValidBlock = /^(body|div|section|h[1-5]|p|span|br|input|strong|img|em|i|b|font|article|header)$/;
        this.notDeepThroughBlock = /^(ul|li|ol|form)$/
        this.dateReg = /(20\d{2})\s{0,2}[-/\u5e74]\s{0,2}(\d{1,2})\s{0,2}[-/\u6708]\s{0,2}?(\d{1,2})\s{0,2}\u65e5?(?:\s{0,3}(\d{1,2})\s{0,2}(?:[:\u65f6]\s{0,2}(\d{1,2})\s{0,2}(?:[:\u5206]\s{0,2}(\d{1,2})\s{0,2}\u79d2?)?)?)?/
    }

    getSimilarOfTwoString(preString, nextString) {
        let leven = new Levenshtein(preString, nextString);

        let distance = leven.distance;

        let totalLength = preString.length + nextString.length;

        return distance / totalLength;
    }

    getTitleClassName(className, unique = true) {
        let $ = this.$;

        let classNames = className.split(' ');

        classNames = classNames.filter(item => {
            if (!item) {
                return false;
            }

            return unique ? $('.' + item).length === 1 : true;
        });

        return classNames;
    }

    getNodeSelector(node, unique = true) {
        let selector = '';

        if (node.attribs.id) {
            selector = `#${node.attribs.id}`
        } else if (node.attribs.class) {
            let uniqueClass = this.getTitleClassName(node.attribs.class, unique);

            if (isString(uniqueClass)) {
                selector = `.${uniqueClass}`;
            } else if (isArray(uniqueClass) && uniqueClass.length > 0) {
                selector = `.${uniqueClass[0]}`;
            }
        }


        return selector;
    }

    getNodeDriver(node) {
        let $ = this.$;
        let nodeTagName = node.name;
        let nodeParent = node.parent;
        let selector = this.getNodeSelector(node);
        let rawSelector = this.getNodeSelector(node, false);
        let selectorPath = [];

        while (!selector && nodeParent) {
            if (nodeParent.attribs.id) {
                selector = `#${nodeParent.attribs.id} ${selectorPath.join(' ')} ${nodeTagName}`
            }

            if (nodeParent.attribs.class) {
                let uniqueClass = this.getTitleClassName(nodeParent.attribs.class);

                if (isString(uniqueClass)) {
                    selector = `.${uniqueClass} ${selectorPath.join(' ')} ${nodeTagName}${rawSelector}`
                } else if (isArray(uniqueClass) && uniqueClass.length > 0) {
                    selector = `.${uniqueClass[0]} ${selectorPath.join(' ')} ${nodeTagName}${rawSelector}`
                }
            }

            selectorPath.unshift(nodeParent.name);

            nodeParent = nodeParent.parent;
        }

        return selector;
    }

    getTextElement(root, options = {}) {
        let textElements = [];
        let self = this;
        let toStr = options.toStr || false;

        function find(root) {
            let nodeType = root.type;
            let nodeName = root.name;

            if (nodeType === 'tag') {
                if (self.notDeepThroughBlock.test(nodeName)) {
                    return;
                }

                if (self.hasDisplayNone.test(root.attribs.style)) {
                    return;
                }

                if (root.children && root.children.length > 0) {
                    each(root.children, find);
                }
            } else if (nodeType === 'text') {
                let data = root.data.replace(/\s+/g, '');

                if (data.length > 0) {
                    if (toStr) {
                        textElements.push(data);
                    } else {
                        textElements.push(root);
                    }
                }
            }
        }

        find(root);

        return textElements;
    }
}

module.exports = GeneratorUtil;