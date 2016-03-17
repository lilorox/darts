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
     * Scoreboard view object
     */
    function Scoreboard(model, elements) {
        this._model = model;
        /*
         * elements = {
         *      dartboard: $('#dartboardId'),
         *      undoButton: $('#undoButtonId'),
         *      loadGameButton: $('#loadGameButtonId'),
         *      saveGameButton: $('#saveGameButtonId')
         * }
         */
        this._elements = elements;

        // Dispatchers for events emitted from the scoreboard
        this.dartboardClicked = new Dispatch(this);
        this.undoButtonClicked = new Dispatch(this);
        this.loadGameButtonClicked = new Dispatch(this);
        this.saveGameButtonClicked = new Dispatch(this);

        // Dispatch events on element changes
        (function(scoreboard) {
            this._elements.dartboard.on('click', function(evt) {
                scoreboard.dartboardClicked.notify({ score: evt.score });
            });
            this._elements.undoButton.on('click', function(evt) {
                scoreboard.undoButtonClicked.notify();
            });
            this._elements.loadGameButton.on('click', function(evt) {
                scoreboard.loadGameButtonClicked.notify();
            });
            this._elements.saveGameButton.on('click', function(evt) {
                scoreboard.saveGameButtonClicked.notify();
            });
        })(this);

        // Attach to the models events
        this._model.undoListChanged.attach(function() {
            // Enable-disable undo button in function of the undo queue length
            this._elements.undoButton.toggleClass(
                'disabled',
                (this._model.getUndoQueueLength() <= 0)
            );
        });
        this._model.gameHasEnded.attach(function(winner) {
            console.log('game over, winner: ', winner.name);
        });
    };
    Scoreboard.prototype = {
        registerHelpers: function() {
            (function(scoreboard) {
                Handlebars.registerHelper({
                    activePlayer: function() {
                        return scoreboard._model.getActivePlayer().name;
                    },
                    throwsTable: function(playerId) {
                        if(this.throws.length == 0) {
                            return new Handlebars.SafeString('<tr><td colspan="4">No throws yet</td></tr>');
                        }

                        var html = '',
                            lastTurn = true;
                        for(var i = this.throws.length - 1; i >= 0; i--) {
                            var turn = this.throws[i];

                            html += '<tr><td>' + (i + 1) + '</td>';
                            for(var j = 0; j < turn.length; j++) {
                                html += '<td>' + scoreToString(turn[j]) + '</td>';
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
            })(this);
        },
        update: function() {
            // Game template
            loadTemplate(
                'templates/' + this._template + '.hbs',
                this._model.getType() + '.' + this._model.getVariant(),
                this._elements.scoreboard
            );

            // Throws details template
            loadTemplate(
                'templates/throws-details.hbs',
                this._model.getContext(),
                this._elements.throwsDetails
            );
        }
    };


    /*
     * Modal box for the new game form
     */
    function NewGameModal = function(rules, elements) {
        this._rules = rules;
        /*
         * elements = {
         *      modal: $('#modalId'),
         *      gameSelect: $('#gameSelectId'),
         *      variantSelect: $('#variantSelectId'),
         *      nbPlayersInput: $('#nbPlayersInputId'),
         *      playersInput: $('#playersInputId'),
         *      goButton: $('#goButtonId')
         * }
         */
        this._elements = elements;

        // Dispatchers for events emitted from the form
        this.gameSelectChanged = new Dispatch(this);
        this.variantSelectChanged = new Dispatch(this);
        this.nbPlayersInputChanged = new Dispatch(this);
        this.playersInputChanged = new Disptach(this);
        this.goButtonClicked = new Dispatch(this);

        // For dynamic additional options
        this.additionalOptionsChanged = new Dispatch(this);

        // Dispatch events on element changes
        (function(modal) {
            this._elements.gameSelect.on('change', function(evt) {
                modal.gameSelectChanged.notify({ game: $(this).val() });
            });
            this._elements.variantSelect.on('change', function(evt) {
                modal.variantSelectChanged.notify({ variant: $(this).val() });
            });
            this._elements.nbPlayersInput.on('change', function(evt) {
                modal.nbPlayersInputChanged.notify({ nbPlayers: $(this).val() });
            });
            this._elements.playersInput.on('change', function(evt) {
                modal.playersInputChanged.notify({ players: $(this).val() });
            });
            this._elements.goButton.on('click', function(evt) {
                modal.goButtonClicked.notify();
            });
        })(this);
    };
    NewGameModal.prototype = {
        update: function() {
        }
    };


    /*
     * Save objects to the global scope
     */
    window.Scoreboard = Scoreboard;
    window.NewGameModal = NewGameModal;
})(window);
