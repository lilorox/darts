/**
 * @license ScoreBoard.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'jquery',
    'bootstrap',
    'handlebars',
    'chartist',
    './DartBoard',
    'models/Dispatcher',
    'Utils'
], function($, bootstrap, Handlebars, Chartist, DartBoard, Dispatcher, Utils) {
    /**
     * ScoreBoard view object.
     * @constructor
     * @param {BaseGame} model - Game object that constitutes the model.
     * @param {Object} elements - jQuery selectors of the elements that
     * constitute the view.
     * @param {String} elements.dartboard - The dartboard div selector.
     * @param {String} elements.scoreboard - The scoreboard div selector.
     * @param {String} elements.throwsDetails - The div selector that will
     * contain the throws details table.
     * @param {String} elements.statsDetails - The div selector that will
     * contain the statistics graphs.
     * @param {String} elements.undoButton - The undo button element selector.
     * @param {String} elements.loadGameButton - The load button element selector.
     * @param {String} elements.saveGameButton - The save button element selector.
     */
    function ScoreBoard(model, elements) {
        this._model = model;
        this._elements = {
            dartboard: $(elements.dartboard),
            scoreboard: $(elements.scoreboard),
            throwsDetails: $(elements.throwsDetails),
            statsDetails: $(elements.statsDetails),
            undoButton: $(elements.undoButton),
            loadGameButton: $(elements.loadGameButton),
            saveGameButton: $(elements.saveGameButton),
        };
    }
    ScoreBoard.prototype = {
        /**********************************************************************
         * Public methods
         *********************************************************************/

        /**
         * Initializes the scoreboard with the jQuery plugin, registers helpers
         * and sets the event handlers.
         */
        init: function() {
            // Create the DartBoard Object
            this._elements.dartboard.DartBoard();

            // Make sure the undo button is disabled
            this._elements.undoButton.toggleClass('disabled', true);

            // Hide the winner info div
            $('#winner-info').hide();

            this.registerHelpers();
            this.setupEvents();
            this.update();
        },

        /**
         * Sets the dispatchers events and the elements events.
         */
        setupEvents: function() {
            this.setupDisptacherEvents();
            this.setupElementsEvents();
        },

        /**
         * Removes the events on the different UI elements.
         */
        removeElementsEvents: function() {
            this._elements.dartboard.off('dartThrown');
            this._elements.undoButton.off('click');
            this._elements.loadGameButton.off('click');
        },

        /**
         * Sets the event handlers on the different UI elements.
         */
        setupElementsEvents: function() {
            // Dispatch events on element changes
            var scoreboard = this;
            scoreboard._elements.dartboard.on('dartThrown', function(evt) {
                scoreboard.dartThrown.dispatch({ score: evt.score });
            });
            scoreboard._elements.undoButton.on('click', function(evt) {
                scoreboard.undoButtonClicked.dispatch();
            });
            scoreboard._elements.loadGameButton.on('click', function(evt) {
                scoreboard.loadGameButtonClicked.dispatch();
            });
            scoreboard._elements.saveGameButton.on('click', function(evt) {
                scoreboard.saveGameButtonClicked.dispatch();
            });
        },

        /**
         * Create the dispatcher of the view and attaches to the model's
         * dispatchers.
         */
        setupDisptacherEvents: function() {
            // Dispatchers for events emitted from the scoreboard
            this.dartThrown = new Dispatcher();
            this.undoButtonClicked = new Dispatcher();
            this.loadGameButtonClicked = new Dispatcher();
            this.saveGameButtonClicked = new Dispatcher();

            // Attach to the models events
            var scoreboard = this;
            this._model.undoListChanged.attach(function() {
                // Enable-disable undo button in function of the undo queue length
                scoreboard._elements.undoButton.toggleClass(
                    'disabled',
                    (scoreboard._model.getUndoQueueLength() <= 0)
                );
                $('#winner-info').hide();
            });
            this._model.scoreChanged.attach(function() {
                scoreboard.update();
            });
            this._model.gameHasEnded.attach(function(winners) {
                if(winners && winners.hasOwnProperty('players') && winners.players) {
                    $('#winners').text(winners.players);
                    $('#winner-info').show();
                }
            });
        },

        /**
         * Detaches the scoreboard from the model's dispatchers.
         */
        detachAllDispatchers: function() {
            this.dartThrown.detachAll();
            this.undoButtonClicked.detachAll();
            this.loadGameButtonClicked.detachAll();
            this.saveGameButtonClicked.detachAll();
        },

        /**
         * Registers the needed Handlebar helpers
         */
        registerHelpers: function() {
            var scoreboard = this;
            Handlebars.registerHelper({
                activePlayer: function() {
                    return scoreboard._model.getActivePlayer().name;
                },
                throwsTable: function(playerId) {
                    if(this.throws.length === 0) {
                        return new Handlebars.SafeString('<tr><td colspan="4">No throws yet</td></tr>');
                    }

                    var html = '',
                        lastTurn = true;
                    for(var i = this.throws.length - 1; i >= 0; i--) {
                        var turn = this.throws[i];

                        html += '<tr><th>' + (i + 1) + '</th>';
                        for(var j = 0; j < turn.length; j++) {
                            if(turn[j] != null) {
                                html += '<td><span' +
                                    (turn[j].highlight ? ' class="score-highlight"' : '') +
                                    '>' + Utils.scoreToString(turn[j]) + '</span>';
                                if(turn[j].invalidate != null && turn[j].invalidate) {
                                    html += ' <span class="glyphicon glyphicon-remove" aria-hidden="true"' +
                                        (turn[j].invalidateReason ? 'data-toggle="tooltip" data-placement="bottom" title="' + turn[j].invalidateReason + '"' : '') +
                                        '></span>';
                                }
                                html += '</td>';
                            } else {
                                html += '<td><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></td>';
                            }
                        }

                        html += '</tr>';
                        lastTurn = false;
                    }
                    return new Handlebars.SafeString(html);
                },
                targetFormat: function() {
                    // See css for color definitions
                    var labelClass = "throw" + this;
                    return new Handlebars.SafeString(
                        '<span class="label label-' + labelClass + '">' + this + '</span>'
                    );
                }
            });
        },

        /**
         * Applies the templates of the specific scoretable and the throws table.
         * Creates the stats graphs.
         */
        update: function() {
            // Game template
            Utils.loadTemplate(
                'templates/' + this._model.getType() + '.' + this._model.getVariant() + '.hbs',
                this._model.getContext(),
                this._elements.scoreboard
            );

            // Throws details template
            Utils.loadTemplate(
                'templates/throws-details.hbs',
                this._model.getContext(),
                this._elements.throwsDetails,
                function() { $('[data-toggle="tooltip"]').tooltip(); }
            );
        },

        /**
         * Unlinks everything from the scoreboard.
         */
        unlink: function() {
            this.detachAllDispatchers();
            delete this.dartThrown;
            delete this.undoButtonClicked;
            delete this.loadGameButtonClicked;
            delete this.saveGameButtonClicked;

            this._elements.dartboard.off('dartThrown');
            this._elements.dartboard.DartBoard('destroy');

            this._elements.undoButton.off('click');
            this._elements.loadGameButton.off('click');
            this._elements.saveGameButton.off('click');

            delete this._elements;
        }
    };

    return ScoreBoard;
});

