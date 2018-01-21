define([
    'lodash',
    '../utility/check-data.js',
    './location.js',
    './action.js',
],
(_, CheckData, Location, Action) => {
    var Interaction = function(parent, key, data) {
        this.parent = parent;
        var myself = self;
        var game = null;

        this.getName = () => {
            return parent.getName() + ` - Interaction '${key}'`;
        }

        var getGame = () => {
            if (game) {
                return game;
            }
            var currentParent = parent;
            while (currentParent.parent) {
                currentParent = currentParent.parent;
            }
            game = currentParent;
            return getGame();
        }

        CheckData.checkKeys(
            data,
            [
                'location',
                'actions',
                'hidden',
            ],
            true,
            this.getName()
        );

        var location = new Location(this, data.location);
        var actions;

        var dynamicCondition = () => {
            return data.if ? !!getGame().getVariable(data.if) : true;
        };

        this.isHidding = () => {
            return data.hidden;
        }

        this.exists = () => {
            return dynamicCondition() && _.reduce(actions, function(acc, action) {
                return acc || action.shouldBeShown();
            }, false);
        }

        var handleUpdate = (renderer, mouse, methodName) => {
            if (!this.exists()) {
                return Promise.resolve({});
            }

            return location[methodName](renderer, mouse)
            .then((outputFromLocation) => {
                var promises = _.map(actions, (action) => {
                    return action[methodName](renderer, mouse, outputFromLocation.isInside);
                });
                return Promise.all(promises)
                .then((output) => {
                    return Promise.resolve(_.concat(outputFromLocation, output));
                });
            });
        }

        this.render = (renderer, mouse) => {
            actions = _.flatMap(data.actions, (action, index) => {
                if (typeof action === 'string') {
                    return getGame().getActions(action);
                } else if (action.ref && action.useRef) {
                    return getGame().getActions(action.ref);
                } else {
                    return new Action(this, index, action);
                }
            });
            return handleUpdate(renderer, mouse, 'render');
        }
        this.handleCursorMove = (renderer, mouse) => {
            return handleUpdate(renderer, mouse, 'handleCursorMove');
        }
        this.handleClickDown = (renderer, mouse) => {
            return handleUpdate(renderer, mouse, 'handleClickDown');
        }
        this.handleClickUp = (renderer, mouse) => {
            return handleUpdate(renderer, mouse, 'handleClickUp');
        }
    }

    return Interaction;
});
