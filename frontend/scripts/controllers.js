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

        this.init();
    };
    GameController.prototype = {
        init: function() {
            this.setupGameEvents();
            this.setupLoadSaveEvents();
        },
        detachAllDispatchers: function() {
            this._game.detachAllDispatchers();
            this._scoreboard.detachAllDispatchers();
        },
        setupGameEvents: function() {
            (function(controller) {
                // Attach to the scoreboard events
                controller._scoreboard.dartThrown.attach(function(data) {
                    controller.registerScore(data.score);
                });
                controller._scoreboard.undoButtonClicked.attach(function() {
                    controller.undo();
                });
            })(this);
        },
        setupLoadSaveEvents: function() {
            (function(controller) {
                // Attach to the scoreboard events
                controller._scoreboard.loadGameButtonClicked.attach(function() {
                    controller.loadGame();
                });
                controller._scoreboard.saveGameButtonClicked.attach(function() {
                    controller.saveGame();
                });
            })(this);
        },
        registerScore: function(score) {
            this._game.registerScore(score);
        },
        undo: function() {
            if(this._game.getUndoQueueLength() != 0) {
                this._game.undo();
                this._scoreboard.update();
            };
        },
        loadGame: function() {
            if(Save.exists("darts")) {
                this._scoreboard = null;
                $('#dartboard').empty();
                $('#scoreboard').empty();
                this._game = Save.load("darts");
                this._game.setupEvents();

                this._scoreboard = new Scoreboard(
                    this._game,
                    {
                        dartboard: $('#dartboard'),
                        scoreboard: $('#scoreboard'),
                        throwsDetails: $('#throws-details'),
                        undoButton: $('#undo-btn'),
                        loadGameButton: $('#load-btn'),
                        saveGameButton: $('#save-btn')
                    }
                );
                this._scoreboard.init();

                this.setupGameEvents();
            }
        },
        saveGame: function() {
            // Clear events before saving
            this.detachAllDispatchers();
            this._scoreboard.removeElementsEvents();

            Save.save("darts", this._game);

            // Rebuild events after saving
            this._game.setupEvents();
            this._scoreboard.setupEvents();
            this.setupGameEvents();

            $('#load-btn').toggleClass("disabled", false);
            this.setupLoadSaveEvents();
        }
    };

    /*
     * Controller for the new game modal
     */
    function NewGameController(gamesLibrary, modalView) {
        this._gamesLibrary = gamesLibrary;
        this._view = modalView;
        this._game = null;
        this._scoreboard = null;
        this._gameController = null;

        (function(controller) {
            controller._view.goButtonClicked.attach(function(data) {
                this._gameController = controller.runGame(data);
            });
        })(this);
    };
    NewGameController.prototype = {
        runGame: function(game) {
            delete this._game;
            delete this._scoreboard;
            delete this._gameController;

            this._game = this._gamesLibrary.create(
                game.type,
                game.variant,
                game.players,
                game.options
            );

            this._scoreboard = new Scoreboard(
                this._game,
                {
                    dartboard: $('#dartboard'),
                    scoreboard: $('#scoreboard'),
                    throwsDetails: $('#throws-details'),
                    undoButton: $('#undo-btn'),
                    loadGameButton: $('#load-btn'),
                    saveGameButton: $('#save-btn')
                }
            );
            this._scoreboard.init();

            this._gameController = new GameController(
                this._game,
                this._scoreboard
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
