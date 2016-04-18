/**
 * @license NewGameController.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'views/ScoreBoard',
    'views/LiveStats',
    './GameController',
    'Utils'
], function(ScoreBoard, LiveStats, GameController, Utils) {
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
        this._livestats = null;
        this._gameController = null;

        var controller = this;
        controller._view.goButtonClicked.attach(function(data) {
            this._gameController = controller.runGame(data);
        });
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
            // Tells the previous gameController (if it exists) to unlink everything
            // so we can remove it safely
            if(this._gameController != null) {
                this._gameController.unlink();
                delete this._gameController;
            }

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

            var controller = this;
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

                controller._livestats = new LiveStats(
                    controller._game,
                    {
                        statsDetails: '#stats-details',
                    }
                );
                controller._livestats.init();

                controller._gameController = new GameController(
                    controller._game,
                    controller._scoreboard,
                    controller._livestats
                );
            });
        }
    };

    return NewGameController;
});
