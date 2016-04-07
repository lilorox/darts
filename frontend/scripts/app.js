/**
 * @license app.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */
require.config({
    shim: {
        bootstrap: { deps: ["jquery"] },
        select2: { deps: ["jquery"] }
    },
    baseUrl: "/scripts",
    paths: {
        jquery: "libs/jquery/jquery.min.js",
        bootstrap: "libs/bootstrap/bootstrap.min.js",
        select2: "libs/select2/select2.min.js",
        handlebars: "libs/handlebars/handlebars.min.js",
    }
});

require(["app/main"]);
