/**
 * @license NewGameModal.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'jquery',
    'bootstrap',
    'select2',
    'models/Dispatcher'
], function($, bootstrap, select2, Dispatcher) {
    /**
     * Modal box for the new game form.
     * @constructor
     * @param {GameLibrary} gameLibrary - An instance of the GameLibrary object.
     * @param {Object} elements - jQuery selectors of the elements that
     * constitute the view.
     * @param {String} elements.modal - The modal div selector.
     * @param {String} elements.gameSelect - The game select element selector.
     * @param {String} elements.variantSelect - The variant select element selector.
     * @param {String} elements.playersInput - The players names input selector.
     * @param {String} elements.additionalOptionsDiv - The div containing the
     * aditionnal options selector.
     * @param {String} elements.goButton - The submit button element.
     * @param {boolean} elements.randomizePlayersCheckbox - The randomize players
     * checkbox.
     */
    function NewGameModal(gameLibrary, elements) {
        this._gameLibrary = gameLibrary;
        this._elements = {
            modal: $(elements.modal),
            gameSelect: $(elements.gameSelect),
            variantSelect: $(elements.variantSelect),
            playersInput: $(elements.playersInput),
            additionalOptionsDiv: $(elements.additionalOptionsDiv),
            goButton: $(elements.goButton),
            randomizePlayersCheckbox: $(elements.randomizePlayersCheckbox),
        };

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
        this._randomize = $(elements.randomizePlayersCheckbox).is(":checked");

        this.setupEvents();
    }
    NewGameModal.prototype = {
        /**********************************************************************
         * Public methods
         *********************************************************************/

        /**
         * Create the dispatcher of the view and attaches to the model's
         * dispatchers.
         */
        setupEvents: function() {
            // Dispatchers for events emitted from the form
            this.goButtonClicked = new Dispatcher();

            // Dispatch events on element changes
            var modal = this;
            modal._elements.goButton.on('click', function(evt) {
                modal.goButtonClicked.dispatch({
                    type: modal._game,
                    variant: modal._variant,
                    players: modal._players,
                    options: modal._options,
                    randomize: modal._randomize,
                });
                modal._elements.modal.modal('hide');

                // Enable the save button
                $('#save-btn').toggleClass('disabled', false);
            });

            // Other events
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
            modal._elements.randomizePlayersCheckbox.on('change', function(evt) {
                modal.setRandomize($(this).is(":checked"));
                modal.validateForm();
            });
        },

        /**
         * Actions after a game has been chosen.
         * @param {string} game - The chosen game.
         */
        setGame: function(game){
            this._game = game;

            if(game.length === 0 || !('variants' in this._rules[game])) {
                this._elements.variantSelect.prop('disabled', true);
                return;
            }
            this._elements.variantSelect.prop('disabled', false);
            this._buildVariantSelect();
            this._buildAdditionalOptions();
        },

        /**
         * Actions after a variant has been chosen.
         * @param {string} selectedVariant - The chosen variant.
         */
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

        /**
         * Removes players from input if there are too many.
         */
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

        /**
         * Sets the players.
         * @param {Player[]} players - The array of the participating players.
         */
        setPlayers: function(players) {
            this._players = players;
        },

        /**
         * Sets an additional option.
         * @param {string} option - The option name.
         * @param {*} value - The option's value.
         */
        setAdditionalOption: function(option, value) {
            this._options[option] = value;
        },

        /**
         * Sets the randomzie option.
         * @param {boolean} randomize - The state of the randomize checkbox
         */
        setRandomize: function(randomize) {
            this._randomize = randomize;
        },

        /**
         * Makes sure the correct number of players are entered and enables
         * or disables the submit button accordingly.
         */
        validateForm: function() {
            this.validatePlayers();
            var modal = this;
            modal._elements.goButton.prop('disabled', function() {
                return (modal._players == null ||
                    modal._nbPlayersConf.min != null && modal._players.length < modal._nbPlayersConf.min ||
                    modal._nbPlayersConf.max != null && modal._players.length > modal._nbPlayersConf.max
                );
            });
        },

        /**
         * Builds the modal view.
         */
        show: function() {
            this._elements.additionalOptionsDiv.hide();
            this._buildGameSelect();
            this._buildPlayersSelect();
            this._elements.modal.modal('show');
        },


        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Builds the game select item according to the game library.
         * @private
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

        /**
         * Builds the variant select item according to the selected game's rules.
         * @private
         */
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

            // Disable select if there is only one option
            $(elements.variantSelect).prop(
                "disabled",
                (Object.keys(variants).length === 1)
            );

            elements.variantSelect.trigger('change');
        },

        /**
         * Builds the players input with Select2.
         * @private
         */
        _buildPlayersSelect: function() {
            this._elements.playersInput.prop('disabled', false);
            this._elements.playersInput.select2({
                placeholder: 'Add players',
                tags: true,
                tokenSeparators: [',', ' '],
                multiple: true
            });
        },

        /**
         * Builds the additional options div according to the selected game's
         * rules.
         * @private
         */
        _buildAdditionalOptions: function() {
            var elements = this._elements;
            this._options = {};
            elements.additionalOptionsDiv.empty();

            if(! this._rules[this._game].hasOwnProperty('options')) {
                return;
            }
            var options = this._rules[this._game].options;

            var modal = this;
            Object.keys(options).forEach(function(optionName) {
                var option = options[optionName],
                    inputId = optionName + '-opt',
                    formGroup = $('<div>').addClass('form-group additional-group'),
                    columnDiv = $('<div>').addClass('col-sm-8'),
                    input = null,
                    dontSetEvents = false;

                $('<label>')
                    .attr('for', inputId)
                    .addClass('col-sm-4 control-label')
                    .text(option.label)
                    .appendTo($(formGroup));

                switch(option.type) {
                    case "select":
                        input = $('<select>')
                            .attr('id', inputId)
                            .addClass('form-control additional-option');

                        Object.keys(option.values).forEach(function(value) {
                            var selectOption = option.values[value];
                            if(selectOption.text) {
                                var opt = $('<option>')
                                    .val(value)
                                    .text(selectOption.text);
                                if(selectOption.selected) {
                                    opt.prop('selected', true);
                                }
                                $(input).append(opt);
                            }
                        });
                        break;
                    case "checkbox":
                        dontSetEvents = true;

                        input = $('<div>')
                            .attr('id', inputId);

                        Object.keys(option.values).forEach(function(value) {
                            var checkOption = option.values[value];
                            if(checkOption.text) {
                                var checkContainer = $('<div>')
                                        .addClass("checkbox"),
                                    checkLabel = $('<label>'),
                                    checkbox = $('<input>')
                                        .attr('type', 'checkbox')
                                        .addClass('additional-option');

                                if(checkOption.checked) {
                                    checkbox.prop('checked', true);
                                }

                                modal.setAdditionalOption(value, (checkOption.checked ? true : false));
                                checkbox.on('change', function() {
                                    modal.setAdditionalOption(value, $(this).is(':checked'));
                                });

                                $(checkLabel)
                                    .text(checkOption.text)
                                    .prepend(checkbox)
                                    .appendTo(checkContainer);
                                $(input).append(checkContainer);
                            }
                        });
                        break;
                    case "number":
                        input = $('<input>')
                            .attr('id', inputId)
                            .attr('type', 'number')
                            .addClass('form-control additional-option');

                        if(option.min != null) {
                            input.attr('min', option.min);
                        }
                        if(option.max != null) {
                            input.attr('max', option.max);
                        }
                        if(option.default != null) {
                            input.val(option.default);
                        }
                        break;
                    default:
                        console.error("Unknown option type '" + option.type + "'");
                        return;
                }

                // Do not set events for special types like checkboxes
                if(! dontSetEvents) {
                    modal.setAdditionalOption(optionName, input.val());
                    input.on('change', function() {
                        modal.setAdditionalOption(optionName, $(this).val());
                    });
                }

                $(columnDiv).append(input);
                $(formGroup)
                    .append(columnDiv)
                    .appendTo(elements.additionalOptionsDiv);
            });
            elements.additionalOptionsDiv.show();
        }
    };

    return NewGameModal;
});
