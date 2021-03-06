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
        if(doc && doc.createTouch && (i === "touches" || i === "changedTouches" || i === "targetTouches")) {
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

        var elem = bs.utils.getElement(data);

        if (elem) {
            exports.canEmitEvents = false;
            eventManager.triggerEvent(elem, EVENT_NAME, null, createTouchList(elem, data.event));
        }
    };
};