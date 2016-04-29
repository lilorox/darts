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

        this._options = options || {};
        this._options.startingScore = parseInt(this._options.startingScore) || 301;
        this._finishingPlayers = [];
        this._minimumScore = (this._options.doubleOut ? 1 : (this._options.tripleOut ? 2 : 0));

        for(var i = 0; i < this._players.length; i++) {
            this._players[i].scoreProgress = [this._options.startingScore];
            this._players[i].canStart = (! this._options.doubleIn && ! this._options.tripleIn);
            this._players[i].score = this._options.startingScore;
            this._players[i].startedTurnAt = this._options.startingScore;
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

                this.registerStartingCondition(player, score);

                if(player.canStart) {
                    player.score -= score.factor * score.value;

                    // Winning condition
                    if(player.score === 0 && (
                            score.factor === 2 && this._options.doubleOut ||
                            score.factor === 3 && this._options.tripleOut)) {
                        this._finishingPlayers.push(this._currentPlayer);
                        this._nextPlayer();
                        return;
                    }

                    // Invalid score (below the minimum)
                    if(player.score <= this._minimumScore || player.score === 0 && (
                            (score.factor !== 2 && this._options.doubleOut) ||
                            (score.factor !== 3 && this._options.tripleOut))) {
                        this._invalidateTurn();
                        player.score = player.startedTurnAt;
                        this._nextPlayer();
                        return;
                    }
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
            }
        },

        /**
         * Skips the remaining throws of the player as his turn is cancelled
         * @function
         */
        _invalidateTurn: {
            value: function() {
                var player = this.getActivePlayer(),
                    turn = player.throws[this._turnNumber - 1];

                // Invalidate the last dart thrown
                turn[turn.length - 1].invalidate = true;
                turn[turn.length - 1].invalidateReason = "Score went to " + player.score;

                // If the player has not thrown all his darts (because he went
                // below zero for instance), we need to fill the turn with null
                // and the progress with the same score
                for(var i = turn.length; i < this._dartsPerTurn; i++) {
                    turn.push(null);
                    player.scoreProgress.push(player.startedTurnAt);
                }
            }
        },

        /**
         * Registers if a player can start scoring according to the dart that he
         * just threw.
         * @function
         * @param {Player} player - The player who threw a dart.
         * @param {Score} score - The resulting score of the throw.
         */
        registerStartingCondition: {
            value: function(player, score) {
                if(! player.canStart && score.value > 0 && (
                        this._options.doubleIn && score.factor === 2 ||
                        this._options.tripleIn && score.factor === 3
                        )) {
                    player.canStart = true;
                    score.highlight = true;
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

                if(nextPlayerId <= playerId) {
                    this._turnNumber ++;

                    if(this._finishingPlayers.length > 0) {
                        this.gameOver(this._finishingPlayers);
                    }
                }
            }
        }
    });
    X01.prototype.constructor = X01;

    return X01;
});

