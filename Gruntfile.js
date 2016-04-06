module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        bowercopy: {
            options: {
                srcPrefix: 'bower_components'
            },
            scripts: {
                options: {
                    destPrefix: 'frontend/scripts/libs'
                },
                files: {
                    'requirejs/require.js': 'requirejs/require.js',
                    'jquery/jquery.min.js': 'jquery/dist/jquery.min.js',
                    'bootstrap/bootstrap.min.js': 'bootstrap/dist/js/bootstrap.min.js',
                    'select2/select2.min.js': 'select2/dist/js/select2.min.js',
                    'handlebars/handlebars.min.js': 'handlebars/handlebars.min.js',
                }
            },
            css: {
                options: {
                    destPrefix: 'frontend/css/libs'
                },
                files: {
                    'bootstrap/bootstrap.min.css': 'bootstrap/dist/css/bootstrap.min.css',
                    'fonts/glyphicons-halflings-regular.woff': 'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
                    'bootstrap/bootstrap-theme.min.css': 'bootstrap/dist/css/bootstrap-theme.min.css',
                    'select2/select2.min.css': 'select2/dist/css/select2.min.css',
                    'select2/select2-bootstrap.css': 'select2-bootstrap/select2-bootstrap.css',
                }
            },
            fonts: {
                options: {
                    destPrefix: 'frontend/css/libs/fonts'
                },
                files: {
                    'glyphicons-halflings-regular.woff': 'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
                    'glyphicons-halflings-regular.woff2': 'bootstrap/dist/fonts/glyphicons-halflings-regular.woff2',
                }
            }
        },

        jshint: {
            options: {
                eqnull: true,
                browser: true,
                proto: true,
                globals: {
                    jQuery: true
                }
            },
            all: [ 'frontend/scripts/*.js' ]
        },

        jsdoc: {
            dist: {
                src: [ 'frontend/scripts/*.js' ],
                options: {
                    destination: 'docs',
                    package: 'package.json'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bowercopy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('default', ['jshint', 'bowercopy', 'jsdoc' ]);
};
