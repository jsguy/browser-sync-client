"use strict";

exports.plugins = {
    "inputs":           require("./ghostmode.forms.input"),
    "change":           require("./ghostmode.forms.change"),
    "toggles":          require("./ghostmode.forms.toggles"),
    "submit":           require("./ghostmode.forms.submit"),
    "keydown":          require('./ghostmode.forms.keydown.js'),
    "keypress":         require('./ghostmode.forms.keypress.js'),
    "contenteditable":  require('./ghostmode.forms.contenteditable.js')
};

/**
 * Load plugins for enabled options
 * @param bs
 */
exports.init = function (bs, eventManager) {

    var checkOpt = true;
    var options = bs.options.ghostMode.forms;

    if (options === true) {
        checkOpt = false;
    }

    function init(name) {
        exports.plugins[name].init(bs, eventManager);
    }

    for (var name in exports.plugins) {
        if (!checkOpt) {
            init(name);
        } else {
            if (options[name]) {
                init(name);
            }
        }
    }
};