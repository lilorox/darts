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
    function View(model, template, elements) {
        this._model = model;
        this._template = template;
        this._elements = elements;

        // Dispatchers for events emitted from the View
        this.newDartThrown = new Dispatch(this);
        this.undoButtonClicked = new Dispatch(this);

        // Dispatch events on element changes
        (function(view) {
            this._elements.dartboard.on('change', function(evt) {
                view.newDartThrown.notify({ score: evt.score });
            });
            this._elements.undoButton.on('click', function(evt) {
                view.undoButtonClicked.notify();
            });
        })(this);

        // Attach to the models events
        this._model.undoListChanged.attach(function() {
            // Enable-disable undo button in function of the undo queue length
            this._elements.undoButton.toggleClass('disabled', (this._model.undo.length <= 0));
        });
    };

    View.loadTemplate = function(url, context, target) {
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'text'
        }).then(function(src) {
            return Handlebars.compile(src)(context);
        }).done(function(html) {
            $(target).html(html);
        });
    };

    View.prototype.update = function() {
        // Game template
        loadTemplate(
            'templates/' + this._template + '.hbs',
            context,
            this._elements.scoreboard
        );

        // Throws details template
        loadTemplate(
            'templates/throws-details.hbs',
            context,
            this._elements.throwsDetails
        );
    };

    window.View = View;
})(window);
