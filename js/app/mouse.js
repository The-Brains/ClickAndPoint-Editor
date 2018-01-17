define([
    '../utility/check-data.js',
],
(CheckData) => {
    var Mouse = function() {
        var myself = self;

        var x = null;
        var y = null;

        var isClicked = false;

        this.registerMouseMove = (newX, newY) => {
            x = newX;
            y = newY;
        }

        this.getX = () => {
            return x;
        }

        this.getY = () => {
            return y;
        }

        this.isInitialize = () => {
            return x !== null && y !== null;
        }

        this.registerClick = () => {
            isClicked = true;
        }
        this.registerRelease = () => {
            isClicked = false;
        }

        this.toString = () => {
            return `Mouse:(${x}, ${y})`;
        }

        var _setCursor = function(cursor) {
            document.body.style.cursor = cursor;
        }

        this.defaultCursor = () => {
            _setCursor('default');
        }

        this.updateCursor = (newCursor) => {
            _setCursor(newCursor);
        }
    }

    return Mouse;
});
