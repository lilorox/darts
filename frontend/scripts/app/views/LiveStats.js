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

        this._context = {
            players: this._model._players
        };

        this._defaultOptions = {
            chart: {
                animation: false,
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                style: {
                    fontFamily: 'Arial',
                    fontSize: '14px'
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
                            title: {
                                text: 'Numbers hit'
                            },
                            categories: [
                                "Out", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                                "10", "11", "12", "13", "14", "15", "16", "17", "18",
                                "19", "20", "B"
                            ]
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: "Darts"
                            }
                        },
                        plotOptions: {
                            series: {
                                stacking: 'normal'
                            }
                        }
                    }),
                    series: [{
                        name: 'Simple',
                        index: 2,
                        data: null
                    }, {
                        name: 'Double',
                        index: 1,
                        data: null
                    }, {
                        name: 'Triple',
                        index: 0,
                        data: null
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
                        data: null
                    }]
                },
                playersProgress: {
                    chart: null,
                    element: '#graph-global-players-progress',
                    options: $.extend(true, {}, this._defaultOptions, {
                        title: {
                            text: 'Players progress'
                        },
                        xAxis: {
                            title: {
                                text: 'Throw'
                            },
                            categories: []
                        },
                        yAxis: {
                            min: 0,
                            title: {
                                text: "Score"
                            }
                        },
                    }),
                    series: []
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
                this._context,
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
        update: function() {
            this._updateGlobalDartsPerNumber();
            this._updateGlobalDartsPerFactor();
            this._updateGlobalPlayersProgress();
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
         * Updates (or creates if necessary) the graph that displays the
         * statistics of the numbers hit by players
         * @private
         */
        _updateGlobalDartsPerNumber: function() {
            var graph = this._graphs.global.dartsPerNumber;

            if(! $(graph.element).length) {
                return;
            }

            // Init series to arrays of 22 zeroes
            graph.series[0].data = Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0);
            graph.series[1].data = Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0);
            graph.series[2].data = Array.apply(null, Array(22)).map(Number.prototype.valueOf, 0);

            this._model._players.forEach(function(player) {
                player.throws.forEach(function(turn) {
                    turn.forEach(function(score) {
                        if(score == null) {
                            return;
                        }

                        var serieIndex = score.factor - 1;
                        if(score.bull) {
                            graph.series[serieIndex].data[21] ++;
                        } else {
                            graph.series[serieIndex].data[score.value] ++;
                        }
                    });
                });
            });

            if(graph.chart == null) {
                graph.chart = this._createHighchartsGraph(
                    graph.element,
                    graph.options,
                    graph.series
                );
            } else {
                // Update order is reversed because of the index property
                // of the series
                graph.chart.series[2].setData(graph.series[0].data, false);
                graph.chart.series[1].setData(graph.series[1].data, false);
                graph.chart.series[0].setData(graph.series[2].data, false);
                graph.chart.redraw(false);
            }
        },

        /**
         * Updates (or creates if necessary) the graph that displays the
         * statistics of the numbers hit by players
         * @private
         */
        _updateGlobalDartsPerFactor: function() {
            var graph = this._graphs.global.dartsPerFactor;

            if(! $(graph.element).length) {
                return;
            }

            graph.series[0].data = [
                ['Out', 0],
                ['Simple', 0],
                ['Double', 0],
                ['Triple', 0]
            ];

            this._model._players.forEach(function(player) {
                player.throws.forEach(function(turn) {
                    turn.forEach(function(score) {
                        if(score == null) {
                            return;
                        }

                        if(score.value == 0) {
                            graph.series[0].data[0][1] ++;
                            return;
                        }
                        var serieIndex = score.factor;
                        graph.series[0].data[serieIndex][1] ++;
                    });
                });
            });

            if(graph.chart == null) {
                graph.chart = this._createHighchartsGraph(
                    graph.element,
                    graph.options,
                    graph.series
                );
            } else {
                graph.chart.series[0].setData(graph.series[0].data, false);
                graph.chart.redraw(false);
            }
        },

        /**
         * Updates (or creates if necessary) the graph that displays the
         * score progress of each player
         * @private
         */
        _updateGlobalPlayersProgress: function() {
            var graph = this._graphs.global.playersProgress;

            if(! $(graph.element).length) {
                return;
            }

            var turns = 0;
            graph.series = [];
            this._model._players.forEach(function(player) {
                graph.series.push({
                    name: player.name,
                    data: player.scoreProgress.slice(0)
                });
                console.log(player.name, player.scoreProgress);
                turns = Math.max(turns, player.scoreProgress.length);
            });
            graph.options.xAxis.categories = Array.apply(null, {length: turns}).map(Number.call, Number);

            if(graph.chart == null) {
                graph.chart = this._createHighchartsGraph(
                    graph.element,
                    graph.options,
                    graph.series
                );
            } else {
                this._model._players.forEach(function(player, idx) {
                    graph.chart.series[idx].setData(graph.series[idx].data, false);
                });
                graph.chart.redraw(false);
            }
        }

    };

    return LiveStats;
});
