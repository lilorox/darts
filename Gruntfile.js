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
                    'jquery/jquery.min.js': 'jquery/dist/jquery.min.js',
                    'bootstrap/bootstrap.min.js': 'bootstrap/dist/js/bootstrap.min.js',
                    'fuelux/fuelux.min.js': 'fuelux/dist/js/fuelux.min.js'
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
                    'fuelux/fuelux.min.css': 'fuelux/dist/css/fuelux.min.css'
                }
            },
            fonts: {
                options: {
                    destPrefix: 'frontend/css/libs/fonts'
                },
                files: {
                    'glyphicons-halflings-regular.woff': 'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
                    'glyphicons-halflings-regular.woff2': 'bootstrap/dist/fonts/glyphicons-halflings-regular.woff2',
                    'fuelux.woff': 'fuelux/dist/fonts/fuelux.woff'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bowercopy');

    grunt.registerTask('default', ['bowercopy']);
};
