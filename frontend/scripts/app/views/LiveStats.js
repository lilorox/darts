/**
 * @license LiveStats.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'jquery',
    'handlebars',
    'chartist',
    'models/Dispatcher',
    'Utils'
], function($, Handlebars, Chartist, Dispatcher, Utils) {
    /**
     * LiveStats view object.
     * @constructor
     * @param {BaseGame} model - Game object that constitutes the model.
     * @param {Object} elements - jQuery selectors of the elements that
     * constitute the view.
     * @param {String} elements.statsDetails - The div selector that will
     * contain the statistics graphs.
     */
    function LiveStats(model, elements) {
        this._model = model;
        this._elements = {
            statsDetails: $(elements.statsDetails)
        };

        this._graphs = {
            global: {
                dartsPerNumber: {
                    element: '#global-graph-darts-per-number',
                    chart: null,
                    options: {
                        seriesBarDistance: 10,
                        axisX: {
                            offset: 60
                        },
                        axisY: {
                            offset: 80,
                            scaleMinSpace:15
                        }
                    }
                },
                dartsPerFactor: {
                    element: '#global-graph-darts-per-factor',
                    chart: null
                }
            }
        };
    }
    LiveStats.prototype = {
        /**********************************************************************
         * Public methods
         *********************************************************************/

        /**
         * Initializes the stats.
         */
        init: function() {
            // Show the stats
            this._elements.statsDetails.show();

            // Loads the stats template
            Utils.loadTemplate(
                'templates/stats-details.hbs',
                this.getGraphsContext(),
                this._elements.statsDetails
            );

            this.setupDisptacherEvents();
        },

        /**
         * Attaches to the model's dispatchers.
         */
        setupDisptacherEvents: function() {
            // Attach to the models events
            var livestats = this;
            this._model.scoreChanged.attach(function() {
                livestats.update();
            });
        },

        /**
         * Updates the statistics graphs
         */
        update: function() {
            this._updateGlobalDartsPerNumber();
        },

        /**
         * Builds and returns the specific context to draw the graphs
         * @returns Object Context object for the stats details template
         */
        getGraphsContext: function() {
            return {};
        },

        /**
         * Unlinks everything from the scoreboard.
         */
        unlink: function() {
            delete this._elements;
        },


        /**********************************************************************
         * "Private" methods that must not be called outside the object itself
         * and must not be overridden by inherited objects
         *********************************************************************/

        /**
         * Updates (or creates if necessary) the graph that displays the
         * statistics of the numbers hit by players
         * @private
         */
        _updateGlobalDartsPerNumber: function() {
            if(! $(this._graphs.global.dartsPerNumber.element).length) {
                return;
            }

            var chart = this._graphs.global.dartsPerNumber.chart,
                data = {};

            data.labels = [];
            data.series = [];
            for(var i = 0; i <= 20; i++) {
                data.labels.push(i);
            }
            data.labels.push('B');

            for(var i = 0; i < this._model._players.length; i++) {
                var serie = [];
                for(var j = 0; j <= 21; j++) {
                    serie.push(Math.floor(Math.random() * 10));
                }
                data.series.push(serie);
            }

            if(chart == null) {
                chart = new Chartist.Bar(
                    this._graphs.global.dartsPerNumber.element,
                    data,
                    this._graphs.global.dartsPerNumber.options
                );
            } else {
                chart.update(data);
            }
        }
    };

    return LiveStats;
});
