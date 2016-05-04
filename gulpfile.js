'use strict';

var config = {
    styles: [
        'bower_components/bootstrap/dist/css/bootstrap.css',
        'bower_components/bootstrap/dist/css/bootstrap-theme.css',
        'bower_components/select2/dist/css/select2.css',
        'bower_components/select2-bootstrap/select2-bootstrap.css',
        'bower_components/select2-bootstrap/select2-bootstrap.css',
        'frontend/css/*.css',
    ],
    fonts: [
        'bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff',
        'bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff2',
    ],
    images: [
        'frontend/css/images/*'
    ],
    templates: [
        'frontend/templates/*.hbs'
    ],
    index: 'frontend/index.tmpl.html'
};

var gulp = require('gulp'),
    bower = require('gulp-bower'),
    concat = require('gulp-concat'),
    debug = require('gulp-debug'),
    del = require('del'),
    inject = require('gulp-inject'),
    insert = require('gulp-insert'),
    merge = require('merge-stream'),
    minifyCSS = require('gulp-minify-css'),
    pjson = require('./package.json'),
    rename = require('gulp-rename'),
    requirejsOptimize = require('gulp-requirejs-optimize'),
    versionString = '/** darts v' + pjson.version + ' Copyright (C) 2016 Pierre Gaxatte; Released under GPLv3 license, see the LICENSE file at the root of the project at https://github.com/lilorox/darts */\n',
    destDir = 'dist/';

/**
 * Empty the destDir
 */
gulp.task('clean', function() {
    return del([ destDir ]);
});


/**
 * Runs bower to install dependencies
 */
gulp.task('bower', function() {
    return bower();
});

gulp.task('prepare', [ 'clean', 'bower' ]);

/**
 * Builds the index page
 */
gulp.task('index', [ 'scripts', 'styles', 'fonts', 'images' ], function() {
    var sources = gulp.src([
            './**/*.js',
            './**/*.css'
        ], {
            read: false,
            cwd: __dirname + '/' + destDir
        }),
        transform = function(filepath) {
            if(filepath.slice(-3) === '.js') {
                return '<script data-main="scripts/main" src="' + filepath + '"></script>';
            }
            return inject.transform.apply(inject.transform, arguments);
        };

    return gulp.src(config.index)
        .pipe(inject(sources, { addRootSlash: false, transform: transform }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest(destDir));
});

/**
 * Copies the templates
 */
gulp.task('templates', [ 'prepare' ], function() {
    return gulp.src(config.templates)
        .pipe(gulp.dest(destDir + 'templates'));
});

/**
 * Merges and minifies the CSS
 */
gulp.task('styles', [ 'prepare' ], function() {
    return gulp.src(config.styles)
            .pipe(concat('darts.min.css'))
            .pipe(minifyCSS())
            .pipe(gulp.dest(destDir + 'css'));
});

/**
 * Copies the fonts
 */
gulp.task('fonts', [ 'prepare' ], function() {
    return gulp.src(config.fonts)
            .pipe(gulp.dest(destDir + 'css/fonts'));
});

/**
 * Copies the images
 */
gulp.task('images', [ 'prepare' ], function() {
    return gulp.src(config.images)
            .pipe(gulp.dest(destDir + 'css/images'));
});

/**
 * Compiles the requirejs code and prepends the license
 */
gulp.task('scripts', [ 'prepare' ], function() {
    return gulp.src('frontend/scripts/app/main.js')
        .pipe(requirejsOptimize({
            baseUrl: 'frontend/scripts/app',
            name: 'main',
            shim: {
                bootstrap: { deps: ["jquery"] },
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
        }))
        .pipe(insert.prepend(versionString))
        .pipe(rename('darts.min.js'))
        .pipe(gulp.dest(destDir + 'scripts'));
});

gulp.task('default', [ 'index', 'templates' ]);
