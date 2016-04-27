/**
 * @license app.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */
require.config({
    baseUrl: "scripts/app",
    nodeIdCompat: true,
    shim: {
        bootstrap: { deps: ["jquery"] },
        select2: { deps: ["jquery"] },
        highcharts: {
            exports: 'Highcharts',
            deps: ["jquery"]
        }
    },
    paths: {
        jquery: "../libs/jquery/jquery.min",
        bootstrap: "../libs/bootstrap/bootstrap.min",
        select2: "../libs/select2/select2.min",
        handlebars: "../libs/handlebars/handlebars.min",
        highcharts: "../libs/highcharts/highcharts",
        d3: "../libs/d3/d3.min",
    }
});

require(['main']);
