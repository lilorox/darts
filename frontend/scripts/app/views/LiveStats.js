/**
 * @license LiveStats.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define([
    'jquery',
    'handlebars',
    'highcharts',
    'models/Dispatcher',
    'Utils'
], function($, Handlebars, Highcharts, Dispatcher, Utils) {
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

        /*
        this._chartOptions = {
            showPoint: false,
            seriesBarDistance: 15,
            axisX: {
                showLabels: true
            }
        };
        */

        this._graphs = {
            global: {
                dartsPerNumber: {
                    chart: null,
                    element: '#global-graph-darts-per-number',
                    options: {
                        chart: {
                            renderTo: null,
                            type: 'column'
                        },
                        xAxis: {
                            categories: null
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: "darts"
                            }
                        },
                        /*
                        plotOptions: {
                            column: {
                                borderWidth: 0,
                                pointPadding: 0.2
                            }
                        },
                        */
                        series: [{
                            name: 'Global',
                            // Init to a array of 22 zeroes
                            data: Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0)
                        }]
                    }
                },
                dartsPerFactor: {
                    element: '#global-graph-darts-per-factor',
                    chart: null,
                    options: {}
                    /*
                    labels: ["Simple", "Double", "Triple"],
                    series: [0, 0, 0],
                    options: {
                        donut: true,
                        donutWidth: 60,
                        startAngle: 270,
                    }
                    */
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
            //this._updateGlobalDartsPerFactor(score);
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
         * Sets the categories for the global dartsPerNumber stats
         * @private
         */
        _initGlobalDartsPerNumber: function() {
            var categories = ['Out'];
            for(var i = 1; i <= 20; i++) {
                categories.push(i.toString());
            }
            categories.push('B');

            this._graphs.global.dartsPerNumber.options.xAxis.categories = categories;
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
                graph.options.series[0].data[21] ++;
            } else {
                graph.options.series[0].data[score.value] ++;
            }

            if(graph.chart == null) {
                graph.options.chart.renderTo = $(graph.element);
                console.log('init', graph.options.chart.renderTo, graph.options);
                graph.chart = new Highcharts.Chart(graph.options);
            } else {
                console.log('redraw', graph.chart);
                /*
                graph.chart.redraw();
                */
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
