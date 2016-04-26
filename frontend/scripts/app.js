/**
 * @license app.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */
require.config({
    baseUrl: "/scripts/app",
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
        jquery: "/scripts/libs/jquery/jquery.min",
        bootstrap: "/scripts/libs/bootstrap/bootstrap.min",
        select2: "/scripts/libs/select2/select2.min",
        handlebars: "/scripts/libs/handlebars/handlebars.min",
        highcharts: "/scripts/libs/highcharts/highcharts",
        d3: "/scripts/libs/d3/d3.min",
    }
});

require(['main']);
