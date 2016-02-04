"use strict";

var utils = exports;

/**
 * @returns {window}
 */
utils.getWindow = function () {
    return window;
};

/**
 * @returns {HTMLDocument}
 */
utils.getDocument = function () {
    return document;
};

/**
 * @returns {HTMLElement}
 */
utils.getBody = function () {
	return document.getElementsByTagName("body")[0];
};

/**
 * Get the current x/y position crossbow
 * @returns {{x: *, y: *}}
 */
utils.getBrowserScrollPosition = function () {

    var $window = exports.getWindow();
    var $document = exports.getDocument();
    var scrollX;
    var scrollY;
    var dElement = $document.documentElement;
    var dBody = $document.body;

    if ($window.pageYOffset !== undefined) {
        scrollX = $window.pageXOffset;
        scrollY = $window.pageYOffset;
    } else {
        scrollX = dElement.scrollLeft || dBody.scrollLeft || 0;
        scrollY = dElement.scrollTop || dBody.scrollTop || 0;
    }

    return {
        x: scrollX,
        y: scrollY
    };
};

/**
 * @returns {{x: number, y: number}}
 */
utils.getScrollSpace = function () {
    var $document = exports.getDocument();
    var dElement = $document.documentElement;
    var dBody = $document.body;
    return {
        x: dBody.scrollHeight - dElement.clientWidth,
        y: dBody.scrollHeight - dElement.clientHeight
    };
};

/**
 * Saves scroll position into cookies
 */
utils.saveScrollPosition = function () {
    var pos = utils.getBrowserScrollPosition();
    pos = [pos.x, pos.y];
    utils.getDocument.cookie = "bs_scroll_pos=" + pos.join(",");
};

/**
 * Restores scroll position from cookies
 */
utils.restoreScrollPosition = function () {
    var pos = utils.getDocument().cookie.replace(/(?:(?:^|.*;\s*)bs_scroll_pos\s*\=\s*([^;]*).*$)|^.*$/, "$1").split(",");
    utils.getWindow().scrollTo(pos[0], pos[1]);
};

/**
 * @param tagName
 * @param elem
 * @returns {*|number}
 */
utils.getElementIndex = function (tagName, elem) {
    var allElems = utils.getDocument().getElementsByTagName(tagName);
    return Array.prototype.indexOf.call(allElems, elem);
};

/**
 * Force Change event on radio & checkboxes (IE)
 */
utils.forceChange = function (elem) {
    elem.blur();
    elem.focus();
};

/**
 * @param elem
 * @returns xpath selector for the given element
 */
utils.getXpath = function(elem){
    /**
     * Gets an XPath for an element which describes its hierarchical location.
     */
    var getElementXPath = function(elem) {
            if (elem && elem.id) {
                return "//*[@id=\"" + elem.id + "\"]";
            } else {
                return getElementTreeXPath(elem);
            }
        },

        getElementTreeXPath = function(elem) {
            var paths = [];

            // Use nodeName (instead of localName) so namespace prefix is included (if any).
            for (; elem && elem.nodeType === 1; elem = elem.parentNode) {
                var index = 0;
                // EXTRA TEST FOR ID
                if (elem && elem.id) {
                    paths.splice(0, 0, "/*[@id=\"" + elem.id + "\"]");
                    break;
                }

                for (var sibling = elem.previousSibling; sibling; sibling = sibling.previousSibling) {
                    // Ignore document type declaration.
                    if (sibling.nodeType === window.Node.DOCUMENT_TYPE_NODE) {
                        continue;
                    }

                    if (sibling.nodeName === elem.nodeName) {
                        ++index;
                    }
                }

                var tagName = elem.nodeName.toLowerCase();
                //  Always use index, otherwise first elem matches all elements
                var pathIndex = "[" + (index + 1) + "]";
                paths.splice(0, 0, tagName + pathIndex);
            }

            return paths.length ? "/" + paths.join("/") : null;
        };

    return getElementTreeXPath(elem);
};

/**
 * @param xpath
 * @returns element
 */
