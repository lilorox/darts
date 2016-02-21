$(function() {
    var dartboard = $('#dartboard').DartBoard({
        onClick: function(evt) {
            var rect = this.getBoundingClientRect(),
                dartboard =  $(this).data('dartboard'),
                score = dartboard.DartBoard(
                    'getScore',
                    evt.clientX - rect.left,
                    evt.clientY - rect.top
                );
            console.log('score=', score);
        }
    });
});
