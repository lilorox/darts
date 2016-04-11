/**
 * @license GamesLibrary.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define(function() {
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
                        nbPlayers: { min: 2, max: 2 },
                        _class: "Cricket"
                    },
                    cutThroat: {
                        desc: "Cut throat (2+ players)",
                        nbPlayers: { min: 2 },
                        _class: "CutThroatCricket"
                    }
                }
            },

            x01: {
                desc: "x01",
                variants: {
                    normal: {
                        desc: "Normal",
                        _class: "X01"
                    },
                    noDoubleStart: {
                        desc: "Start without double",
                        _class: "NoDoubleStartX01"
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
                }
            },

            clock: {
                desc: "Around the clock",
                variants: {
                    normal: {
                        desc: "No variant",
                        _class: "AroundTheClock"
                    }
                },
                options: {
                    dartsPerSlice: {
                        label: "Darts per target to close",
                        type: "number",
                        min: 1,
                        default: 1
                    }
                }
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
        getGameClassName: function(type, variant, players, options) {
            if(! this._games.hasOwnProperty(type) ||
                    ! this._games[type].variants.hasOwnProperty(variant)) {
                return null;
            }

            return this._games[type].variants[variant]._class;
        }
    };

    return GamesLibrary;
});

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
