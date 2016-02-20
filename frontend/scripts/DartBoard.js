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

(function(window) {
    "use strict";

    var twoPI = 2 * Math.PI;

    function DartBoard(canvas, cfg) {
        this.canvas = canvas;

        cfg = cfg || {};
        this.boardColors = cfg.boardColors || {
            single: [ "rgb(255,255,255)", "rgb(0,0,0)" ],
            multiple: [ "rgb(0,150,61)", "rgb(206,21,0)" ]
        };
        this.numberOrder = cfg.numberOrder || [
                6,  10, 15, 2,  17,
                3,  19, 7,  16, 8,
                11, 14, 9,  12, 5,
                20, 1,  18, 4,  13
        ];
        this.marks = cfg.marks || {
            textPosition: 0.95,
            outerDouble: 0.85,
            innerDouble: 0.80,
            outerTriple: 0.53,
            innerTriple: 0.48,
            outerSingleBull: 0.07,
            outerDoubleBull: 0.03
        };
        this.bullSingleValue = cfg.bullSingleValue || 25;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.radius = Math.min(this.width, this.height) / 2;
        this.center = {
            x: this.width / 2,
            y: this.height / 2
        };

        // Build the dartboard
        var ctx = this.canvas.getContext('2d');

        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Whole target
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.beginPath();
        ctx.arc(
            this.center.x,
            this.center.y,
            this.radius,
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
                single = this.boardColors.single[i % 2],
                multiple = this.boardColors.multiple[i % 2],
                sectors = [
                    [ this.marks.outerDouble, multiple ],
                    [ this.marks.innerDouble, single ],
                    [ this.marks.outerTriple, multiple ],
                    [ this.marks.innerTriple, single ]
                ];

            // Text
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.textAlign = "center";
            ctx.font = '12px Serif'
            ctx.fillText(
                this.numberOrder[i],
                this.center.x +
                    this.radius * Math.cos(startAngle + Math.PI / 20) *
                    this.marks.textPosition,
                this.center.y +
                    this.radius * Math.sin(startAngle + Math.PI / 20) *
                    this.marks.textPosition + 4 // Offset y
            );

            // Line separating from the next point
            ctx.beginPath();
            ctx.moveTo(
                this.center.x +
                    this.radius * Math.cos(endAngle) * this.marks.outerSingleBull,
                this.center.y +
                    this.radius * Math.sin(endAngle) * this.marks.outerSingleBull
            );
            ctx.lineTo(
                this.center.x +
                    this.radius * Math.cos(endAngle) * this.marks.outerTriple,
                this.center.y +
                    this.radius * Math.sin(endAngle) * this.marks.outerTriple
            );
            ctx.stroke();
            ctx.closePath();

            // Fill the circle sectors, from the biggest to the smallest
            for(var j = 0; j < sectors.length; j++) {
                var sector = sectors[j],
                    r = sector[0] * this.radius,
                    color = sector[1];

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(
                    this.center.x,
                    this.center.y
                );
                ctx.arc(
                    this.center.x,
                    this.center.y,
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
            this.marks.outerDouble,
            this.marks.innerDouble,
            this.marks.outerTriple,
            this.marks.innerTriple,
            this.marks.outerSingleBull,
            this.marks.outerDoubleBull
        ];
        for(var j = 0; j < circlesMarks.length; j++) {
            ctx.beginPath();
            ctx.arc(
                this.center.x,
                this.center.y,
                this.radius * circlesMarks[j],
                twoPI,
                false
            );
            ctx.stroke();
            ctx.closePath();
        }

        // Outer bull's eye
        ctx.fillStyle = this.boardColors.multiple[0];
        ctx.beginPath();
        ctx.moveTo(
            this.center.x,
            this.center.y
        );
        ctx.arc(
            this.center.x,
            this.center.y,
            this.marks.outerSingleBull * this.radius,
            0,
            twoPI
        );
        ctx.fill();
        ctx.closePath();

        // Inner bull's eye
        ctx.fillStyle = this.boardColors.multiple[1];
        ctx.beginPath();
        ctx.moveTo(
            this.center.x,
            this.center.y
        );
        ctx.arc(
            this.center.x,
            this.center.y,
            this.marks.outerDoubleBull * this.radius,
            0,
            twoPI
        );
        ctx.fill();
        ctx.closePath();
    };

    DartBoard.prototype.detectScore = function(inputX, inputY) {
        var ctx = this.canvas.getContext('2d'),
            x = this.center.x - inputX, // yes it is backwards because
            y = this.center.y - inputY, // canvas are backwards...
            angle = Math.atan2(y, x) + Math.PI, // Angle starting on the right
            radius = Math.sqrt(
                Math.pow(x, 2) +
                Math.pow(y, 2)
            ) / this.radius;

        var result = {
            value: 0,
            factor: 1,
            bull: false
        };

        // Outside of the target
        if(radius > this.marks.outerDouble) {
            return result;
        }

        // Bull's eye check
        if(radius <= this.marks.outerSingleBull) {
            result.value = this.bullSingleValue;
            result.bull = true;

            if(radius <= this.marks.outerDoubleBull) {
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
        result.value = this.numberOrder[sector];

        // Get the factor depending on radius
        if(radius >= this.marks.innerDouble && radius <= this.marks.outerDouble) {
            result.factor = 2;
        } else if(radius >= this.marks.innerTriple && radius <= this.marks.outerTriple) {
            result.factor = 3;
        }

        return result;
    };

    window.DartBoard = DartBoard;
}(window));
