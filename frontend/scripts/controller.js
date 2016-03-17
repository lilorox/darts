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
    function GameController(model, view) {
        this._model = model;
        this._view = view;

        (function(controller) {
            // Attach to the view events
            this._view.dartboardClicked.attach(function(data) {
                controller.registerScore(data.score);
            });
            this._view.undoButtonClicked.attach(function() {
                controller.undo();
            });
        })(this);
    };

    GameController.prototype.registerScore = function(score) {
        this._model.registerScore(score);
        this._view.update();
    };

    GameController.prototype.undo = function() {
        if(this._model.getUndoQueueLength() != 0) {
            this._model.undo();
            this._view.update();
        };
    };

    window.Controller = Controller;
})(window);
