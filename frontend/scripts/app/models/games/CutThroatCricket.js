/**
 * @license CutThroatCricket.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    './Cricket'
], function(Cricket) {
    /**
     * Cricket game, cut-throat variant.
     * @constructor
     * @param {string[]} game.players - An array of strings containing the names of the players.
     */
    function CutThroatCricket(players) {
        Cricket.call(this, players);
    }
    CutThroatCricket.prototype = Object.create(Cricket.prototype, {
        /**********************************************************************
         * "Protected" methods from Cricket that are overriden
         *********************************************************************/

        /**
         * Adds the score to all the players except the current one.
         * @function
         * @protected
         * @param {Score} score - Score object
         */
        _addScore: {
            enumerable: false,
            value: function(score) {
                var targetName = (score.bull ? '_B' : '_' + score.value);
                for(var i = 0; i < this._players.length; i ++) {
                    if(i != this._currentPlayer && this._players[i].targets[targetName] < 3) {
                        this._players[i].score += score.factor * score.value;
                    }
                }
            }
        },

        /**
         * Gets the id of the player with the lower score.
         * @function
         * @protected
         * @returns {number} Id of the player with the lower score.
         */
        _getWinningPlayer: {
            enumerable: false,
            value: function() {
                // Returns the id of the player with the lowest score
                var leaderId = 0;

                for(var i = 1; i < this._players.length; i++) {
                    if(this._players[i].score < this._players[leaderId].score) {
                        leaderId = i;
                    }
                }
                return leaderId;
            }
        }
    });
    CutThroatCricket.prototype.constructor = Cricket;

    return CutThroatCricket;
});

