define(['jquery', 'lodash'], function($, _) {
    function resizeCanvas() {
        var canvasDrawing = $('#canvas');
        var container = $('.page-content');

        var height = container.height();
        var width = container.width();

        $('.CanvasArea').height(height);
        $('.CanvasArea').width(width);
        canvasDrawing.width(width);
        canvasDrawing.height(height);
        canvasDrawing.attr('width', width);
        canvasDrawing.attr('height', height);
    };

    $(window).resize(_.debounce(resizeCanvas, 200, {
        maxWait: 1000,
    }));
    resizeCanvas();
});
