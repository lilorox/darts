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

        this._defaultOptions = {
            chart: {
                animation: false
            },
            title: {
                style: {
                    fontSize: '12px'
                }
            },
            credits: {
                enabled: false
            }
        };

        this._graphs = {
            global: {
                dartsPerNumber: {
                    chart: null,
                    element: '#graph-global-darts-per-number',
                    options: $.extend(true, {}, this._defaultOptions, {
                        chart: {
                            type: 'column'
                        },
                        title: {
                            text: 'Darts per number'
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
                        legend: {
                            enabled: false
                        }
                    }),
                    series: [{
                        name: 'Global',
                        // Init to a array of 22 zeroes
                        data: Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0)
                    }]
                },
                dartsPerFactor: {
                    chart: null,
                    element: '#graph-global-darts-per-factor',
                    options: $.extend(true, {}, this._defaultOptions, {
                        chart: {
                            plotBackgroundColor: null,
                            plotBorderWidth: 0,
                            plotShadow: false
                        },
                        title: {
                            text: 'Darts per factor'
                        },
                        plotOptions: {
                            pie: {
                                dataLabels: {
                                    enabled: false,
                                },
                                startAngle: -90,
                                endAngle: 90,
                                showInLegend: true
                            },
                        },
                        tooltip: {
                            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                        },
                        legend: {
                            enabled: true,
                            align: 'right',
                            verticalAlign: 'top',
                            layout: 'vertical',
                            x: -50,
                        }
                    }),
                    series: [{
                        type: 'pie',
                        name: 'Darts per factor',
                        innerSize: '50%',
                        data: [
                            ['Simple', 0],
                            ['Double', 0],
                            ['Triple', 0]
                        ]
                    }]
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
         * Helper function to create a Highchart graph and return the Highchart object
         * @private
         * @param {string} element - The jQuery selector for the element containing the graph
         * @param {Object} options - The graph's options
         * @param {Object} series - The graph's series (the object will be cloned)
         * @returns {Object} The Highcharts object created
         */
        _createHighchartsGraph: function(element, options, series) {
                // Clone of the series object
                options.series = $.map(series, function (obj) {
                     return $.extend(true, {}, obj);
                });
                $(element).highcharts(options);
                return $(element).highcharts();
        },

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
                graph.series[0].data[21] ++;
            } else {
                graph.series[0].data[score.value] ++;
            }

            if(graph.chart == null) {
                this._createHighchartsGraph(
                    graph.element,
                    graph.options,
                    graph.series
                );
            } else {
                graph.chart.series[0].setData(graph.series[0].data, true, false);
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

            if(score.value == 0) {
                return;
            }

            var serieIndex = score.factor - 1;
            graph.series[0].data[serieIndex][1] ++;

            if(graph.chart == null) {
                this._createHighchartsGraph(
                    graph.element,
                    graph.options,
                    graph.series
                );
            } else {
                graph.chart.series[0].setData(graph.series[0].data, true, false);
            }
        }

    };

    return LiveStats;
});
