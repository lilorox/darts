/**
 * @license Utils.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'handlebars'
], function(Handlebars) {
    /*
     * General utility functions
     */
    var Utils = {
        /**
         * Take a template from an URL, applies the context and loads the result
         * into the specified target.
         * @param {string} url - The location of the template definition.
         * @param {Object} context - The context to apply to the template.
         * @param {Object} $target - The jQuery object to apply the template to.
         * @param {function} callback - The function to call after the new html is inserted
         */
        loadTemplate: function(url, context, $target, callback) {
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'text'
            }).then(function(src) {
                return Handlebars.compile(src)(context);
            }).done(function(html) {
                $target.html(html);
                if(callback && typeof callback === 'function') {
                    callback();
                }
            });
        },

        /**
         * Converts a score Object to a readable format.
         * @param {Score} score - The score to convert.
         */
        scoreToString: function(score) {
            var factorToString = {
                1: "",
                2: "D",
                3: "T"
            },
            value = (score.bull ? "B" : score.value);
            return factorToString[score.factor] + value;
        },

        /**
         * Randomizes array element order in-place.
         * Using Durstenfeld shuffle algorithm.
         * @param {*} array - The array to shuffle.
         */
        shuffleArray: function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }
    };

    return Utils;
});
