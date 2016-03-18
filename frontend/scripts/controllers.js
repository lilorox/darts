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
            controller._scoreboard.dartboardClicked.attach(function(data) {
                controller.registerScore(data.score);
            });
            controller._scoreboard.undoButtonClicked.attach(function() {
                controller.undo();
            });
            controller._scoreboard.loadButtonClicked.attach(function() {
                controller.loadGame();
            });
            controller._scoreboard.saveButtonClicked.attach(function() {
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
    function NewGameController(gamesLibrary, modalView) {
        this._gamesLibrary = gamesLibrary;
        this._view = modalView;
        this._gameController = null;

        (function(controller) {
            controller._view.goButtonClicked.attach(function(data) {
                this._gameInstance = controller.runGame(data);
            });
        })(this);
    };
    NewGameController.prototype = {
        runGame: function(game) {
            var game = this._gamesLibrary.create(
                game.type,
                game.variant,
                game.players,
                game.options
            );
        },
        getGameInstance: function() {
            return this._gameController;
        }
    };

    /*
     * Save objects to the global scope
     */
    window.GameController = GameController;
    window.NewGameController = NewGameController;
})(window);
