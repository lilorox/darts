/**
 * @license Dartboard.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see the LICENSE file at the root of the project
 */

define(['jquery', 'd3'], function($, d3) {
    /**
     * Displays the dartboard and enables the user to interact with it by throwing darts.
     * @constructor
     */
    function DartBoard(element, options) {
        this._element = $(element);

        // Default options
        this._defaults = {
            // Canvas size
            width: 500,
            height: 500,

            // Colors of the sectors
           boardColors: [
                [ "rgb(0,150,61)",    "rgb(206,21,0)" ], // Double / Triple
                [ "rgb(255,255,255)", "rgb(0,0,0)" ] // Single
           ],

            // Order of the numbers, starting on the right, clockwise
            numberOrder: [
                /*
                6,  10, 15, 2,  17,
                3,  19, 7,  16, 8,
                11, 14, 9,  12, 5,
                20, 1,  18, 4,  13
                */
                20, 1,  18, 4,  13,
                6,  10, 15, 2,  17,
                3,  19, 7,  16, 8,
                11, 14, 9,  12, 5
            ],

            // Radius of the concentric circles, relative to the size of the canvas
            marks : {
                textPosition: 0.90,
                outerDouble: 0.85,
                innerDouble: 0.80,
                outerTriple: 0.53,
                innerTriple: 0.48,
                outerSingleBull: 0.07,
                outerDoubleBull: 0.03
            },

            // Default value of the outer bull's eye
            bullSingleValue: 25,

            // Events
            onClick: function(evt) { return; }
        };

        this._options = $.extend(true, {}, this._defaults, options);

        /**
         * Builds the dartboard SVG object and appends it to the main element
         */
        this._draw = function() {
            var radius = 500,
                center = { x: radius, y: radius },
                svg = d3.select(this._element.get(0))
                    .classed("dartboard", true)
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("viewBox", "0 0 1000 1000"),
                svgDefs = svg.append("defs"),
                factors = [ 2, 1, 3, 1 ],
                pieces = [
                    [ this._options.marks.outerDouble, this._options.marks.innerDouble ],
                    [ this._options.marks.innerDouble, this._options.marks.outerTriple ],
                    [ this._options.marks.outerTriple, this._options.marks.innerTriple ],
                    [ this._options.marks.innerTriple, this._options.marks.outerSingleBull ]
                ];

            // Adds the external rect and circle
            svg.append("rect")
                .classed("scorable", true)
                .attr("width", 1000)
                .attr("height", 1000)
                .attr("fill", "rgb(255, 255, 255)")
                .attr("data-factor", "2");
            svg.append("circle")
                .classed("scorable", true)
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", radius)
                .attr("fill", "rgb(50,50,50)");

            /**
             * Private function to return the 4 points of a segment of a hollow circle
             */
            function makePoints(center, radius, startAngle, endAngle, startRatio, endRatio) {
                return [
                    {
                        x: center.x + radius * Math.cos(startAngle) * startRatio,
                        y: center.y + radius * Math.sin(startAngle) * startRatio
                    },
                    {
                        x: center.x + radius * Math.cos(endAngle) * startRatio,
                        y: center.y + radius * Math.sin(endAngle) * startRatio
                    },
                    {
                        x: center.x + radius * Math.cos(endAngle) * endRatio,
                        y: center.y + radius * Math.sin(endAngle) * endRatio
                    },
                    {
                        x: center.x + radius * Math.cos(startAngle) * endRatio,
                        y: center.y + radius * Math.sin(startAngle) * endRatio
                    }
                ];
            }

            // Construction of each of the dartboard slices
            var startAngle = - 11 * Math.PI / 20;
            for(i = 0; i < 20; i++) {
                var endAngle = startAngle + Math.PI / 10;

                // For each slice, construction of the 4 segments (double, single, triple, single)
                for(var j = 0; j < 4; j++) {
                    var startRatio = pieces[j][0],
                        endRatio = pieces[j][1],
                        points = makePoints(center,radius, startAngle, endAngle, startRatio, endRatio),
                        color = this._options.boardColors[j % 2][i % 2],
                        outerRadius = startRatio * radius,
                        innerRadius = endRatio * radius,
                        d = [
                            "M", points[0].x, points[0].y,
                            "A", outerRadius, outerRadius, 1, 0, 1, points[1].x, points[1].y,
                            "L", points[2].x, points[2].y,
                            "A", innerRadius, innerRadius, 1, 0, 0, points[3].x, points[3].y,
                            "L", points[0].x, points[0].y,
                            "Z"
                        ];
                    svg.append("path")
                        .classed("scorable", true)
                        .classed("dartboard-segment", true)
                        .attr("data-score", this._options.numberOrder[i])
                        .attr("data-factor", factors[j])
                        .attr("d", d.join(" "))
                        .attr("fill", color);
                }

                // Adds the textPath and the text of the current slice
                var textRadius = this._options.marks.textPosition * radius,
                    textStart = {
                        x: center.x + textRadius * Math.cos(startAngle),
                        y: center.y + textRadius * Math.sin(startAngle)
                    },
                    textEnd = {
                        x: center.x + textRadius * Math.cos(endAngle),
                        y: center.y + textRadius * Math.sin(endAngle)
                    };

                // SVG defs of the textPath
                svgDefs.append("path")
                    .attr("id", "dartboard-text-path-" + this._options.numberOrder[i])
                    .attr(
                        "d",
                        [
                            "M", textStart.x, textStart.y,
                            "A", textRadius, textRadius, 0, 0, 1, textEnd.x, textEnd.y
                        ].join(" ")
                    );

                svg.append("text")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("text-anchor", "middle")
                    /*
                    .attr("font-size", Math.floor(radius / 15))
                    .attr("font-family", "Arial")
                    */
                    .attr("fill", "white")
                    .append("textPath")
                        .attr("xlink:href", "#dartboard-text-path-" + this._options.numberOrder[i])
                        .attr("startOffset", "50%")
                        .text(this._options.numberOrder[i]);

                        /*
                svg.append("use")
                    .attr("xlink:href", "#dartboard-text-path-" + this._options.numberOrder[i])
                    .attr("stroke", "red");
                    */

                startAngle = endAngle;
            }

            // Adds the single bull hollow circle
            var outerBullRadius = this._options.marks.outerSingleBull * radius,
                innerBullRadius = this._options.marks.outerDoubleBull * radius;
            svg.append("path")
                .classed("scorable", true)
                .classed("dartboard-segment", true)
                .attr("data-score", this._options.bullSingleValue)
                .attr("data-factor", 1)
                .attr("data-bull", true)
                .attr(
                    "d",
                    [
                        "M", center.x, center.y - outerBullRadius,
                        "A", outerBullRadius, outerBullRadius, 0, 0, 1, center.x, center.y + outerBullRadius,
                        "A", outerBullRadius, outerBullRadius, 0, 0, 1, center.x, center.y - outerBullRadius,
                        "z",
                        "M", center.x, center.y - innerBullRadius,
                        "A", innerBullRadius, innerBullRadius, 0, 0, 0, center.x, center.y + innerBullRadius,
                        "A", innerBullRadius, innerBullRadius, 0, 0, 0, center.x, center.y - innerBullRadius,
                        "z"
                    ].join(" ")
                )
                .style("fill",  this._options.boardColors[0][0])
                .attr("fill-rule", "evenodd");

            // Adds the double bull plain circle
            svg.append("circle")
                .classed("scorable", true)
                .classed("dartboard-segment", true)
                .attr("data-score", this._options.bullSingleValue)
                .attr("data-factor", 2)
                .attr("data-bull", true)
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", innerBullRadius)
                .style("fill", this._options.boardColors[0][1]);
        };

        /**
         * Sets the onClick event
         */
        this._setupEvents = function() {
            var dartboard = this;
            this._element.children('svg').children('.scorable').on('click', function(evt) {
                evt.preventDefault();
                dartboard._options.onClick();

                var score = $(this).data('score') || 0,
                    factor = $(this).data('factor') || 1,
                    bull = ($(this).data('bull') === true ? true : false);

                $(this).trigger(
                    new jQuery.Event('dartThrown', {
                        score: {
                            value: score,
                            factor: factor,
                            bull: bull
                        }
                    })
                );
            });

        };

        /**
         * Destroys the plugin.
         */
        this.destroy = function() {
            this._element.off('click');
            this._element.empty();
            delete this._element;
        };

        this._draw();
        this._setupEvents();
    }


    /**
     * Registers the jQuery Plugin and deals with the options or methods passed
     * as arguments.
     */
    $.fn.DartBoard = function(methodOrOptions) {
        var method = (typeof methodOrOptions === 'string') ? methodOrOptions : undefined;

        if(method) {
            var dartboards = this.map(function() {
                return $(this).data('dartboard');
            });

            var args = (arguments.length > 1) ? Array.prototype.slice.call(arguments, 1) : undefined;
            var results = [];

            this.each(function(index) {
                var dartboard = dartboards[index];

                if(! dartboard) {
                    console.warn('$.DartBoard is not instantiated yet');
                    console.info(this);
                    results.push(undefined);
                    return;
                }

                if(typeof dartboard[method] === 'function') {
                    var result = dartboard[method].apply(dartboard, args);
                    results.push(result);
                } else {
                    console.warn('Method \'' + method + '\' not defined in $.DartBoard');
                }
            });

            return (results.length > 1) ? results : results[0];
        } else {
            var options = (typeof methodOrOptions === 'object') ? methodOrOptions : undefined;
            return this.each(function() {
                $(this).data('dartboard', new DartBoard($(this), options));
            });
        }
    };
});
