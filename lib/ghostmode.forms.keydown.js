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

        var elem = bs.utils.getElement(data);

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