utils.getElementByXpath = function(xpath){
    utils.getWindow().wgxpath.install();
    var xpathSelector = utils.getDocument().evaluate(xpath, utils.getDocument().body);
    return xpathSelector.iterateNext();
};

/**
 * @param elem
 * @returns {{tagName: (elem.tagName|*), index: *}}
 */
utils.getElementData = function (elem) {
    var tagName = elem.tagName;
    var index = utils.getElementIndex(tagName, elem);
    var xpath = utils.getXpath(elem);
    return {
        tagName:    tagName,
        index:      index,
        xpath:      xpath 
    };
};

/**
 * @param {string} tagName
 * @param {number} index
 */
utils.getSingleElement = function (tagName, index) {
    var elems = utils.getDocument().getElementsByTagName(tagName);
    return elems[index];
};

/**
 * Get the body element
 */
utils.getBody = function () {
    return utils.getDocument().getElementsByTagName("body")[0];
};

/**
 * Initialises the hover styles so we can show hover across browsers
 */
utils.initHoverStyles = function(){
    var doc = utils.getDocument(),
        hoverClass = "browser-sync-hover",
        trimStr = function (str) {
            return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        },
        si, rules, ri, rule, cssText, ruleDef, myRules, newRu, mi, ru;
    for(si in doc.styleSheets) {
        if(!doc.styleSheets[si].browserSyncProcessed) {
            try{
                doc.styleSheets[si].browserSyncProcessed = true;
                rules = doc.styleSheets[si].rules;
                for(ri in rules) {
                    rule = rules[ri];
                    if(rule.cssText && rule.cssText.indexOf(":hover") !== -1) {
                        cssText = trimStr(rule.cssText.substr(0, rule.cssText.indexOf("{")));
                        ruleDef = trimStr(rule.cssText.substr(rule.cssText.indexOf("{")));
                        console.log("---------------------------------------------");
                        console.log(rule.cssText);
                        myRules = cssText.split(",");
                        newRu = [];
                        for(mi in myRules) {
                            ru = myRules[mi].split(":hover")[0];
                            newRu.push(myRules[mi] + ", " +ru + "." +hoverClass);
                        }
                        newRu = newRu.join(",") + " " + ruleDef;
                        console.log(newRu);
                        rule.cssText = newRu;
                    }
                }
            } catch(ex){
                console.log("stylesheet not ready");
                continue;
            }
        }
    }
};

//  Ref: http://jaketrent.com/post/addremove-classes-raw-javascript/
utils.hasClass = function(el, className) {
    if(!el) {
        return false;
    }
    return el.classList?
        el.classList.contains(className):
        !!el.className.match(new RegExp("(\\s|^)" + className + "(\\s|$)"));
};

utils.addClass = function(el, className) {
    if(!el) {
        return false;
    }
    if (el.classList) {
        el.classList.add(className);
    } else if (!utils.hasClass(el, className)){
        el.className += " " + className;
    }
};

utils.removeClass = function(el, className) {
    if(!el) {
        return false;
    }
    if (el.classList) {
        el.classList.remove(className);
    } else if (utils.hasClass(el, className)) {
        var reg = new RegExp("(\\s+|^)" + className + "(\\s+|$)");
        el.className=el.className.replace(reg, " ");
    }
};

/**
 * @param {{x: number, y: number}} pos
 */
utils.setScroll = function (pos) {
    utils.getWindow().scrollTo(pos.x, pos.y);
};

/**
 * Hard reload
 */
utils.reloadBrowser = function () {
    utils.getWindow().location.reload(true);
};

/**
 * Foreach polyfill
 * @param coll
 * @param fn
 */
utils.forEach = function (coll, fn) {
    for (var i = 0, n = coll.length; i < n; i += 1) {
        fn(coll[i], i, coll);
    }
};

/**
 * Are we dealing with old IE?
 * @returns {boolean}
 */
utils.isOldIe = function () {
    return typeof utils.getWindow().attachEvent !== "undefined";
};