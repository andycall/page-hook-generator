/**
 * @file Level2 content 内容区域分析
 * 找出content内部的父级，确定content内容的位置
 */

let each = require('lodash.foreach');
let filter = require('lodash.filter');
let map = require('lodash.map');
let sortBy = require('lodash.sortby');
let noSearchElement = /^(li|ul|ol|a)$/i;
let GeneratorUtil = require('./util');

function covertObjectToCollection(object) {
    let result = [];
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            result.push({
                key: key,
                value: object[key]
            });
        }
    }

    return result;
}

function getCommonParent(elements) {
    let parents = [];

    elements.forEach(element => {
        let parent = element.element.parent;

        if (!parents.includes(parent)) {
            parents.push(parent);
        }
    });

    return parents;
}

class Level2 extends GeneratorUtil {
    constructor(options) {
        super(options);

        this.body = options.$('body')[0] || options.$('html')[0];
    }

    getNodeDepth(root) {
        let self = this;
        let treeInfo = {};
        let elementInfo = {};

        function find(root, depth) {
            let name = root.name;
            let attribs = root.attribs;

            if (!treeInfo[depth]) {
                treeInfo[depth] = [];
            }

            if (!elementInfo[name]) {
                elementInfo[name] = {}
            }

            if (!elementInfo[name][depth]) {
                elementInfo[name][depth] = 0;
            }

            elementInfo[name][depth]++;

            treeInfo[depth].push({
                name: name,
                attribs: attribs,
                element: root
            });

            if (root.children && root.children.length > 0) {
                root.children.forEach(child => {
                    if (child.type === 'tag') {
                        if (self.hasDisplayNone.test(child.attribs.style)) {
                            return;
                        }

                        if (noSearchElement.test(child.name)) {
                            return;
                        }

                        find(child, depth + 1);
                    }
                });
            }
        }

        find(root, 0);

        return {
            elementInfo: elementInfo,
            treeInfo: treeInfo
        };
    }

    findDepth(root, tagName, depth) {
        if (depth < 1) {
            return root;
        }

        let elements = [];

        function find(root, selector, depth) {
            let children = root.children;

            if (depth < 0) {
                return;
            }

            if (noSearchElement.test(root.name)) {
                return;
            }

            if (children && children.length > 0) {
                each(children, (item) => {
                    let name;

                    if (tagName === 'text') {
                        name = item.type;
                    }
                    else {
                        name = item.name;
                    }

                    if (name == tagName) {
                        elements.push(item);
                    }

                    if (!noSearchElement.test(tagName)) {
                        find(item, selector, depth - 1);
                    }
                });
            }
        }

        find(root, tagName, depth);

        return elements;
    }

    searchForParents(sortedInfo, treeInfo) {
        let self = this;
        return map(sortedInfo, info => {
            let floor = info.key;
            let count = info.value;

            let rawElement = filter(treeInfo[floor], treeNode => {
                return treeNode.name === 'p' || treeNode.name === 'br';
            });

            let commonParents = getCommonParent(rawElement);

            // 如果有不止一个父级，说明是分布在树的多个根节点下面，要分开对待
            commonParents = commonParents.map(element => {
                let textElement = self.findDepth(element, 'text', 1);
                let imgElement = self.findDepth(element, 'img', 3);

                element.texts = textElement;
                element.imgs = imgElement;

                return element;
            });

            return commonParents;
        });
    }

    filterNestedParent(rawParents) {
        let pureParents = [];
        let suspiciousParents = [];
        let $ = this.$;

        each(rawParents, group => {
            each(group, parent => {
                // 找到相互没有依赖的父级元素，但是可能会出现遗漏，
                // 这个主要看循环的顺序,但是顺序并不是决定因素
                if (!pureParents.includes(parent)) {
                    if (pureParents.every(item => {
                            return !$.contains(item, parent) && !$.contains(parent, item);
                        })) {
                        pureParents.push(parent);
                    }
                    // 找出那些因为顺序而误杀的父级
                    else if (pureParents.every(item => {
                            return !$.contains(item, parent);
                        })) {
                        suspiciousParents.push(parent);
                    }
                }
            });
        });

        // 找出最深的父级
        each(pureParents, (pure, pIndex) => {
            each(suspiciousParents, (sus, sIndex) => {
                if ($.contains(pure, sus)) {
                    pureParents[pIndex] = sus;
                }

                // 回滚一下suspiciousParents，
                // 只要sus里面不含有非法的标签就能死灰复燃
                if ($.contains(sus, pure)) {
                    let allSusElement = filter($(sus).find('*'), ele => ele.type === 'tag');

                    // allSusElement.forEach(ele => {
                    //     if (!this.isValidBlock.test(ele.name)) {
                    //         console.log(ele.name);
                    //     }
                    // });


                    if (allSusElement.every(ele => this.isValidBlock.test(ele.name))) {
                        pureParents[pIndex] = sus;
                    }
                }

            });
        });

        return pureParents;
    }

    findBestParents(rawParents) {
        let bestParent = null;
        let bestScore = 0;
        let $ = this.$;
        let self = this;

        let pureParents = this.filterNestedParent(rawParents);

        each(pureParents, parent => {
            if (self.hasDisplayNone.test(parent.attribs.style)) {
                return;
            }

            let textScore = parent.texts.reduce((total, element) => {
                let textLength = this.getTextElement(element, {
                    toStr: true
                }).join('').length * 0.01;
                return total + textLength;
            }, 0);
            let imgScore = parent.imgs.length * 2;
            let totalScore = textScore + imgScore;

            if (totalScore > bestScore) {
                bestParent = parent;
                bestScore = totalScore
            }
        });

        return bestParent;
    }

}

module.exports = function ($) {
    let level2 = new Level2({
        $: $
    });

    let body = level2.body;
    // 获取各个元素在不同深度的数量
    let {
        elementInfo,
        treeInfo
    } = level2.getNodeDepth(body);

    let pInfo = elementInfo.p;

    // 没有p标签的话，就没必要搜索了
    if (!pInfo) {
        return null;
    }

    pInfo = covertObjectToCollection(pInfo);

    let sortedInfo = sortBy(pInfo, o => {
        return 0 - o.value
    });

    let rawParents = level2.searchForParents(sortedInfo, treeInfo);
    let bestParent = level2.findBestParents(rawParents);

    if (!bestParent) {
        throw new Error('can not find parents');
    }

    return level2.getNodeDriver(bestParent);
};