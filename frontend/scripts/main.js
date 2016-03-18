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
$(function() {
    var gamesLibrary = new GamesLibrary(),
        newGameModal = new NewGameModal(
            gamesLibrary,
            {
                modal: $('#new-game-modal'),
                gameSelect: $('#game-select'),
                variantSelect: $('#variant-select'),
                nbPlayersInput: $('#nbplayers-input'),
                playersInput: $('#players-input'),
                additionalOptionsDiv: $('#additional-options'),
                goButton: $('#game-submit')
            }
        ),
        newGameController = new NewGameController(gamesLibrary, newGameModal);
    newGameModal.show();
});
