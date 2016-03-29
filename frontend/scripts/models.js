/*
Copyright (C) 2016 Pierre Gaxatte

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

;(function(window) {
    /**
     * Save object taken from https://github.com/skeeto/disc-rl
     */
    var Save = {
        isArray: function(object) {
            return Object.prototype.toString.call(object) === "[object Array]";
        },

        isString: function(object) {
            return Object.prototype.toString.call(object) === "[object String]";
        },

        isBoolean: function(object) {
            return Object.prototype.toString.call(object) === "[object Boolean]";
        },

        isNumber: function(object) {
            return Object.prototype.toString.call(object) === "[object Number]";
        },

        isFunction: function(object) {
            return Object.prototype.toString.call(object) === "[object Function]";
        },

        isObject: function(object) {
            return object !== null && object !== undefined &&
                !this.isArray(object) && !this.isBoolean(object) &&
                !this.isString(object) && !this.isNumber(object) &&
                !this.isFunction(object);
        },

        decorate: function(object) {
            if (object === null) {
                return null;
            } else if (object === undefined) {
                return undefined;
            } else if (this.isString(object)) {
                return String(object);
            } else if (this.isNumber(object)) {
                return Number(object);
            } else if (this.isBoolean(object)) {
                return Boolean(object);
            } else if (this.isArray(object)) {
                for (var i = 0; i < object.length; i++) {
                    object[i] = this.decorate(object[i]);
                }
                return object;
            } else if (this.isFunction(object)) {
                throw new Error("Can't serialize functions.");
            } else {
                if ('doNotSave' in object) {
                    return null;
                }

                if (!('#' in object)) {
                    var constructor = object.constructor.name;
                    //console.log('decorate', constructor, object);
                    if (constructor === '') {
                        throw new Error("Can't serialize with anonymous constructors.");
                    } else if (constructor !== 'Object') {
                        if (window[constructor].prototype !== object.__proto__) {
                            throw new Error('Constructor mismatch!');
                        } else {
                            object['#'] = constructor;
                        }
                    }
                }
                for (var k in object) {
                    if (object.hasOwnProperty(k)) {
                        object[k] = this.decorate(object[k]);
                    }
                }
                return object;
            }
        },

        fixPrototype: function(object) {
            var isObject = Save.isObject(object);
            if (isObject && object['#']) {
                var constructor = window[object['#']];
                if (constructor) {
                    object.__proto__ = constructor.prototype;
                } else {
                    throw new Error('Unknown constructor ' + object['#']);
                }
            }
            if (isObject || Save.isArray(object)) {
                for (var k in object) {
                    if (object.hasOwnProperty(k)) {
                        this.fixPrototype(object[k]);
                    }
                }
            }
            return object;
        },

        stringify: function(object, deferred) {
            object = this.decorate(object);
            return JSON.stringify(object);
        },

        parse: function(string) {
            return this.fixPrototype(JSON.parse(string));
        },

        save: function(variable, value) {
            if (arguments.length === 1) value = window[variable];
            localStorage[variable] = this.stringify(value);
            return variable;
        },

        load: function(variable) {
            window[variable] = this.parse(localStorage[variable]);
            return window[variable];
        },

        exists: function(variable) {
            return variable in localStorage;
        },

        clear: function(variable) {
            if (variable) {
                localStorage.removeItem(variable);
            } else {
                localStorage.clear();
            }
        }
    };


    /**
     * Parent game object, cannot be used directly but the games inherit from it
     * @constructor
     * @param {string} type - The type of game.
     * @param {string} variant - The variant of the game.
     * @param {string[]} game.players - An array of strings containing the names of the players.
     */
    function BaseGame(type, variant, players) {
        this._type = type;
        this._variant = variant;
        this._players = players.map(function(player) {
            return {
                name: player,
                score: 0,
                throwsLeft: 3,
                active: false,
                throws: [],
                showScoreTab: false
            };
        });
        this._currentPlayer = 0;
        this._previousPlayer = 0;
        this._players[0].active = true;
        this._players[0].showScoreTab = true;
        this._turnNumber = 1;
        this._gameEnded = false;

        // Undo actions
        this._undo = [];
        this._undoMaxSize = 10;

        // Properties to save and restore in the game object
        this._gameStateProperties = [
            "_players",
            "_currentPlayer",
            "_turnNumber",
            "_gameEnded",
            "_winner"
        ];
        this.additionalProps = [];

        this.setupEvents();
    }
    BaseGame.prototype = {
        /**********************************************************************
         * Public methods
         *********************************************************************/

        /**
         * Creates the Dispatcher objects
         */
        setupEvents: function() {
            this.undoListChanged = new Dispatcher();
            this.gameHasEnded = new Dispatcher();
            this.scoreChanged = new Dispatcher();
        },

        /**
         * Detaches all the Dispatchers
         */
        detachAllDispatchers: function() {
            this.undoListChanged.detachAll();
            this.gameHasEnded.detachAll();
            this.scoreChanged.detachAll();
        },

        /**
         * Returns a player from its id.
         * @param {number} playerId - Id of the player to return.
         * @returns {Player} Player object.
         */
        getPlayer: function(playerId) {
            return this._players[playerId];
        },

        /**
         * Returns the currently active player.
         * @returns {Player} Active player object.
         */
        getActivePlayer: function() {
            return this._players[this._currentPlayer];
        },

        /**
         * Returns the length of the undo queue.
         * @returns {number} Length of the undo queue.
         */
        getUndoQueueLength: function() {
            return this._undo.length;
        },

        /**
         * Returns an object describing the context to use in the templates.
         * By default, it returns an object as {players: [array of player objects], turn: turnNumber}.
         * The context can be extended by the results of the getSpecificContext function.
         * @see getSpecificContext
         * @returns {Object} The context to use in templates.
         */
        getContext: function() {
            return $.extend(
                {
                    players: this._players,
                    turn: this._turnNumber
                },
                this.getSpecificContext()
            );
        },

        /**
         * Returns the type of this game.
         * @returns {string} The type of game.
         */
        getType: function() {
            return this._type;
        },

        /**
         * Returns the variant of this game.
         * @returns {string} The variant of game.
         */
        getVariant: function() {
            return this._variant;
        },

        /**
         * Registers a new score from a thrown dart.
         * This function takes care of changing the player's showScoreTab
         * property to control the display of the players score sheet.
         * Adds the throw to the current player and calls a specific function
         * processNewScore that should be overriden by the child game class.
         * @see processNewScore
         * @param {Score} score - Score object to register.
         */
        registerScore: function(score) {
            if(this._gameEnded) {
                return;
            }

            // Hide previous player tab
            this.getPlayer(this._previousPlayer).showScoreTab = false;

            // Add the throw to the current player
            var player = this.getActivePlayer();
            player.showScoreTab = true;

            // Save current state to the undo queue
            this._saveState();

            if(player.throws.length < this._turnNumber) {
                player.throws.push([]);
            }
            player.throws[this._turnNumber - 1].push(score);

            // Save previous player
            this._previousPlayer = this._currentPlayer;

            // Run specific game logic
            this.processNewScore(score);
            this.scoreChanged.dispatch();
        },

        /**
         * Pops the last saved state to undo the last move.
         */
        undo: function() {
            if(this.getUndoQueueLength() <= 0) {
                return;
            }
            var state = JSON.parse(this._undo.pop());

            for(var prop in state) {
                if(state.hasOwnProperty(prop) && this.hasOwnProperty(prop)) {
                    this[prop] = state[prop];
                }
            }

            this.undoListChanged.dispatch();
        },

        /**
         * Marks the game as over and deactivate all players.
         * Dispatches the winner's id to the gameHasEnded dispatcher object.
         * @see gameHasEnded
         * @param {number} winnerId - Id of the player that won. null if not
         * applicable to this game.
         */
        gameOver: function(winnerId) {
            this._gameEnded = true;

            // Disable all players
            for(var i = 0; i < this._players.length; i++) {
                this._players[i].active = false;
            }

            // Dispatch an event for the end of the game
            // If the winnerId is null, send null
            this.gameHasEnded.dispatch((
                winnerId == null ?
                null :
                { player: this._players[winnerId].name }
            ));
        },


        /**********************************************************************
         * "Abstract" methods that may be overridden
         *********************************************************************/

        /**
         * Returns the specific context of this game.
         * If overriden, it must return an Object (even empty).
         * @see getContext
         * @abstract
         * @returns {Object} Specific context object for the templates.
         */
        getSpecificContext: function() { return {}; },

        /**
         * Processes the score of the dart that has been thrown according to
         * the specific rules of the game.
         * @see registerScore
         * @abstract
         * @param {Score} score - The score that is being registered.
         */
        processNewScore: function(score) { return; },


        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Saves the state of the game into the undo array.
         * @private
         */
        _saveState: function() {
            var props = [].concat(this._gameStateProperties).concat(this.additionalProps),
                state = {};

            for(var i = 0; i < props.length; i ++) {
                state[props[i]] = this[props[i]];
            }

            this._undo.push(JSON.stringify(state));
            if(this._undo.length > this._undoMaxSize) {
                this._undo.shift();
            }
            this.undoListChanged.dispatch();
        }
    };


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
                            this.gameOver(this._getWinningPlayer());
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


    /*
     * Games library object
     */
    function GamesLibrary() {
        this._games = {
            cricket:  {
                desc: "Cricket",
                variants: {
                    normal: {
                        desc: "Normal (2 players)",
                        nbPlayers: { min: 2, max: 2 }
                    },
                    cutThroat: {
                        desc: "Cut throat (2+ players)",
                        nbPlayers: { min: 2 },
                        _obj: CutThroatCricket
                    }
                },
                _obj: Cricket
            },

            x01: {
                desc: "x01",
                variants: {
                    normal: {
                        desc: "Normal"
                    },
                    noDoubleStart: {
                        desc: "Start without double",
                        _obj: NoDoubleStartX01
                    }
                },
                options: {
                    startingScore: {
                        label: "Starting score",
                        type: "select",
                        values: {
                            301: "301",
                            501: "501",
                            701: "701",
                            1001: "1001",
                        }
                    }
                },
                _obj: X01
            },

            clock: {
                desc: "Around the clock",
                variants: {
                    normal: {
                        desc: "No variant"
                    }
                },
                _obj: AroundTheClock
            },

            /*
            killer: {
                desc: "Killer",
                variants: {
                    normal: {
                        desc: "No variant",
                        nbPlayers: { min: 4 }
                    }
                }
            }
            */
        };
    }
    GamesLibrary.prototype = {
        getRules: function() {
            return this._games;
        },
        create: function(type, variant, players, options) {
            if(! this._games.hasOwnProperty(type) ||
                    ! this._games[type].variants.hasOwnProperty(variant)) {
                return null;
            }

            var GameClass = null;
            if(variant === 'normal') {
                GameClass = this._games[type]._obj;
            } else {
                GameClass = this._games[type].variants[variant]._obj;
            }

            return new GameClass(players, options);
        }
    };


    /*
     * Save objects to the global scope
     */
    window.Save = Save;
    window.GamesLibrary = GamesLibrary;
    window.BaseGame = BaseGame;
    window.Cricket = Cricket;
    window.CutThroatCricket = Cricket;
    window.AroundTheClock = AroundTheClock;
    window.X01 = X01;
    window.NoDoubleStartX01 = NoDoubleStartX01;
})(window);

/*
 * Custom typedef, for documentation only
 */

/**
 @typedef Score
 @type {Object}
 @property {number} value - The base value (1..20, bull'eye = 25).
 @property {number} factor - The factor of the score (single, double, triple).
 @property {boolean} bull - Is the score a bull's eye?
 */

/**
 @typedef Player
 @type {Object}
 @property {string} name - The player's name.
 @property {number} score - The player's current score.
 @property {number} throwsLeft - How many throws this player has left (in this turn).
 @property {boolean} active - Is this the player's turn?
 @property {Object[]} throws - An array of object describing each throw the player has made, turn by turn.
 @property {boolean} showScoreTab - Should the player's score tab be up?
 */
