/**
 * @license AroundTheClock.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    './BaseGame'
], function(BaseGame) {
    /**
     * Around the clock game, without variant.
     * @constructor
     * @param {string[]} game.players - An array of strings containing the names of the players.
     */
    function AroundTheClock(players) {
        BaseGame.call(this, 'clock', 'normal', players);
        for(var i = 0; i < this._players.length; i++) {
            this._players[i].won = false;
            this._players[i].winningTurn = 0;
        }
    }
    AroundTheClock.prototype = Object.create(BaseGame.prototype, {
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

                if(player.score == 20 && score.bull) {
                    player.won = true;
                    player.winningTurn = this._turnNumber;
                    player.throwsLeft = 0;

                    if(this._isGameOver()) {
                        this.gameOver();
                        return;
                    } else {
                        this._nextPlayer();
                    }
                } else if(score.value == player.score + 1) {
                    player.score ++;
                }
                player.throwsLeft --;

                if(player.throwsLeft === 0) {
                    player.throwsLeft = 3;
                    this._nextPlayer();
                }
            }
        },

        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/
        /**
         * Checks if the game is over.
         * @function
         * @private
         * @returns {boolean} True if the game is over, false otherwise.
         */
        _isGameOver: {
            enumerable: false,
            value: function() {
                var gameIsOver = true;
                for(var i = 0; i < this._players.length; i++) {
                    gameIsOver = gameIsOver && this._players[i].won;
                }
                return gameIsOver;
            }
        },

        /**
         * Switches to the next player that has not finished yet.
         * @function
         * @private
         */
        _nextPlayer: {
            enumerable: false,
            value: function() {
                var player = this.getActivePlayer(),
                    nextPlayerId = (this._currentPlayer + 1) % this._players.length,
                    nextPlayer = this._players[nextPlayerId];

                while(nextPlayer.won) {
                    nextPlayerId = (nextPlayerId + 1) % this._players.length;
                    nextPlayer = this._players[nextPlayerId];
                }

                if(this._currentPlayer != nextPlayerId) {
                    player.active = false;
                }

                if(nextPlayerId <= this._currentPlayer) {
                    this._turnNumber ++;
                }

                this._currentPlayer = nextPlayerId;
                nextPlayer.active = true;
            }
        }
    });
    AroundTheClock.prototype.constructor = AroundTheClock;

    return AroundTheClock;
});

