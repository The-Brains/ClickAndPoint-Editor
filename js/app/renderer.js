define([
],
() => {
    var Renderer = function($canvas, canvasContext) {
        var myself = self;
        var backgroundRatio = {
            width: 1,
            height: 1,
        };
        var offset = {
            x: 0,
            y: 0,
        }

        this.setBackgroundRatio = (width, height) => {
            backgroundRatio.width = width;
            backgroundRatio.height = height;
        }

        this.get$Canvas = () => {
            return $canvas;
        }

        this.getCanvas = () => {
            return canvas;
        }

        this.getContext = () => {
            return canvasContext;
        }

        this.convertCoordonateToBackground = (point) => {
            return {
                x: point.x * backgroundRatio.width + offset.x,
                y: point.y * backgroundRatio.height + offset.y,
            };
        }

        this.convertBackgroundToCoordinate = (point) => {
            return {
                x: (point.x - offset.x) / backgroundRatio.width,
                y: (point.y - offset.y) / backgroundRatio.height,
            };
        }

        this.convertValueToBackground = (value) => {
            return value * backgroundRatio.width;
        }

        this.convertBackgroundToValue = (value) => {
            return value / backgroundRatio.width;
        }

        this.setOffset = (offsetX, offsetY) => {
            offset.x = offsetX;
            offset.y = offsetY;
        }

        this.getOffset = () => {
            return offset;
        }
    }

    return Renderer;
});
