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
                    'bootstrap/bootstrap.min.js': 'bootstrap/dist/js/bootstrap.min.js'
                }
            },
            css: {
                options: {
                    destPrefix: 'frontend/css/libs'
                },
                files: {
                    'bootstrap/bootstrap.min.css': 'bootstrap/dist/css/bootstrap.min.css',
                    'bootstrap/bootstrap-theme.min.css': 'bootstrap/dist/css/bootstrap-theme.min.css'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bowercopy');

    grunt.registerTask('default', ['bowercopy']);
};
