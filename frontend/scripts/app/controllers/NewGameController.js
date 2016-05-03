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

            var Game = this._gamesLibrary.getGameClass(
                game.type,
                game.variant,
                players,
                game.options
            );

            this._game = new Game(game.players, game.options);

            this._scoreboard = new ScoreBoard(
                this._game,
                {
                    dartboard: '#dartboard',
                    scoreboard: '#scoreboard',
                    throwsDetails: '#throws-details',
                    undoButton: '#undo-btn',
                    loadGameButton: '#load-btn',
                    saveGameButton: '#save-btn'
                }
            );
            this._scoreboard.init();

            this._livestats = new LiveStats(
                this._game,
                {
                    statsDetails: '#stats-details',
                }
            );
            this._livestats.init();

            this._gameController = new GameController(
                this._game,
                this._scoreboard,
                this._livestats
            );
        }
    };

    return NewGameController;
});
