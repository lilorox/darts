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
     * Controller of the game
     */
    function GameController(game, scoreboard) {
        this._game = game;
        this._scoreboard = scoreboard;

        (function(controller) {
            // Attach to the scoreboard events
            this._scoreboard.dartboardClicked.attach(function(data) {
                controller.registerScore(data.score);
            });
            this._scoreboard.undoButtonClicked.attach(function() {
                controller.undo();
            });
            this._scoreboard.loadButtonClicked.attach(function() {
                controller.loadGame();
            });
            this._scoreboard.saveButtonClicked.attach(function() {
                controller.saveGame();
            });
        })(this);
    };
    GameController.prototype = {
        registerScore: function(score) {
            this._game.registerScore(score);
            this._scoreboard.update();
        },
        undo: function() {
            if(this._game.getUndoQueueLength() != 0) {
                this._game.undo();
                this._scoreboard.update();
            };
        },
        loadGame: function() {
            console.log('todo loadGame');
            this._scoreboard.update();
        },
        saveGame: function() {
            console.log('todo saveGame');
            this._scoreboard.update();
        }
    };

    /*
     * Controller for the new game modal
     */
    function NewGameController(gameLibrary, modalView) {
        this._gameLibray = gameLibrary;
        this._view = modalView;

        (function(controller) {
            this._view.gameSelectChanged.attach(function(data) {
                controller.setGame(data.game);
            });
        })(this);
    };
    NewGameController.prototype = {
        setGame: function(game) {
            return;
        };
    };

    /*
     * Save objects to the global scope
     */
    window.Controller = Controller;
    window.NewGameController = NewGameController;
})(window);
