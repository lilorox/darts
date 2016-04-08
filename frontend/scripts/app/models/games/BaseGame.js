/**
 * @license BaseGame.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    '../Dispatcher'
], function(Dispatcher) {
    /**
     * Parent game object, cannot be used directly but the games inherit from it
     * @constructor
     * @param {string} type - The type of game.
     * @param {string} variant - The variant of the game.
     * @param {string[]} game.players - An array of strings containing the names of the players.
     */
    function BaseGame(type, variant, players) {
        this._type = type;
        this._variant = variant;
        this._players = players.map(function(player) {
            return {
                name: player,
                score: 0,
                throwsLeft: 3,
                active: false,
                throws: [],
                showScoreTab: false
            };
        });
        this._currentPlayer = 0;
        this._previousPlayer = 0;
        this._players[0].active = true;
        this._players[0].showScoreTab = true;
        this._turnNumber = 1;
        this._gameEnded = false;

        // Undo actions
        this._undo = [];
        this._undoMaxSize = 10;

        // Properties to save and restore in the game object
        this._gameStateProperties = [
            "_players",
            "_currentPlayer",
            "_turnNumber",
            "_gameEnded",
            "_winner"
        ];
        this.additionalProps = [];

        this.setupEvents();
    }
    BaseGame.prototype = {
        /**********************************************************************
         * Public methods
         *********************************************************************/

        /**
         * Creates the Dispatcher objects
         */
        setupEvents: function() {
            this.undoListChanged = new Dispatcher();
            this.gameHasEnded = new Dispatcher();
            this.scoreChanged = new Dispatcher();
        },

        /**
         * Detaches all the Dispatchers
         */
        detachAllDispatchers: function() {
            this.undoListChanged.detachAll();
            this.gameHasEnded.detachAll();
            this.scoreChanged.detachAll();
        },

        /**
         * Returns a player from its id.
         * @param {number} playerId - Id of the player to return.
         * @returns {Player} Player object.
         */
        getPlayer: function(playerId) {
            return this._players[playerId];
        },

        /**
         * Returns the currently active player.
         * @returns {Player} Active player object.
         */
        getActivePlayer: function() {
            return this._players[this._currentPlayer];
        },

        /**
         * Returns the length of the undo queue.
         * @returns {number} Length of the undo queue.
         */
        getUndoQueueLength: function() {
            return this._undo.length;
        },

        /**
         * Returns an object describing the context to use in the templates.
         * By default, it returns an object as {players: [array of player objects], turn: turnNumber}.
         * The context can be extended by the results of the getSpecificContext function.
         * @see getSpecificContext
         * @returns {Object} The context to use in templates.
         */
        getContext: function() {
            return $.extend(
                {
                    players: this._players,
                    turn: this._turnNumber
                },
                this.getSpecificContext()
            );
        },

        /**
         * Returns the type of this game.
         * @returns {string} The type of game.
         */
        getType: function() {
            return this._type;
        },

        /**
         * Returns the variant of this game.
         * @returns {string} The variant of game.
         */
        getVariant: function() {
            return this._variant;
        },

        /**
         * Registers a new score from a thrown dart.
         * This function takes care of changing the player's showScoreTab
         * property to control the display of the players score sheet.
         * Adds the throw to the current player and calls a specific function
         * processNewScore that should be overriden by the child game class.
         * @see processNewScore
         * @param {Score} score - Score object to register.
         */
        registerScore: function(score) {
            if(this._gameEnded) {
                return;
            }

            // Hide previous player tab
            this.getPlayer(this._previousPlayer).showScoreTab = false;

            // Add the throw to the current player
            var player = this.getActivePlayer();
            player.showScoreTab = true;

            // Save current state to the undo queue
            this._saveState();

            if(player.throws.length < this._turnNumber) {
                player.throws.push([]);
            }
            player.throws[this._turnNumber - 1].push(score);

            // Save previous player
            this._previousPlayer = this._currentPlayer;

            // Run specific game logic
            this.processNewScore(score);
            this.scoreChanged.dispatch();
        },

        /**
         * Pops the last saved state to undo the last move.
         */
        undo: function() {
            if(this.getUndoQueueLength() <= 0) {
                return;
            }
            var state = JSON.parse(this._undo.pop());

            for(var prop in state) {
                if(state.hasOwnProperty(prop) && this.hasOwnProperty(prop)) {
                    this[prop] = state[prop];
                }
            }

            this.undoListChanged.dispatch();
        },

        /**
         * Marks the game as over and deactivate all players.
         * Dispatches the winner's id to the gameHasEnded dispatcher object.
         * @see gameHasEnded
         * @param {number[]} winners - Ids of the players that won. null if not
         * applicable to this game.
         */
        gameOver: function(winners) {
            this._gameEnded = true;

            // Disable all players
            for(var i = 0; i < this._players.length; i++) {
                this._players[i].active = false;
            }

            var winnersNames = [];
            (function(game) {
                winnersNames = winners.map(function(playerId) {
                    return game._players[playerId].name;
                }).join(', ');
            })(this);


            // Dispatch an event for the end of the game
            // If the winnerId is null, send null
            this.gameHasEnded.dispatch((
                winners == null ?
                null :
                {
                    players: winnersNames
                }
            ));
        },


        /**********************************************************************
         * "Abstract" methods that may be overridden
         *********************************************************************/

        /**
         * Returns the specific context of this game.
         * If overriden, it must return an Object (even empty).
         * @see getContext
         * @abstract
         * @returns {Object} Specific context object for the templates.
         */
        getSpecificContext: function() { return {}; },

        /**
         * Processes the score of the dart that has been thrown according to
         * the specific rules of the game.
         * @see registerScore
         * @abstract
         * @param {Score} score - The score that is being registered.
         */
        processNewScore: function(score) { return; },


        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Saves the state of the game into the undo array.
         * @private
         */
        _saveState: function() {
            var props = [].concat(this._gameStateProperties).concat(this.additionalProps),
                state = {};

            for(var i = 0; i < props.length; i ++) {
                state[props[i]] = this[props[i]];
            }

            this._undo.push(JSON.stringify(state));
            if(this._undo.length > this._undoMaxSize) {
                this._undo.shift();
            }
            this.undoListChanged.dispatch();
        }
    };

    return BaseGame;
});
