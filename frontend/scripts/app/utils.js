/**
 * @license Utils.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define(function() {
    /*
     * General utility functions
     */
    var Utils = {
        loadTemplate: function(url, context, $target) {
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'text'
            }).then(function(src) {
                return Handlebars.compile(src)(context);
            }).done(function(html) {
                $target.html(html);
            });
        },
        scoreToString: function(score) {
            var factorToString = {
                1: "",
                2: "D",
                3: "T"
            },
            value = (score.bull ? "B" : score.value);
            return factorToString[score.factor] + value;
        }
    };

    return Utils;
});
