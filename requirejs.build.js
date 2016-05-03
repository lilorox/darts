({
    baseUrl: 'frontend/scripts/app',
    name: 'main',
    out: 'dist/scripts/main.js',
    shim: {
//        bootstrap: { deps: ["jquery"] },
        select2: { deps: ["jquery"] },
        highcharts: {
            exports: 'Highcharts',
            deps: ["jquery"]
        }
    },
    preserveLicenseComments: false,
    paths: {
        jquery: '../../../bower_components/jquery/dist/jquery',
        bootstrap: '../../../bower_components/bootstrap/dist/js/bootstrap',
        select2: '../../../bower_components/select2/dist/js/select2',
        handlebars: '../../../bower_components/handlebars/handlebars',
        highcharts: '../../../bower_components/highcharts/highcharts',
        d3: '../../../bower_components/d3/d3',
        requirelib: '../../../bower_components/requirejs/require'
    },
    optimize: 'none',
    include: [ 'requirelib', 'bootstrap' ]
});
