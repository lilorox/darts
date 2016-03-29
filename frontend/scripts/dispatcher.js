/**
 * @license dispatcher.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see ../../LICENSE
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

