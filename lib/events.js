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
                elem.addEventListener(type, data.dispatcher, (bs && bs.options.capture) || false);
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
 */
/*
exports.triggerEvent = function(elem, type){
    var evObj;

    window.setTimeout(function () {
        // IE
        if (document.createEventObject){
            evObj = document.createEventObject();
            evObj.cancelBubble = true;
            return elem.fireEvent("on" + type, evObj);
        } else {
            evObj = document.createEvent(type.toLowerCase() === "click"? "MouseEvents": "HTMLEvents");
            evObj.initEvent(type, true, true);
            return !elem.dispatchEvent(evObj);
        }
    }, 0);
};
*/

exports.triggerEvent = function(elem, type, name, args){
    var evObj,
        addArgs = function(e, args) {
            var i;
            args = args || {};
            for(i in args) {if(args.hasOwnProperty(i)){
                e[i] = args[i];
            }}
        };

    name = name || typeof type !=="undefined" && type.toLowerCase() === "click"? 
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



