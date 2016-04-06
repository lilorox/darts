/**
 * @license main.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see ../../LICENSE
 */

$(function() {
    /**
     * Main entry point: creates a GameLibrary object, a NewGameModal
     * and a NewGameController.
     */
    var gamesLibrary = new GamesLibrary(),
        newGameModal = new NewGameModal(
            gamesLibrary,
            {
                modal: $('#new-game-modal'),
                gameSelect: $('#game-select'),
                variantSelect: $('#variant-select'),
                playersInput: $('#players-input'),
                additionalOptionsDiv: $('#additional-options'),
                goButton: $('#game-submit')
            }
        ),
        newGameController = new NewGameController(gamesLibrary, newGameModal);
    newGameModal.show();
});
