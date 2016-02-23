(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var socket       = require("./socket");
var emitter      = require("./emitter");
var notify       = require("./notify");
var tab          = require("./tab");
var utils        = require("./browser.utils");

/**
 * @constructor
 */
var BrowserSync = function (options) {

    this.options   = options;
    this.socket    = socket;
    this.emitter   = emitter;
    this.utils     = utils;
    this.tabHidden = false;

    var bs = this;

    /**
     * Options set
     */
    socket.on("options:set", function (data) {
        emitter.emit("notify", "Setting options...");
        bs.options = data.options;
    });

    emitter.on("tab:hidden", function () {
        bs.tabHidden = true;
    });
    emitter.on("tab:visible", function () {
        bs.tabHidden = false;
    });
};

/**
 * Helper to check if syncing is allowed
 * @param data
 * @param optPath
 * @returns {boolean}
 */
BrowserSync.prototype.canSync = function (data, optPath) {

    data = data || {};

    if (data.override) {
        return true;
    }

    var canSync = true;

    if (optPath) {
        canSync = this.getOption(optPath);
    }

    return canSync && data.url === window.location.pathname;
};

/**
 * Helper to check if syncing is allowed
 * @returns {boolean}
 */
BrowserSync.prototype.getOption = function (path) {

    if (path && path.match(/\./)) {

        return getByPath(this.options, path);

    } else {

        var opt = this.options[path];

        if (isUndefined(opt)) {
            return false;
        } else {
            return opt;
        }
    }
};

/**
 * @type {Function}
 */
module.exports = BrowserSync;

/**
 * @param {String} val
 * @returns {boolean}
 */
function isUndefined(val) {

    return "undefined" === typeof val;
}

/**
 * @param obj
 * @param path
 */
function getByPath(obj, path) {

    for(var i = 0, tempPath = path.split("."), len = tempPath.length; i < len; i++){
        if(!obj || typeof obj !== "object") {
            return false;
        }
        obj = obj[tempPath[i]];
    }

    if(typeof obj === "undefined") {
        return false;
    }

    return obj;
}
},{"./browser.utils":2,"./emitter":5,"./notify":27,"./socket":28,"./tab":29}],2:[function(require,module,exports){
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
utils.getElementData = function (elem, event) {
    var tagName = elem.tagName;
    var index = utils.getElementIndex(tagName, elem);
    var xpath = utils.getXpath(elem);
    var result = {
        tagName: tagName,
        index: index,
        xpath: xpath 
    };

    //  Optionally add additional event data
    if(event){
        result.event = event;
    }

    return result;
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
        appendStyle = function(css){
            var head = document.head || document.getElementsByTagName("head")[0],
                style = document.createElement("style");

            style.type = "text/css";
            if (style.styleSheet){
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
        },
        trimStr = function (str) {
            return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
        },
        si, rules, ri, rule, cssText, ruleDef, myRules, newRu, mi, ru;

    //  Keep track of processed stylesheets
    doc.browserSyncProcessed = doc.browserSyncProcessed || {};

    for(si in doc.styleSheets) {if(doc.styleSheets.hasOwnProperty(si)){
        if(!doc.browserSyncProcessed[si]) {
            try{
                doc.browserSyncProcessed[si] = true;
                rules = doc.styleSheets[si].rules;
                for(ri in rules) {
                    rule = rules[ri];
                    if(rule.cssText && rule.cssText.indexOf(":hover") !== -1) {
                        cssText = trimStr(rule.cssText.substr(0, rule.cssText.indexOf("{")));
                        ruleDef = trimStr(rule.cssText.substr(rule.cssText.indexOf("{")));
                        myRules = cssText.split(",");
                        newRu = [];
                        for(mi in myRules) {
                            ru = myRules[mi].split(":hover")[0];
                            newRu.push(myRules[mi] + ", " +ru + "." +hoverClass);
                        }
                        newRu = newRu.join(",") + " " + ruleDef;
                        appendStyle(newRu);
                        doc.browserSyncProcessed[doc.styleSheets.length-1] = true;
                    }
                }
            } catch(ex){
                console.log("style issue", ex);
                continue;
            }
        }
    }}
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
},{}],3:[function(require,module,exports){
if (!("indexOf" in Array.prototype)) {

    Array.prototype.indexOf= function(find, i) {
        if (i === undefined) {
            i = 0;
        }
        if (i < 0) {
            i += this.length;
        }
        if (i < 0) {
            i= 0;
        }
        for (var n = this.length; i < n; i += 1) {
            if (i in this && this[i]===find) {
                return i;
            }
        }
        return -1;
    };
}
},{}],4:[function(require,module,exports){
"use strict";
var events  = require("./events");
var utils   = require("./browser.utils");
var emitter = require("./emitter");
var sync    = exports;

var options = {

    tagNames: {
        "css":  "link",
        "jpg":  "img",
        "jpeg": "img",
        "png":  "img",
        "svg":  "img",
        "gif":  "img",
        "js":   "script"
    },
    attrs: {
        "link":   "href",
        "img":    "src",
        "script": "src"
    }
};

var hiddenElem;
var OPT_PATH = "codeSync";

var current = function () {
    return window.location.pathname;
};

/**
 * @param {BrowserSync} bs
 */
sync.init = function (bs) {

    if (bs.options.tagNames) {
        options.tagNames = bs.options.tagNames;
    }

    if (bs.options.scrollRestoreTechnique === "window.name") {
        sync.saveScrollInName(emitter);
    } else {
        sync.saveScrollInCookie(utils.getWindow(), utils.getDocument());
    }

    bs.socket.on("file:reload", sync.reload(bs));
    bs.socket.on("browser:reload", function () {
        if (bs.canSync({url: current()}, OPT_PATH)) {
            sync.reloadBrowser(true, bs);
        }
    });
};

/**
 * Use window.name to store/restore scroll position
 */
sync.saveScrollInName = function () {

    var PRE     = "<<BS_START>>";
    var SUF     = "<<BS_END>>";
    var regex   = new RegExp(PRE + "(.+?)" + SUF);
    var $window = utils.getWindow();
    var saved   = {};

    /**
     * Listen for the browser:hardReload event.
     * When it runs, save the current scroll position
     * in window.name
     */
    emitter.on("browser:hardReload", function (data) {
        var newname = [$window.name, PRE, JSON.stringify({
            bs: {
                hardReload: true,
                scroll:     data.scrollPosition
            }
        }), SUF].join("");
        $window.name = newname;
    });

    /**
     * On page load, check window.name for an existing
     * BS json blob & parse it.
     */
    try {
        var json = $window.name.match(regex);
        if (json) {
            saved = JSON.parse(json[1]);
        }
    } catch (e) {
        saved = {};
    }

    /**
     * If the JSON was parsed correctly, try to
     * find a scroll property and restore it.
     */
    if (saved.bs && saved.bs.hardReload && saved.bs.scroll) {
        utils.setScroll(saved.bs.scroll);
    }

    /**
     * Remove any existing BS json from window.name
     * to ensure we don't interfere with any other
     * libs who may be using it.
     */
    $window.name = $window.name.replace(regex, "");
};

/**
 * Use a cookie-drop to save scroll position of
 * @param $window
 * @param $document
 */
sync.saveScrollInCookie = function ($window, $document) {

    if (!utils.isOldIe()) {
        return;
    }

    if ($document.readyState === "complete") {
        utils.restoreScrollPosition();
    } else {
        events.manager.addEvent($document, "readystatechange", function() {
            if ($document.readyState === "complete") {
                utils.restoreScrollPosition();
            }
        });
    }

    emitter.on("browser:hardReload", utils.saveScrollPosition);
};

/**
 * @param elem
 * @param attr
 * @param options
 * @returns {{elem: HTMLElement, timeStamp: number}}
 */
sync.swapFile = function (elem, attr, options) {

    var currentValue = elem[attr];
    var timeStamp = new Date().getTime();
    var suffix = "?rel=" + timeStamp;

    var justUrl = sync.getFilenameOnly(currentValue);

    if (justUrl) {
        currentValue = justUrl[0];
    }

    if (options) {
        if (!options.timestamps) {
            suffix = "";
        }
    }

    elem[attr] = currentValue + suffix;

    var body = document.body;

    setTimeout(function () {
        if (!hiddenElem) {
            hiddenElem = document.createElement("DIV");
            body.appendChild(hiddenElem);
        } else {
            hiddenElem.style.display = "none";
            hiddenElem.style.display = "block";
        }
    }, 200);

    return {
        elem: elem,
        timeStamp: timeStamp
    };
};

sync.getFilenameOnly = function (url) {
    return /^[^\?]+(?=\?)/.exec(url);
};

/**
 * @param {BrowserSync} bs
 * @returns {*}
 */
sync.reload = function (bs) {

    /**
     * @param data - from socket
     */
    return function (data) {

        if (!bs.canSync({url: current()}, OPT_PATH)) {
            return;
        }
        var transformedElem;
        var options = bs.options;
        var emitter = bs.emitter;

        if (data.url || !options.injectChanges) {
            sync.reloadBrowser(true);
        }

        if (data.basename && data.ext) {

            var domData = sync.getElems(data.ext);
            var elems   = sync.getMatches(domData.elems, data.basename, domData.attr);

            if (elems.length && options.notify) {
                emitter.emit("notify", {message: "Injected: " + data.basename});
            }

            for (var i = 0, n = elems.length; i < n; i += 1) {
                transformedElem = sync.swapFile(elems[i], domData.attr, options);
            }
        }

        return transformedElem;
    };
};

/**
 * @param fileExtension
 * @returns {*}
 */
sync.getTagName = function (fileExtension) {
    return options.tagNames[fileExtension];
};

/**
 * @param tagName
 * @returns {*}
 */
sync.getAttr = function (tagName) {
    return options.attrs[tagName];
};

/**
 * @param elems
 * @param url
 * @param attr
 * @returns {Array}
 */
sync.getMatches = function (elems, url, attr) {

    if (url[0] === "*") {
        return elems;
    }

    var matches = [];

    for (var i = 0, len = elems.length; i < len; i += 1) {
        if (elems[i][attr].indexOf(url) !== -1) {
            matches.push(elems[i]);
        }
    }

    return matches;
};

/**
 * @param fileExtension
 * @returns {{elems: NodeList, attr: *}}
 */
sync.getElems = function(fileExtension) {

    var tagName = sync.getTagName(fileExtension);
    var attr    = sync.getAttr(tagName);

    return {
        elems: document.getElementsByTagName(tagName),
        attr: attr
    };
};

/**
 * @param confirm
 */
sync.reloadBrowser = function (confirm) {
    emitter.emit("browser:hardReload", {
        scrollPosition: utils.getBrowserScrollPosition()
    });
    if (confirm) {
        utils.reloadBrowser();
    }
};
},{"./browser.utils":2,"./emitter":5,"./events":6}],5:[function(require,module,exports){
"use strict";

exports.events = {};

/**
 * @param name
 * @param data
 */
exports.emit = function (name, data) {
    var event = exports.events[name];
    var listeners;
    if (event && event.listeners) {
        listeners = event.listeners;
        for (var i = 0, n = listeners.length; i < n; i += 1) {
            listeners[i](data);
        }
    }
};

/**
 * @param name
 * @param func
 */
exports.on = function (name, func) {
    var events = exports.events;
    if (!events[name]) {
        events[name] = {
            listeners: [func]
        };
    } else {
        events[name].listeners.push(func);
    }
};
},{}],6:[function(require,module,exports){
exports._ElementCache = function () {

    var cache = {},
        guidCounter = 1,
        expando = "data" + (new Date).getTime();

    this.getData = function (elem) {
        var guid = elem[expando];
        if (!guid) {
            guid = elem[expando] = guidCounter++;
            cache[guid] = {};
        }
        return cache[guid];
    };

    this.removeData = function (elem) {
        var guid = elem[expando];
        if (!guid) return;
        delete cache[guid];
        try {
            delete elem[expando];
        }
        catch (e) {
            if (elem.removeAttribute) {
                elem.removeAttribute(expando);
            }
        }
    };
};

/**
 * Fix an event
 * @param event
 * @returns {*}
 */
exports._fixEvent = function (event) {

    function returnTrue() {
        return true;
    }

    function returnFalse() {
        return false;
    }

    if (!event || !event.stopPropagation) {
        var old = event || window.event;

        // Clone the old object so that we can modify the values
        event = {};

        for (var prop in old) {
            event[prop] = old[prop];
        }

        // The event occurred on this element
        if (!event.target) {
            event.target = event.srcElement || document;
        }

        // Handle which other element the event is related to
        event.relatedTarget = event.fromElement === event.target ?
            event.toElement :
            event.fromElement;

        // Stop the default browser action
        event.preventDefault = function () {
            event.returnValue = false;
            event.isDefaultPrevented = returnTrue;
        };

        event.isDefaultPrevented = returnFalse;

        // Stop the event from bubbling
        event.stopPropagation = function () {
            event.cancelBubble = true;
            event.isPropagationStopped = returnTrue;
        };

        event.isPropagationStopped = returnFalse;

        // Stop the event from bubbling and executing other handlers
        event.stopImmediatePropagation = function () {
            this.isImmediatePropagationStopped = returnTrue;
            this.stopPropagation();
        };

        event.isImmediatePropagationStopped = returnFalse;

        // Handle mouse position
        if (event.clientX != null) {
            var doc = document.documentElement, body = document.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0);
        }

        // Handle key presses
        event.which = event.charCode || event.keyCode;

        // Fix button for mouse clicks:
        // 0 == left; 1 == middle; 2 == right
        if (event.button != null) {
            event.button = (event.button & 1 ? 0 :
                (event.button & 4 ? 1 :
                    (event.button & 2 ? 2 : 0)));
        }
    }

    return event;
};

/**
 * @constructor
 */
exports._EventManager = function (cache) {

    var nextGuid = 1;

    this.addEvent = function (elem, type, fn, bs) {

        var data = cache.getData(elem);

        if (!data.handlers) data.handlers = {};

        if (!data.handlers[type])
            data.handlers[type] = [];

        if (!fn.guid) fn.guid = nextGuid++;

        data.handlers[type].push(fn);

        if (!data.dispatcher) {
            data.disabled = false;
            data.dispatcher = function (event) {

                if (data.disabled) return;
                event = exports._fixEvent(event);

                var handlers = data.handlers[event.type];
                if (handlers) {
                    for (var n = 0; n < handlers.length; n++) {
                        handlers[n].call(elem, event);
                    }
                }
            };
        }

        if (data.handlers[type].length == 1) {
            if (document.addEventListener) {
                elem.addEventListener(type, data.dispatcher, (bs && typeof bs.options.capture !== "undefined")? bs.options.capture: true);
            }
            else if (document.attachEvent) {
                elem.attachEvent("on" + type, data.dispatcher);
            }
        }

    };

    function tidyUp(elem, type) {

        function isEmpty(object) {
            for (var prop in object) {
                return false;
            }
            return true;
        }

        var data = cache.getData(elem);

        if (data.handlers[type].length === 0) {

            delete data.handlers[type];

            if (document.removeEventListener) {
                elem.removeEventListener(type, data.dispatcher, false);
            }
            else if (document.detachEvent) {
                elem.detachEvent("on" + type, data.dispatcher);
            }
        }

        if (isEmpty(data.handlers)) {
            delete data.handlers;
            delete data.dispatcher;
        }

        if (isEmpty(data)) {
            cache.removeData(elem);
        }
    }

    this.removeEvent = function (elem, type, fn) {

        var data = cache.getData(elem);

        if (!data.handlers) return;

        var removeType = function (t) {
            data.handlers[t] = [];
            tidyUp(elem, t);
        };

        if (!type) {
            for (var t in data.handlers) removeType(t);
            return;
        }

        var handlers = data.handlers[type];
        if (!handlers) return;

        if (!fn) {
            removeType(type);
            return;
        }

        if (fn.guid) {
            for (var n = 0; n < handlers.length; n++) {
                if (handlers[n].guid === fn.guid) {
                    handlers.splice(n--, 1);
                }
            }
        }
        tidyUp(elem, type);

    };

    this.proxy = function (context, fn) {
        if (!fn.guid) {
            fn.guid = nextGuid++;
        }
        var ret = function () {
            return fn.apply(context, arguments);
        };
        ret.guid = fn.guid;
        return ret;
    };
};



/**
 * Trigger an event on an element
 * @param elem
 * @param type
 * @param name
 * @param args
 */
//  "UIEvents", "MouseEvents", "HTMLEvents";
exports.triggerEvent = function(elem, type, name, args){
    var evObj,
        lType = typeof type !=="undefined"? type.toLowerCase(): undefined,
        addArgs = function(e, args) {
            var i;
            args = args || {};
            for(i in args) {if(args.hasOwnProperty(i)){
                e[i] = args[i];
            }}
        };

    name = name || typeof type !=="undefined" && lType === "click"? 
        "MouseEvents": 
        "HTMLEvents";

    window.setTimeout(function () {
        // IE
        if (document.createEventObject){
            evObj = document.createEventObject();
            evObj.cancelBubble = true;
            addArgs(evObj, args);
            return elem.fireEvent("on" + type, evObj);
        } else {
            evObj = document.createEvent(name);
            evObj.initEvent(type, true, true);
            addArgs(evObj, args);
            return !elem.dispatchEvent(evObj);
        }
    }, 0);
};

/**
 * Mainly used for triggering change Event on SELECT in firefox.
 * @param elem
 */
exports.triggerChange = function(elem){
    var evObj;
    if(document.createEvent){
        window.setTimeout(function () {
            evObj = document.createEvent("HTMLEvents");
            evObj.initEvent("change", true, true);
            elem.dispatchEvent(evObj);
        },0);
    }
};

/**
 * Trigger a mouseup/mousedown event on given element.
 * @param elem
 * @param mouseEventName should be 'mouseup' or 'mousedown'
 */
exports.triggerMouseUpDown = function (elem, mouseEventName) {

    var evObj;
    if (window.MouseEvent) {
        evObj = new MouseEvent((mouseEventName === 'mouseup' ? 'mouseup' : 'mousedown'), {
            view: window,
            bubbles: true,
            cancelable: true
        });
        elem.dispatchEvent(evObj);
    } else if (document.createEvent) {
        window.setTimeout(function () {
            evObj = document.createEvent("MouseEvents");
            evObj.initEvent(mouseEventName === 'mouseup' ? 'mouseup' : 'mousedown', true, true);
            elem.dispatchEvent(evObj);
        }, 0);
    } else {
        window.setTimeout(function () {
            if (document.createEventObject) {
                evObj = document.createEventObject();
                evObj.cancelBubble = true;
                elem.fireEvent("on" + (mouseEventName === 'mouseup' ? 'mouseup' : 'mousedown'), evObj);
            }
        }, 0);
    }
};

var cache = new exports._ElementCache();
var eventManager = new exports._EventManager(cache);

eventManager.triggerEvent = exports.triggerEvent;
eventManager.triggerMouseUpDown = exports.triggerMouseUpDown;
eventManager.triggerChange = exports.triggerChange;

exports.manager = eventManager;




},{}],7:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "click";
var OPT_PATH    = "ghostMode.clicks";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        if (exports.canEmitEvents) {

            var elem = event.target || event.srcElement;

            if (elem.type === "checkbox" || elem.type === "radio") {
                bs.utils.forceChange(elem);
                return;
            }

            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {
        if (!bs.canSync(data, OPT_PATH) || bs.tabHidden) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerEvent(elem, EVENT_NAME);
        }
    };
};
},{}],8:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "select:change";
var OPT_PATH    = "ghostMode.forms.change";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, "change", exports.browserEvent(bs));
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        var elem = event.target || event.srcElement;
        var data;

        if (exports.canEmitEvents) {

            if (elem.tagName === "SELECT") {

                data = bs.utils.getElementData(elem);
                data.value = elem.value;

                bs.socket.emit(EVENT_NAME, data);
            }

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem && elem.tagName === "SELECT") {
            elem.value = data.value;
            eventManager.triggerChange(elem);
            return elem;
        }

        return false;
    };
};
},{}],9:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME = "contenteditable:input";
var OPT_PATH = "ghostMode.forms.contenteditable";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, "input", exports.browserEvent(bs),bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        var elem = event.target || event.srcElement;
        var data;

        if (exports.canEmitEvents) {

            if (elem.contentEditable === "true") {

                data = bs.utils.getElementData(elem);
                data.innerHTML = elem.innerHTML;

                bs.socket.emit(EVENT_NAME, data);
            }

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem && elem.contentEditable === "true") {
            elem.innerHTML = data.innerHTML;
            return elem;
        }

        return false;
    };
};
},{}],10:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "input:text";
var OPT_PATH    = "ghostMode.forms.inputs";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    var eventType = typeof document.body.oninput !== "undefined"? "input": "keyup";
    eventManager.addEvent(document.body, eventType, exports.browserEvent(bs));
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        var elem = event.target || event.srcElement;
        var data;

        if (exports.canEmitEvents) {

            if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {

                data = bs.utils.getElementData(elem);
                data.value = elem.value;

                bs.socket.emit(EVENT_NAME, data);
            }

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath),
            eventType;

        if (elem) {
            elem.value = data.value;

            eventType = typeof elem.oninput !== "undefined"? "input": "change";
            eventManager.triggerEvent(elem, eventType);

            return elem;
        }

        return false;
    };
};
},{}],11:[function(require,module,exports){
"use strict";

exports.plugins = {
    "inputs":           require("./ghostmode.forms.input"),
    "change":           require("./ghostmode.forms.change"),
    "submit":           require("./ghostmode.forms.submit"),
    "keydown":          require("./ghostmode.forms.keydown.js"),
    "keypress":         require("./ghostmode.forms.keypress.js"),
    "contenteditable":  require("./ghostmode.forms.contenteditable.js"),
    "toggles":          require("./ghostmode.forms.toggles")
};

/**
 * Load plugins for enabled options
 * @param bs
 */
exports.init = function (bs, eventManager) {

    var checkOpt = true;
    var options = bs.options.ghostMode.forms;

    if (options === true) {
        checkOpt = false;
    }

    function init(name) {
        exports.plugins[name].init(bs, eventManager);
    }

    for (var name in exports.plugins) {
        if (!checkOpt) {
            init(name);
        } else {
            if (options[name]) {
                init(name);
            }
        }
    }
};
},{"./ghostmode.forms.change":8,"./ghostmode.forms.contenteditable.js":9,"./ghostmode.forms.input":10,"./ghostmode.forms.keydown.js":12,"./ghostmode.forms.keypress.js":13,"./ghostmode.forms.submit":14,"./ghostmode.forms.toggles":15}],12:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME = "input:keydown";
var OPT_PATH = "ghostMode.forms.keydown";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, "keydown", exports.browserEvent(bs),bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        var elem = event.target || event.srcElement;
        var data;

        if (exports.canEmitEvents) {

            if (elem.tagName === "INPUT") {

                data = bs.utils.getElementData(elem);
                data.keyCode = event.keyCode;

                if (data.keyCode === 13) {
                    bs.socket.emit(EVENT_NAME, data);
                }
            }

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            var evt = document.createEvent("Events");
            evt.initEvent("keydown", true, true);

            evt.keyCode = data.keyCode;
            elem.dispatchEvent(evt);
            return elem;
        }

        return false;
    };
};
},{}],13:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME = "input:keypress";
var OPT_PATH = "ghostMode.forms.keypress";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, "keypress", exports.browserEvent(bs),bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        var elem = event.target || event.srcElement;
        var data;

        if (exports.canEmitEvents) {

            if (elem.tagName === "INPUT") {

                data = bs.utils.getElementData(elem);
                data.keyCode = event.keyCode;

                if (data.keyCode === 13) {
                    bs.socket.emit(EVENT_NAME, data);
                }
            }

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            var evt = document.createEvent("Events");
            evt.initEvent("keypress", true, true);

            evt.keyCode = data.keyCode;
            elem.dispatchEvent(evt);
            return elem;
        }

        return false;
    };
};
},{}],14:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "form:submit";
var OPT_PATH    = "ghostMode.forms.submit";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    var browserEvent = exports.browserEvent(bs);
    eventManager.addEvent(document.body, "submit", browserEvent);
    eventManager.addEvent(document.body, "reset", browserEvent);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            var data = bs.utils.getElementData(elem);
            data.type = event.type;
            bs.socket.emit(EVENT_NAME, data);
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        exports.canEmitEvents = false;

        if (elem && data.type === "submit") {
            elem.submit();
        }

        if (elem && data.type === "reset") {
            elem.reset();
        }
        return false;
    };
};
},{}],15:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "input:toggles";
var OPT_PATH    = "ghostMode.forms.toggles";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    var browserEvent = exports.browserEvent(bs);
    exports.addEvents(eventManager, browserEvent);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * @param eventManager
 * @param event
 */
