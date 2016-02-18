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
            var elem = event.target || event.srcElement,
                elem2 = elem.parentNode;

            bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem));

            //  Mouseover parents as well - for 
            //  some reason mousover doesn't like to bubble
            if(typeof elem2 !== "undefined") {
                while(elem2 && elem2 !== document.body) {
                    bs.socket.emit(EVENT_NAME, bs.utils.getElementData(elem2));
                    elem2 = elem2.parentNode;
                }
            }
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

        var elem = bs.utils.getElementByXpath(data.xpath);

        //  Apply classname to element
        bs.utils.addClass(elem, "browser-sync-hover");

        if (elem) {
            exports.canEmitEvents = false;
            //  We want to apply 
            eventManager.triggerEvent(elem, EVENT_NAME, "MouseEvents");
        }
    };
};