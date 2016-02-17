function buildCanvas() {
    var canvas = $("#dartboard > canvas")[0],
        width = canvas.width,
        height = canvas.height,
        ctx = canvas.getContext('2d'),
        radius = Math.min(width, height) / 2,
        center = {x: width / 2, y: height / 2};

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, width, height);

    // Whole target
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    // Concentric cirlces
    ctx.strokeStyle = 'rgb(100, 100, 100)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.85, 2 * Math.PI, false);
    ctx.arc(center.x, center.y, radius * 0.80, 2 * Math.PI, false);
    ctx.stroke();
    ctx.closePath();
}

$(function() {
    buildCanvas();
});
