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
    /**
     * Dispatches object/messages between model, view and controller or anyone
     * attaching to it.
     * @constructor
     */
    function Dispatcher() {
        this._listeners = [];

        // Do not save this object
        this.doNotSave = true;
    }
    Dispatcher.prototype = {
        /**
         * Attaches a listener to this Dispatcher.
         * @param {function} callback - The function to call when an event is
         * dispatched to this Dispatcher.
         */
        attach: function(callback) {
            this._listeners.push(callback);
        },

        /**
         * Dispatches an object to the listeners.
         * @param {*} args - Anything you want to send to the listeners
         */
        dispatch: function(args) {
            for(var i = 0; i < this._listeners.length; i++) {
                this._listeners[i](args);
            }
        },

        /**
         * Detaches all the listeners.
         */
        detachAll: function() {
            this._listeners = [];
        }
    };


    /*
     * Save objects to the global scope
     */
    window.Dispatcher = Dispatcher;
})(window);

