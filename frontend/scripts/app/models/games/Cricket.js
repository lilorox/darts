/**
 * @license Cricket.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    './BaseGame'
], function(BaseGame) {
    /**
     * Cricket game, without variant.
     * @constructor
     * @param {string[]} game.players - An array of strings containing the names of the players.
     */
    function Cricket(players) {
        BaseGame.call(this, 'cricket', 'normal', players);
        for(var i = 0; i < this._players.length; i++) {
            this._players[i].targets = {
                _15: 0,
                _16: 0,
                _17: 0,
                _18: 0,
                _19: 0,
                _20: 0,
                _B: 0
            };
        }

        this._allowedTargets = {
            _15: true,
            _16: true,
            _17: true,
            _18: true,
            _19: true,
            _20: true,
            _B: true
        };
    }
    Cricket.prototype = Object.create(BaseGame.prototype, {
        /**********************************************************************
         * "Abstract" methods from BaseGame that are overriden
         *********************************************************************/

        /**
         * Overrides BaseGame's getSpecificContext abstract method.
         * @see BaseGame.getSpecificContext
         * @function
         */
        getSpecificContext: {
            value: function() {
                return {
                    allowedTargets: this._allowedTargets
                };
            }
        },

        /**
         * Overrides BaseGame's processNewScore abstract method.
         * @see BaseGame.processNewScore
         * @function
         */
        processNewScore: {
            value: function(score) {
                var player = this.getActivePlayer();

                var targetName = (score.bull ? '_B' : '_' + score.value);
                if(this._allowedTargets.hasOwnProperty(targetName) &&
                        this._allowedTargets[targetName]) {
                    if(player.targets[targetName] < 3) {
                        player.targets[targetName] = Math.min(
                            3,
                            player.targets[targetName] + score.factor
                        );
                    } else {
                        this._addScore(score);
                    }
                }

                if(this._checkTargetIsClosed(targetName)) {
                    this._allowedTargets[targetName] = false;
                }

                player.throwsLeft --;
                if(player.throwsLeft === 0) {
                    player.throwsLeft = 3;
                    player.active = false;
                    this._currentPlayer = (this._currentPlayer + 1) % this._players.length;
                    this.getActivePlayer().active = true;
                    if(this._currentPlayer === 0) {
                        if(this._checkAllTargetsClosed()) {
                            this.gameOver([this._getWinningPlayer()]);
                        } else {
                            this._turnNumber ++;
                        }
                    }
                }
            }
        },


        /**********************************************************************
         * "Protected" methods specific to the Cricket game
         *********************************************************************/

        /**
         * Adds the score to the current player.
         * @function
         * @protected
         * @param {Score} score - Score object
         */
        _addScore: {
            enumerable: false,
            value: function(score) {
                this.getActivePlayer().score += score.factor * score.value;
            }
        },

        /**
         * Gets the id of the player with the higher score.
         * @function
         * @protected
         * @returns {number} Id of the player with the higher score.
         */
        _getWinningPlayer: {
            enumerable: false,
            value: function() {
                // Returns the id of the player with the highest score
                var leaderId = 0;

                for(var i = 1; i < this._players.length; i++) {
                    if(this._players[i].score > this._players[leaderId].score) {
                        leaderId = i;
                    }
                }
                return leaderId;
            }
        },


        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Checks if a certain target has been closed.
         * @function
         * @private
         * @param {string} target - The target to check, preceded with an
         * underscore; eg. "_10", "_3" or "_B"
         * @returns {boolean} True if the target is closed, false otherwise.
         */
        _checkTargetIsClosed: {
            enumerable: false,
            value: function(target) {
                var playersClosed = 0;
                for(var i = 0; i < this._players.length; i++) {
                    if(this._players[i].targets[target] >= 3) {
                        playersClosed ++;
                    }
                }

                return (playersClosed === this._players.length);
            }
        },

        /**
         * Checks if a player has closed all his targets
         * @function
         * @private
         * @param {number} playerId - Id of the player to check
         * @returns {boolean} True if the player has closed all targets, false otherwise.
         */
        _playerClosedAllTargets: {
            enumerable: false,
            value: function(playerId) {
                var targets = Object.keys(this._allowedTargets),
                    playerClosed = true,
                    j = 0;
                while(playerClosed && j < targets.length) {
                    playerClosed = (playerClosed && this._players[playerId].targets[targets[j]] >= 3);
                    j ++;
                }

                return playerClosed;
            }
        },

        /**
         * Checks if all targets have been closed (thus leading to the end of the game).
         * @function
         * @private
         * @returns {boolean} True if all targets are closed, false otherwise.
         */
        _checkAllTargetsClosed: {
            enumerable: false,
            value: function() {
                for(var i = 0; i < this._players.length; i++) {
                    if(this._playerClosedAllTargets(i)) {
                        return true;
                    }
                }
                return false;
            }
        }
    });
    Cricket.prototype.constructor = Cricket;

    return Cricket;
});
