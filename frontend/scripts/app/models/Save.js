/**
 * @license Save.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define(function() {
    /**
     * Save object taken from https://github.com/skeeto/disc-rl
     */
    var Save = {
        isArray: function(object) {
            return Object.prototype.toString.call(object) === "[object Array]";
        },

        isString: function(object) {
            return Object.prototype.toString.call(object) === "[object String]";
        },

        isBoolean: function(object) {
            return Object.prototype.toString.call(object) === "[object Boolean]";
        },

        isNumber: function(object) {
            return Object.prototype.toString.call(object) === "[object Number]";
        },

        isFunction: function(object) {
            return Object.prototype.toString.call(object) === "[object Function]";
        },

        isObject: function(object) {
            return object !== null && object !== undefined &&
                !this.isArray(object) && !this.isBoolean(object) &&
                !this.isString(object) && !this.isNumber(object) &&
                !this.isFunction(object);
        },

        decorate: function(object) {
            if (object === null) {
                return null;
            } else if (object === undefined) {
                return undefined;
            } else if (this.isString(object)) {
                return String(object);
            } else if (this.isNumber(object)) {
                return Number(object);
            } else if (this.isBoolean(object)) {
                return Boolean(object);
            } else if (this.isArray(object)) {
                for (var i = 0; i < object.length; i++) {
                    object[i] = this.decorate(object[i]);
                }
                return object;
            } else if (this.isFunction(object)) {
                throw new Error("Can't serialize functions.");
            } else {
                if ('doNotSave' in object) {
                    return null;
                }

                if (!('#' in object)) {
                    var constructor = object.constructor.name;
                    //console.log('decorate', constructor, object);
                    if (constructor === '') {
                        throw new Error("Can't serialize with anonymous constructors.");
                    } else if (constructor !== 'Object') {
                        if (window[constructor].prototype !== object.__proto__) {
                            throw new Error('Constructor mismatch!');
                        } else {
                            object['#'] = constructor;
                        }
                    }
                }
                for (var k in object) {
                    if (object.hasOwnProperty(k)) {
                        object[k] = this.decorate(object[k]);
                    }
                }
                return object;
            }
        },

        fixPrototype: function(object) {
            var isObject = Save.isObject(object);
            if (isObject && object['#']) {
                var constructor = window[object['#']];
                if (constructor) {
                    object.__proto__ = constructor.prototype;
                } else {
                    throw new Error('Unknown constructor ' + object['#']);
                }
            }
            if (isObject || Save.isArray(object)) {
                for (var k in object) {
                    if (object.hasOwnProperty(k)) {
                        this.fixPrototype(object[k]);
                    }
                }
            }
            return object;
        },

        stringify: function(object, deferred) {
            object = this.decorate(object);
            return JSON.stringify(object);
        },

        parse: function(string) {
            return this.fixPrototype(JSON.parse(string));
        },

        save: function(variable, value) {
            if (arguments.length === 1) value = window[variable];
            localStorage[variable] = this.stringify(value);
            return variable;
        },

        load: function(variable) {
            window[variable] = this.parse(localStorage[variable]);
            return window[variable];
        },

        exists: function(variable) {
            return variable in localStorage;
        },

        clear: function(variable) {
            if (variable) {
                localStorage.removeItem(variable);
            } else {
                localStorage.clear();
            }
        }
    };

    return Save;
});
