/**
 * @license app.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

/**
 * This config file is only used for the development environment.
 * On the production environment, the scripts are compiled using
 * the requirejs compiler of gulp. The configuration for the compiling
 * is in the gulpfile.js, in the 'scripts' task.
 */
require.config({
    baseUrl: "scripts/app",
    nodeIdCompat: true,
    shim: {
        boostrap: { deps: [ 'jquery' ] },
        select2: { deps: [ 'jquery' ] },
        highcharts: {
            deps: [ 'jquery' ],
            exports: 'Highcharts'
        }
    },
    paths: {
        jquery: "../../libs/jquery",
        bootstrap: "../../libs/bootstrap",
        select2: "../../libs/select2",
        handlebars: "../../libs/handlebars",
        highcharts: "../../libs/highcharts",
        d3: "../../libs/d3",
    }
});

require(['main']);
