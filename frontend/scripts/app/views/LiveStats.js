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

        this._chartOptions = {
            showPoint: false,
            seriesBarDistance: 15,
            axisX: {
                showLabels: true
            }
        };

        this._graphs = {
            global: {
                dartsPerNumber: {
                    element: '#global-graph-darts-per-number',
                    chart: null,
                    labels: null,
                    series: [
                        // Init to a array of 22 zeroes
                        Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0)
                    ],
                    options: $.extend({}, this._chartOptions, {
                        axisY: {
                            onlyInteger: true,
                            low: 0
                        }
                    })
                },
                dartsPerFactor: {
                    element: '#global-graph-darts-per-factor',
                    chart: null,
                    labels: ["Simple", "Double", "Triple"],
                    series: [0, 0, 0],
                    options: {}
                }
            }
        };
        this._initGlobalDartsPerNumber();
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
            this._model.scoreChanged.attach(function(score) {
                livestats.update(score);
            });
        },


        /**
         * Updates the statistics graphs
         * @param {Score} score - The new throw to register
         */
        update: function(score) {
            this._updateGlobalDartsPerNumber(score);
            this._updateGlobalDartsPerFactor(score);
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
         * Sets the labels for the global dartsPerNumber stats
         * @private
         */
        _initGlobalDartsPerNumber: function() {
            var labels = ['Out'];
            for(var i = 1; i <= 20; i++) {
                labels.push(i.toString());
            }
            labels.push('B');

            this._graphs.global.dartsPerNumber.labels = labels;
        },

        /**
         * Updates (or creates if necessary) the graph that displays the
         * statistics of the numbers hit by players
         * @private
         * @param {Score} score - The new throw to register
         */
        _updateGlobalDartsPerNumber: function(score) {
            var graph = this._graphs.global.dartsPerNumber;

            if(! $(graph.element).length) {
                return;
            }

            if(score.bull) {
                graph.series[0][21] ++;
            } else {
                graph.series[0][score.value] ++;
            }

            if(graph.chart == null) {
                graph.chart = new Chartist.Bar(
                    graph.element,
                    {
                        labels: graph.labels,
                        series: graph.series,
                    },
                    graph.options
                );
            } else {
                graph.chart.update(graph.data);
            }
        },

        /**
         * Updates (or creates if necessary) the graph that displays the
         * statistics of the numbers hit by players
         * @private
         * @param {Score} score - The new throw to register
         */
        _updateGlobalDartsPerFactor: function(score) {
            var graph = this._graphs.global.dartsPerFactor;

            if(! $(graph.element).length) {
                return;
            }

            if(score.value !== 0) {
                graph.series[score.factor - 1] ++;
            }

            console.log( {
                        labels: graph.labels,
                        series: graph.series,
                    });

            if(graph.chart == null) {
                graph.chart = new Chartist.Pie(
                    graph.element,
                    {
                        labels: graph.labels,
                        series: graph.series,
                    },
                    graph.options
                );
            } else {
                graph.chart.update(graph.data);
            }
        }

    };

    return LiveStats;
});
