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

        var elem = bs.utils.getElement(data);

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