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
    function Dispatcher(sender) {
        this._sender = sender;
        this._listeners = [];
    };
    Dispatcher.prototype.attach = function(callback) {
        this._listeners.push(callback);
    };
    Dispatcher.prototype.dispatch = function(args) {
        for(var i = 0; i < this._listeners.length; i++) {
            this.listeners[index](this._sender, args);
        }
    };

    window.Dispatcher = Dispatcher;
})(window);

