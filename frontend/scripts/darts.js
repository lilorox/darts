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

function buildAdditionnalOptions() {
    var game = $('#game-select').val();

    $('.additionnal-group').remove();

    if(! games[game].hasOwnProperty('options')) {
        return;
    }
    
    Object.keys(games[game].options).forEach(function(optionName) {
        var option = games[game].options[optionName],
            inputId = optionName + '-opt',
            formGroup = $('<div>').addClass('form-group additionnal-group'),
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
                    .addClass('form-control additionnal-option');

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
            .insertBefore('#game-submit');
    });
}

function buildPlayersSelect() {
    $('#game-players').prop('disabled', false);
    $('#game-players').select2({
        placeholder: 'Add players',
        tags: true,
        tokenSeparators: [',', ' '],
        multiple: true
    });

    $('#game-players').on('change', function(evt) {
        var min = $('#game-nbplayers').data('min'),
            max = $('#game-nbplayers').val(),
            values = $(this).val();

        if(values.length < min) {
            $('#game-submit').prop('disabled', true);
            return;
        }

        while(values.length > max) {
            $('#game-players option:last-child').remove();
            $('#game-players').trigger('change');
            values = $(this).val();
        }

        $('#game-submit').prop('disabled', false);
    });
}

function buildNbPlayersInput(conf) {
    var min = conf.min || 1,
        max = conf.max || null,
        value = conf.value || 2;

    $('#game-nbplayers').val(value);
    $('#game-nbplayers').data('min', min);
    $('#game-nbplayers').data('max', max);

    if(min === max) {
        // Disable the input since there is no possible choice
        $('#game-nbplayers').prop('disabled', true);
        return;
    }

    $('#game-nbplayers').prop('disabled', false);
    $('#game-nbplayers').on('change', function(evt) {
        if($(this).data('min') && $(this).val() < $(this).data('min')) {
            $(this).val(min);
        } else if($(this).data('max') && $(this).val() > $(this).data('max')) {
            $(this).val(max);
        }
    });
}

function buildVariantSelect() {
    $('#game-variant').empty();
    var game = $('#game-select').val();

    Object.keys(games[game].variants).forEach(function(key) {
        $('<option>')
            .val(key)
            .text(games[game].variants[key].desc)
            .appendTo($('#game-variant'));
    });

    $('#game-variant').on('change', function(evt) {
        var game = $('#game-select').val(),
            variant = games[game].variants[$(this).val()],
            nbPlayersConf = {
                value: 2,
                min: 1
            };

        if(variant.hasOwnProperty('variant')) {
            if(variant.nbPlayers.hasOwnProperty('min')) {
                nbPlayersConf.min = variant.nbPlayers.min;
            }

            if(variant.nbPlayers.hasOwnProperty('max')) {
                nbPlayersConf.max = variant.nbPlayers.max;
            }
        }

        buildNbPlayersInput(nbPlayersConf);
    });

    $('#game-variant').trigger('change');
}

function buildGameSelect() {
    Object.keys(games).forEach(function(key) {
        $('<option>')
            .val(key)
            .text(games[key].desc)
            .appendTo($('#game-select'));
    });

    $('#game-select').on('change', function(evt) {
        var game = $(this).val();
        if(game.length === 0 || !('variants' in games[game])) {
            $('#game-variant').prop('disabled', true);
            return;
        };
        $('#game-variant').prop('disabled', false);
        buildVariantSelect();
        buildAdditionnalOptions();
    });

    $('#game-select').trigger('change');
}

function toggleMenu() {
    $('#menu').toggle(200);
    $(".fold span").toggleClass("glyphicon-chevron-up");
    $(".fold span").toggleClass("glyphicon-chevron-down");
}

function startGame() {
    var game = $('#game-select').val(),
        variant = $('#game-variant').val(),
        players = $('#game-players').val(),
        additionnalOptions = {};

    toggleMenu();

    $('.additionnal-option').each(function() {
        var value = $(this).val(),
            option = $(this).data('option-name');
        additionnalOptions[option] = value;
    });

    if(window.g) {
        $('#dartboard').empty();
        delete window.g;
        window.g = null;
    }
    var GameClass = getGameClass(game, variant);
    if(GameClass != null) {
        window.g = new GameClass(players, 'dartboard', 'scoreboard', additionnalOptions);
    } else {
        console.error("No class found for game '" + game + "' with variant '" + variant + "'");
    }
}

$(function() {
    buildGameSelect();
    buildPlayersSelect();

    /* For test purposes
    var GameClass = getGameClass('clock', 'normal');
    window.g = new GameClass(["player1", "player2", "player3"], 'dartboard', 'scoreboard');
    */
    var GameClass = getGameClass('cricket', 'normal');
    window.g = new GameClass(["player1", "player2"], 'dartboard', 'scoreboard');
    toggleMenu();

    $('#menu form').on('submit', function(evt) {
        evt.preventDefault();
        startGame();
    });

    $('#fold-menu').on('click', function(evt) {
        evt.preventDefault();
        toggleMenu();
    });
});
