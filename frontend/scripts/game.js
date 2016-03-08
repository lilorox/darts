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
    var BaseGame = function(type, variant, players, dartboardId, scoreboardId) {
        this.type = type;
        this.variant = variant;
        this.players = players;

        var onClickAction = (function(game) {
            return function(evt) {
                var rect = this.getBoundingClientRect(),
                    dartboard =  $(this).data('dartboard'),
                    score = dartboard.DartBoard(
                        'getScore',
                        evt.clientX - rect.left,
                        evt.clientY - rect.top
                    );
                game.processNewScore(score);
            }
        })(this);

        this.dartboard = $('#' + dartboardId).DartBoard({
            onClick: onClickAction
        });

        this.scoreboard = $('#' + scoreboardId);

        this.buildScoreTable();
//        console.log('BaseGame:', this.type, this.variant, this.players);
    };
    BaseGame.prototype = {
        buildScoreTable: function() { return; },
        processNewScore: function(score) { return; }
    };

    var games = {}
    games.cricket =  {
        desc: "Cricket",
        variants: {
            normal: {
                desc: "Normal (2 players)",
                nbPlayers: { min: 2, max: 2 }
            },
            cutThroat: {
                desc: "Cut throat (2+ players)",
                nbPlayers: { min: 2 }
            }
        },
        obj: {}
    };
    games.cricket.obj = function(players, dartboardId, scoreboardId) {
        BaseGame.call(this, 'cricket', 'normal', players, dartboardId, scoreboardId);
    };
    games.cricket.obj.prototype = Object.create(BaseGame.prototype, {
        buildScoreTable: {
            value: function() {
                console.log('Building score table');
                this.scoreboard.append('<p>Pouet</p>');
            }
        },
        processNewScore: {
            value: function(score) {
                console.log('score=', score);
            }
        }
    });
    games.cricket.obj.prototype.constructor = games.cricket.obj;


    games.x01 = {
        desc: "x01",
        variants: {
            301: {
                desc: "301"
            },
            501: {
                desc: "501"
            },
            701: {
                desc: "701"
            }
        }
    };


    games.clock = {
        desc: "Around the clock",
        variants: {
            normal: {
                desc: "No variant"
            }
        }
    };


    games.killer = {
        desc: "Killer",
        variants: {
            normal: {
                desc: "No variant",
                nbPlayers: { min: 4 }
            }
        }
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
