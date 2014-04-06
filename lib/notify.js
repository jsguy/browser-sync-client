"use strict";

var scroll = require("./ghostmode.scroll");

var styles = [
    "background-color: black",
    "color: white",
    "padding: 10px",
    "display: none",
    "font-family: sans-serif",
    "position: absolute",
    "z-index: 9999",
    "right: 0px",
    "border-bottom-left-radius: 5px"
];

var browserSync;
var elem;
var options;

/**
 * @param {BrowserSync} bs
 * @returns {*}
 */
module.exports.init = function (bs) {

    browserSync = bs;
    options     = bs.opts;

    var cssStyles = styles;

    if (options.notify.styles) {
        cssStyles = options.notify.styles;
    }

    elem = document.createElement("DIV");
    elem.id = "notifyElem";
    elem.style.cssText = cssStyles.join(";");
    document.getElementsByTagName("body")[0].appendChild(elem);

    browserSync.emitter.on("notify", function (data) {
        exports.flash(data.message);
    });

    return elem;
};

/**
 * @param message
 * @param [timeout]
 * @returns {*}
 */
module.exports.flash = function (message, timeout) {

    // return if notify was never initialised
    if (!elem) {
        return;
    }

    var html = document.getElementsByTagName("HTML")[0];
    html.style.position = "relative";

    elem.innerHTML = message;
    elem.style.top = browserSync.utils.getScrollPosition().y + "px";
    elem.style.display = "block";

    window.setTimeout(function () {
        elem.style.display = "none";
    }, timeout || 2000);

    return elem;
};