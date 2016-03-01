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

    var rules = {
        cricket: {
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
            }
        },
        x01: {
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
        },
        clock: {
            desc: "Around the clock",
            variants: {
                normal: {
                    desc: "No variant"
                }
            }
        }
    };

    var Game = function(type, variant, players) {
    };

    window.Game = Game;
    window.rules = rules;

})(window);
