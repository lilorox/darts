/**
 * @license NoDoubleStartX01.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    './X01'
], function(X01) {
    /**
     * x01 type of game (301, 501, 701, ...), without the need to start with a double.
     * @constructor
     * @param {string[]} game.players - An array of strings containing the names of the players.
     * @param {Object} options - Object containing the starting score; eg. { startingScore: 501 }.
     */
    function NoDoubleStartX01(players, options) {
        X01.call(this, players, options);
    }
    NoDoubleStartX01.prototype = Object.create(X01.prototype, {
        /**********************************************************************
         * "Abstract" methods from X01 that are overriden
         *********************************************************************/

        /**
         * Overrides X01's registerStartingCondition abstract method. Does nothing
         * as there is no rule in this game that a player must obey before the
         * points are registered.
         * @see X01.registerStartingCondition
         * @function
         * @param {Player} player - The player who threw a dart.
         * @param {Score} score - The resulting score of the throw.
         */
        registerStartingCondition: { value: function(player, score) { return; }},

        /**
         * Determines if the player can start registering the throws as score.
         * In classic x01, the player must start with a double before points
         * are counted.
         * @function
         * @param {Player} player - The player who threw a dart.
         * Overrides X01's playerCanStartScoring abstract method. Always returns
         * true as there is no rule in this game that a player must obey before
         * the points are registered.
         * @see X01.playerCanStartScoring
         * @function
         * @param {Player} player - The player who threw a dart.
         */
        playerCanStartScoring: {
            value: function(player) {
                return true;
            }
        },
    });
    NoDoubleStartX01.prototype.constructor = X01;

    return NoDoubleStartX01;
});

