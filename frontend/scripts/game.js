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
    var loadTemplate = function(url, context, target) {
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'text',
            cache: false // debug
        }).then(function(src) {
            return Handlebars.compile(src)(context);
        }).done(function(html) {
            $(target).html(html);
        });
    };

    var scoreToString = function(score) {
        var factorToString = {
                1: "",
                2: "D",
                3: "T"
            },
            value = (score.bull ? "B" : score.value);
        return factorToString[score.factor] + value;
    };

    var BaseGame = function(type, variant, players, dartboardId, scoreboardId) {
        this.type = type;
        this.variant = variant;
        this.players = players.map(function(player) {
            return {
                name: player,
                score: 0,
                throwsLeft: 3,
                active: false,
                throws: []
            };
        });
        this.currentPlayer = 0;
        this.players[0].active = true;
        this.turnNumber = 1;
        this.gameEnded = false;
        this.winner = null;

        var onClickAction = (function(game) {
            return function(evt) {
                var rect = this.getBoundingClientRect(),
                    dartboard =  $(this).data('dartboard'),
                    score = dartboard.DartBoard(
                        'getScore',
                        evt.clientX - rect.left,
                        evt.clientY - rect.top
                    );
                game.registerNewScore(score);
            }
        })(this);

        this.dartboard = $('#' + dartboardId).DartBoard({
            onClick: onClickAction
        });
        this.scoreboard = $('#' + scoreboardId);

        (function(game) {
            Handlebars.registerHelper('activePlayer', function() {
                return game.players[game.currentPlayer].name;
            });
        })(this);
    };
    BaseGame.prototype.updateView = function(additionalContext) {
        var initialContext = {
                players: this.players,
                turn: this.turnNumber,
                gameEnded: this.gameEnded,
                winner: this.winner
            },
            context = $.extend(true, {}, initialContext,
                    this.additionalContext, additionalContext);

        (function(game, context) {
            // Game template
            loadTemplate(
                'templates/' + game.type + '.' + game.variant + '.hbs',
                context,
                game.scoreboard
            );

            /*
            // Throws details template
            loadTemplate(
                'templates/throws-details.hbs',
                context,
                '#throws-details'
            );
            */
        })(this, context);
    };
    BaseGame.prototype.registerNewScore = function(score) {
        // Add the throw to the current player
        var player = this.players[this.currentPlayer];

        if(player.throws.length < this.turnNumber) {
            player.throws.push([]);
        }
        player.throws[this.turnNumber - 1].push(score);

        // Run specific game logic
        this.processNewScore(score);
    };
    BaseGame.prototype.processNewScore = function(score) { return; };

    /*
     * Cricket
     */
    var Cricket = function(players, dartboardId, scoreboardId) {
        BaseGame.call(this, 'cricket', 'normal', players, dartboardId, scoreboardId);
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].targets = {
                _15: 0,
                _16: 0,
                _17: 0,
                _18: 0,
                _19: 0,
                _20: 0,
                _B: 0
            };
        }

        this.allowedTargets = {
            _15: true,
            _16: true,
            _17: true,
            _18: true,
            _19: true,
            _20: true,
            _B: true
        };

        this.additionalContext = {
            allowedTargets: this.allowedTargets
        };

        Handlebars.registerHelper('targetFormat', function() {
            // See css for color definitions
            var labelClass = "throw" + this;
            return new Handlebars.SafeString(
                '<span class="label label-' + labelClass + '">' + this + '</span>'
            );
        });

        this.updateView();
    };
    Cricket.prototype = Object.create(BaseGame.prototype, {
        _addScore: {
            value: function(score) {
                this.players[this.currentPlayer].score += score.factor * score.value;
            }
        },
        _checkTargetIsClosed: {
            enumerable: false,
            value: function(target) {
                var playersClosed = 0;
                for(var i = 0; i < this.players.length; i++) {
                    if(this.players[i].targets[target] >= 3) {
                        playersClosed ++;
                    }
                }

                return (playersClosed === this.players.length);
            }
        },
        _playerClosedAllTargets: {
            enumerable: false,
            value: function(playerId) {
                var targets = Object.keys(this.allowedTargets),
                    playerClosed = true,
                    j = 0;
                while(playerClosed && j < targets.length) {
                    playerClosed = (playerClosed && this.players[playerId].targets[targets[j]] >= 3);
                    j ++;
                }

                return playerClosed;
            }
        },
        _checkAllTargetsClosed: {
            enumerable: false,
            value: function() {
                for(var i = 0; i < this.players.length; i++) {
                    if(this._playerClosedAllTargets(i)) {
                        return true;
                    }
                }
                return false;
            }
        },
        processNewScore: {
            value: function(score) {
                if(this.gameEnded) {
                    return;
                }

                var player = this.players[this.currentPlayer],
                    additionalContext = {
                        allowedTargets: this.allowTargets
                    };

                var targetName = (score.bull ? '_B' : '_' + score.value);
                if(this.allowedTargets.hasOwnProperty(targetName) &&
                        this.allowedTargets[targetName]) {
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
                    this.allowedTargets[targetName] = false;
                }

                player.throwsLeft --;
                if(player.throwsLeft === 0) {
                    player.throwsLeft = 3;
                    player.active = false;
                    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
                    this.players[this.currentPlayer].active = true;
                    if(this.currentPlayer === 0) {
                        if(this._checkAllTargetsClosed()) {
                            this.endOfGame();
                        } else {
                            this.turnNumber ++;
                        }
                    }
                }
                this.updateView(additionalContext);
            }
        },
        endOfGame: {
            value: function() {
                this.gameEnded = true;
                var winner = this.players[0].name,
                    winnerScore = this.players[0].score;

                for(var i = 1; i < this.players.length; i++) {
                    if(this.players[i].score > winnerScore) {
                        winner = this.players[i].name;
                        winnerScore = this.players[i].score;
                    }
                }

                this.winner = winner;
                this.updateView();
            }
        }
    });
    Cricket.prototype.constructor = Cricket;

    /*
     * Cut-Throat Cricket
     */
    var CutThroatCricket = function(players, dartboardId, scoreboardId) {
        Cricket.call(this, players, dartboardId, scoreboardId);
        this.updateView();
    }
    CutThroatCricket.prototype = Object.create(Cricket.prototype, {
        _addScore: {
            value: function(score) {
                var targetName = (score.bull ? '_B' : '_' + score.value);
                for(var i = 0; i < this.players.length; i ++) {
                    if(i != this.currentPlayer && this.players[i].targets[targetName] < 3) {
                        this.players[i].score += score.factor * score.value;
                    }
                }
            }
        },
        endOfGame: {
            value: function() {
                this.gameEnded = true;
                var winner = this.players[0].name,
                    winnerScore = this.players[0].score;

                for(var i = 1; i < this.players.length; i++) {
                    if(this.players[i].score < winnerScore) {
                        winner = this.players[i].name;
                        winnerScore = this.players[i].score;
                    }
                }

                this.winner = winner;
                this.updateView();
            }
        }
    });
    CutThroatCricket.prototype.constructor = Cricket;

    /*
     * Around the clock
     */
    var AroundTheClock = function(players, dartboardId, scoreboardId) {
        BaseGame.call(this, 'clock', 'normal', players, dartboardId, scoreboardId);
        for(var i = 0; i < this.players.length; i++) {
            this.players[i].won = false;
            this.players[i].winningTurn = 0;
        }
        this.updateView();
    };
    AroundTheClock.prototype = Object.create(BaseGame.prototype, {
        _isGameOver: {
            enumerable: false,
            value: function() {
                var gameIsOver = true;
                for(var i = 0; i < this.players.length; i++) {
                    gameIsOver = gameIsOver && this.players[i].won;
                }
                return gameIsOver;
            }
        },
        _nextPlayer: {
            value: function() {
                var player = this.players[this.currentPlayer],
                    nextPlayerId = (this.currentPlayer + 1) % this.players.length,
                    nextPlayer = this.players[nextPlayerId];

                while(nextPlayer.won) {
                    nextPlayerId = (nextPlayerId + 1) % this.players.length;
                    nextPlayer = this.players[nextPlayerId];
                }

                if(this.currentPlayer != nextPlayerId) {
                    player.active = false;
                }

                if(nextPlayerId <= this.currentPlayer) {
                    this.turnNumber ++;
                }

                this.currentPlayer = nextPlayerId;
                nextPlayer.active = true;
            }
        },
        processNewScore: {
            value: function(score) {
                if(this.gameEnded) {
                    return;
                }

                var player = this.players[this.currentPlayer];

                if(player.score == 20 && score.bull) {
                    player.won = true;
                    player.winningTurn = this.turnNumber;
                    player.throwsLeft = 0;

                    if(this._isGameOver()) {
                        player.active = false;
                        this.gameEnded = true;
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
    var X01 = function(players, dartboardId, scoreboardId, options) {
        BaseGame.call(this, 'x01', 'normal', players, dartboardId, scoreboardId);

        options = options || {};
        this.startingScore = parseInt(options.startingScore) || 301;

        for(var i = 0; i < this.players.length; i++) {
            this.players[i].startingDouble = false;
            this.players[i].score = this.startingScore;
            this.players[i].startedTurnAt = this.startingScore;
        }

        this.updateView();
    };
    X01.prototype = Object.create(BaseGame.prototype, {
        _nextPlayer: {
            value: function() {
                var player = this.players[this.currentPlayer],
                    nextPlayerId = (this.currentPlayer + 1) % this.players.length,
                    nextPlayer = this.players[nextPlayerId];

                player.throwsLeft = 3;
                player.active = false;
                player.startedTurnAt = player.score;

                this.currentPlayer = nextPlayerId;
                nextPlayer.active = true;

                if(nextPlayerId <= this.currentPlayer) {
                    this.turnNumber ++;
                }
            }
        },
        processNewScore: {
            value: function(score) {
                if(this.gameEnded) {
                    return;
                }

                var player = this.players[this.currentPlayer];
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
                this.gameEnded = true;
                this.winner = winner;
                this.updateView();
            }
        }
    });
    X01.prototype.constructor = X01;

    var NoDoubleStartX01 = function(players, dartboardId, scoreboardId, options) {
        X01.call(this, players, dartboardId, scoreboardId, options);
    }
    NoDoubleStartX01.prototype = Object.create(X01.prototype, {
        processNewScore: {
            value: function(score) {
                if(this.gameEnded) {
                    return;
                }

                var player = this.players[this.currentPlayer];
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

    window.games = games;
})(window);