exports.addEvents = function (eventManager, event) {

    var elems   = document.getElementsByTagName("select");
    var inputs  = document.getElementsByTagName("input");

    addEvents(elems);
    addEvents(inputs);

    function addEvents(domElems) {
        for (var i = 0, n = domElems.length; i < n; i += 1) {
            eventManager.addEvent(domElems[i], "change", event);
        }
    }
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            var data;
            if (elem.type === "radio" || elem.type === "checkbox" || elem.tagName === "SELECT") {
                data = bs.utils.getElementData(elem);
                data.type    = elem.type;
                data.value   = elem.value;
                data.checked = elem.checked;
                bs.socket.emit(EVENT_NAME, data);
            }
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        exports.canEmitEvents = false;

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            //  Timeout to allow click events to work first
            setTimeout(function(){
                if (data.type === "radio") {
                    data.checked = (!!data.checked);
                    if (data.checked !== elem.checked) {
                        eventManager.triggerEvent(elem, "click");
                    }
                }
                if (data.type === "checkbox") {
                    data.checked = (!!data.checked);
                    if (data.checked !== elem.checked) {
                        eventManager.triggerEvent(elem, "click");
                    }
                }
                if (data.tagName === "SELECT") {
                    if (data.value !== elem.value) {
                        elem.value = data.value;
                        eventManager.triggerEvent(elem, "focus");
                        eventManager.triggerEvent(elem, "change");
                        eventManager.triggerEvent(elem, "blur");
                    }
                }
            }, 0);

            return elem;
        }
        return false;
    };
};
},{}],16:[function(require,module,exports){
"use strict";

var eventManager = require("./events").manager;

exports.plugins = {
	"scroll":		require("./ghostmode.scroll"),
	"clicks":		require("./ghostmode.clicks"),
	"forms":		require("./ghostmode.forms"),
	"location":		require("./ghostmode.location"),
	"mouseup":		require("./ghostmode.mouseup"),
	"mousedown":	require("./ghostmode.mousedown"),
	"mouseover":	require("./ghostmode.mouseover"),
	"mouseout":		require("./ghostmode.mouseout"),
	"touchstart":	require("./ghostmode.touchstart"),
	"touchmove":	require("./ghostmode.touchmove"),
	"touchend":		require("./ghostmode.touchend")
};

/**
 * Load plugins for enabled options
 * @param bs
 */
exports.init = function (bs) {
	for (var name in exports.plugins) {
		exports.plugins[name].init(bs, eventManager);
	}
};
},{"./events":6,"./ghostmode.clicks":7,"./ghostmode.forms":11,"./ghostmode.location":17,"./ghostmode.mousedown":18,"./ghostmode.mouseout":19,"./ghostmode.mouseover":20,"./ghostmode.mouseup":21,"./ghostmode.scroll":22,"./ghostmode.touchend":23,"./ghostmode.touchmove":24,"./ghostmode.touchstart":25}],17:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing location
 * @type {string}
 */
