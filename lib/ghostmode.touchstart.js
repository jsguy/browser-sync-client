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

            return new doc.window.Touch({
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