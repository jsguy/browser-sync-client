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

        var elem = bs.utils.getElement(data),
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