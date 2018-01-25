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
        var interactions = _.map(data.interactions, (interaction, index) => {
            return new Interaction(this, index, interaction);
        });

        this.getImageBackground = () => {
            return data.backgroundImg;
        }
        
        function applyBackgroundImage(image, renderer, callback) {
            var $canvas = renderer.get$Canvas();
            var canvasContext = renderer.getContext();
            var originalWidth = image.naturalWidth;
            var originalHeight = image.naturalHeight;
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

            canvasContext.drawImage(image, cornerX, cornerY, width, height);
            callback();
        }

        var backgroundSrc = null;
        var backgroundImage = new Image();
        var renderBackground = (renderer) => {
            return new Promise((resolve, reject) => {
                if(backgroundSrc === this.getImageBackground()) {
                    applyBackgroundImage(backgroundImage, renderer, resolve);
                    return;
                }

                backgroundImage.onload = (source) => {
                    applyBackgroundImage(source.target, renderer, resolve);
                };
                backgroundImage.src = backgroundSrc = data.backgroundImg;
            });
        }

        var handleUpdate = (renderer, mouse, methodName) => {
            interactions = _.map(data.interactions, (interaction, index) => {
                return interactions[index] || new Interaction(this, index, interaction);
            });


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
