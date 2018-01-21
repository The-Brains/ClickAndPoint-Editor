define([
    'jquery',
    'lodash',
    '../utility/data-provider.js',
    '../utility/check-data.js',
    './renderer.js',
    './mouse.js',
    './scene.js',
    './action.js',
    './item.js',
    '../editor/editor.js',
],
($, _, DataProvider, CheckData, Renderer, Mouse, Scene, Action, Item, Editor) => {
    var Game = function(sourceFile, canvas, sourceData) {
        var myself = self;
        var $canvas = null;
        this.renderer = null;

        if (canvas) {
            var canvas = canvas;
            $canvas = $(canvas);
            var canvasContext = canvas.getContext('2d');
            this.renderer = new Renderer($canvas, canvasContext);
        }

        var offsetX, offsetY;

        var backgroundColor = null;

        this.mouse = new Mouse();
        this.dataProvider = new DataProvider();
        this.dataProvider.sourceFile = sourceFile;
        this.dataProvider.sourceData = sourceData;

        this.sourceData = null;
        this.scenes = {};
        this.globalActions = {};
        this.currentScene = null;
        this.items = {};
        this.variables = {};

        this.getName = () => {
            return 'MainGame';
        }

        this.getActions = (actionName) => {
            var result = _.has(this.globalActions, actionName);

            if (!result) {
                throw `[MISSING ACTION] The action '${actionName}' cannot be find.`;
            }

            return this.globalActions[actionName];
        }

        this.start = () => {
            return this.dataProvider.fetchData()
            .then((data) => {
                this.sourceData = data;

                CheckData.checkKeys(
                    this.sourceData,
                    [
                        'startScene',
                        'scenes',
                        'items',
                        'globalActions',
                        'variables',
                    ],
                    true,
                    this.getName()
                );

                backgroundColor = this.sourceData.backgroundColor || 'black';

                // init actions
                _.each(this.sourceData.globalActions, (actionData, key) => {
                    CheckData.checkKeys(actionData, ['actions'], true,
                        this.getName() + ` - globalActions - ${key}`);

                    this.globalActions[key] = [];
                });

                // init scenes
                _.each(this.sourceData.scenes, (sceneData, key) => {
                    this.scenes[key] = {};
                });

                // Init Items
                _.each(this.sourceData.items, (item, key) => {
                    this.items[key] = {};
                });

                // init variables
                _.each(this.sourceData.variables, (variable, key) => {
                    this.variables[key] = {};
                });


                // create Global Actions
                 _.each(this.sourceData.globalActions, (actionData, key) => {
                    _.each(actionData.actions, (action, index) => {
                        this.globalActions[key].push(new Action(this, `${key}-${index}` ,action));
                    });
                });
                ////

                // Create scenes
                _.each(this.sourceData.scenes, (sceneData, key) => {
                    this.scenes[key] = new Scene(this, key, sceneData);
                });
                CheckData.checkKeys(this.scenes, [this.sourceData.startScene], true,
                    `The scenes are missing first scene named '${this.sourceData.startScene}'`);
                ////

                // Create items
                _.each(this.sourceData.items, (item, key) => {
                    this.items[key] = new Item(this, key, item);
                });

                // create variables
                _.each(this.sourceData.variables, (variable, key) => {
                    this.variables[key] = variable;
                });

                // initialize editor
                this.editor = new Editor(document.getElementById('editor'), {
                    gotoScene: function(scene) {
                        return changeScene(scene).then((output) => {
                            return render();
                        });
                    },
                    data: this.sourceData,
                    renderer: this.renderer,
                    render: render,
                });

                return changeScene(this.sourceData.startScene)
                    .then((output) => {
                        return render();
                    })
                    .then(() => {
                        $(window).resize(_.debounce(() => {
                            render().then(()=> {
                                this.editor.render();
                            });
                        }, 500, {
                            maxWait: 1000,
                        }));

                        if ($canvas) {
                            $canvas.mousemove(_.debounce(handleCursorMove, 150, {
                                maxWait: 200,
                            }));
                            $canvas.mousedown(handleClickDown);
                            $canvas.mouseup(handleClickUp);
                        }
                        this.editor.render();
                    });
            });
        };

        this.isValidSceneKey = (sceneKey, raise=false) => {
            var result = _.has(this.scenes, sceneKey);

            if (!result && raise) {
                throw `[MISSING SCENE] The scene '${sceneKey}' cannot be find.`;
            }

            return result;
        }

        this.isValidItemKey = (itemKey, raise=false) => {
            var result = _.has(this.items, itemKey);

            if (!result && raise) {
                throw `[MISSING ITEMS] The item '${itemKey}' cannot be find.`;
            }

            return result;
        }

        this.isValidVariableName = (varName, raise=false) => {
            var result = _.has(this.variables, varName);

            if (!result && raise) {
                throw `[MISSING VARIABLE] The variable '${varName}' cannot be find.`;
            }

            return result;
        }

        this.isItemOwned = (itemKey) => {
            this.isValidItemKey(itemKey, true);
            return this.items[itemKey].owned;
        }

        this.getVariable = (varName) => {
            this.isValidVariableName(varName, true);
            return this.variables[varName];
        }

        var resetCanvas = () => {
            var canvas = this.renderer.getCanvas();
            var context = this.renderer.getContext();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        var changeScene = (sceneKey) => {
            if(!this.scenes[sceneKey]) {
                this.scenes[sceneKey] = new Scene(this, sceneKey, this.sourceData.scenes[sceneKey]);
            }

            this.isValidSceneKey(sceneKey, true);

            this.currentScene = this.scenes[sceneKey];
            this.mouse.defaultCursor();
            return Promise.resolve({
                render: true,
            });
        }

        var takeItem = (itemKey) => {
            this.isValidItemKey(itemKey, true);
            this.items[itemKey].owned = true;
            this.mouse.updateCursor('default');
            return Promise.resolve({
                render: true,
            });
        }

        var updateVariable = (varName, varValue) => {
            this.variables[varName] = varValue;
            return Promise.resolve({
                render: true,
            });
        }

        var render = () => {
            if (!this.renderer) {
                return Promise.reject('Renderer is not defined');
            }

            resetCanvas();
            var boundingBox = canvas.getBoundingClientRect();
            offsetX = boundingBox.left;
            offsetY = boundingBox.top;

            if(this.currentScene) {
                return this.currentScene.render(this.renderer, this.mouse);
            }
        }

        var updateMousePosition = (e) => {
            mouseX = parseInt(e.clientX - offsetX);
            mouseY = parseInt(e.clientY - offsetY);
            this.mouse.registerMouseMove(mouseX, mouseY);
        }

        var handleCursorMove = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if(this.editor.active) {
                return;
            }

            updateMousePosition(e);
            return this.currentScene.handleCursorMove(this.renderer, this.mouse);
        }

        var handleClickDown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            updateMousePosition(e);
            this.mouse.registerClick();
            return this.currentScene.handleClickDown(this.renderer, this.mouse)
            .then((output) => {
                output = _.flatten(output);
                var newScene = _.find(output, 'newScene');
                var takenItems = _.filter(output, 'takeItem');
                var updateVariables = _.filter(output, 'setVariable');

                var promises = [];

                if (newScene) {
                    promises.push(changeScene(newScene.newScene));
                }
                if (takenItems && takenItems.length > 0 ) {
                    promises = _.concat(promises, _.map(takenItems, (takenItem) => {
                        return takeItem(takenItem.takeItem);
                    }));
                }
                if (updateVariables && updateVariables.length > 0) {
                    promises = _.concat(promises, _.map(updateVariables, (updateVar) => {
                        return updateVariable(
                            updateVar.setVariable.target,
                            updateVar.setVariable.value
                        );
                    }));
                }
                return Promise.all(promises);
            })
            .then((outputs) => {
                var needRender = _.find(outputs, 'render');

                if (needRender) {
                    return render();
                } else {
                    if(this.editor) {
                        this.editor.onSceneChange(this.currentScene.key);
                    }
                }

                return Promise.resolve();
            })
            .then(() => {
                if(this.editor) {
                    this.editor.onSceneChange(this.currentScene.key);
                }
            });
        }

        var handleClickUp = (e) => {
            e.preventDefault();
            e.stopPropagation();

            updateMousePosition(e);
            this.mouse.registerRelease();
            return this.currentScene.handleClickUp(this.renderer, this.mouse);
        }
    }
    return Game;
});
