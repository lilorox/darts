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

;(function($) {
    // Computed once and used everywhere
    var twoPI = 2 * Math.PI;

    var methods = {
        // Init function
        init: function(options) {
            // Default options
            this._defaults = {
                // Canvas size
                width: 500,
                height: 500,

                // Colors of the sectors
                boardColors: {
                    single: [ "rgb(255,255,255)", "rgb(0,0,0)" ],
                    multiple: [ "rgb(0,150,61)", "rgb(206,21,0)" ]
                },

                // Order of the numbers, starting on the right, clockwise
                numberOrder: [
                    6,  10, 15, 2,  17,
                    3,  19, 7,  16, 8,
                    11, 14, 9,  12, 5,
                    20, 1,  18, 4,  13
                ],

                // Radius of the concentric circles, relative to the size of the canvas
                marks : {
                    textPosition: 0.95,
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

            // Builder function for the dartboard
            // This function will be applied to all the selected elements
            // so we need to save the current object with options 
            // otherwise we will lose this context in the each function
            // right after
            var builder = (function(dartboard) {
                return function() {
                    // Creates on a new canvas
                    var canvasElement = $("<canvas>")
                        .attr("width", dartboard._options.width)
                        .attr("height", dartboard._options.height);
                    $(this).append(canvasElement);
                    $(this).addClass("dartboard");

                    // Set element's handlers
                    $(this).on('click', dartboard._options.onClick);

                    // Set the data attribute to the jQuery instance
                    $(this).data('dartboard', dartboard);

                    var canvas = canvasElement[0],
                        ctx = canvas.getContext('2d'),
                        height = canvas.height,
                        width = canvas.width,
                        radius = Math.min(width, height) / 2,
                        center = { x: width / 2, y: height / 2 };

                    // Save some parameters to the jQuery object
                    dartboard._canvas = canvas;
                    dartboard._radius = radius;
                    dartboard._center = center;

                    ctx.fillStyle = 'rgb(255, 255, 255)';
                    ctx.fillRect(0, 0, width, height);

                    // Whole target
                    ctx.fillStyle = 'rgb(0, 0, 0)';
                    ctx.beginPath();
                    ctx.arc(
                        center.x,
                        center.y,
                        radius,
                        0,
                        twoPI,
                        false
                    );
                    ctx.fill();
                    ctx.closePath();

                    // To have a angle starting on the right but with 
                    // sectors centered
                    var startAngle = - Math.PI / 20;

                    // Point line separators and color stripes
                    for(var i = 0; i < 20; i++) {
                        var endAngle = startAngle + Math.PI / 10,
                            single = dartboard._options.boardColors.single[i % 2],
                            multiple = dartboard._options.boardColors.multiple[i % 2],
                            sectors = [
                                [ dartboard._options.marks.outerDouble, multiple ],
                                [ dartboard._options.marks.innerDouble, single ],
                                [ dartboard._options.marks.outerTriple, multiple ],
                                [ dartboard._options.marks.innerTriple, single ]
                            ];

                        // Text
                        ctx.fillStyle = 'rgb(255, 255, 255)';
                        ctx.textAlign = "center";
                        ctx.font = '12px Serif'
                        ctx.fillText(
                            dartboard._options.numberOrder[i],
                            center.x +
                                radius * Math.cos(startAngle + Math.PI / 20) *
                                dartboard._options.marks.textPosition,
                            center.y +
                                radius * Math.sin(startAngle + Math.PI / 20) *
                                dartboard._options.marks.textPosition + 4 // Offset y
                        );

                        // Line separating from the next point
                        ctx.beginPath();
                        ctx.moveTo(
                            center.x +
                                radius * Math.cos(endAngle) * dartboard._options.marks.outerSingleBull,
                            center.y +
                                radius * Math.sin(endAngle) * dartboard._options.marks.outerSingleBull
                        );
                        ctx.lineTo(
                            center.x +
                                radius * Math.cos(endAngle) * dartboard._options.marks.outerTriple,
                            center.y +
                                radius * Math.sin(endAngle) * dartboard._options.marks.outerTriple
                        );
                        ctx.stroke();
                        ctx.closePath();

                        // Fill the circle sectors, from the biggest to the smallest
                        for(var j = 0; j < sectors.length; j++) {
                            var sector = sectors[j],
                                r = sector[0] * radius,
                                color = sector[1];

                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.moveTo(center.x, center.y);
                            ctx.arc(
                                center.x,
                                center.y,
                                r,
                                startAngle,
                                endAngle
                            );
                            ctx.fill();
                            ctx.closePath();
                        }

                        startAngle = endAngle;
                    }

                    // Concentric cirlces
                    ctx.strokeStyle = 'rgb(100, 100, 100)';
                    var circlesMarks = [
                        dartboard._options.marks.outerDouble,
                        dartboard._options.marks.innerDouble,
                        dartboard._options.marks.outerTriple,
                        dartboard._options.marks.innerTriple,
                        dartboard._options.marks.outerSingleBull,
                        dartboard._options.marks.outerDoubleBull
                    ];
                    for(var j = 0; j < circlesMarks.length; j++) {
                        ctx.beginPath();
                        ctx.arc(
                            center.x,
                            center.y,
                            radius * circlesMarks[j],
                            twoPI,
                            false
                        );
                        ctx.stroke();
                        ctx.closePath();
                    }

                    // Outer bull's eye
                    ctx.fillStyle = dartboard._options.boardColors.multiple[0];
                    ctx.beginPath();
                    ctx.moveTo(center.x, center.y);
                    ctx.arc(
                        center.x,
                        center.y,
                        dartboard._options.marks.outerSingleBull * radius,
                        0,
                        twoPI
                    );
                    ctx.fill();
                    ctx.closePath();

                    // Inner bull's eye
                    ctx.fillStyle = dartboard._options.boardColors.multiple[1];
                    ctx.beginPath();
                    ctx.moveTo(center.x, center.y);
                    ctx.arc(
                        center.x,
                        center.y,
                        dartboard._options.marks.outerDoubleBull * radius,
                        0,
                        twoPI
                    );
                    ctx.fill();
                    ctx.closePath();
                };
            })(this);

            // Apply the builder to the selector
            this.each(builder);

            return this;
        },

        // Options getter
        options: function() {
            return this._options;
        },

        // Returns the score under coordinates (x, y)
        getScore: function(inputX, inputY) {
            var ctx = this._canvas.getContext('2d'),
                x = this._center.x - inputX, // yes it is backwards because
                y = this._center.y - inputY, // canvas are backwards...
                angle = Math.atan2(y, x) + Math.PI, // Angle starting on the right
                radius = Math.sqrt(
                    Math.pow(x, 2) +
                    Math.pow(y, 2)
                ) / this._radius;

            var result = {
                value: 0,
                factor: 1,
                bull: false
            };

            // Outside of the target
            if(radius > this._options.marks.outerDouble) {
                return result;
            }

            // Bull's eye check
            if(radius <= this._options.marks.outerSingleBull) {
                result.value = this._options.bullSingleValue;
                result.bull = true;

                if(radius <= this._options.marks.outerDoubleBull) {
                    result.factor = 2;
                }
                return result;
            }

            // Rotate angle by pi/10 to correctly align the sectors
            var correctedAngle = angle + Math.PI / 20;
            if(correctedAngle < 0) {
                correctedAngle += twoPI;
            } else if(correctedAngle > twoPI) {
                correctedAngle -= twoPI;
            }

            // Get sector index and corresponding value
            var sector = Math.floor( correctedAngle * 10 / Math.PI);
            result.value = this._options.numberOrder[sector];

            // Get the factor depending on radius
            if(radius >= this._options.marks.innerDouble && radius <= this._options.marks.outerDouble) {
                result.factor = 2;
            } else if(radius >= this._options.marks.innerTriple && radius <= this._options.marks.outerTriple) {
                result.factor = 3;
            }

            return result;
        }
    };

    $.fn.DartBoard = function(methodOrOptions) {
        if(this.length > 1) {
            $.error('The DartBoard can only be applied to one element');
            return;
        }

        if(methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(
                    this,
                    Array.prototype.slice.call(arguments, 1)
            );
        } else if(typeof methodOrOptions === 'object' || ! methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  methodOrOptions + ' does not exist on jQuery.DartBoard');
        }
    };
})(jQuery);
