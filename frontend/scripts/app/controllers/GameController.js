/**
 * @license GameController.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'models/Save'
], function(Save) {
    /**
     * Controls the game.
     * @constructor
     * @param {BaseGame} game - The game (model) to control.
     * @param {ScoreBoard} scoreboard - The scoreboard (view) that interacts
     * with the model.
     * @param {LiveStats} livestats - The livestats (view) that displays the
     * statistics of the current game.
     */
    function GameController(game, scoreboard, livestats) {
        this._game = game;
        this._scoreboard = scoreboard;

        this.init();
    }
    GameController.prototype = {
        /**
         * Initializes the events of the controller.
         */
        init: function() {
            this.setupGameEvents();
            this.setupLoadSaveEvents();
        },

        /**
         * Detaches all the Dispatcher objects of the game and scoreboard.
         */
        detachAllDispatchers: function() {
            this._game.detachAllDispatchers();
            this._scoreboard.detachAllDispatchers();
        },

        /**
         * Attaches the game related scoreboard's dispatcher to the controller's methods.
         */
        setupGameEvents: function() {
            var controller = this;

            // Attach to the scoreboard events
            this._scoreboard.dartThrown.attach(function(data) {
                controller.registerScore(data.score);
            });
            this._scoreboard.undoButtonClicked.attach(function() {
                controller.undo();
            });
        },

        /**
         * Attaches the scoreboard's load & save dispatcher to the controller's methods.
         */
        setupLoadSaveEvents: function() {
            var controller = this;

            // Attach to the scoreboard events
            this._scoreboard.loadGameButtonClicked.attach(function() {
                controller.loadGame();
            });
            this._scoreboard.saveGameButtonClicked.attach(function() {
                controller.saveGame();
            });
        },

        /**
         * Registers a new score in the model.
         * @param {Object} score - The new score to register.
         */
        registerScore: function(score) {
            this._game.registerScore(score);
        },

        /**
         * Calls the model's undo function.
         */
        undo: function() {
            if(this._game.getUndoQueueLength() !== 0) {
                this._game.undo();
                this._scoreboard.update();
            }
        },

        /**
         * Loads a previously saved state
         */
        loadGame: function() {
            if(Save.exists("darts")) {
                // Clear events before loading
                this.detachAllDispatchers();
                this._scoreboard.removeElementsEvents();

                // Load the save and setup events
                this._game = Save.load("darts");
                this._game.setupEvents();

                // Re-create the scoreboard
                this._scoreboard = new Scoreboard(
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

                // Reset the controllers's events
                this.setupGameEvents();
                this.setupLoadSaveEvents();
            }
        },

        /**
         * Saves (and overwrites) the game
         */
        saveGame: function() {
            // Clear events before saving
            this.detachAllDispatchers();
            this._scoreboard.removeElementsEvents();

            Save.save("darts", this._game);

            // Rebuild events after saving
            this._game.setupEvents();
            this._scoreboard.setupEvents();

            // Reset the controllers's events
            this.setupGameEvents();
            this.setupLoadSaveEvents();
            $('#load-btn').toggleClass("disabled", false);
        },

        /**
         * Unlinks everything from the controller and delete the model and view.
         */
        unlink: function() {
            this.detachAllDispatchers();
            if(this._game != null) {
                this._game.unlink();
                delete this._game;
            }

            if(this._scoreboard != null) {
                this._scoreboard.unlink();
                delete this._scoreboard;
            }

            if(this._livestats != null) {
                this._livestats.unlink();
                delete this._livestats;
            }
        }
    };

    return GameController;
});