var EVENT_NAME = "browser:location";
var OPT_PATH   = "ghostMode.location";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 */
exports.init = function (bs) {
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs));
};

/**
 * Respond to socket event
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        if (data.path) {
            exports.setPath(data.path);
        } else {
            exports.setUrl(data.url);
        }
    };
};

/**
 * @param url
 */
exports.setUrl = function (url) {
    window.location = url;
};

/**
 * @param path
 */
exports.setPath = function (path) {
    window.location = window.location.protocol + "//" + window.location.host + path;
};
},{}],18:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "mousedown";
var OPT_PATH    = "ghostMode.mousedown";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        if (exports.canEmitEvents) {

            var elem = event.target || event.srcElement;

            if (elem.type === "checkbox" || elem.type === "radio") {
                bs.utils.forceChange(elem);
                return;
            }

            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {
        if (!bs.canSync(data, OPT_PATH) || bs.tabHidden) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerMouseUpDown(elem, EVENT_NAME);
        }
    };
};
},{}],19:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing mouseout events between browsers
 * @type {string}
 */
var EVENT_NAME  = "mouseout";
var OPT_PATH    = "ghostMode.mouseout";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the moused out element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {
    return function (data) {
        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        //  Apply CSS hover ability (you can safely call this as many times as you like)
        bs.utils.initHoverStyles();

        var elem = bs.utils.getElementByXpath(data.xpath),
            elem2;

        if (elem) {
            exports.canEmitEvents = false;
            bs.utils.removeClass(elem, "browser-sync-hover");
            eventManager.triggerEvent(elem, EVENT_NAME, "MouseEvents");

            elem2 = elem.parentNode;

            //  parents as well
            while(elem2 && elem2 !== document.body) {
                bs.utils.removeClass(elem2, "browser-sync-hover");
                eventManager.triggerEvent(elem2, EVENT_NAME, "MouseEvents");
                elem2 = elem2.parentNode;
            }
        }
    };
};
},{}],20:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing mouseover events between browsers
 * @type {string}
 */
var EVENT_NAME  = "mouseover";
var OPT_PATH    = "ghostMode.mouseover";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the moused over element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {
    return function (data) {
        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        //  Apply CSS hover ability (you can safely call this as many times as you like)
        bs.utils.initHoverStyles();

        var elem = bs.utils.getElementByXpath(data.xpath),
            elem2;

        if (elem) {
            exports.canEmitEvents = false;
            bs.utils.addClass(elem, "browser-sync-hover");
            eventManager.triggerEvent(elem, EVENT_NAME, "MouseEvents");

            elem2 = elem.parentNode;

            //  parents as well
            while(elem2 && elem2 !== document.body) {
                bs.utils.addClass(elem2, "browser-sync-hover");
                eventManager.triggerEvent(elem2, EVENT_NAME, "MouseEvents");
                elem2 = elem2.parentNode;
            }
        }
    };
};
},{}],21:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing clicks between browsers
 * @type {string}
 */
var EVENT_NAME  = "mouseup";
var OPT_PATH    = "ghostMode.mouseup";
exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {

    return function (event) {

        if (exports.canEmitEvents) {

            var elem = event.target || event.srcElement;

            if (elem.type === "checkbox" || elem.type === "radio") {
                bs.utils.forceChange(elem);
                return;
            }

            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));

        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerMouseUpDown(elem, EVENT_NAME);
        }
    };
};
},{}],22:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing scroll between devices
 * @type {string}
 */
var WINDOW_EVENT_NAME  = "scroll";
var ELEMENT_EVENT_NAME = "scroll:element";
var OPT_PATH           = "ghostMode.scroll";
var utils;

exports.canEmitEvents = true;

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    utils     = bs.utils;
    var opts  = bs.options;

    /**
     * Window Scroll events
     */
    eventManager.addEvent(window, WINDOW_EVENT_NAME, exports.browserEvent(bs));
    bs.socket.on(WINDOW_EVENT_NAME, exports.socketEvent(bs));

    /**
     * element Scroll Events
     */
    var cache = {};
    addElementScrollEvents("scrollElements", false);
    addElementScrollEvents("scrollElementMapping", true);
    bs.socket.on(ELEMENT_EVENT_NAME, exports.socketEventForElement(bs, cache));

    function addElementScrollEvents (key, map) {
        if (!opts[key] || !opts[key].length || !("querySelectorAll" in document)) {
            return;
        }
        utils.forEach(opts[key], function (selector) {
            var elems = document.querySelectorAll(selector) || [];
            utils.forEach(elems, function (elem) {
                var data = utils.getElementData(elem);
                data.cacheSelector = data.tagName + ":" + data.index;
                data.map = map;
                cache[data.cacheSelector] = elem;
                eventManager.addEvent(elem, WINDOW_EVENT_NAME, exports.browserEventForElement(bs, elem, data));
            });
        });
    }
};

