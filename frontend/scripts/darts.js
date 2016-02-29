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

var games = {
    cricket: {
        desc: "Cricket",
        variants: {
            normal: {
                desc: "Normal (2 players)",
                nbPlayers: { min: 2, max: 2 }
            },
            cutThroat: {
                desc: "Cut throat (2+ players)",
                nbPlayers: { min: 2 }
            }
        }
    },
    x01: {
        desc: "x01",
        variants: {
            301: {
                desc: "301"
            },
            501: {
                desc: "501"
            },
            701: {
                desc: "701"
            }
        }
    },
    clock: {
        desc: "Around the clock"
    }
};

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
            max = $('#game-nbplayers').data('max'),
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
    if(max != null) {
        $('#game-nbplayers').data('max', max);
    }

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

function buildVariantSelect(game) {
    $('#game-variant').empty();

    Object.keys(games[game].variants).forEach(function(key) {
        $('<option>')
            .val(key)
            .text(games[game].variants[key].desc)
            .appendTo($('#game-variant'));
    });

    $('#game-variant').on('change', function(evt) {
        var variant = games[game].variants[$(this).val()],
            nbPlayersConf = {
                value: 2,
                min: 1
            };

        if('nbPlayers' in variant) {
            if('min' in variant.nbPlayers) {
                nbPlayersConf.min = variant.nbPlayers.min;
            }

            if('max' in variant.nbPlayers) {
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
        buildVariantSelect(game);
    });

    $('#game-select').trigger('change');
}

function toggleMenu() {
    $('#menu').toggle();
    $("span", this).toggleClass("glyphicon-chevron-up");
    $("span", this).toggleClass("glyphicon-chevron-down");
}

function startGame() {
    var game = $('#game-select').val(),
        variant = $('#game-variant').val(),
        players = $('#game-players').val();

    toggleMenu();

    console.log('Game:', game, variant, players);
}

$(function() {
    var dartboard = $('#dartboard').DartBoard({
        onClick: function(evt) {
            var rect = this.getBoundingClientRect(),
                dartboard =  $(this).data('dartboard'),
                score = dartboard.DartBoard(
                    'getScore',
                    evt.clientX - rect.left,
                    evt.clientY - rect.top
                );
            console.log('score=', score);
        }
    });

    buildGameSelect();
    buildPlayersSelect();

    $('#menu form').on('submit', function(evt) {
        evt.preventDefault();
        startGame();
    });

    $('#fold-menu').on('click', function(evt) {
        evt.preventDefault();
        toggleMenu();
    });
});
