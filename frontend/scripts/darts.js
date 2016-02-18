var boardColors = {
    single: [ "rgb(0,0,0)", "rgb(255,255,255)" ],
    multiple: [ "rgb(206,21,0)", "rgb(0,150,61)" ]
};

function buildCanvas() {
    var canvas = $("#dartboard > canvas")[0],
        width = canvas.width,
        height = canvas.height,
        ctx = canvas.getContext('2d'),
        radius = Math.min(width, height) / 2,
        center = {x: width / 2, y: height / 2},
        marks = {
            // In percentage of the radius
            textPosition: 0.95,
            outerTriple: 0.85,
            innerTriple: 0.80,
            outerDouble: 0.53,
            innerDouble: 0.48,
            outerSingleBull: 0.07,
            outerDoubleBull: 0.03
        };

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, width, height);

    // Whole target
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    // Point line separators and color stripes
    var startAngle = 9 * Math.PI / 20;
    for(var i = 0; i < 20; i++) {
        var endAngle = startAngle + Math.PI / 10,
            textAngle = startAngle + 11 * Math.PI / 20,
            single = boardColors.single[i % 2],
            multiple = boardColors.multiple[i % 2],
            sectors = [
                [ marks.outerTriple, multiple ],
                [ marks.innerTriple, single ],
                [ marks.outerDouble, multiple ],
                [ marks.innerDouble, single ]
            ];

        // Text
        ctx.save();
        ctx.translate(
            center.x + radius * Math.cos(startAngle + Math.PI / 20) * marks.textPosition,
            center.y + radius * Math.sin(startAngle + Math.PI / 20) * marks.textPosition
        );
        ctx.rotate(textAngle);
        ctx.textAlign = "center";
        ctx.fillText(i, 0, 0);
        ctx.restore();

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
            return;
        }
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * marks[key], 2 * Math.PI, false);
        ctx.stroke();
        ctx.closePath();
    });

    // Outer bull's eye
    ctx.fillStyle = boardColors.multiple[1];
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
        2 * Math.PI
    );
    ctx.fill();
    ctx.closePath();

    // Inner bull's eye
    ctx.fillStyle = boardColors.multiple[0];
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
        2 * Math.PI
    );
    ctx.fill();
    ctx.closePath();
}

$(function() {
    buildCanvas();
});
