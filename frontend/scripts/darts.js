var twoPI = 2 * Math.PI,
    boardColors = {
        single: [
            "rgb(255,255,255)",
            "rgb(0,0,0)"
        ],
        multiple: [
            "rgb(0,150,61)",
            "rgb(206,21,0)"
        ]
    },
    numberOrder = [
        6, 10, 15, 2, 17,
        3, 19, 7, 16, 8,
        11, 14, 9, 12, 5,
        20, 1, 18, 4, 13
        /*
        6, 13, 4, 18, 1, 20, 5, 12, 9, 14,
        11, 8, 16, 7, 19, 3, 17, 2, 15, 10
        */
    ],
    marks = {
        // In percentage of the radius
        textPosition: 0.95,
        outerTriple: 0.85,
        innerTriple: 0.80,
        outerDouble: 0.53,
        innerDouble: 0.48,
        outerSingleBull: 0.07,
        outerDoubleBull: 0.03
    },
    bullSingleValue = 25;

function buildDartBoard(canvas) {
    var width = canvas.width,
        height = canvas.height,
        ctx = canvas.getContext('2d'),
        radius = Math.min(width, height) / 2,
        center = {x: width / 2, y: height / 2};

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, width, height);

    // Whole target
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, twoPI, false);
    ctx.fill();
    ctx.closePath();

    // To have a angle starting on the right but with 
    // sectors centered
    var startAngle = - Math.PI / 20;

    // Point line separators and color stripes
    for(var i = 0; i < 20; i++) {
        var endAngle = startAngle + Math.PI / 10,
            single = boardColors.single[i % 2],
            multiple = boardColors.multiple[i % 2],
            sectors = [
                [ marks.outerTriple, multiple ],
                [ marks.innerTriple, single ],
                [ marks.outerDouble, multiple ],
                [ marks.innerDouble, single ]
            ];

        // Text
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.textAlign = "center";
        ctx.font = '12px Serif'
        ctx.fillText(
            numberOrder[i],
            center.x + radius * Math.cos(startAngle + Math.PI / 20) * marks.textPosition,
            center.y + radius * Math.sin(startAngle + Math.PI / 20) * marks.textPosition + 4 // Offset y
        );

        // Line separating from the next point
        ctx.beginPath();
        ctx.moveTo(
            center.x + radius * Math.cos(endAngle) * marks.outerSingleBull,
            center.y + radius * Math.sin(endAngle) * marks.outerSingleBull
        );
        ctx.lineTo(
            center.x + radius * Math.cos(endAngle) * marks.outerTriple,
            center.y + radius * Math.sin(endAngle) * marks.outerTriple
        );
        ctx.stroke();
        ctx.closePath();

        // Fill the circle sectors, from the biggest to the smallest
        sectors.forEach(function(sector, i) {
            var r = sector[0] * radius,
                color = sector[1];

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(
                center.x,
                center.y
            );
            ctx.arc(
                center.x,
                center.y,
                r,
                startAngle,
                endAngle
            );
            ctx.fill();
            ctx.closePath();
        });

        startAngle = endAngle;
    }

    // Concentric cirlces
    ctx.strokeStyle = 'rgb(100, 100, 100)';
    Object.keys(marks).forEach(function(key, i) {
        if(i == 0) {
            // Skip the textPosition mark
            return;
        }
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * marks[key], twoPI, false);
        ctx.stroke();
        ctx.closePath();
    });

    // Outer bull's eye
    ctx.fillStyle = boardColors.multiple[0];
    ctx.beginPath();
    ctx.moveTo(
        center.x,
        center.y
    );
    ctx.arc(
        center.x,
        center.y,
        marks.outerSingleBull * radius,
        0,
        twoPI
    );
    ctx.fill();
    ctx.closePath();

    // Inner bull's eye
    ctx.fillStyle = boardColors.multiple[1];
    ctx.beginPath();
    ctx.moveTo(
        center.x,
        center.y
    );
    ctx.arc(
        center.x,
        center.y,
        marks.outerDoubleBull * radius,
        0,
        twoPI
    );
    ctx.fill();
    ctx.closePath();
}

function detectScore(canvas, coord) {
    var width = canvas.width,
        height = canvas.height,
        ctx = canvas.getContext('2d'),
        maxRadius = Math.min(width, height) / 2,
        center = {x: width / 2, y: height / 2},
        x = center.x - coord.x, // yes it is backwards because
        y = center.y - coord.y, // canvas are backwards...
        angle = Math.atan2(y, x) + Math.PI, // Angle starting on the right
        radius = Math.sqrt(
            Math.pow(x, 2) +
            Math.pow(y, 2)
        ) / maxRadius;

    /*
    console.log('x=', x,
            'y=', y,
            'rad=', angle,
            'deg=', (angle * 180 / Math.PI),
            'radius=', radius
    );
    */

    var result = {
        value: 0,
        factor: 1,
        bull: false
    };

    // Outside of the target
    if(radius > marks.outerTriple) {
        return result;
    }

    // Bull's eye check
    if(radius <= marks.outerSingleBull) {
        result.value = bullSingleValue;
        result.bull = true;

        if(radius <= marks.outerDoubleBull) {
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
    result.value = numberOrder[sector];

    // Get the factor depending on radius
    if(radius >= marks.innerDouble && radius <= marks.outerDouble) {
        result.factor = 2;
    } else if(radius >= marks.innerTriple && radius <= marks.outerTriple) {
        result.factor = 3;
    }

    return result;
}

$(function() {
    var canvas = $("#dartboard > canvas")[0];

    buildDartBoard(canvas);

    $(canvas).on('click', function(evt) {
        var rect = this.getBoundingClientRect();
            score = detectScore(
                this,
                {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                }
            );
        console.log('score=', score);
    });
});
