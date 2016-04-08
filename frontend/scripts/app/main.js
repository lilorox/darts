/**
 * @license main.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'jquery',
    'models/GamesLibrary',
    'views/NewGameModal',
    'controllers/NewGameController',
], function($, GamesLibrary, NewGameModal, NewGameController) {
    /**
     * Main entry point: creates a GameLibrary object, a NewGameModal
     * and a NewGameController.
     */
    $(function() {
        var gamesLibrary = new GamesLibrary(),
            newGameModal = new NewGameModal(
                gamesLibrary,
                {
                    modal: '#new-game-modal',
                    gameSelect: '#game-select',
                    variantSelect: '#variant-select',
                    playersInput: '#players-input',
                    additionalOptionsDiv: '#additional-options',
                    goButton: '#game-submit'
                }
            ),
            newGameController = new NewGameController(gamesLibrary, newGameModal);
        newGameModal.show();
    });
});
