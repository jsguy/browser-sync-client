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

        var elem = bs.utils.getElement(data),
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