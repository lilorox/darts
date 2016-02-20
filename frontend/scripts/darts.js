$(function() {
    var canvas = $("#dartboard > canvas")[0],
        dartboard = new DartBoard(canvas);

    (function(dartboard) {
        $(canvas).on('click', function(evt) {
            var rect = this.getBoundingClientRect(),
                score = dartboard.detectScore(
                    evt.clientX - rect.left,
                    evt.clientY - rect.top
                );
            console.log('score=', score);
        });
    })(dartboard);
});
