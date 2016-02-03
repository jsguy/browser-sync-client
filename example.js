var bs     = require("browser-sync").create();
var client = require("./");

client["plugin:name"] = "client:script";

bs.use(client);

bs.init({
    //server: {
    //    baseDir: ["test/fixtures"]
    //},
    //proxy: 'http://localhost:8080',
    proxy: 'http://app.edulastic.com',
    open: false,
    minify: false,
    snippetOptions: {
        rule: {
            //match: /SHNAE/,
            match: /<\/head>/i,
            fn: function (snippet) {
                return snippet + "\n</head>";
            }
        }
    },
    clientEvents: [
        "scroll",
        "input:text",
        "input:toggles",
        "input:keydown",
        "input:keypress",
        "form:submit",
        "form:reset",
        "click",
        "contenteditable:input",
        "mouseup",
        "mousedown",
        "select:change"
    ],
    ghostMode: {
        clicks: true,
        scroll: true,
        forms: {
            submit: true,
            inputs: true,
            toggles: true,
            keypress: true,
            keydown: true,
            contenteditable: true,
            change: true
        },
        mouseup: true,
        mousedown: true
    },
    capture:true
});
