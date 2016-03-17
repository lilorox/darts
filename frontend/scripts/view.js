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
        this.dartboardClicked = new Dispatch(this);
        this.undoButtonClicked = new Dispatch(this);

        // Dispatch events on element changes
        (function(view) {
            this._elements.dartboard.on('click', function(evt) {
                view.dartboardClicked.notify({ score: evt.score });
            });
            this._elements.undoButton.on('click', function(evt) {
                view.undoButtonClicked.notify();
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
    };

    View.loadTemplate = function(url, context, $target) {
        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'text'
        }).then(function(src) {
            return Handlebars.compile(src)(context);
        }).done(function(html) {
            $target.html(html);
        });
    };

    View.prototype.registerHelpers = function() {
        (function(view) {
            Handlebars.registerHelper({
                activePlayer: function() {
                    return view._model.getActivePlayer().name;
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
    };

    View.prototype.update = function() {
        // Game template
        View.loadTemplate(
            'templates/' + this._template + '.hbs',
            this._model.getContext(),
            this._elements.scoreboard
        );

        // Throws details template
        View.loadTemplate(
            'templates/throws-details.hbs',
            this._model.getContext(),
            this._elements.throwsDetails
        );
    };

    window.View = View;
})(window);
