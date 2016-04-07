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
         * Overrides BaseGame's processNewScore abstract method.
         * @see BaseGame.processNewScore
         * @function
         */
        processNewScore: {
            value: function(score) {
                if(this._gameEnded) {
                    return;
                }

                var player = this._players[this._currentPlayer];
                player.throwsLeft --;

                player.score -= score.factor * score.value;
                if(player.score < 0) {
                    player.score = player.startedTurnAt;
                    this._nextPlayer();
                }

                if(player.score === 0) {
                    this.gameOver(this._currentPlayer);
                    return;
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
            }
        }
    });
    NoDoubleStartX01.prototype.constructor = X01;

    return NoDoubleStartX01;
});

