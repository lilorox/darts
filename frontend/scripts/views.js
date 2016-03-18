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
            scoreboard._elements.dartboard.on('click', function(evt) {
                scoreboard.dartboardClicked.dispatch({ score: evt.score });
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
    function NewGameModal(gameLibrary, elements) {
        this._gameLibrary = gameLibrary;
        /*
         * elements = {
         *      modal: $('#modalId'),
         *      gameSelect: $('#gameSelectId'),
         *      variantSelect: $('#variantSelectId'),
         *      playersInput: $('#playersInputId'),
         *      additionalOptionsDiv: $('#additionalOptionsDiv'),
         *      goButton: $('#goButtonId')
         * }
         */
        this._elements = elements;

        // Private variables
        this._rules = this._gameLibrary.getRules();
        this._game = null;
        this._variant = null;
        this._nbPlayersConf = {
            min: 1,
            max: null
        };
        this._players = [];
        this._options = {};

        // Dispatchers for events emitted from the form
        this.goButtonClicked = new Dispatcher(this);

        // Dispatch events on element changes
        (function(modal) {
            modal._elements.goButton.on('click', function(evt) {
                modal.goButtonClicked.dispatch({
                    game: this._game,
                    variant: this._variant,
                    players: this._players,
                    options: this._options
                });
                modal._elements.modal('hide');
            });
        })(this);

        // Other events
        (function(modal) {
            modal._elements.gameSelect.on('change', function(evt) {
                modal.setGame($(this).val());
                modal.validateForm();
            });
            modal._elements.variantSelect.on('change', function(evt) {
                modal.setVariant($(this).val());
                modal.validateForm();
            });
            modal._elements.playersInput.on('change', function(evt) {
                modal.setPlayers($(this).val());
                modal.validateForm();
            });
        })(this);
    };
    NewGameModal.prototype = {
        /*
         * Public methods
         */
        setGame: function(game){
            this._game = game;

            if(game.length === 0 || !('variants' in this._rules[game])) {
                this._elements.variantSelect.prop('disabled', true);
                return;
            };
            this._elements.variantSelect.prop('disabled', false);
            this._buildVariantSelect();
            this._buildAdditionalOptions();
        },
        setVariant: function(selectedVariant) {
            this._variant = selectedVariant;
            var variant = this._rules[this._game].variants[selectedVariant];

            // Restore defaults before applying specific rules
            this._nbPlayersConf = {
                min: 1,
                max: null
            };

            if(variant.hasOwnProperty('nbPlayers')) {
                if(variant.nbPlayers.hasOwnProperty('min')) {
                    this._nbPlayersConf.min = variant.nbPlayers.min;
                }

                if(variant.nbPlayers.hasOwnProperty('max')) {
                    this._nbPlayersConf.max = variant.nbPlayers.max;
                }
            }
        },
        validatePlayers: function() {
            var values = this._elements.playersInput.val();

            if(values && this._nbPlayersConf.max) {
                while(values.length > this._nbPlayersConf.max) {
                    $('option:last-child', this._elements.playersInput).remove();
                    this._elements.playersInput.trigger('change');
                    values = this._elements.playersInput.val();
                }
            }
            this.setPlayers(values);
        },
        setPlayers: function(players) {
            this._players = players;
        },
        setAdditionalOption: function(option, value) {
            this._options[option] = value;
        },
        validateForm: function() {
            this.validatePlayers();
            (function(modal) {
                modal._elements.goButton.prop('disabled', function() {
                    return (modal._players == null ||
                        modal._nbPlayersConf.min != null && modal._players.length < modal._nbPlayersConf.min ||
                        modal._nbPlayersConf.max != null && modal._players.length > modal._nbPlayersConf.max
                    );
                });
            })(this);
        },
        show: function() {
            this._elements.additionalOptionsDiv.hide();
            this._buildGameSelect();
            this._buildPlayersSelect();
            this._elements.modal.modal('show');
        },
        /*
         * Private methods
         */
        _buildGameSelect: function() {
            var rules = this._rules,
                elements = this._elements;

            Object.keys(rules).forEach(function(key) {
                $('<option>')
                    .val(key)
                    .text(rules[key].desc)
                    .appendTo(elements.gameSelect);
            });

            this._elements.gameSelect.trigger('change');
        },
        _buildVariantSelect: function() {
            var variants = this._rules[this._game].variants,
                elements = this._elements;
            elements.variantSelect.empty();

            Object.keys(variants).forEach(function(key) {
                $('<option>')
                    .val(key)
                    .text(variants[key].desc)
                    .appendTo(elements.variantSelect);
            });

            elements.variantSelect.trigger('change');
        },
        _buildPlayersSelect: function() {
            this._elements.playersInput.prop('disabled', false);
            this._elements.playersInput.select2({
                placeholder: 'Add players',
                tags: true,
                tokenSeparators: [',', ' '],
                multiple: true
            });
        },
        _buildAdditionalOptions: function() {
            var elements = this._elements;
            elements.additionalOptionsDiv.empty();

            if(! this._rules[this._game].hasOwnProperty('options')) {
                return;
            }
            var options = this._rules[this._game].options;

            Object.keys(options).forEach(function(optionName) {
                var option = options[optionName],
                    inputId = optionName + '-opt',
                    formGroup = $('<div>').addClass('form-group additional-group'),
                    input = null;

                $('<label>')
                    .attr('for', inputId)
                    .text(option.label)
                    .appendTo($(formGroup));

                switch(option.type) {
                    case "select":
                        input = $('<select>')
                            .attr('id', inputId)
                            .data('option-name', optionName)
                            .addClass('form-control additional-option');

                        (function(modal) {
                            input.on('change', function() {
                                modal.setAdditionalOption(optionName, $(this).val());
                            });
                        })(this);

                        for(var value in option.values) {
                            if(option.values.hasOwnProperty(value)) {
                                $('<option>')
                                .val(value)
                                .text(option.values[value])
                                .appendTo($(input));
                            }
                        }
                }

                $(formGroup)
                    .append(input)
                    .appendTo(elements.additionalOptionsDiv);
            });
            elements.additionalOptionsDiv.show();
        }
    };


    /*
     * Save objects to the global scope
     */
    window.Scoreboard = Scoreboard;
    window.NewGameModal = NewGameModal;
})(window);
