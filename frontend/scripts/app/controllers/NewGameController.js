/**
 * @license NewGameController.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'views/ScoreBoard',
    './GameController',
    'Utils'
], function(ScoreBoard, GameController, Utils) {
    /**
     * Controller for the new game modal.
     * @constructor
     * @param {GamesLibrary} gamesLibrary - The GameLibrary object (model) referencing the rules.
     * @param {NewGameModal} modalView - The NewGameModal object (view) representing the modal box for a new game.
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
    }
    NewGameController.prototype = {
        /**
         * Starts a new game
         * @param {Object} game - The object containing the following game's parameters.
         * @param {string} game.type - The type of game to start.
         * @param {string} game.variant - The game variant.
         * @param {string[]} game.players - An array of strings containing the names of the players.
         * @param {Object} game.options - An extra object containing specific options for the selected game type/variant.
         * @param {boolean} game.randomize - If the players order should be randomized before starting the game or not.
         */
        runGame: function(game) {
            delete this._game;
            delete this._scoreboard;
            delete this._gameController;

            var players = game.players;
            if(game.randomize) {
                Utils.shuffleArray(players);
            }

            var className = this._gamesLibrary.getGameClassName(
                game.type,
                game.variant,
                players,
                game.options
            );

            (function(controller) {
                require(["models/games/" + className], function(Game) {
                    controller._game = new Game(game.players, game.options);

                    controller._scoreboard = new ScoreBoard(
                        controller._game,
                        {
                            dartboard: '#dartboard',
                            scoreboard: '#scoreboard',
                            throwsDetails: '#throws-details',
                            undoButton: '#undo-btn',
                            loadGameButton: '#load-btn',
                            saveGameButton: '#save-btn'
                        }
                    );
                    controller._scoreboard.init();

                    controller._gameController = new GameController(
                        controller._game,
                        controller._scoreboard
                    );
                });
            })(this);
        }
    };

    return NewGameController;
});
