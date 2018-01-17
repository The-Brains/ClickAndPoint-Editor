define([
    'lodash',
    '../utility/check-data.js',
],
(_, CheckData) => {
    var Action = function(parent, key, data) {
        this.parent = parent;
        var myself = self;
        var game = null;
        var cursorWasChanged = false;

        this.getName = () => {
            return parent.getName() + ` - Action '${key}'`;
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
                'type',
                'target',
            ],
            true,
            this.getName()
        );

        var type = data.type;
        var target = data.target;

        this.validType = {
            goto: {
                checkData: () => {
                    getGame().isValidSceneKey(target, true);
                },
                hoverCursor: data.hoverCursor || 'zoom-in',
                actClickDown: (renderer, mouse, isHover) => {
                    if (isHover) {
                        return Promise.resolve({
                            newScene: target,
                        });
                    }
                    return Promise.resolve({});
                },
                actClickUp: (renderer, mouse, isHover) => {
                    return Promise.resolve({});
                },
                shouldBeShown: () => { return true; }
            },
            take: {
                checkData: () => {
                    getGame().isValidItemKey(target, true);
                },
                hoverCursor: data.hoverCursor || 'pointer',
                actClickDown: (renderer, mouse, isHover) => {
                    if (isHover) {
                        return Promise.resolve({
                            takeItem: target,
                        });
                    }
                    return Promise.resolve({});
                },
                actClickUp: (renderer, mouse, isHover) => {
                    return Promise.resolve({});
                },
                shouldBeShown: () => {
                    return !getGame().isItemOwned(target);
                }
            },
            setVariable: {
                hoverCursor: null,
                checkData: () => {
                    CheckData.checkKeys(
                        data,
                        [
                            'value',
                        ],
                        true,
                        this.getName()
                    );
                    getGame().isValidVariableName(target, true);
                },
                actClickDown: (renderer, mouse, isHover) => {
                    if (isHover) {
                        return Promise.resolve({
                            setVariable: {
                                target: target,
                                value: data.value,
                            }
                        });
                    }
                    return Promise.resolve({});
                },
                actClickUp: (renderer, mouse, isHover) => {
                    return Promise.resolve({});
                },
                shouldBeShown: () => {
                    return false;
                }
            }
        };

        var handleUpdate = (renderer, mouse, isHover) => {
            if (isHover && this.validType[type].hoverCursor !== null) {
                mouse.updateCursor(this.validType[type].hoverCursor);
                cursorWasChanged = true;
            }
            var data = {
                needDefaultCursor: !isHover && cursorWasChanged,
                isActive: cursorWasChanged && isHover,
            };
            if (!isHover) {
                cursorWasChanged = false;
            }

            return Promise.resolve(data);
        }

        this.shouldBeShown = () => {
            return this.validType[type].shouldBeShown();
        }

        this.render = (renderer, mouse, isHover) => {
            return handleUpdate(renderer, mouse, isHover);
        }

        this.handleCursorMove = (renderer, mouse, isHover) => {
            return handleUpdate(renderer, mouse, isHover);
        }

        this.handleClickDown = (renderer, mouse, isHover) => {
            return this.validType[type].actClickDown(renderer, mouse, isHover);
        }
        this.handleClickUp = (renderer, mouse, isHover) => {
            return this.validType[type].actClickUp(renderer, mouse, isHover);
        }

        if (!_.has(this.validType, type)) {
            throw `The action type '${type}' is not valid.`;
        }

        this.validType[type].checkData();
    }

    return Action;
});
