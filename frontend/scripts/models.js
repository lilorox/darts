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
    /*
     * Save object taken from https://github.com/skeeto/disc-rl
     */
    var Save = {
        isArray: function(object) {
            return Object.prototype.toString.call(object) === '[object Array]';
        },

        isString: function(object) {
            return Object.prototype.toString.call(object) === '[object String]';
        },

        isBoolean: function(object) {
            return Object.prototype.toString.call(object) === '[object Boolean]';
        },

        isNumber: function(object) {
            return Object.prototype.toString.call(object) === '[object Number]';
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
                    console.log('decorate', constructor, object);
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

        stringify: function(object) {
            object = this.decorate(object);
            return JSON.stringify(object);
        },

        parse: function(string) {
            return this.fixPrototype(JSON.parse(string));
        },

        /* Main API */

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


    /*
     * Parent game object
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
    };
    BaseGame.prototype = {
        /*
         * Public methods
         */
        setupEvents: function() {
            this.undoListChanged = new Dispatcher();
            this.gameHasEnded = new Dispatcher();
            this.scoreChanged = new Dispatcher();
        },
        getPlayer: function(playerId) {
            return this._players[playerId];
        },
        getActivePlayer: function() {
            return this._players[this._currentPlayer];
        },
        getUndoQueueLength: function() {
            return this._undo.length;
        },
        getContext: function() {
            return $.extend(
                {
                    players: this._players,
                    turn: this._turnNumber
                },
                this.getSpecificContext()
            );
        },
        getType: function() {
            return this._type;
        },
        getVariant: function() {
            return this._variant;
        },
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

        /*
         * "Protected" methods that may be overridden
         */
        getSpecificContext: function() { return {}; },
        processNewScore: function(score) { return; },

        /*
         * "Private" methods that must not be called outside the object itself
         *  and must not be overridden by inherited objects
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


    /*
     * Cricket
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
    };
    Cricket.prototype = Object.create(BaseGame.prototype, {
        /*
         * Overriden "protected" methods
         */
        getSpecificContext: {
            value: function() {
                return {
                    allowedTargets: this._allowedTargets
                };
            }
        },
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
        /*
         * "Private" methods
         */
        _addScore: {
            enumerable: false,
            value: function(score) {
                this.getActivePlayer().score += score.factor * score.value;
            }
        },
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
        },
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
        }
    });
    Cricket.prototype.constructor = Cricket;


    /*
     * Cut-Throat Cricket
     */
    function CutThroatCricket(players) {
        Cricket.call(this, players);
    }
    CutThroatCricket.prototype = Object.create(Cricket.prototype, {
        /*
         * Overriden private methods from Cricket
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


    /*
     * Around the clock
     */
    function AroundTheClock(players) {
        BaseGame.call(this, 'clock', 'normal', players);
        for(var i = 0; i < this._players.length; i++) {
            this._players[i].won = false;
            this._players[i].winningTurn = 0;
        }
    };
    AroundTheClock.prototype = Object.create(BaseGame.prototype, {
        /*
         * Overriden "protected" methods
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
        /*
         * "Private" methods
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


    /*
     * x01
     */
    function X01(players, options) {
        BaseGame.call(this, 'x01', 'normal', players);

        options = options || {};
        this._startingScore = parseInt(options._startingScore) || 301;

        for(var i = 0; i < this._players.length; i++) {
            this._players[i].startingDouble = false;
            this._players[i].score = this._startingScore;
            this._players[i].startedTurnAt = this._startingScore;
        }

    };
    X01.prototype = Object.create(BaseGame.prototype, {
        /*
         * Overriden "protected" methods
         */
        processNewScore: {
            value: function(score) {
                var player = this.getActivePlayer();
                player.throwsLeft --;

                if(! player.startingDouble && score.factor == 2) {
                    player.startingDouble = true;
                }

                if(player.startingDouble) {
                    player.score -= score.factor * score.value;
                    if(player.score < 0 ||
                            (player.score == 0 && score.factor != 2) ||
                            player.score == 1) {

                        player.score = player.startedTurnAt;
                        this._nextPlayer();
                    }

                    if(player.score == 0 && score.factor == 2) {
                        this.gameOver(this._currentPlayer);
                        return;
                    }
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
            }
        },
        /*
         * "Private" methods
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


    /*
     * x01 without starting double
     */
    function NoDoubleStartX01(players, options) {
        X01.call(this, players, options);
    }
    NoDoubleStartX01.prototype = Object.create(X01.prototype, {
        /*
         * Overriden "protected" methods
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

                if(player.score == 0) {
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
    };
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
                GameClass = this._games[type]._obj
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