/**
 * @param {BrowserSync} bs
 */
exports.socketEvent = function (bs) {

    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var scrollSpace = utils.getScrollSpace();

        exports.canEmitEvents = false;

        if (bs.options && bs.options.scrollProportionally) {
            return window.scrollTo(0, scrollSpace.y * data.position.proportional); // % of y axis of scroll to px
        } else {
            return window.scrollTo(0, data.position.raw.y);
        }
    };
};

/**
 * @param bs
 */
exports.socketEventForElement = function (bs, cache) {
    return function (data) {

        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        exports.canEmitEvents = false;

        function scrollOne (selector, pos) {
            if (cache[selector]) {
                cache[selector].scrollTop = pos;
            }
        }

        if (data.map) {
            return Object.keys(cache).forEach(function (key) {
                scrollOne(key, data.position);
            });
        }

        scrollOne(data.elem.cacheSelector, data.position);
    };
};

/**
 * @param bs
 */
exports.browserEventForElement = function (bs, elem, data) {
    return function () {
        var canSync = exports.canEmitEvents;
        if (canSync) {
            bs.socket.emit(ELEMENT_EVENT_NAME, {
                position: elem.scrollTop,
                elem: data,
                map: data.map
            });
        }
        exports.canEmitEvents = true;
    };
};

exports.browserEvent = function (bs) {

    return function () {

        var canSync = exports.canEmitEvents;

        if (canSync) {
            bs.socket.emit(WINDOW_EVENT_NAME, {
                position: exports.getScrollPosition()
            });
        }

        exports.canEmitEvents = true;
    };
};


/**
 * @returns {{raw: number, proportional: number}}
 */
exports.getScrollPosition = function () {
    var pos = utils.getBrowserScrollPosition();
    return {
        raw: pos, // Get px of x and y axis of scroll
        proportional: exports.getScrollTopPercentage(pos) // Get % of y axis of scroll
    };
};

/**
 * @param {{x: number, y: number}} scrollSpace
 * @param scrollPosition
 * @returns {{x: number, y: number}}
 */
exports.getScrollPercentage = function (scrollSpace, scrollPosition) {

    var x = scrollPosition.x / scrollSpace.x;
    var y = scrollPosition.y / scrollSpace.y;

    return {
        x: x || 0,
        y: y
    };
};

/**
 * Get just the percentage of Y axis of scroll
 * @returns {number}
 */
exports.getScrollTopPercentage = function (pos) {
    var scrollSpace = utils.getScrollSpace();
    var percentage  = exports.getScrollPercentage(scrollSpace, pos);
    return percentage.y;
};
},{}],23:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing touchend events between browsers
 * @type {string}
 */
var EVENT_NAME  = "touchend";
var OPT_PATH    = "ghostMode.touchend";
exports.canEmitEvents = true;
var createTouchList = function(elem, args){
    var result = {},
        doc = document;
    for(var i in args) {if(args.hasOwnProperty(i)){
        if(i === "touches" || i === "changedTouches" || i === "targetTouches") {
            var touchy = doc.createTouch(
                window,
                elem,
                parseInt(Math.random() * (new Date()).getTime(), 10),
                args[i].pageX,
                args[i].pageY
            );
            result[i] = doc.createTouchList([touchy]);
        }
    }}

    return result;
};

var getTouchData = function(event) {
    var result = {},
        props = ["touches", "changedTouches", "targetTouches"];

    for(var i = 0; i < props.length; i += 1) {
        if(event[props[i]] && event[props[i]][0]) {
            result[props[i]] = {
                pageX: event[props[i]][0].pageX,
                pageY: event[props[i]][0].pageY
            };
        }
    }

    return result;
};

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem, getTouchData(event)));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {
    return function (data) {
        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerEvent(elem, EVENT_NAME, null, createTouchList(elem, data.event));
        }
    };
};
},{}],24:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing touchmove events between browsers
 * @type {string}
 */
var EVENT_NAME  = "touchmove";
var OPT_PATH    = "ghostMode.touchmove";
exports.canEmitEvents = true;
var createTouchList = function(elem, args){
    var result = {},
        doc = document;
    for(var i in args) {if(args.hasOwnProperty(i)){
        if(i === "touches" || i === "changedTouches" || i === "targetTouches") {
            var touchy = doc.createTouch(
                window,
                elem,
                parseInt(Math.random() * (new Date()).getTime(), 10),
                args[i].pageX,
                args[i].pageY
            );
            result[i] = doc.createTouchList([touchy]);
        }
    }}

    return result;
};

var getTouchData = function(event) {
    var result = {},
        props = ["touches", "changedTouches", "targetTouches"];

    for(var i = 0; i < props.length; i += 1) {
        if(event[props[i]] && event[props[i]][0]) {
            result[props[i]] = {
                pageX: event[props[i]][0].pageX,
                pageY: event[props[i]][0].pageY
            };
        }
    }

    return result;
};

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem, getTouchData(event)));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {
    return function (data) {
        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerEvent(elem, EVENT_NAME, null, createTouchList(elem, data.event));
        }
    };
};
},{}],25:[function(require,module,exports){
"use strict";

/**
 * This is the plugin for syncing touchstart events between browsers
 * @type {string}
 */
var EVENT_NAME  = "touchstart";
var OPT_PATH    = "ghostMode.touchstart";
exports.canEmitEvents = true;
var createTouchList = function(elem, args){
    var result = {},
        doc = document;

    //  Add polyfills - these are also used in
    //  touchmove and touchend 
    if(!doc.createTouch) {
        doc.createTouch = function(view, target, identifier, pageX, pageY, screenX, screenY, clientX, clientY) {
            // auto set
            if(typeof clientX === "undefined" || typeof clientY === "undefined") {
                clientX = pageX - window.pageXOffset;
                clientY = pageY - window.pageYOffset;
            }

            if(typeof screenX === "undefined" || typeof screenY === "undefined") {
                screenX = 0;
                screenY = 0;
            }

            return new window.Touch({
                target: target,
                identifier: identifier, 
                pageX: pageX,
                pageY: pageY,
                screenX: screenX,
                screenY: screenY,
                clientX: clientX,
                clientY: clientY
            });
        };
    }

    if(!doc.createTouchList) {
        doc.createTouchList = function(touchPoints) {
            var touches = [],
                touchList = [],
                i,
                self = this;

            for(i = 0; i < touchPoints.length; i += 1) {
                var point = touchPoints[i];
                touchList.push({
                    target: self.target,
                    identifier: point.identifier,
                    clientX: point.clientX,
                    clientY: point.clientY,
                    pageX: point.pageX,
                    pageY: point.pageY,
                    screenX: point.screenX,
                    screenY: point.screenY
                });
            }

            touchList.item = function(i) {
                return touchList[i];
            };

            return touchList;
        };
    }

    for(var i in args) {if(args.hasOwnProperty(i)){
        if(i === "touches" || i === "changedTouches" || i === "targetTouches") {
            var touchy = doc.createTouch(
                window,
                elem,
                parseInt(Math.random() * (new Date()).getTime(), 10),
                args[i].pageX,
                args[i].pageY
            );
            result[i] = doc.createTouchList([touchy]);
        }
    }}

    return result;
};

var getTouchData = function(event) {
    var result = {},
        props = ["touches", "changedTouches", "targetTouches"];

    for(var i = 0; i < props.length; i += 1) {
        if(event[props[i]] && event[props[i]][0]) {
            result[props[i]] = {
                pageX: event[props[i]][0].pageX,
                pageY: event[props[i]][0].pageY
            };
        }
    }

    return result;
};

/**
 * @param {BrowserSync} bs
 * @param eventManager
 */
exports.init = function (bs, eventManager) {
    eventManager.addEvent(document.body, EVENT_NAME, exports.browserEvent(bs), bs);
    bs.socket.on(EVENT_NAME, exports.socketEvent(bs, eventManager));
};

/**
 * Uses event delegation to determine the clicked element
 * @param {BrowserSync} bs
 * @returns {Function}
 */
exports.browserEvent = function (bs) {
    return function (event) {
        if (exports.canEmitEvents) {
            var elem = event.target || event.srcElement;
            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem, getTouchData(event)));
        } else {
            exports.canEmitEvents = true;
        }
    };
};

/**
 * @param {BrowserSync} bs
 * @param {manager} eventManager
 * @returns {Function}
 */
