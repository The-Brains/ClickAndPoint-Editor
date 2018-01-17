define([
    '../utility/check-data.js',
],
(CheckData) => {
    var Location = function(parent, data) {
        this.parent = parent;
        var myself = self;

        this.getName = () => {
            return parent.getName() + ` - Location ${data.shape}`;
        }

        CheckData.checkKeys(
            data,
            [
                'description',
                'shape',
            ],
            true,
            this.getName()
        );

        var colorInside = 'blue';
        var colorDefault = 'black';
        var wasDrawn = false;

        this.square = {
            dataCheck: () => {
                CheckData.checkKeys(
                    data.description,
                    [
                        'bottomRightCorner',
                        'bottomRightCorner.x',
                        'bottomRightCorner.y',
                        'topLeftCorner',
                        'topLeftCorner.x',
                        'topLeftCorner.y',
                    ],
                    true,
                    this.getName()
                );
                if (data.description.topLeftCorner.x >= data.description.bottomRightCorner.x) {
                    throw `[${this.getName()}] The topLeftCorner.x is bigger than bottomRightCorner.x`;
                }
                if (data.description.topLeftCorner.y >= data.description.bottomRightCorner.y) {
                    throw `[${this.getName()}] The topLeftCorner.y is bigger than bottomRightCorner.y`;
                }
            },
            draw: (renderer, color) => {
                var topLeftCorner = renderer.convertCoordonateToBackground(data.description.topLeftCorner);
                var bottomRightCorner = renderer.convertCoordonateToBackground(data.description.bottomRightCorner);
                var canvasContext = renderer.getContext();

                canvasContext.beginPath();
                canvasContext.rect(
                    topLeftCorner.x,
                    topLeftCorner.y,
                    bottomRightCorner.x - topLeftCorner.x,
                    bottomRightCorner.y - topLeftCorner.y,
                );

                canvasContext.lineWidth = 3;
                canvasContext.strokeStyle = color;
                canvasContext.stroke();

                return Promise.resolve({});
            },
            isInside: (renderer, mouse) => {
                if (!mouse.isInitialize()) {
                    return false;
                }
                var topLeftCorner = renderer.convertCoordonateToBackground(data.description.topLeftCorner);
                var bottomRightCorner = renderer.convertCoordonateToBackground(data.description.bottomRightCorner);
                return (
                    mouse.getX() <= bottomRightCorner.x && mouse.getX() >= topLeftCorner.x &&
                    mouse.getY() <= bottomRightCorner.y && mouse.getY() >= topLeftCorner.y
                );
            },
        };

        this.circle = {
            dataCheck: () => {
                CheckData.checkKeys(
                    data.description,
                    [
                        'center',
                        'center.x',
                        'center.y',
                        'radius',
                    ],
                    true,
                    this.getName()
                );
            },
            draw: (renderer, color) => {
                var center = renderer.convertCoordonateToBackground(data.description.center);
                var radius = renderer.convertValueToBackground(data.description.radius);
                var canvasContext = renderer.getContext();

                canvasContext.beginPath();
                canvasContext.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
                canvasContext.lineWidth = 3;
                canvasContext.strokeStyle = color;
                canvasContext.stroke();

                return Promise.resolve({});
            },
            isInside: (renderer, mouse) => {
                if (!mouse.isInitialize()) {
                    return false;
                }
                var center = renderer.convertCoordonateToBackground(data.description.center);
                var radius = renderer.convertValueToBackground(data.description.radius);
                return Math.pow(mouse.getX() - center.x, 2) + Math.pow(mouse.getY() - center.y, 2)
                    < Math.pow(radius, 2);
            },
        }

        this.icon = {
            dataCheck: () => {
                this.square.dataCheck();
                CheckData.checkKeys(
                    data.description,
                    [
                        'image',
                    ],
                    true,
                    this.getName()
                );
            },
            draw: (renderer, color) => {
                return new Promise((resolve) => {
                    var topLeftCorner = renderer.convertCoordonateToBackground(data.description.topLeftCorner);
                    var bottomRightCorner = renderer.convertCoordonateToBackground(data.description.bottomRightCorner);
                    var img = new Image();
                    var $canvas = renderer.get$Canvas();
                    var canvasContext = renderer.getContext();

                    img.onload = (source) => {
                        var originalWidth = source.target.naturalWidth;
                        var originalHeight = source.target.naturalHeight;
                        var originalRatio = originalWidth / originalHeight * 1.0;

                        canvasContext.drawImage(img,
                            topLeftCorner.x,
                            topLeftCorner.y,
                            bottomRightCorner.x - topLeftCorner.x,
                            bottomRightCorner.y - topLeftCorner.y,
                        );
                        resolve();
                    };
                    img.src = data.description.image;
                });
            },
            isInside: (renderer, mouse) => {
                return this.square.isInside(renderer, mouse);
            },
        }

        var handleUpdate = (renderer, mouse) => {
            var isInside = this[data.shape].isInside(renderer, mouse);
            return Promise.resolve()
            .then(() => {
                if (isInside) {
                    wasDrawn = true;
                    return this[data.shape].draw(renderer, colorInside);
                } else if (!parent.isHidding()) {
                    wasDrawn = true;
                    return this[data.shape].draw(renderer, colorDefault);
                } else {
                    var returnedData = {
                        needRedrawScene: wasDrawn,
                    };
                    wasDrawn = false;
                    return Promise.resolve(returnedData);
                }
            })
            .then((output) => {
                return _.merge(output, {
                    isInside: isInside,
                });
            });
        }

        this.render = (renderer, mouse) => {
            return handleUpdate(renderer, mouse);
        }

        this.handleCursorMove = (renderer, mouse) => {
            return handleUpdate(renderer, mouse);
        }

        this.handleClickDown = (renderer, mouse) => {
            var isInside = this[data.shape].isInside(renderer, mouse);
            return Promise.resolve({
                isInside: isInside,
            });
        }
        this.handleClickUp = (renderer, mouse) => {
            var isInside = this[data.shape].isInside(renderer, mouse);
            return Promise.resolve({
                isInside: isInside,
            });
        }

        this[data.shape].dataCheck();
    }

    return Location;
});
