define([
    'lodash',
    '../utility/check-data.js',
    './interaction.js',
],
(_, CheckData, Interaction) => {
    var Scene = function(parent, key, data) {
        this.parent = parent;
        var myself = self;

        this.getName = () => {
            if (parent) {
                return parent.getName() + ` - Scene '${key}'`;
            } else {
                return `Scene '${key}'`;
            }
        }

        CheckData.checkKeys(
            data,
            [
                'name',
                'backgroundImg',
                'interactions',
            ],
            true,
            this.getName()
        );

        var name = data.name;
        var key = key;
        var backgroundImg = data.backgroundImg;
        var interactions = _.map(data.interactions, (interaction, index) => {
            return new Interaction(this, index, interaction);
        });

        this.getImageBackground = () => {
            return backgroundImg;
        }

        var renderBackground = (renderer) => {
            return new Promise((resolve, reject) => {
                var img = new Image();
                var $canvas = renderer.get$Canvas();
                var canvasContext = renderer.getContext();

                img.onload = (source) => {
                    var originalWidth = source.target.naturalWidth;
                    var originalHeight = source.target.naturalHeight;
                    var originalRatio = originalWidth / originalHeight * 1.0;

                    var fullHeight = $canvas.height();
                    var height = fullHeight;
                    var fullWidth =  $canvas.width();
                    var width = fullWidth;

                    var ratioWidth = originalWidth / width;
                    var ratioHeight = originalHeight / height;
                    if (ratioWidth > ratioHeight) {
                        height = width / originalRatio;
                    } else {
                        width = height * originalRatio;
                    }

                    renderer.setBackgroundRatio(
                        width / originalWidth,
                        height / originalHeight,
                    );

                    var cornerX = 0;
                    var cornerY = 0;

                    if (height < fullHeight) {
                        cornerY = (fullHeight - height) / 2;
                    }
                    if (width < fullWidth) {
                        cornerX = (fullWidth - width) / 2;
                    }

                    renderer.setOffset(cornerX, cornerY);

                    canvasContext.drawImage(img, cornerX, cornerY, width, height);
                    resolve();
                };
                img.src = backgroundImg;
            });
        }

        var handleUpdate = (renderer, mouse, methodName) => {
            var promises = _.map(interactions, (interaction) => {
                return interaction[methodName](renderer, mouse);
            });
            return Promise.all(promises)
            .then((output) => {
                output = _.flatten(output);
                // None is active and at least one was
                if (_.every(output, (a) => { return !a.isActive; }) &&
                    _.some(output, (a) => {return a.needDefaultCursor;})) {
                    mouse.defaultCursor();
                }

                // at least one is TRUE
                if (_.some(output, (a) => {return a.needRedrawScene;})) {
                    return this.render(renderer, mouse);
                } else {
                    return Promise.resolve(output);
                }
            });;
        }

        this.render = (renderer, mouse) => {
            return renderBackground(renderer)
            .then(() => {
                return handleUpdate(renderer, mouse, 'render');
            })

        }

        this.handleCursorMove = (renderer, mouse) => {
            return handleUpdate(renderer, mouse, 'handleCursorMove');
        }

        this.handleClickDown = (renderer, mouse) => {
            var promises = _.map(interactions, (interaction) => {
                return interaction.handleClickDown(renderer, mouse);
            });
            return Promise.all(promises)
        }

        this.handleClickUp = (renderer, mouse) => {
            var promises = _.map(interactions, (interaction) => {
                return interaction.handleClickUp(renderer, mouse);
            });
            return Promise.all(promises)
        }

        this.key = key;
    }

    return Scene;
});
