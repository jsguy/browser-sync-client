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

        var elem = bs.utils.getElement(data);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerMouseUpDown(elem, EVENT_NAME);
        }
    };
};