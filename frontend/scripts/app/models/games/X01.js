/**
 * @license X01.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    './BaseGame'
], function(BaseGame) {
    /**
     * x01 type of game (301, 501, 701, ...)
     * @constructor
     * @param {string[]} game.players - An array of strings containing the names of the players.
     * @param {Object} options - Object containing the starting score; eg. { startingScore: 501 }.
     */
    function X01(players, options) {
        BaseGame.call(this, 'x01', 'normal', players);

        options = options || {};
        this._startingScore = parseInt(options.startingScore) || 301;

        for(var i = 0; i < this._players.length; i++) {
            this._players[i].startingDouble = false;
            this._players[i].score = this._startingScore;
            this._players[i].startedTurnAt = this._startingScore;
        }
    }
    X01.prototype = Object.create(BaseGame.prototype, {
        /**********************************************************************
         * "Abstract" methods from BaseGame that are overriden
         *********************************************************************/

        /**
         * Overrides BaseGame's processNewScore abstract method.
         * @see BaseGame.processNewScore
         * @function
         */
        processNewScore: {
            value: function(score) {
                var player = this.getActivePlayer();
                player.throwsLeft --;

                if(! player.startingDouble && score.factor === 2) {
                    player.startingDouble = true;
                }

                if(player.startingDouble) {
                    player.score -= score.factor * score.value;
                    if(player.score < 0 ||
                            (player.score === 0 && score.factor !== 2) ||
                            player.score === 1) {

                        player.score = player.startedTurnAt;
                        this._nextPlayer();
                    }

                    if(player.score === 0 && score.factor === 2) {
                        this.gameOver(this._currentPlayer);
                        return;
                    }
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
            }
        },

        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Switches to the next player.
         * @function
         * @private
         */
        _nextPlayer: {
            enumerable: false,
            value: function() {
                var player = this.getActivePlayer(),
                    playerId = this._currentPlayer,
                    nextPlayerId = (this._currentPlayer + 1) % this._players.length,
                    nextPlayer = this._players[nextPlayerId];

                player.throwsLeft = 3;
                player.active = false;
                player.startedTurnAt = player.score;

                this._currentPlayer = nextPlayerId;
                nextPlayer.active = true;

                if(nextPlayerId < playerId) {
                    this._turnNumber ++;
                }
            }
        }
    });
    X01.prototype.constructor = X01;

    return X01;
});

