"use strict";

var eventManager = require("./events").manager;

exports.plugins = {
	"scroll":		require("./ghostmode.scroll"),
	"clicks":		require("./ghostmode.clicks"),
	"forms":		require("./ghostmode.forms"),
	"location":		require("./ghostmode.location"),
	"mouseup":		require("./ghostmode.mouseup"),
	"mousedown":	require("./ghostmode.mousedown"),
	"mouseover":	require("./ghostmode.mouseover"),
	"touchstart":	require("./ghostmode.touchstart"),
	"touchmove":	require("./ghostmode.touchmove"),
	"touchend":		require("./ghostmode.touchend")
};

/**
 * Load plugins for enabled options
 * @param bs
 */
exports.init = function (bs) {
	for (var name in exports.plugins) {
		exports.plugins[name].init(bs, eventManager);
	}
};