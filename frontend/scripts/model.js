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
                if (!('#' in object)) {
                    var constructor = object.constructor.name;
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

    function BaseGame(type, variant, players, dartboardId, scoreboardId) {
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
        this._players[0].active = true;
        this._players[0].showScoreTab = true;
        this._turnNumber = 1;
        this._gameEnded = false;
        this._winner = null;

        this._context = {};

        // Undo actions
        this._undo = [];
        this._undoMaxSize = 10;

        // Properties to save and restore in the game object
        this._gameStateProperties = [
            "players",
            "currentPlayer",
            "turnNumber",
            "gameEnded",
            "winner"
        ];
        this.additionalProps = [];

        // Additional context properties
        this.additionalContextProps = [];
    };

    /*
     * Public methods
     */
    BaseGame.prototype.getActivePlayer = function() {
        return this._players[this._currentPlayer];
    };
    BaseGame.prototype.getUndoQueueLength = function() {
        return this._undo.length;
    };
    BaseGame.prototype.getContext = function() {
        return $.extend(
            {},
            this._context,
            this.getSpecificContext();
        );
    };

    BaseGame.prototype.registerScore = function(score) {
        // Add the throw to the current player
        var player = this.getActivePlayer();
        player.showScoreTab = true;

        // Save current state to the undo queue
        this._saveState();

        if(player.throws.length < this._turnNumber) {
            player.throws.push([]);
        }
        player.throws[this._turnNumber - 1].push(score);

        // Run specific game logic
        this.processNewScore(score);

        player.showScoreTab = false;
    };

    BaseGame.prototype.undo = function() {
        if(this._undo.length <= 0) {
            return;
        }
        var state = JSON.parse(this._undo.pop());

        for(var prop in state) {
            if(state.hasOwnProperty(prop) && this.hasOwnProperty(prop)) {
                this[prop] = state[prop];
            }
        }
    };

    BaseGame.prototype.gameOver = function(winnerId) {
            this._gameEnded = true;

            this._winner = winner;
            this.updateView();
        }
    };

    /*
     * "Protected" methods that may be overriden
     */
    BaseGame.prototype.getSpecificContext = function() { return {}; };
    BaseGame.prototype.processNewScore = function(score) { return; };

    /*
     * "Private" methods that must not be called outside the object itself
     */
    BaseGame.prototype._saveState = function() {
        var props = [].concat(this._gameStateProperties).concat(this.additionalProps),
            state = {};

        for(var i = 0; i < props.length; i ++) {
            state[props[i]] = this[props[i]];
        }

        this._undo.push(JSON.stringify(state));
        if(this._undo.length > this._undoMaxSize) {
            this._undo.shift();
        }
    };

    /*
     * Cricket
     */
    function Cricket(players, dartboardId, scoreboardId) {
        BaseGame.call(this, 'cricket', 'normal', players, dartboardId, scoreboardId);
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
                if(this._gameEnded) {
                    return;
                }

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
                            this.gameOver(this._getHighestScorePlayer());
                        } else {
                            this._turnNumber ++;
                        }
                    }
                }
                this.updateView();
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
        _getHighestScorePlayer: {
            enumerable: false,
            value: function() {
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
    function CutThroatCricket(players, dartboardId, scoreboardId) {
        Cricket.call(this, players, dartboardId, scoreboardId);
        this.updateView();
    }
    CutThroatCricket.prototype = Object.create(Cricket.prototype, {
        _addScore: {
            value: function(score) {
                var targetName = (score.bull ? '_B' : '_' + score.value);
                for(var i = 0; i < this._players.length; i ++) {
                    if(i != this._currentPlayer && this._players[i].targets[targetName] < 3) {
                        this._players[i].score += score.factor * score.value;
                    }
                }
            }
        },
        endOfGame: {
            value: function() {
                this._gameEnded = true;
                var winner = this._players[0].name,
                    winnerScore = this._players[0].score;

                for(var i = 1; i < this._players.length; i++) {
                    if(this._players[i].score < winnerScore) {
                        winner = this._players[i].name;
                        winnerScore = this._players[i].score;
                    }
                }

                this._winner = winner;
                this.updateView();
            }
        }
    });
    CutThroatCricket.prototype.constructor = Cricket;

    /*
     * Around the clock
     */
    function AroundTheClock(players, dartboardId, scoreboardId) {
        BaseGame.call(this, 'clock', 'normal', players, dartboardId, scoreboardId);
        for(var i = 0; i < this._players.length; i++) {
            this._players[i].won = false;
            this._players[i].winningTurn = 0;
        }
        this.updateView();
    };
    AroundTheClock.prototype = Object.create(BaseGame.prototype, {
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
            value: function() {
                var player = this._players[this._currentPlayer],
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
        },
        processNewScore: {
            value: function(score) {
                if(this._gameEnded) {
                    return;
                }

                var player = this._players[this._currentPlayer];

                if(player.score == 20 && score.bull) {
                    player.won = true;
                    player.winningTurn = this._turnNumber;
                    player.throwsLeft = 0;

                    if(this._isGameOver()) {
                        player.active = false;
                        this._gameEnded = true;
                        this.updateView();
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
                this.updateView();
            }
        }
    });
    AroundTheClock.prototype.constructor = AroundTheClock;

    /*
     * x01
     */
    function X01(players, dartboardId, scoreboardId, options) {
        BaseGame.call(this, 'x01', 'normal', players, dartboardId, scoreboardId);

        options = options || {};
        this.startingScore = parseInt(options.startingScore) || 301;

        for(var i = 0; i < this._players.length; i++) {
            this._players[i].startingDouble = false;
            this._players[i].score = this.startingScore;
            this._players[i].startedTurnAt = this.startingScore;
        }

        this.updateView();
    };
    X01.prototype = Object.create(BaseGame.prototype, {
        _nextPlayer: {
            value: function() {
                var player = this._players[this._currentPlayer],
                    nextPlayerId = (this._currentPlayer + 1) % this._players.length,
                    nextPlayer = this._players[nextPlayerId];

                player.throwsLeft = 3;
                player.active = false;
                player.startedTurnAt = player.score;

                this._currentPlayer = nextPlayerId;
                nextPlayer.active = true;

                if(nextPlayerId <= this._currentPlayer) {
                    this._turnNumber ++;
                }
            }
        },
        processNewScore: {
            value: function(score) {
                if(this._gameEnded) {
                    return;
                }

                var player = this._players[this._currentPlayer];
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
                        this.endOfGame(player.name);
                        return;
                    }
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
                this.updateView();
            }
        },
        endOfGame: {
            value: function(winner) {
                this._gameEnded = true;
                this._winner = winner;
                this.updateView();
            }
        }
    });
    X01.prototype.constructor = X01;

    function NoDoubleStartX01(players, dartboardId, scoreboardId, options) {
        X01.call(this, players, dartboardId, scoreboardId, options);
    }
    NoDoubleStartX01.prototype = Object.create(X01.prototype, {
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
                    this.endOfGame(player.name);
                    return;
                }

                if(player.throwsLeft === 0) {
                    this._nextPlayer();
                }
                this.updateView();
            }
        },
    });
    NoDoubleStartX01.prototype.constructor = X01;

    /*
     * Games catalog object
     */
    var games = {
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
                    obj: CutThroatCricket
                }
            },
            obj: Cricket
        },

        x01: {
            desc: "x01",
            variants: {
                normal: {
                    desc: "Normal"
                },
                noDoubleStart: {
                    desc: "Start without double",
                    obj: NoDoubleStartX01
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
            obj: X01
        },

        clock: {
            desc: "Around the clock",
            variants: {
                normal: {
                    desc: "No variant"
                }
            },
            obj: AroundTheClock
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

    window.getGameClass = function(type, variant) {
        if(! games.hasOwnProperty(type) ||
                ! games[type].variants.hasOwnProperty(variant)) {
            return null;
        }

        var GameClass = null;
        if(variant === 'normal') {
            GameClass = games[type].obj
        } else {
            GameClass = games[type].variants[variant].obj;
        }

        return GameClass;
    };


    window.Save = Save;
    window.games = games;
    window.BaseGame = BaseGame;
    window.Cricket = Cricket;
    window.CutThroatCricket = Cricket;
    window.AroundTheClock = AroundTheClock;
    window.X01 = X01;
    window.NoDoubleStartX01 = NoDoubleStartX01;
})(window);

