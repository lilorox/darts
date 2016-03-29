/**
 * @license daretboard.js Copyright (C) 2016 Pierre Gaxatte
 * Released under GPLv3 license, see ../../LICENSE
 */

;(function($) {
    // Computed once and used everywhere
    var twoPI = 2 * Math.PI;

    /**
     * Displays the dartboard and enabled the user to interact with it by throwing darts.
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
            boardColors: {
                single:   [ "rgb(255,255,255)", "rgb(0,0,0)" ],
                multiple: [ "rgb(0,150,61)",    "rgb(206,21,0)" ]
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

        /*
         * Build the dartboard canvas and such
         */
        var canvasElement = $("<canvas>")
            .attr("width", this._options.width)
            .attr("height", this._options.height);
        this._element.append(canvasElement);
        this._element.addClass("dartboard");

        var canvas = canvasElement[0],
            ctx = canvas.getContext('2d'),
            height = canvas.height,
            width = canvas.width,
            radius = Math.min(width, height) / 2,
            center = { x: width / 2, y: height / 2 };

        // Save some parameters to the jQuery object
        this._canvas = canvas;
        this._radius = radius;
        this._center = center;

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
        var i, j;
        for(i = 0; i < 20; i++) {
            var endAngle = startAngle + Math.PI / 10,
                single = this._options.boardColors.single[i % 2],
                multiple = this._options.boardColors.multiple[i % 2],
                sectors = [
                    [ this._options.marks.outerDouble, multiple ],
                    [ this._options.marks.innerDouble, single ],
                    [ this._options.marks.outerTriple, multiple ],
                    [ this._options.marks.innerTriple, single ]
                ];

            // Text
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.textAlign = "center";
            ctx.font = '12px Serif';
            ctx.fillText(
                this._options.numberOrder[i],
                center.x +
                    radius * Math.cos(startAngle + Math.PI / 20) *
                    this._options.marks.textPosition,
                center.y +
                    radius * Math.sin(startAngle + Math.PI / 20) *
                    this._options.marks.textPosition + 4 // Offset y
            );

            // Line separating from the next point
            ctx.beginPath();
            ctx.moveTo(
                center.x +
                    radius * Math.cos(endAngle) * this._options.marks.outerSingleBull,
                center.y +
                    radius * Math.sin(endAngle) * this._options.marks.outerSingleBull
            );
            ctx.lineTo(
                center.x +
                    radius * Math.cos(endAngle) * this._options.marks.outerTriple,
                center.y +
                    radius * Math.sin(endAngle) * this._options.marks.outerTriple
            );
            ctx.stroke();
            ctx.closePath();

            // Fill the circle sectors, from the biggest to the smallest
            for(j = 0; j < sectors.length; j++) {
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
            this._options.marks.outerDouble,
            this._options.marks.innerDouble,
            this._options.marks.outerTriple,
            this._options.marks.innerTriple,
            this._options.marks.outerSingleBull,
            this._options.marks.outerDoubleBull
        ];
        for(j = 0; j < circlesMarks.length; j++) {
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
        ctx.fillStyle = this._options.boardColors.multiple[0];
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(
            center.x,
            center.y,
            this._options.marks.outerSingleBull * radius,
            0,
            twoPI
        );
        ctx.fill();
        ctx.closePath();

        // Inner bull's eye
        ctx.fillStyle = this._options.boardColors.multiple[1];
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(
            center.x,
            center.y,
            this._options.marks.outerDoubleBull * radius,
            0,
            twoPI
        );
        ctx.fill();
        ctx.closePath();

        // Set element's handlers
        (function(dartboard) {
            dartboard._element.on('click', function(evt) {
                evt.preventDefault();
                dartboard._options.onClick();

                var rect = this.getBoundingClientRect(),
                    event = new jQuery.Event('dartThrown', {
                        score: dartboard.getScore(
                            evt.clientX - rect.left,
                            evt.clientY - rect.top
                        )
                    });
                $(this).trigger(event);
            });
        })(this);

        // Set the data attribute to the jQuery instance
        this._element.data('dartboard', dartboard);
    }
    DartBoard.prototype = {
        /**
         * Returns the score under coordinates (x, y)
         * @param {number} inputX - The X coordinates to lookup the score for.
         * @param {number} inputY - The Y coordinates to lookup the score for.
         * @returns {Object} Score object (eg. for a double 10: {value: 10, factor: 3, bull: false}).
         */
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


    /*
     * Registers the jQuery Plugin
     */
    $.fn.DartBoard = function(options) {
        return this.each(function() {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('dartboard')) return;

            var dartboard = new DartBoard(element, options);

            // Store plugin object in this element's data
            element.data('dartboard', dartboard);
        });
    };
})(jQuery);