exports.socketEvent = function (bs, eventManager) {
    return function (data) {
        if (!bs.canSync(data, OPT_PATH)) {
            return false;
        }

        var elem = bs.utils.getElementByXpath(data.xpath);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerEvent(elem, EVENT_NAME, null, createTouchList(elem, data.event));
        }
    };
};
},{}],26:[function(require,module,exports){
"use strict";

var socket       = require("./socket");
var shims        = require("./client-shims");
var notify       = require("./notify");
var codeSync     = require("./code-sync");
var BrowserSync  = require("./browser-sync");
var ghostMode    = require("./ghostmode");
var emitter      = require("./emitter");
var events       = require("./events");
var utils        = require("./browser.utils");
var wgxpath      = require("./wgxpath.install");

var shouldReload = false;
var initialised    = false;

/**
 * @param options
 */
exports.init = function (options) {
    if (shouldReload && options.reloadOnRestart) {
        utils.reloadBrowser();
    }

    var BS = window.___browserSync___ || {};

    if (!BS.client) {

        BS.client = true;

        var browserSync = new BrowserSync(options);

        // Always init on page load
        ghostMode.init(browserSync);
        codeSync.init(browserSync);

        notify.init(browserSync);

        if (options.notify) {
            notify.flash("Connected to BrowserSync");
        }
    }

    if (!initialised) {
        socket.on("disconnect", function () {
            if (options.notify) {
                notify.flash("Disconnected from BrowserSync");
            }
            shouldReload = true;
        });
        initialised = true;
    }
};

/**
 * Handle individual socket connections
 */
socket.on("connection", exports.init);

/**debug:start**/
if (window.__karma__) {
    window.__bs_scroll__     = require("./ghostmode.scroll");
    window.__bs_clicks__     = require("./ghostmode.clicks");
    window.__bs_location__   = require("./ghostmode.location");
    window.__bs_inputs__     = require("./ghostmode.forms.input");
    window.__bs_toggles__    = require("./ghostmode.forms.toggles");
    window.__bs_submit__     = require("./ghostmode.forms.submit");
    window.__bs_forms__      = require("./ghostmode.forms");
    window.__bs_utils__      = require("./browser.utils");
    window.__bs_emitter__    = emitter;
    window.__bs              = BrowserSync;
    window.__bs_notify__     = notify;
    window.__bs_code_sync__  = codeSync;
    window.__bs_ghost_mode__ = ghostMode;
    window.__bs_socket__     = socket;
    window.__bs_index__      = exports;
}
/**debug:end**/
},{"./browser-sync":1,"./browser.utils":2,"./client-shims":3,"./code-sync":4,"./emitter":5,"./events":6,"./ghostmode":16,"./ghostmode.clicks":7,"./ghostmode.forms":11,"./ghostmode.forms.input":10,"./ghostmode.forms.submit":14,"./ghostmode.forms.toggles":15,"./ghostmode.location":17,"./ghostmode.scroll":22,"./notify":27,"./socket":28,"./wgxpath.install":30}],27:[function(require,module,exports){
"use strict";

var scroll = require("./ghostmode.scroll");
var utils  = require("./browser.utils");

var styles = {
    display: "none",
    padding: "15px",
    fontFamily: "sans-serif",
    position: "fixed",
    fontSize: "0.9em",
    zIndex: 9999,
    right: 0,
    top: 0,
    borderBottomLeftRadius: "5px",
    backgroundColor: "#1B2032",
    margin: 0,
    color: "white",
    textAlign: "center"
};

var elem;
var options;
var timeoutInt;

/**
 * @param {BrowserSync} bs
 * @returns {*}
 */
exports.init = function (bs) {

    options     = bs.options;

    var cssStyles = styles;

    if (options.notify.styles) {

        if (Object.prototype.toString.call(options.notify.styles) === "[object Array]") {
            // handle original array behavior, replace all styles with a joined copy
            cssStyles = options.notify.styles.join(";");
        } else {
            for (var key in options.notify.styles) {
                if (options.notify.styles.hasOwnProperty(key)) {
                    cssStyles[key] = options.notify.styles[key];
                }
            }
        }
    }

    elem = createElement();

    var flashFn = exports.watchEvent(bs);

    bs.emitter.on("notify", flashFn);
    bs.socket.on("browser:notify", flashFn);

    return elem;
};

function createElement(){
    var cssStyles = styles;

    var elem = document.createElement("DIV");
    elem.id = "__bs_notify__";

    if (typeof cssStyles === "string") {
       elem.style.cssText = cssStyles;
    } else {
        for (var rule in cssStyles) {
            elem.style[rule] = cssStyles[rule];
        }
    }

    return elem;
}


/**
 * @returns {Function}
 */
exports.watchEvent = function (bs) {
    return function (data) {
        if (bs.options.notify) {
            if (typeof data === "string") {
                return exports.flash(data);
            }
            exports.flash(data.message, data.timeout);
        }
    };
};

/**
 *
 */
exports.getElem = function () {
    var elementFound = false;
    if(elem && elem.id){
        elementFound = document.getElementById(elem.id);
    }
    if(!elementFound){
        elem = createElement();
    }
    return elem;
};

/**
 * @param message
 * @param [timeout]
 * @returns {*}
 */
exports.flash = function (message, timeout) {

    var elem  = exports.getElem();
    var $body = utils.getBody();

    // return if notify was never initialised
    if (!elem) {
        return false;
    }

    elem.innerHTML     = message;
    elem.style.display = "block";

    $body.appendChild(elem);

    if (timeoutInt) {
        clearTimeout(timeoutInt);
        timeoutInt = undefined;
    }

    timeoutInt = window.setTimeout(function () {
        elem.style.display = "none";
        if (elem.parentNode) {
            $body.removeChild(elem);
        }
    }, timeout || 2000);

    return elem;
};
},{"./browser.utils":2,"./ghostmode.scroll":22}],28:[function(require,module,exports){
"use strict";

/**
 * @type {{emit: emit, on: on}}
 */
var BS = window.___browserSync___ || {};
exports.socket = BS.socket || {
    emit: function(){},
    on: function(){}
};


/**
 * @returns {string}
 */
exports.getPath = function () {
    return window.location.pathname;
};
/**
 * Alias for socket.emit
 * @param name
 * @param data
 */
exports.emit = function (name, data) {
    var socket = exports.socket;
    if (socket && socket.emit) {
        // send relative path of where the event is sent
        data.url = exports.getPath();
        socket.emit(name, data);
    }
};

/**
 * Alias for socket.on
 * @param name
 * @param func
 */
exports.on = function (name, func) {
    exports.socket.on(name, func);
};
},{}],29:[function(require,module,exports){
var utils        = require("./browser.utils");
var emitter      = require("./emitter");
var $document    = utils.getDocument();

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof $document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof $document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
} else if (typeof $document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof $document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

// If the page is hidden, pause the video;
// if the page is shown, play the video
function handleVisibilityChange() {
    if ($document[hidden]) {
        emitter.emit("tab:hidden");
    } else {
        emitter.emit("tab:visible");
    }
}

if (typeof $document.addEventListener === "undefined" ||
    typeof $document[hidden] === "undefined") {
    //console.log('not supported');
} else {
    $document.addEventListener(visibilityChange, handleVisibilityChange, false);
}
},{"./browser.utils":2,"./emitter":5}],30:[function(require,module,exports){
/* jshint ignore:start */
(function(){function h(a){return function(){return this[a]}}function l(a){return function(){return a}}var m=this;
function ba(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function n(a){return"string"==typeof a}function ca(a,b,c){return a.call.apply(a.bind,arguments)}function da(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}
function ea(a,b,c){ea=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ca:da;return ea.apply(null,arguments)}function fa(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=c.slice();b.push.apply(b,arguments);return a.apply(this,b)}}
function q(a){var b=r;function c(){}c.prototype=b.prototype;a.G=b.prototype;a.prototype=new c;a.F=function(a,c,f){for(var g=Array(arguments.length-2),k=2;k<arguments.length;k++)g[k-2]=arguments[k];return b.prototype[c].apply(a,g)}};
/*

 The MIT License

 Copyright (c) 2007 Cybozu Labs, Inc.
 Copyright (c) 2012 Google Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to
 deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 IN THE SOFTWARE.
*/
function t(a,b,c){this.a=a;this.b=b||1;this.f=c||1};var ga=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")};function u(a,b){return-1!=a.indexOf(b)}function ha(a,b){return a<b?-1:a>b?1:0};var v=Array.prototype,ia=v.indexOf?function(a,b,c){return v.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(n(a))return n(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},w=v.forEach?function(a,b,c){v.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=n(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},ja=v.filter?function(a,b,c){return v.filter.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=[],f=0,g=n(a)?
a.split(""):a,k=0;k<d;k++)if(k in g){var p=g[k];b.call(c,p,k,a)&&(e[f++]=p)}return e},x=v.reduce?function(a,b,c,d){d&&(b=ea(b,d));return v.reduce.call(a,b,c)}:function(a,b,c,d){var e=c;w(a,function(c,g){e=b.call(d,e,c,g,a)});return e},ka=v.some?function(a,b,c){return v.some.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=n(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return!0;return!1};
function la(a,b){var c;a:{c=a.length;for(var d=n(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){c=e;break a}c=-1}return 0>c?null:n(a)?a.charAt(c):a[c]}function ma(a){return v.concat.apply(v,arguments)}function na(a,b,c){return 2>=arguments.length?v.slice.call(a,b):v.slice.call(a,b,c)};var y;a:{var oa=m.navigator;if(oa){var pa=oa.userAgent;if(pa){y=pa;break a}}y=""};var qa=u(y,"Opera")||u(y,"OPR"),A=u(y,"Trident")||u(y,"MSIE"),ra=u(y,"Edge"),sa=u(y,"Gecko")&&!(u(y.toLowerCase(),"webkit")&&!u(y,"Edge"))&&!(u(y,"Trident")||u(y,"MSIE"))&&!u(y,"Edge"),ta=u(y.toLowerCase(),"webkit")&&!u(y,"Edge");function ua(){var a=y;if(sa)return/rv\:([^\);]+)(\)|;)/.exec(a);if(ra)return/Edge\/([\d\.]+)/.exec(a);if(A)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(ta)return/WebKit\/(\S+)/.exec(a)}function va(){var a=m.document;return a?a.documentMode:void 0}
var wa=function(){if(qa&&m.opera){var a=m.opera.version;return"function"==ba(a)?a():a}var a="",b=ua();b&&(a=b?b[1]:"");return A&&(b=va(),b>parseFloat(a))?String(b):a}(),xa={};
function ya(a){if(!xa[a]){for(var b=0,c=ga(String(wa)).split("."),d=ga(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var g=c[f]||"",k=d[f]||"",p=RegExp("(\\d*)(\\D*)","g"),z=RegExp("(\\d*)(\\D*)","g");do{var E=p.exec(g)||["","",""],aa=z.exec(k)||["","",""];if(0==E[0].length&&0==aa[0].length)break;b=ha(0==E[1].length?0:parseInt(E[1],10),0==aa[1].length?0:parseInt(aa[1],10))||ha(0==E[2].length,0==aa[2].length)||ha(E[2],aa[2])}while(0==b)}xa[a]=0<=b}}
var za=m.document,Aa=za&&A?va()||("CSS1Compat"==za.compatMode?parseInt(wa,10):5):void 0;var B=A&&!(9<=Aa),Ba=A&&!(8<=Aa);function C(a,b,c,d){this.a=a;this.nodeName=c;this.nodeValue=d;this.nodeType=2;this.parentNode=this.ownerElement=b}function Ca(a,b){var c=Ba&&"href"==b.nodeName?a.getAttribute(b.nodeName,2):b.nodeValue;return new C(b,a,b.nodeName,c)};function Da(a){this.b=a;this.a=0}function Ea(a){a=a.match(Fa);for(var b=0;b<a.length;b++)Ga.test(a[b])&&a.splice(b,1);return new Da(a)}var Fa=RegExp("\\$?(?:(?![0-9-])[\\w-]+:)?(?![0-9-])[\\w-]+|\\/\\/|\\.\\.|::|\\d+(?:\\.\\d*)?|\\.\\d+|\"[^\"]*\"|'[^']*'|[!<>]=|\\s+|.","g"),Ga=/^\s/;function D(a,b){return a.b[a.a+(b||0)]}function F(a){return a.b[a.a++]}function Ha(a){return a.b.length<=a.a};!sa&&!A||A&&9<=Aa||sa&&ya("1.9.1");A&&ya("9");function Ia(a,b){if(a.contains&&1==b.nodeType)return a==b||a.contains(b);if("undefined"!=typeof a.compareDocumentPosition)return a==b||Boolean(a.compareDocumentPosition(b)&16);for(;b&&a!=b;)b=b.parentNode;return b==a}
function Ja(a,b){if(a==b)return 0;if(a.compareDocumentPosition)return a.compareDocumentPosition(b)&2?1:-1;if(A&&!(9<=Aa)){if(9==a.nodeType)return-1;if(9==b.nodeType)return 1}if("sourceIndex"in a||a.parentNode&&"sourceIndex"in a.parentNode){var c=1==a.nodeType,d=1==b.nodeType;if(c&&d)return a.sourceIndex-b.sourceIndex;var e=a.parentNode,f=b.parentNode;return e==f?Ka(a,b):!c&&Ia(e,b)?-1*La(a,b):!d&&Ia(f,a)?La(b,a):(c?a.sourceIndex:e.sourceIndex)-(d?b.sourceIndex:f.sourceIndex)}d=9==a.nodeType?a:a.ownerDocument||
a.document;c=d.createRange();c.selectNode(a);c.collapse(!0);d=d.createRange();d.selectNode(b);d.collapse(!0);return c.compareBoundaryPoints(m.Range.START_TO_END,d)}function La(a,b){var c=a.parentNode;if(c==b)return-1;for(var d=b;d.parentNode!=c;)d=d.parentNode;return Ka(d,a)}function Ka(a,b){for(var c=b;c=c.previousSibling;)if(c==a)return-1;return 1};function G(a){var b=null,c=a.nodeType;1==c&&(b=a.textContent,b=void 0==b||null==b?a.innerText:b,b=void 0==b||null==b?"":b);if("string"!=typeof b)if(B&&"title"==a.nodeName.toLowerCase()&&1==c)b=a.text;else if(9==c||1==c){a=9==c?a.documentElement:a.firstChild;for(var c=0,d=[],b="";a;){do 1!=a.nodeType&&(b+=a.nodeValue),B&&"title"==a.nodeName.toLowerCase()&&(b+=a.text),d[c++]=a;while(a=a.firstChild);for(;c&&!(a=d[--c].nextSibling););}}else b=a.nodeValue;return""+b}
function H(a,b,c){if(null===b)return!0;try{if(!a.getAttribute)return!1}catch(d){return!1}Ba&&"class"==b&&(b="className");return null==c?!!a.getAttribute(b):a.getAttribute(b,2)==c}function Ma(a,b,c,d,e){return(B?Na:Oa).call(null,a,b,n(c)?c:null,n(d)?d:null,e||new I)}
function Na(a,b,c,d,e){if(a instanceof J||8==a.b||c&&null===a.b){var f=b.all;if(!f)return e;a=Pa(a);if("*"!=a&&(f=b.getElementsByTagName(a),!f))return e;if(c){for(var g=[],k=0;b=f[k++];)H(b,c,d)&&g.push(b);f=g}for(k=0;b=f[k++];)"*"==a&&"!"==b.tagName||K(e,b);return e}Qa(a,b,c,d,e);return e}
function Oa(a,b,c,d,e){b.getElementsByName&&d&&"name"==c&&!A?(b=b.getElementsByName(d),w(b,function(b){a.a(b)&&K(e,b)})):b.getElementsByClassName&&d&&"class"==c?(b=b.getElementsByClassName(d),w(b,function(b){b.className==d&&a.a(b)&&K(e,b)})):a instanceof L?Qa(a,b,c,d,e):b.getElementsByTagName&&(b=b.getElementsByTagName(a.f()),w(b,function(a){H(a,c,d)&&K(e,a)}));return e}
function Ra(a,b,c,d,e){var f;if((a instanceof J||8==a.b||c&&null===a.b)&&(f=b.childNodes)){var g=Pa(a);if("*"!=g&&(f=ja(f,function(a){return a.tagName&&a.tagName.toLowerCase()==g}),!f))return e;c&&(f=ja(f,function(a){return H(a,c,d)}));w(f,function(a){"*"==g&&("!"==a.tagName||"*"==g&&1!=a.nodeType)||K(e,a)});return e}return Sa(a,b,c,d,e)}function Sa(a,b,c,d,e){for(b=b.firstChild;b;b=b.nextSibling)H(b,c,d)&&a.a(b)&&K(e,b);return e}
function Qa(a,b,c,d,e){for(b=b.firstChild;b;b=b.nextSibling)H(b,c,d)&&a.a(b)&&K(e,b),Qa(a,b,c,d,e)}function Pa(a){if(a instanceof L){if(8==a.b)return"!";if(null===a.b)return"*"}return a.f()};function I(){this.b=this.a=null;this.l=0}function Ta(a){this.node=a;this.a=this.b=null}function Ua(a,b){if(!a.a)return b;if(!b.a)return a;for(var c=a.a,d=b.a,e=null,f=null,g=0;c&&d;){var f=c.node,k=d.node;f==k||f instanceof C&&k instanceof C&&f.a==k.a?(f=c,c=c.a,d=d.a):0<Ja(c.node,d.node)?(f=d,d=d.a):(f=c,c=c.a);(f.b=e)?e.a=f:a.a=f;e=f;g++}for(f=c||d;f;)f.b=e,e=e.a=f,g++,f=f.a;a.b=e;a.l=g;return a}function Va(a,b){var c=new Ta(b);c.a=a.a;a.b?a.a.b=c:a.a=a.b=c;a.a=c;a.l++}
function K(a,b){var c=new Ta(b);c.b=a.b;a.a?a.b.a=c:a.a=a.b=c;a.b=c;a.l++}function Wa(a){return(a=a.a)?a.node:null}function Xa(a){return(a=Wa(a))?G(a):""}function M(a,b){return new Ya(a,!!b)}function Ya(a,b){this.f=a;this.b=(this.c=b)?a.b:a.a;this.a=null}function N(a){var b=a.b;if(null==b)return null;var c=a.a=b;a.b=a.c?b.b:b.a;return c.node};function Za(a){switch(a.nodeType){case 1:return fa($a,a);case 9:return Za(a.documentElement);case 11:case 10:case 6:case 12:return ab;default:return a.parentNode?Za(a.parentNode):ab}}function ab(){return null}function $a(a,b){if(a.prefix==b)return a.namespaceURI||"http://www.w3.org/1999/xhtml";var c=a.getAttributeNode("xmlns:"+b);return c&&c.specified?c.value||null:a.parentNode&&9!=a.parentNode.nodeType?$a(a.parentNode,b):null};function r(a){this.i=a;this.b=this.g=!1;this.f=null}function O(a){return"\n  "+a.toString().split("\n").join("\n  ")}function bb(a,b){a.g=b}function cb(a,b){a.b=b}function P(a,b){var c=a.a(b);return c instanceof I?+Xa(c):+c}function Q(a,b){var c=a.a(b);return c instanceof I?Xa(c):""+c}function R(a,b){var c=a.a(b);return c instanceof I?!!c.l:!!c};function db(a,b,c){r.call(this,a.i);this.c=a;this.h=b;this.o=c;this.g=b.g||c.g;this.b=b.b||c.b;this.c==eb&&(c.b||c.g||4==c.i||0==c.i||!b.f?b.b||b.g||4==b.i||0==b.i||!c.f||(this.f={name:c.f.name,s:b}):this.f={name:b.f.name,s:c})}q(db);
function S(a,b,c,d,e){b=b.a(d);c=c.a(d);var f;if(b instanceof I&&c instanceof I){e=M(b);for(d=N(e);d;d=N(e))for(b=M(c),f=N(b);f;f=N(b))if(a(G(d),G(f)))return!0;return!1}if(b instanceof I||c instanceof I){b instanceof I?e=b:(e=c,c=b);e=M(e);b=typeof c;for(d=N(e);d;d=N(e)){switch(b){case "number":d=+G(d);break;case "boolean":d=!!G(d);break;case "string":d=G(d);break;default:throw Error("Illegal primitive type for comparison.");}if(a(d,c))return!0}return!1}return e?"boolean"==typeof b||"boolean"==typeof c?
a(!!b,!!c):"number"==typeof b||"number"==typeof c?a(+b,+c):a(b,c):a(+b,+c)}db.prototype.a=function(a){return this.c.m(this.h,this.o,a)};db.prototype.toString=function(){var a="Binary Expression: "+this.c,a=a+O(this.h);return a+=O(this.o)};function fb(a,b,c,d){this.a=a;this.w=b;this.i=c;this.m=d}fb.prototype.toString=h("a");var gb={};function T(a,b,c,d){if(gb.hasOwnProperty(a))throw Error("Binary operator already created: "+a);a=new fb(a,b,c,d);return gb[a.toString()]=a}
T("div",6,1,function(a,b,c){return P(a,c)/P(b,c)});T("mod",6,1,function(a,b,c){return P(a,c)%P(b,c)});T("*",6,1,function(a,b,c){return P(a,c)*P(b,c)});T("+",5,1,function(a,b,c){return P(a,c)+P(b,c)});T("-",5,1,function(a,b,c){return P(a,c)-P(b,c)});T("<",4,2,function(a,b,c){return S(function(a,b){return a<b},a,b,c)});T(">",4,2,function(a,b,c){return S(function(a,b){return a>b},a,b,c)});T("<=",4,2,function(a,b,c){return S(function(a,b){return a<=b},a,b,c)});
T(">=",4,2,function(a,b,c){return S(function(a,b){return a>=b},a,b,c)});var eb=T("=",3,2,function(a,b,c){return S(function(a,b){return a==b},a,b,c,!0)});T("!=",3,2,function(a,b,c){return S(function(a,b){return a!=b},a,b,c,!0)});T("and",2,2,function(a,b,c){return R(a,c)&&R(b,c)});T("or",1,2,function(a,b,c){return R(a,c)||R(b,c)});function hb(a,b){if(b.a.length&&4!=a.i)throw Error("Primary expression must evaluate to nodeset if filter has predicate(s).");r.call(this,a.i);this.c=a;this.h=b;this.g=a.g;this.b=a.b}q(hb);hb.prototype.a=function(a){a=this.c.a(a);return ib(this.h,a)};hb.prototype.toString=function(){var a;a="Filter:"+O(this.c);return a+=O(this.h)};function jb(a,b){if(b.length<a.A)throw Error("Function "+a.j+" expects at least"+a.A+" arguments, "+b.length+" given");if(null!==a.v&&b.length>a.v)throw Error("Function "+a.j+" expects at most "+a.v+" arguments, "+b.length+" given");a.B&&w(b,function(b,d){if(4!=b.i)throw Error("Argument "+d+" to function "+a.j+" is not of type Nodeset: "+b);});r.call(this,a.i);this.h=a;this.c=b;bb(this,a.g||ka(b,function(a){return a.g}));cb(this,a.D&&!b.length||a.C&&!!b.length||ka(b,function(a){return a.b}))}q(jb);
jb.prototype.a=function(a){return this.h.m.apply(null,ma(a,this.c))};jb.prototype.toString=function(){var a="Function: "+this.h;if(this.c.length)var b=x(this.c,function(a,b){return a+O(b)},"Arguments:"),a=a+O(b);return a};function kb(a,b,c,d,e,f,g,k,p){this.j=a;this.i=b;this.g=c;this.D=d;this.C=e;this.m=f;this.A=g;this.v=void 0!==k?k:g;this.B=!!p}kb.prototype.toString=h("j");var lb={};
function U(a,b,c,d,e,f,g,k){if(lb.hasOwnProperty(a))throw Error("Function already created: "+a+".");lb[a]=new kb(a,b,c,d,!1,e,f,g,k)}U("boolean",2,!1,!1,function(a,b){return R(b,a)},1);U("ceiling",1,!1,!1,function(a,b){return Math.ceil(P(b,a))},1);U("concat",3,!1,!1,function(a,b){var c=na(arguments,1);return x(c,function(b,c){return b+Q(c,a)},"")},2,null);U("contains",2,!1,!1,function(a,b,c){return u(Q(b,a),Q(c,a))},2);U("count",1,!1,!1,function(a,b){return b.a(a).l},1,1,!0);
U("false",2,!1,!1,l(!1),0);U("floor",1,!1,!1,function(a,b){return Math.floor(P(b,a))},1);U("id",4,!1,!1,function(a,b){function c(a){if(B){var b=e.all[a];if(b){if(b.nodeType&&a==b.id)return b;if(b.length)return la(b,function(b){return a==b.id})}return null}return e.getElementById(a)}var d=a.a,e=9==d.nodeType?d:d.ownerDocument,d=Q(b,a).split(/\s+/),f=[];w(d,function(a){a=c(a);!a||0<=ia(f,a)||f.push(a)});f.sort(Ja);var g=new I;w(f,function(a){K(g,a)});return g},1);U("lang",2,!1,!1,l(!1),1);
U("last",1,!0,!1,function(a){if(1!=arguments.length)throw Error("Function last expects ()");return a.f},0);U("local-name",3,!1,!0,function(a,b){var c=b?Wa(b.a(a)):a.a;return c?c.localName||c.nodeName.toLowerCase():""},0,1,!0);U("name",3,!1,!0,function(a,b){var c=b?Wa(b.a(a)):a.a;return c?c.nodeName.toLowerCase():""},0,1,!0);U("namespace-uri",3,!0,!1,l(""),0,1,!0);U("normalize-space",3,!1,!0,function(a,b){return(b?Q(b,a):G(a.a)).replace(/[\s\xa0]+/g," ").replace(/^\s+|\s+$/g,"")},0,1);
U("not",2,!1,!1,function(a,b){return!R(b,a)},1);U("number",1,!1,!0,function(a,b){return b?P(b,a):+G(a.a)},0,1);U("position",1,!0,!1,function(a){return a.b},0);U("round",1,!1,!1,function(a,b){return Math.round(P(b,a))},1);U("starts-with",2,!1,!1,function(a,b,c){b=Q(b,a);a=Q(c,a);return 0==b.lastIndexOf(a,0)},2);U("string",3,!1,!0,function(a,b){return b?Q(b,a):G(a.a)},0,1);U("string-length",1,!1,!0,function(a,b){return(b?Q(b,a):G(a.a)).length},0,1);
U("substring",3,!1,!1,function(a,b,c,d){c=P(c,a);if(isNaN(c)||Infinity==c||-Infinity==c)return"";d=d?P(d,a):Infinity;if(isNaN(d)||-Infinity===d)return"";c=Math.round(c)-1;var e=Math.max(c,0);a=Q(b,a);if(Infinity==d)return a.substring(e);b=Math.round(d);return a.substring(e,c+b)},2,3);U("substring-after",3,!1,!1,function(a,b,c){b=Q(b,a);a=Q(c,a);c=b.indexOf(a);return-1==c?"":b.substring(c+a.length)},2);
U("substring-before",3,!1,!1,function(a,b,c){b=Q(b,a);a=Q(c,a);a=b.indexOf(a);return-1==a?"":b.substring(0,a)},2);U("sum",1,!1,!1,function(a,b){for(var c=M(b.a(a)),d=0,e=N(c);e;e=N(c))d+=+G(e);return d},1,1,!0);U("translate",3,!1,!1,function(a,b,c,d){b=Q(b,a);c=Q(c,a);var e=Q(d,a);a=[];for(d=0;d<c.length;d++){var f=c.charAt(d);f in a||(a[f]=e.charAt(d))}c="";for(d=0;d<b.length;d++)f=b.charAt(d),c+=f in a?a[f]:f;return c},3);U("true",2,!1,!1,l(!0),0);function L(a,b){this.h=a;this.c=void 0!==b?b:null;this.b=null;switch(a){case "comment":this.b=8;break;case "text":this.b=3;break;case "processing-instruction":this.b=7;break;case "node":break;default:throw Error("Unexpected argument");}}function mb(a){return"comment"==a||"text"==a||"processing-instruction"==a||"node"==a}L.prototype.a=function(a){return null===this.b||this.b==a.nodeType};L.prototype.f=h("h");L.prototype.toString=function(){var a="Kind Test: "+this.h;null===this.c||(a+=O(this.c));return a};function nb(a){r.call(this,3);this.c=a.substring(1,a.length-1)}q(nb);nb.prototype.a=h("c");nb.prototype.toString=function(){return"Literal: "+this.c};function J(a,b){this.j=a.toLowerCase();this.c=b?b.toLowerCase():"http://www.w3.org/1999/xhtml"}J.prototype.a=function(a){var b=a.nodeType;return 1!=b&&2!=b?!1:"*"!=this.j&&this.j!=a.nodeName.toLowerCase()?!1:this.c==(a.namespaceURI?a.namespaceURI.toLowerCase():"http://www.w3.org/1999/xhtml")};J.prototype.f=h("j");J.prototype.toString=function(){return"Name Test: "+("http://www.w3.org/1999/xhtml"==this.c?"":this.c+":")+this.j};function ob(a){r.call(this,1);this.c=a}q(ob);ob.prototype.a=h("c");ob.prototype.toString=function(){return"Number: "+this.c};function pb(a,b){r.call(this,a.i);this.h=a;this.c=b;this.g=a.g;this.b=a.b;if(1==this.c.length){var c=this.c[0];c.u||c.c!=qb||(c=c.o,"*"!=c.f()&&(this.f={name:c.f(),s:null}))}}q(pb);function rb(){r.call(this,4)}q(rb);rb.prototype.a=function(a){var b=new I;a=a.a;9==a.nodeType?K(b,a):K(b,a.ownerDocument);return b};rb.prototype.toString=l("Root Helper Expression");function sb(){r.call(this,4)}q(sb);sb.prototype.a=function(a){var b=new I;K(b,a.a);return b};sb.prototype.toString=l("Context Helper Expression");
function tb(a){return"/"==a||"//"==a}pb.prototype.a=function(a){var b=this.h.a(a);if(!(b instanceof I))throw Error("Filter expression must evaluate to nodeset.");a=this.c;for(var c=0,d=a.length;c<d&&b.l;c++){var e=a[c],f=M(b,e.c.a),g;if(e.g||e.c!=ub)if(e.g||e.c!=vb)for(g=N(f),b=e.a(new t(g));null!=(g=N(f));)g=e.a(new t(g)),b=Ua(b,g);else g=N(f),b=e.a(new t(g));else{for(g=N(f);(b=N(f))&&(!g.contains||g.contains(b))&&b.compareDocumentPosition(g)&8;g=b);b=e.a(new t(g))}}return b};
pb.prototype.toString=function(){var a;a="Path Expression:"+O(this.h);if(this.c.length){var b=x(this.c,function(a,b){return a+O(b)},"Steps:");a+=O(b)}return a};function wb(a,b){this.a=a;this.b=!!b}
function ib(a,b,c){for(c=c||0;c<a.a.length;c++)for(var d=a.a[c],e=M(b),f=b.l,g,k=0;g=N(e);k++){var p=a.b?f-k:k+1;g=d.a(new t(g,p,f));if("number"==typeof g)p=p==g;else if("string"==typeof g||"boolean"==typeof g)p=!!g;else if(g instanceof I)p=0<g.l;else throw Error("Predicate.evaluate returned an unexpected type.");if(!p){p=e;g=p.f;var z=p.a;if(!z)throw Error("Next must be called at least once before remove.");var E=z.b,z=z.a;E?E.a=z:g.a=z;z?z.b=E:g.b=E;g.l--;p.a=null}}return b}
wb.prototype.toString=function(){return x(this.a,function(a,b){return a+O(b)},"Predicates:")};function V(a,b,c,d){r.call(this,4);this.c=a;this.o=b;this.h=c||new wb([]);this.u=!!d;b=this.h;b=0<b.a.length?b.a[0].f:null;a.b&&b&&(a=b.name,a=B?a.toLowerCase():a,this.f={name:a,s:b.s});a:{a=this.h;for(b=0;b<a.a.length;b++)if(c=a.a[b],c.g||1==c.i||0==c.i){a=!0;break a}a=!1}this.g=a}q(V);
V.prototype.a=function(a){var b=a.a,c=null,c=this.f,d=null,e=null,f=0;c&&(d=c.name,e=c.s?Q(c.s,a):null,f=1);if(this.u)if(this.g||this.c!=xb)if(a=M((new V(yb,new L("node"))).a(a)),b=N(a))for(c=this.m(b,d,e,f);null!=(b=N(a));)c=Ua(c,this.m(b,d,e,f));else c=new I;else c=Ma(this.o,b,d,e),c=ib(this.h,c,f);else c=this.m(a.a,d,e,f);return c};V.prototype.m=function(a,b,c,d){a=this.c.f(this.o,a,b,c);return a=ib(this.h,a,d)};
V.prototype.toString=function(){var a;a="Step:"+O("Operator: "+(this.u?"//":"/"));this.c.j&&(a+=O("Axis: "+this.c));a+=O(this.o);if(this.h.a.length){var b=x(this.h.a,function(a,b){return a+O(b)},"Predicates:");a+=O(b)}return a};function zb(a,b,c,d){this.j=a;this.f=b;this.a=c;this.b=d}zb.prototype.toString=h("j");var Ab={};function W(a,b,c,d){if(Ab.hasOwnProperty(a))throw Error("Axis already created: "+a);b=new zb(a,b,c,!!d);return Ab[a]=b}
W("ancestor",function(a,b){for(var c=new I,d=b;d=d.parentNode;)a.a(d)&&Va(c,d);return c},!0);W("ancestor-or-self",function(a,b){var c=new I,d=b;do a.a(d)&&Va(c,d);while(d=d.parentNode);return c},!0);
var qb=W("attribute",function(a,b){var c=new I,d=a.f();if("style"==d&&b.style&&B)return K(c,new C(b.style,b,"style",b.style.cssText)),c;var e=b.attributes;if(e)if(a instanceof L&&null===a.b||"*"==d)for(var d=0,f;f=e[d];d++)B?f.nodeValue&&K(c,Ca(b,f)):K(c,f);else(f=e.getNamedItem(d))&&(B?f.nodeValue&&K(c,Ca(b,f)):K(c,f));return c},!1),xb=W("child",function(a,b,c,d,e){return(B?Ra:Sa).call(null,a,b,n(c)?c:null,n(d)?d:null,e||new I)},!1,!0);W("descendant",Ma,!1,!0);
var yb=W("descendant-or-self",function(a,b,c,d){var e=new I;H(b,c,d)&&a.a(b)&&K(e,b);return Ma(a,b,c,d,e)},!1,!0),ub=W("following",function(a,b,c,d){var e=new I;do for(var f=b;f=f.nextSibling;)H(f,c,d)&&a.a(f)&&K(e,f),e=Ma(a,f,c,d,e);while(b=b.parentNode);return e},!1,!0);W("following-sibling",function(a,b){for(var c=new I,d=b;d=d.nextSibling;)a.a(d)&&K(c,d);return c},!1);W("namespace",function(){return new I},!1);
var Bb=W("parent",function(a,b){var c=new I;if(9==b.nodeType)return c;if(2==b.nodeType)return K(c,b.ownerElement),c;var d=b.parentNode;a.a(d)&&K(c,d);return c},!1),vb=W("preceding",function(a,b,c,d){var e=new I,f=[];do f.unshift(b);while(b=b.parentNode);for(var g=1,k=f.length;g<k;g++){var p=[];for(b=f[g];b=b.previousSibling;)p.unshift(b);for(var z=0,E=p.length;z<E;z++)b=p[z],H(b,c,d)&&a.a(b)&&K(e,b),e=Ma(a,b,c,d,e)}return e},!0,!0);
W("preceding-sibling",function(a,b){for(var c=new I,d=b;d=d.previousSibling;)a.a(d)&&Va(c,d);return c},!0);var Cb=W("self",function(a,b){var c=new I;a.a(b)&&K(c,b);return c},!1);function Db(a){r.call(this,1);this.c=a;this.g=a.g;this.b=a.b}q(Db);Db.prototype.a=function(a){return-P(this.c,a)};Db.prototype.toString=function(){return"Unary Expression: -"+O(this.c)};function Eb(a){r.call(this,4);this.c=a;bb(this,ka(this.c,function(a){return a.g}));cb(this,ka(this.c,function(a){return a.b}))}q(Eb);Eb.prototype.a=function(a){var b=new I;w(this.c,function(c){c=c.a(a);if(!(c instanceof I))throw Error("Path expression must evaluate to NodeSet.");b=Ua(b,c)});return b};Eb.prototype.toString=function(){return x(this.c,function(a,b){return a+O(b)},"Union Expression:")};function Fb(a,b){this.a=a;this.b=b}function Gb(a){for(var b,c=[];;){X(a,"Missing right hand side of binary expression.");b=Hb(a);var d=F(a.a);if(!d)break;var e=(d=gb[d]||null)&&d.w;if(!e){a.a.a--;break}for(;c.length&&e<=c[c.length-1].w;)b=new db(c.pop(),c.pop(),b);c.push(b,d)}for(;c.length;)b=new db(c.pop(),c.pop(),b);return b}function X(a,b){if(Ha(a.a))throw Error(b);}function Ib(a,b){var c=F(a.a);if(c!=b)throw Error("Bad token, expected: "+b+" got: "+c);}
function Jb(a){a=F(a.a);if(")"!=a)throw Error("Bad token: "+a);}function Kb(a){a=F(a.a);if(2>a.length)throw Error("Unclosed literal string");return new nb(a)}function Lb(a){var b=F(a.a),c=b.indexOf(":");if(-1==c)return new J(b);var d=b.substring(0,c);a=a.b(d);if(!a)throw Error("Namespace prefix not declared: "+d);b=b.substr(c+1);return new J(b,a)}
function Mb(a){var b,c=[],d;if(tb(D(a.a))){b=F(a.a);d=D(a.a);if("/"==b&&(Ha(a.a)||"."!=d&&".."!=d&&"@"!=d&&"*"!=d&&!/(?![0-9])[\w]/.test(d)))return new rb;d=new rb;X(a,"Missing next location step.");b=Nb(a,b);c.push(b)}else{a:{b=D(a.a);d=b.charAt(0);switch(d){case "$":throw Error("Variable reference not allowed in HTML XPath");case "(":F(a.a);b=Gb(a);X(a,'unclosed "("');Ib(a,")");break;case '"':case "'":b=Kb(a);break;default:if(isNaN(+b))if(!mb(b)&&/(?![0-9])[\w]/.test(d)&&"("==D(a.a,1)){b=F(a.a);
b=lb[b]||null;F(a.a);for(d=[];")"!=D(a.a);){X(a,"Missing function argument list.");d.push(Gb(a));if(","!=D(a.a))break;F(a.a)}X(a,"Unclosed function argument list.");Jb(a);b=new jb(b,d)}else{b=null;break a}else b=new ob(+F(a.a))}"["==D(a.a)&&(d=new wb(Ob(a)),b=new hb(b,d))}if(b)if(tb(D(a.a)))d=b;else return b;else b=Nb(a,"/"),d=new sb,c.push(b)}for(;tb(D(a.a));)b=F(a.a),X(a,"Missing next location step."),b=Nb(a,b),c.push(b);return new pb(d,c)}
function Nb(a,b){var c,d,e;if("/"!=b&&"//"!=b)throw Error('Step op should be "/" or "//"');if("."==D(a.a))return d=new V(Cb,new L("node")),F(a.a),d;if(".."==D(a.a))return d=new V(Bb,new L("node")),F(a.a),d;var f;if("@"==D(a.a))f=qb,F(a.a),X(a,"Missing attribute name");else if("::"==D(a.a,1)){if(!/(?![0-9])[\w]/.test(D(a.a).charAt(0)))throw Error("Bad token: "+F(a.a));c=F(a.a);f=Ab[c]||null;if(!f)throw Error("No axis with name: "+c);F(a.a);X(a,"Missing node name")}else f=xb;c=D(a.a);if(/(?![0-9])[\w]/.test(c.charAt(0)))if("("==
D(a.a,1)){if(!mb(c))throw Error("Invalid node type: "+c);c=F(a.a);if(!mb(c))throw Error("Invalid type name: "+c);Ib(a,"(");X(a,"Bad nodetype");e=D(a.a).charAt(0);var g=null;if('"'==e||"'"==e)g=Kb(a);X(a,"Bad nodetype");Jb(a);c=new L(c,g)}else c=Lb(a);else if("*"==c)c=Lb(a);else throw Error("Bad token: "+F(a.a));e=new wb(Ob(a),f.a);return d||new V(f,c,e,"//"==b)}
function Ob(a){for(var b=[];"["==D(a.a);){F(a.a);X(a,"Missing predicate expression.");var c=Gb(a);b.push(c);X(a,"Unclosed predicate expression.");Ib(a,"]")}return b}function Hb(a){if("-"==D(a.a))return F(a.a),new Db(Hb(a));var b=Mb(a);if("|"!=D(a.a))a=b;else{for(b=[b];"|"==F(a.a);)X(a,"Missing next union location path."),b.push(Mb(a));a.a.a--;a=new Eb(b)}return a};function Pb(a,b){if(!a.length)throw Error("Empty XPath expression.");var c=Ea(a);if(Ha(c))throw Error("Invalid XPath expression.");b?"function"==ba(b)||(b=ea(b.lookupNamespaceURI,b)):b=l(null);var d=Gb(new Fb(c,b));if(!Ha(c))throw Error("Bad token: "+F(c));this.evaluate=function(a,b){var c=d.a(new t(a));return new Y(c,b)}}
function Y(a,b){if(0==b)if(a instanceof I)b=4;else if("string"==typeof a)b=2;else if("number"==typeof a)b=1;else if("boolean"==typeof a)b=3;else throw Error("Unexpected evaluation result.");if(2!=b&&1!=b&&3!=b&&!(a instanceof I))throw Error("value could not be converted to the specified type");this.resultType=b;var c;switch(b){case 2:this.stringValue=a instanceof I?Xa(a):""+a;break;case 1:this.numberValue=a instanceof I?+Xa(a):+a;break;case 3:this.booleanValue=a instanceof I?0<a.l:!!a;break;case 4:case 5:case 6:case 7:var d=
M(a);c=[];for(var e=N(d);e;e=N(d))c.push(e instanceof C?e.a:e);this.snapshotLength=a.l;this.invalidIteratorState=!1;break;case 8:case 9:d=Wa(a);this.singleNodeValue=d instanceof C?d.a:d;break;default:throw Error("Unknown XPathResult type.");}var f=0;this.iterateNext=function(){if(4!=b&&5!=b)throw Error("iterateNext called with wrong result type");return f>=c.length?null:c[f++]};this.snapshotItem=function(a){if(6!=b&&7!=b)throw Error("snapshotItem called with wrong result type");return a>=c.length||
0>a?null:c[a]}}Y.ANY_TYPE=0;Y.NUMBER_TYPE=1;Y.STRING_TYPE=2;Y.BOOLEAN_TYPE=3;Y.UNORDERED_NODE_ITERATOR_TYPE=4;Y.ORDERED_NODE_ITERATOR_TYPE=5;Y.UNORDERED_NODE_SNAPSHOT_TYPE=6;Y.ORDERED_NODE_SNAPSHOT_TYPE=7;Y.ANY_UNORDERED_NODE_TYPE=8;Y.FIRST_ORDERED_NODE_TYPE=9;function Qb(a){this.lookupNamespaceURI=Za(a)}
function Rb(a){a=a||m;var b=a.document;b.evaluate||(a.XPathResult=Y,b.evaluate=function(a,b,e,f){return(new Pb(a,e)).evaluate(b,f)},b.createExpression=function(a,b){return new Pb(a,b)},b.createNSResolver=function(a){return new Qb(a)})}var Sb=["wgxpath","install"],Z=m;Sb[0]in Z||!Z.execScript||Z.execScript("var "+Sb[0]);for(var Tb;Sb.length&&(Tb=Sb.shift());)Sb.length||void 0===Rb?Z[Tb]?Z=Z[Tb]:Z=Z[Tb]={}:Z[Tb]=Rb;})()
/* jshint ignore:end */
},{}]},{},[26]);
