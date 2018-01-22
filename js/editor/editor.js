define(function() {
    var placeHolderImage = "./assets/placeholder.svg";
    return function(div, gameInterface) {
        var game = gameInterface;
        var currentScene;
        var self = this;
        var lastInteractionSelected = null;
        var actionIndex = 0;
        var borderWidth = 3;
        var flashInterval;
        var rollOvered = null;
        var editorTab = "scenes";
        var globalActionSelected = null;
        var browseScene = false;
        var itemSelected = null;
        var selectedVariable = null;

        self.active = false;

        var availableActions = {
            'goto': function() {
                return Object.keys(game.data.scenes);
            },
            'take': function() {
                return Object.keys(game.data.items);
            },
            'setVariable': function() {
                return Object.keys(game.data.variables);
            },
        };

        function getActiveScene() {
            return game.data.scenes[currentScene];
        }

        function onSceneChange(scene) {
            if (scene !== currentScene) {
                var nextScene = game.data.scenes[scene];
                var locationDiv = document.getElementById('locationDiv');
                if (locationDiv) {
                    locationDiv.style.display = "none";
                }

                browseScene = false;
                currentScene = scene;
                selectInteraction(null);
                render();
            }
        }

        function jumpToScene(sceneName) {
            browseScene = false;
            currentScene = sceneName;
            var locationDiv = document.getElementById('locationDiv');
            if(locationDiv) {
                locationDiv.style.display = "none";
            }
            selectInteraction(null);
            render();
            game.gotoScene(currentScene).then(() => {
                render();
            });
        }

        function makeSidebarButton(sideBar, text, pressed, callback) {
            var button =  sideBar.appendChild(document.createElement('div'));
            button.innerText = text;
            button.style.fontSize = "12px";
            button.style.borderTopLeftRadius = "8px";
            button.style.borderBottomLeftRadius = "8px";
            button.style.textAlign = "right";
            if(pressed) {
                button.style.margin = "1px 1px 1px 4px";
                button.style.padding = "2px 2px 3px 15px";
                button.style.backgroundColor = "darkblue";
                button.style.color = "white";
            } else {
                button.style.margin = "1px 1px 1px 15px";
                button.style.padding = "2px 2px 3px 4px";
                button.style.backgroundColor = "aqua";
                button.style.color = "darkblue";
                button.style.cursor = "pointer";
                button.addEventListener("click", callback);
            }
            return button;
        }

        function addSidebar(div) {
            var sideBar = div.appendChild(document.createElement('div'));
            sideBar.style.borderRight = "2px solid gray";
            sideBar.style.height = "75%";

            makeSidebarButton(sideBar, "scenes", editorTab==="scenes", (e) => {
                editorTab = "scenes";
                render();
            });

            makeSidebarButton(sideBar, "actions", editorTab==="actions", (e) => {
                editorTab = "actions";
                render();
            });

            makeSidebarButton(sideBar, "items", editorTab==="items", (e) => {
                editorTab = "items";
                render();
            });

            makeSidebarButton(sideBar, "variables", editorTab==="variables", (e) => {
                editorTab = "variables";
                render();
            });
        }

        function addSceneThumbnail(div) {
            var w = game.renderer.get$Canvas().width(),
                h = game.renderer.get$Canvas().height();
            var scale = Math.min(100/w, 50/h);

            for(var s in game.data.scenes) {
                var scene = game.data.scenes[s];
                var thumbnail = div.appendChild(document.createElement("div"));
                thumbnail.style.width = w * scale +"px";
                thumbnail.style.height = h * scale + "px";
                thumbnail.style.margin = "2px";
                thumbnail.style.backgroundColor = "black";
                thumbnail.style.cursor = "pointer";
                thumbnail.style.backgroundImage = "url(" + scene.backgroundImg + ")";
                thumbnail.style.backgroundSize = "contain";
                thumbnail.style.backgroundRepeat = "no-repeat";
                thumbnail.style.cursor = "pointer";
                thumbnail.style.backgroundColor = "black";
                thumbnail.style.backgroundPosition = "center";
                thumbnail.scene = s;

                var label = thumbnail.appendChild(document.createElement("div"));
                label.style.fontSize = "11px";
                label.style.backgroundColor = "beige";
                label.style.opacity = .9;
                label.style.textAlign = "center";
                label.innerText = s;

                thumbnail.addEventListener("click", (e) => {
                    jumpToScene(e.currentTarget.scene);
                });
            }
        }

        function changeItemReference(oldName, newName) {
            for(var actionName in game.data.globalActions) {
                game.data.globalActions[actionName].actions.forEach(action => {
                    changeItemReferenceInAction(oldName, newName, action);
                });
            }
            for(var s in game.data.scenes) {
                game.data.scenes[s].interactions.forEach(interaction => {
                    interaction.actions.forEach(action => {
                        changeItemReferenceInAction(oldName, newName, action);
                    });
                });
            }
        }

        function changeItemReferenceInAction(oldName, newName, action) {
            if(typeof(action)==='object') {
                if(action.type==='take' && action.target===oldName) {
                    action.target = newName;
                }
            }
        }

        function addItemSelector(div) {
            var divItems = div.appendChild(document.createElement("div"));
            divItems.style.display = "flex";
            divItems.style.flexDirection = "column";

            var divThumbnail = divItems.appendChild(document.createElement("div"));
            divThumbnail.style.display = "flex";
            divThumbnail.style.flexWrap = "warp";
            for(var i in game.data.items) {
                var item = game.data.items[i];
                var thumbnail = divThumbnail.appendChild(document.createElement("div"));
                thumbnail.style.width = "50px";
                thumbnail.style.height = "40px";
                thumbnail.style.backgroundColor = "black";
                thumbnail.style.backgroundImage = "url(" + item.icon + ")";
                thumbnail.style.backgroundSize = "contain";
                thumbnail.style.backgroundRepeat = "no-repeat";
                thumbnail.style.backgroundPosition = "center";
                thumbnail.style.cursor = "pointer";
                thumbnail.item = i;

                var label = thumbnail.appendChild(document.createElement("div"));
                label.style.fontSize = "10px";
                label.style.backgroundColor = i===itemSelected ? "yellowgreen" : "white";
                label.style.opacity = .9;
                label.style.textAlign = "center";
                label.innerText = i;

                if(itemSelected===i) {
                    thumbnail.style.border = "2px solid green";
                    thumbnail.style.margin = "2px";
                } else {
                    thumbnail.style.margin = "4px";
                }
                thumbnail.addEventListener("click", (e) => {
                    itemSelected = itemSelected=== e.currentTarget.item
                        ? null : e.currentTarget.item;
                    render();
                });
            }

            var addItem = divThumbnail.appendChild(document.createElement("div"));
            addItem.style.fontSize = "30px";
            addItem.style.width = "50px";
            addItem.style.height = "40px";
            addItem.style.backgroundColor = "#eeeeee";
            addItem.style.cursor = "pointer";
            addItem.style.textAlign = "center";
            addItem.style.margin = "4px";
            addItem.innerText = "+";
            addItem.addEventListener("click", (e) => {
                var newName = prompt("Enter a name for the new item");
                if(newName && newName.trim()!=="") {
                    if(game.data.items[newName]) {
                        alert("The name \"" + newName + "\" already exists.")
                    } else {
                        game.data.items[newName] = {
                            description: "",
                            icon:placeHolderImage,
                        };
                        itemSelected = newName;
                        game.render();
                        render();
                    }
                }
            });

            if(itemSelected) {
                var item = game.data.items[itemSelected];
                var divItemDescription = divItems.appendChild(document.createElement("div"));
                divItemDescription.style.borderTop = "2px solid gray";
                divItemDescription.style.marginTop = "3px";
                divItemDescription.style.paddingTop = "3px";
                divItemDescription.style.display = "flex";
                divItemDescription.style.flexDirection = "row";

                var divIcon = divItemDescription.appendChild(document.createElement("div"));
                divIcon.style.width = "60px";
                divIcon.style.height = "50px";
                divIcon.style.backgroundColor = "black";
                divIcon.style.backgroundImage = "url(" + item.icon + ")";
                divIcon.style.backgroundSize = "contain";
                divIcon.style.backgroundRepeat = "no-repeat";
                divIcon.style.backgroundPosition = "center";
                divIcon.style.cursor = "pointer";

                var divUpload = divIcon.appendChild(document.createElement("div"));
                divUpload.style.width = 0;
                divUpload.style.height = 0;
                divUpload.style.overflow = "hidden";
                var input = divUpload.appendChild(document.createElement("input"));
                input.type = "file";
                input.addEventListener("change", onUploadItemIcon);
                input.setAttribute("accept", "image/*");

                divIcon.addEventListener("click", (e) => {
                    input.click();
                });

                var divInfo =  divItemDescription.appendChild(document.createElement("div"));
                divInfo.style.display = "flex";
                divInfo.style.flexDirection = "column";
                divInfo.style.width = "100%";
                divInfo.style.marginLeft = "4px";

                var itemName = divInfo.appendChild(document.createElement("div"));
                itemName.style.fontSize = "12px";
                itemName.innerText = itemSelected;

                var links = divInfo.appendChild(document.createElement('div'));
                links.style.fontSize = "12px";
                links.style.marginBottom = "4px";

                var renameLink = links.appendChild(document.createElement('span'));
                renameLink.innerText = 'rename';
                renameLink.style.cursor = "pointer";
                renameLink.style.color = "green";
                renameLink.addEventListener("click", (e) => {
                    var name = prompt("Enter a new name for this item", itemSelected);
                    if(name !== null && name.trim()!=="" && name !== itemSelected) {
                        if(game.data.items[name]) {
                            alert("This item \""+ name +"\" already exists.");
                        } else {
                            game.data.items[name] = game.data.items[itemSelected];
                            delete game.data.items[itemSelected];
                            changeItemReference(itemSelected, name);
                            itemSelected = name;
                            game.render();
                            render();
                        }
                    }
                    render();
                });

                links.appendChild(document.createElement("span")).innerText = " - ";

                var deleteLink = links.appendChild(document.createElement('span'));
                deleteLink.innerText = "delete";
                deleteLink.style.cursor = "pointer";
                deleteLink.style.color = "crimson";
                deleteLink.addEventListener("click", (e) => {
                    var answer = confirm("Delete the item \"" + itemSelected + "\"?");
                    if(answer) {
                        delete game.data.items[itemSelected];
                        changeItemReference(itemSelected, '');
                        itemSelected = null;
                        render();
                        game.render();
                    }
                });

                var itemDesc = divInfo.appendChild(document.createElement("input"));
                itemDesc.style.width = "100%";
                itemDesc.value = item.description;
                itemDesc.placeholder = "Enter a description for this item";
                itemDesc.addEventListener("change", (e) => {
                    game.data.items[itemSelected].description = e.target.value;
                    game.render();
                });
                itemDesc.addEventListener("keydown", (e) => {
                    if(e.key==="Enter") {
                        e.currentTarget.blur();
                    }
                });
            }
        }

        function addVariableEditor(div) {
            var links = div.appendChild(document.createElement('div'));
            links.style.fontSize = "12px";
            links.style.marginLeft = "4px";

            for(var varName in game.data.variables) {
                var varLink = links.appendChild(document.createElement('div'));
                varLink.style.borderRadius = "4px";
                varLink.style.margin = "1px 1px 1px 5px";
                varLink.style.padding = "1px 3px 2px 3px";
                varLink.style.cursor = "pointer";
                varLink.variable = varName;
                if(selectedVariable===varName) {
                    varLink.style.color = "navy";
                    varLink.style.backgroundColor = "snow";
                } else {
                    varLink.style.color = "navy";
                    varLink.style.backgroundColor = "snow";
                }

                var varLabel = varLink.appendChild(document.createElement('span'));
                varLabel.innerText = varName;

                var checkbox = varLink.appendChild(document.createElement('input'));
                checkbox.type = "checkbox";
                checkbox.id = varName + '_check';
                checkbox.checked = game.data.variables[varName];
                checkbox.name = varName;
                checkbox.variable = varName;
                checkbox.addEventListener("change", (e) => {
                    game.data.variables[e.target.name] =
                        e.target.checked;
                    selectedVariable = e.target.variable;
                    render();
                    game.render();
                });

                varLink.addEventListener("click", e => {
                    selectedVariable = e.target.variable;
                    render();
                    game.render();
                });

            }
        }

        function addActionSelector(div) {
            var links = div.appendChild(document.createElement('div'));
            links.style.fontSize = "12px";
            links.style.marginLeft = "4px";
            links.style.borderRight = "2px solid gray";
            links.style.height = "75%";
            links.style.textAlign = "right";

            for(var actionName in game.data.globalActions) {
                var actionLink = links.appendChild(document.createElement('div'));
                actionLink.innerText = actionName;
                actionLink.style.borderTopLeftRadius = "8px";
                actionLink.style.borderBottomLeftRadius = "8px";
                actionLink.style.cursor = "pointer";
                if(actionName===globalActionSelected) {
                    actionLink.style.color = "white";
                    actionLink.style.backgroundColor = "crimson";
                    actionLink.style.margin = "1px 1px 1px 5px";
                    actionLink.style.padding = "0 2px 1px 15px";
                } else {
                    actionLink.style.color = "crimson";
                    actionLink.style.margin = "1px 1px 1px 15px";
                    actionLink.style.padding = "0 2px 1px 5px";
                    actionLink.style.backgroundColor = "mistyrose";
                }
                actionLink.action = actionName;
                actionLink.addEventListener("click", (e) => {
                    globalActionSelected = globalActionSelected === e.target.action
                        ? null : e.target.action;
                    actionIndex = -1;
                    render();
                });
            }

            var createAction = links.appendChild(document.createElement('div'));
            createAction.style.marginTop = "4px";
            createAction.innerText = "new action";
            createAction.style.cursor = "pointer";
            createAction.style.color = "blue";
            createAction.style.textAlign = "center";
            createAction.addEventListener("click", (e) => {
                var name = prompt("Enter a name for this action", '');
                if(name !== null && name.trim()!=="") {
                    if(game.data.globalActions[name]) {
                        alert("The action \""+name+"\" already exists.");
                    } else {
                        game.data.globalActions[name] = {
                            actions: [],
                            backgroundImg: placeHolderImage,
                            name: name,
                        };
                        globalActionSelected = name;
                        actionIndex = -1;
                        render();
                    }
                }
            });
        }

        function addSceneSelector(div) {
            var scene = getActiveScene();

            if(scene && !scene.backgroundImg) {
                scene.backgroundImg = placeHolderImage;
            }
            var w = game.renderer.get$Canvas().width(),
                h = game.renderer.get$Canvas().height();
            var scale = Math.min(100/w, 50/h);

            var sceneDiv =  div.appendChild(document.createElement('div'));
            sceneDiv.style.display = "flex";
            sceneDiv.style.flexDirection = "column";
            sceneDiv.style.alignItems = "center";
            sceneDiv.style.justifyContent = "center";
            sceneDiv.style.width = "120px";

            var backgroundDiv = sceneDiv.appendChild(document.createElement('div'));
            backgroundDiv.id = "backgroundDiv";
            backgroundDiv.style.width = w * scale +"px";
            backgroundDiv.style.height = h * scale + "px";
            backgroundDiv.style.backgroundImage = "url(" + scene.backgroundImg + ")";
            backgroundDiv.style.backgroundSize = "contain";
            backgroundDiv.style.backgroundRepeat = "no-repeat";
            backgroundDiv.style.cursor = "pointer";
            backgroundDiv.style.backgroundColor = "black";
            backgroundDiv.style.backgroundPosition = "center";

            var divUpload = backgroundDiv.appendChild(document.createElement("div"));
            divUpload.style.width = 0;
            divUpload.style.height = 0;
            divUpload.style.overflow = "hidden";
            var input = divUpload.appendChild(document.createElement("input"));
            input.type = "file";
            input.addEventListener("change", onUploadBackground);
            input.setAttribute("accept", "image/*");

            backgroundDiv.addEventListener("click", () => {
                input.click();
            });


            var select = sceneDiv.appendChild(document.createElement('select'));
            select.style.margin = "4px 0 0";
            for(var sceneId in game.data.scenes) {
                var option = select.appendChild(document.createElement('option'));
                option.value = sceneId;
                option.innerText = sceneId;
                option.selected = sceneId === currentScene;
            }

            select.addEventListener("change", (e) => {
                jumpToScene(e.currentTarget.value);
            });

            var links = sceneDiv.appendChild(document.createElement('div'));
            links.style.fontSize = "12px";

            var startLink = links.appendChild(document.createElement('div'));
            if (game.data.startScene !== currentScene) {
                startLink.innerText = "make starting scene";
                startLink.style.cursor = "pointer";
                startLink.style.color = "green";
                startLink.addEventListener("click", (e) => {
                    game.data.startScene = currentScene;
                    render();
                    game.render();
                });
            } else {
                startLink.style.color = "gray";
                startLink.innerText = "starting scene";
            }

            var createLink = links.appendChild(document.createElement('div'));
            createLink.innerText = "new scene";
            createLink.style.cursor = "pointer";
            createLink.style.color = "blue";
            createLink.addEventListener("click", (e) => {
                var name = prompt("Enter a name for this scene", '');
                if(name !== null && name.trim()!=="") {
                    game.data.scenes[name] = {
                        interactions: [],
                        backgroundImg: placeHolderImage,
                        name: name,
                    };
                    jumpToScene(name);
                }
            });

            if (sceneCount() > 1) {
                var deleteLink = links.appendChild(document.createElement('div'));
                deleteLink.innerText = "delete scene";
                deleteLink.style.cursor = "pointer";
                deleteLink.style.color = "crimson";
                deleteLink.addEventListener("click", (e) => {
                    var answer = confirm("Delete the scene \"" + currentScene + "\"?");
                    if(answer) {
                        delete game.data.scenes[currentScene];
                        if(currentScene === game.data.startScene) {
                            game.data.startScene = firstScene();
                        }
                        jumpToScene(game.data.startScene);
                    }
                });
            }
        }

        function firstScene() {
            for(var s in game.data.scenes) {
                return s;
            }
            return null;
        }

        function sceneCount() {
            var count = 0;
            for(var s in game.data.scenes) {
                count++;
            }
            return count;
        }

        function flashLocation(div, borderWidth, flash) {
            var hilight = true;
            return setInterval(() => {
                hilight = !hilight;
                div.style.border = borderWidth +"px solid "+(hilight?"white":"black");
            }, flash);
        }

        function updateLocations(div) {
            var scene = getActiveScene();
            var interactions = scene.interactions;
            for(var i=0; i<interactions.length; i++) {
                var interaction = interactions[i];
                var location = interaction.location;
                var d = div.appendChild(document.createElement('div'));
                d.style.backgroundColor = interaction===lastInteractionSelected ? 'yellow' : 'silver';
                d.style.position = "absolute";
                var topLeft, bottomRight;
                var topOffset = game.renderer.getCanvas().offsetTop;

                if(location.shape==='square' || location.shape==='icon') {
                    topLeft = game.renderer.convertCoordonateToBackground(location.description.topLeftCorner);
                    bottomRight = game.renderer.convertCoordonateToBackground(location.description.bottomRightCorner);
                }
                if(location.shape==='circle') {
                    var center = game.renderer.convertCoordonateToBackground(
                        location.description.center
                    );
                    var radius = game.renderer.convertValueToBackground(location.description.radius);
                    topLeft = {x:center.x - radius, y:center.y - radius};
                    bottomRight = {x:center.x + radius, y:center.y + radius};
                }

                if(topLeft && bottomRight) {
                    d.style.opacity = .5;
                    d.style.left = (topLeft.x - borderWidth) + 'px';
                    d.style.top = (topLeft.y + topOffset - borderWidth) + 'px';
                    d.style.width = (bottomRight.x - topLeft.x) + 'px';
                    d.style.height = (bottomRight.y - topLeft.y) + 'px';
                    d.style.border = interaction===lastInteractionSelected
                        ? borderWidth +"px solid white" : borderWidth +"px solid black";
                    d.style.cursor = "pointer";
                    d.interactionBox = true;
                    d.interaction = interaction;
                    d.addEventListener("mousedown", selectLocation);
                    d.addEventListener('mouseover', (e) => {
                        if(rollOvered !== e.currentTarget.interaction) {
                            rollOvered = e.currentTarget.interaction;
                            render();
                        }
                    });
                    d.addEventListener('mouseout', (e) => {
                        if(rollOvered === e.currentTarget.interaction) {
                            rollOvered = null;
                            render();
                        }
                    });


                    if(interaction===lastInteractionSelected) {
                        flashInterval = flashLocation(d, borderWidth, 100);
                    } else if (interaction===rollOvered) {
                        flashInterval = flashLocation(d, borderWidth, 50);
                    }
                }
            }
        }

        var divOffset = {x:0,y:0, selection: null, cornerDragged: null, originalSize: null};
        function selectLocation(e) {
            var d = e.currentTarget;
            d.style.border = borderWidth + "px solid yellow";
            divOffset.x = d.offsetLeft - e.clientX;
            divOffset.y = d.offsetTop - e.clientY;
            divOffset.cornerDragged = getCorner(e);
            divOffset.originalSize = {
                x: d.offsetLeft, y: d.offsetTop,
                width: d.offsetWidth, height: d.offsetHeight,
            };
            divOffset.selection = d;
            d.style.cursor = "move";
        }

        function showEditIcon(div, src, makeActive) {
            div = div.appendChild(document.createElement("div"));
            var img = div.appendChild(document.createElement('img'));
            img.src = src;
            img.style.width = "20px"; img.style.height = "20px";
            img.style.cursor = "pointer";
            img.style.margin = "2px";
            img.addEventListener("click", () => {
                self.active = makeActive;
                render();
            });
            div.append(img);
        }

        function showSceneEditor(divContainer, divRow, activeChange) {
            if(!browseScene) {
                var divLeft = divRow.appendChild(document.createElement('div'));
                addSceneSelector(divLeft);

                var divRight = divRow.appendChild(document.createElement('div'));
                addInteractionEditor(divRight);

                var divMore = divRow.appendChild(document.createElement('div'));
                divMore.style.marginLeft = '20px';
                addActionEditor(divMore);

                var postUpdate = () => {
                    var locationDiv = divContainer.appendChild(document.createElement('div'));
                    locationDiv.id="locationDiv";
                    updateLocations(locationDiv);
                    game.render();
                };

                if(activeChange) {
                    setTimeout(postUpdate, 510);
                } else {
                    postUpdate();
                }
            } else {
                var divThumbnail = divRow.appendChild(document.createElement('div'));
                divThumbnail.style.display = "flex";
                divThumbnail.style.flexWrap = "warp";
                addSceneThumbnail(divThumbnail)
            }
        }

        function showActionsEditor(divContainer, divRow, activeChange) {
            var divLeft = divRow.appendChild(document.createElement('div'));
            addActionSelector(divLeft);

            var divRight = divRow.appendChild(document.createElement('div'));
            addActionEditor(divRight);

            var postUpdate = () => {
                var locationDiv = divContainer.appendChild(document.createElement('div'));
                locationDiv.id="locationDiv";
                updateLocations(locationDiv);
                game.render();
            };

            if(activeChange) {
                setTimeout(postUpdate, 510);
            } else {
                postUpdate();
            }
        }

        function showItemsEditor(divContainer, divRow, activeChange) {
            var divLeft = divRow.appendChild(document.createElement('div'));
            divLeft.style.paddingLeft = "8px";
            divLeft.style.width = "85%";
            addItemSelector(divLeft);

            var postUpdate = () => {
                var locationDiv = divContainer.appendChild(document.createElement('div'));
                locationDiv.id="locationDiv";
                updateLocations(locationDiv);
                game.render();
            };

            if(activeChange) {
                setTimeout(postUpdate, 510);
            } else {
                postUpdate();
            }
        }

        function showVariablesEditor(divContainer, divRow, activeChange) {
            var divLeft = divRow.appendChild(document.createElement('div'));
            addVariableEditor(divLeft);

            var divRight = divRow.appendChild(document.createElement('div'));

            var postUpdate = () => {
                var locationDiv = divContainer.appendChild(document.createElement('div'));
                locationDiv.id="locationDiv";
                updateLocations(locationDiv);
                game.render();
            };

            if(activeChange) {
                setTimeout(postUpdate, 510);
            } else {
                postUpdate();
            }
        }

        function showBreadcrumb(div) {
            var breadCrumbDiv =  div.appendChild(document.createElement('div'));
            breadCrumbDiv.style.margin = "4px";
            breadCrumbDiv.style.fontSize = "12px";

            var editorSpan = breadCrumbDiv.appendChild(document.createElement('span'));
            editorSpan.innerText = editorTab;

            if(editorTab==='items' && itemSelected) {
                editorSpan.style.cursor = "pointer";
                editorSpan.style.color = "blue";
                editorSpan.addEventListener("click", (e) => {
                    itemSelected = null;
                    render();
                });

                breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";

                var itemSpan = breadCrumbDiv.appendChild(document.createElement('span'));
                itemSpan.innerText = itemSelected;
            }

            if(editorTab==='actions' && globalActionSelected) {
                editorSpan.style.cursor = "pointer";
                editorSpan.style.color = "blue";
                editorSpan.addEventListener("click", (e) => {
                    globalActionSelected = null;
                    actionIndex = -1;
                    render();
                });

                breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";

                var actionSpan = breadCrumbDiv.appendChild(document.createElement('span'));
                actionSpan.innerText = globalActionSelected;

                if(actionIndex >= 0) {
                    actionSpan.style.cursor = "pointer";
                    actionSpan.style.color = "blue";
                    actionSpan.addEventListener("click", (e) => {
                        actionIndex = -1;
                        render();
                    });

                    breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";

                    var selectedAction = game.data.globalActions[globalActionSelected].actions[actionIndex];
                    var stepSpan = breadCrumbDiv.appendChild(document.createElement('span'));
                    stepSpan.innerText = getActionText(selectedAction);
                }
            }

            if(editorTab==='scenes' && !browseScene) {
                editorSpan.style.cursor = "pointer";
                editorSpan.style.color = "blue";
                editorSpan.addEventListener("click", (e) => {
                    browseScene = true;
                    render();
                });

                breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";
                var sceneSpan = breadCrumbDiv.appendChild(document.createElement('span'));
                sceneSpan.innerText = currentScene;

                if (lastInteractionSelected) {
                    breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";
                    sceneSpan.style.cursor = "pointer";
                    sceneSpan.style.color = "blue";
                    sceneSpan.addEventListener("click", (e) => {
                        selectInteraction(null);
                        render();
                    });

                    var interactionSpan =  breadCrumbDiv.appendChild(document.createElement('span'));
                    interactionSpan.innerText = lastInteractionSelected.name
                        || "interaction " + (getActiveScene().interactions.indexOf(lastInteractionSelected)+1);

                    if(actionIndex >= 0) {
                        interactionSpan.style.cursor = "pointer";
                        interactionSpan.style.color = "blue";
                        interactionSpan.addEventListener("click", (e) => {
                            actionIndex = -1;
                            render();
                        });

                        breadCrumbDiv.appendChild(document.createElement('span')).innerText = " > ";

                        var selectedAction = lastInteractionSelected.actions[actionIndex];
                        var actionSpan = breadCrumbDiv.appendChild(document.createElement('span'));
                        actionSpan.innerText = getActionText(selectedAction);
                    }
                }
            }
        }

        function render() {
            var activeChange = (self.active && !document.getElementById('divContainer')
                || !self.active && document.getElementById('divContainer'));

            clearInterval(flashInterval);

            if(!currentScene) {
                currentScene = game.data.startScene;
            }

            div.innerHTML = "";
            if(!self.active) {
                showEditIcon(div, "/click-and-point-editor/assets/edit.svg", true);
                div.style.height = "24px";
                div.style.position = "absolute";
                game.render();
            } else {
                div.style.height = "140px";
                div.style.position = "";

                var divHeader =  div.appendChild(document.createElement('div'));
                divHeader.style.display = "flex";
                divHeader.style.flexDirection = "row";
                showEditIcon(divHeader, "/click-and-point-editor/assets/close.svg", false);
                showBreadcrumb(divHeader)

                var divContainer = div.appendChild(document.createElement('div'));
                divContainer.id = "divContainer";
                divContainer.style.width = "100vw";

                var divRow = div.appendChild(document.createElement('div'));
                divRow.style.display = "flex";
                divRow.style.flexDirection = "row";

                var divSidebar = divRow.appendChild(document.createElement('div'));
                addSidebar(divSidebar);

                switch(editorTab) {
                    case 'scenes':
                        showSceneEditor(divContainer, divRow, activeChange);
                        break;
                    case 'actions':
                        showActionsEditor(divContainer, divRow, activeChange);
                        break;
                    case 'items':
                        showItemsEditor(divContainer, divRow, activeChange);
                        break;
                    case 'variables':
                        showVariablesEditor(divContainer, divRow, activeChange);
                        break;
                }
            }
        }
        var shapes = ['circle','square','icon'];

        function onUpload(e) {
            var uploader = e.currentTarget;
            if (uploader.files && uploader.files[0]) {
                var reader = new FileReader();
                reader.addEventListener('load', onFileRead);
                reader.readAsDataURL(uploader.files[0]);
            }
        }

        function onFileRead(e) {
            var reader = e.currentTarget;
            if(lastInteractionSelected) {
                lastInteractionSelected.location.description.image = reader.result;
                render();
                game.render();
            }
        }

        function onUploadBackground(e) {
            var uploader = e.currentTarget;
            if (uploader.files && uploader.files[0]) {
                var reader = new FileReader();
                reader.addEventListener('load', onFileReadBackground);
                reader.readAsDataURL(uploader.files[0]);
            }
        }

        function onUploadItemIcon(e) {
            var uploader = e.currentTarget;
            if (uploader.files && uploader.files[0]) {
                var reader = new FileReader();
                reader.addEventListener('load', onFileReadItemIcon);
                reader.readAsDataURL(uploader.files[0]);
            }
        }

        function onFileReadItemIcon(e) {
            var reader = e.currentTarget;
            if(itemSelected) {
                game.data.items[itemSelected].icon = reader.result;
                render();
                game.render();
            }
        }

        function onFileReadBackground(e) {
            var reader = e.currentTarget;
            var scene = getActiveScene();
            scene.backgroundImg = reader.result;
            var img = new Image();
            img.addEventListener("load", () => {
                var previousWidth = game.renderer.getBackgroundRatio().width;
                game.render().then(()=> {
                    var wRatio = previousWidth/game.renderer.getBackgroundRatio().width;
                    for(var s in game.data.scenes) {
                        var scene = game.data.scenes[s];
                        scene.interactions.forEach(interaction => {
                            if(interaction.location.shape==='circle') {
                                interaction.location.description.center.x *= wRatio;
                                interaction.location.description.center.y *= wRatio;
                                interaction.location.description.radius *= wRatio;
                            } else {
                                interaction.location.description.bottomRightCorner.x *= wRatio;
                                interaction.location.description.bottomRightCorner.y *= wRatio;
                                interaction.location.description.topLeftCorner.x *= wRatio;
                                interaction.location.description.topLeftCorner.y *= wRatio;
                            }
                        });
                    }

                    render();
                });
            });
            img.src = scene.backgroundImg;
        }

        function getActionText(action) {
            return typeof(action)==='string'
                    ? action
                    : action.useRef
                        ? action.ref
                        : action.type
                        +" "
                        + action.target
                        + (action.type==='setVariable'
                                ?" = "+ (action.value.toString().toUpperCase())
                                :'');
        }

        function addActionEditor(div) {
            var selectedActionDiv = null;
            var actionViewed = editorTab === 'scenes'
                ? lastInteractionSelected
                : editorTab === 'actions'
                ? game.data.globalActions[globalActionSelected]
                : null;

            if(actionViewed) {
                var actionDiv = div.appendChild(document.createElement('div'));
                actionDiv.style.backgroundColor = "#dddddd";
                actionDiv.style.padding = "3px 5px";
                
                for(var i=0; i<actionViewed.actions.length; i++) {
                    var singleAction = actionDiv.appendChild(document.createElement('div'));
                    singleAction.innerText = (i+1) + " - " + getActionText(actionViewed.actions[i]);
                    singleAction.style.backgroundColor = actionIndex===i ? 'DarkOrange' : 'beige';
                    singleAction.style.borderTopLeftRadius = '4px';
                    singleAction.style.borderTopRightRadius = '4px';
                    if (actionIndex !== i) {
                        singleAction.style.borderBottomLeftRadius = "4px";
                        singleAction.style.borderBottomRightRadius = "4px";
                    }

                    singleAction.style.padding = "1px 4px 1px 2px";
                    singleAction.style.marginTop = "2px";
                    singleAction.style.fontSize = "9pt";
                    singleAction.style.color = actionIndex===i ? "white":"DarkOrange";
                    singleAction.style.cursor = "pointer";
                    singleAction.index = i;
                    singleAction.addEventListener("click", (e) => {
                        actionIndex = actionIndex===e.currentTarget.index?-1:e.currentTarget.index;
                        render();
                    });
                    if(actionIndex === i) {
                        selectedActionDiv = singleAction;
                    }
                }

                if(selectedActionDiv) {
                    var selectedAction = actionViewed.actions[actionIndex];
                    var actionEditDiv =  actionDiv.insertBefore(document.createElement('div'), selectedActionDiv.nextSibling);
                    actionEditDiv.style.backgroundColor = "moccasin";
                    actionEditDiv.style.borderBottomLeftRadius = "4px";
                    actionEditDiv.style.borderBottomRightRadius = "4px";
                    actionEditDiv.style.padding = "1px 3px 1px";

                    var radioGroup1 = actionEditDiv.appendChild(document.createElement('div'));
                    var radioAction1 = radioGroup1.appendChild(document.createElement('input'));
                    radioAction1.type = 'radio';
                    radioAction1.id = "radioAction1";
                    radioAction1.name = "action";
                    radioAction1.value = "namedAction";
                    radioAction1.checked = typeof(selectedAction)==='string' || selectedAction.useRef;
                    if(!radioAction1.checked) {
                        radioAction1.addEventListener("click", (e) => {
                            if(!selectedAction.ref) {
                                for(var actionName in game.data.globalActions) {
                                    if(editorTab !== 'actions' || actionName !== globalActionSelected) {
                                        selectedAction.ref = actionName;
                                        break;
                                    }
                                }
                            }
                            if(selectedAction.ref) {
                                selectedAction.useRef = true;
                            }
                            render();
                            game.render();
                        });
                    }

                    var actionSelect = radioGroup1.appendChild(document.createElement('select'));
                    actionSelect.for = "radioAction1";
                    actionSelect.style.backgroundColor = radioAction1.checked ? "" : "silver";
                    actionSelect.disabled = !radioAction1.checked;

                    for(var actionName in game.data.globalActions) {
                        if(editorTab === 'actions' && actionName === globalActionSelected) {
                            continue;
                        }

                        var option = actionSelect.appendChild(document.createElement('option'));
                        option.value = actionName;
                        option.innerText = actionName;
                        option.selected = actionName === selectedAction
                            || typeof(selectedAction)==='object' && actionName === selectedAction.ref;
                    }

                    var option = actionSelect.appendChild(document.createElement('option'));
                    option.value = '';
                    option.innerText = "[ new global action ]";

                    actionSelect.addEventListener("change", (e) => {
                        var actionName = e.currentTarget.value;
                        if(actionName === '') {
                            var name = prompt("Enter a name for this action", '');
                            if(name !== null && name.trim()!=="") {
                                if(game.data.globalActions[name]) {
                                    if(name !== globalActionSelected) {
                                        actionName = name;
                                    }
                                } else {
                                    game.data.globalActions[name] = {
                                        actions: [],
                                        backgroundImg: placeHolderImage,
                                        name: name,
                                    };
                                    actionName = name;
                                }
                            }
                        }

                        if(actionName !== '') {
                            if(typeof(selectedAction)==='string') {
                                actionViewed.actions[actionIndex] = actionName;
                            } else {
                                selectedAction.ref = actionName;
                            }
                            game.render();
                        }
                        render();
                    });

                    var radioGroup2 = actionEditDiv.appendChild(document.createElement('div'));
                    radioGroup2.style.display = "flex";
                    radioGroup2.style.flexDirection = "row";
                    var radioAction2 = radioGroup2.appendChild(document.createElement('input'));
                    radioAction2.type = 'radio';
                    radioAction2.id = "radioAction2";
                    radioAction2.name = "action";
                    radioAction2.value = "namedAction";
                    radioAction2.checked = typeof(selectedAction)!=='string' && !selectedAction.useRef;
                    if (!radioAction2.checked) {
                        radioAction2.addEventListener("click", (e) => {
                            if(typeof(selectedAction)==='string') {
                                selectedAction = actionViewed.actions[actionIndex] = {
                                    ref: selectedAction,
                                };
                            }
                            delete selectedAction.useRef;
                            if(!selectedAction.type) {
                                selectedAction.type = 'goto';
                            }
                            var availableTargets = availableActions[selectedAction.type]();
                            if(availableTargets.indexOf(selectedAction.target)<0) {
                                selectedAction.target = availableTargets[0];
                            }
                            if(selectedAction.type==='setVariable' && typeof(selectedAction.value)==='undefined') {
                                selectedAction.value = true;
                            }

                            render();
                            game.render();
                        });
                    }

                    var actionTypeSelect = radioGroup2.appendChild(document.createElement('select'));
                    actionTypeSelect.for = "radioAction2";
                    actionTypeSelect.style.backgroundColor = radioAction2.checked ? "" : "silver";
                    actionTypeSelect.disabled = !radioAction2.checked;

                    for(var type in availableActions) {
                        var option = actionTypeSelect.appendChild(document.createElement('option'));
                        option.value = type;
                        option.innerText = type;
                        option.selected = typeof(selectedAction)==='object' && selectedAction.type === type;
                    }

                    actionTypeSelect.addEventListener("change", (e) => {
                        if(e.currentTarget.value !== '' && e.currentTarget.value !== selectedAction.type) {
                            selectedAction.type = e.currentTarget.value;
                            var availableTargets = availableActions[e.currentTarget.value]();
                            if(selectedAction.target !== '' && availableTargets.indexOf(selectedAction.target)<0) {
                                selectedAction.target = availableTargets[0];
                            }
                            if(selectedAction.type==='setVariable' && typeof(selectedAction.value)==='undefined') {
                                selectedAction.value = true;
                            }
                            game.render();
                            render();
                        }
                    });

                    var actionTargetSelect = radioGroup2.appendChild(document.createElement('select'));
                    actionTargetSelect.for = "radioAction2";
                    actionTargetSelect.style.backgroundColor = radioAction2.checked ? "" : "silver";
                    actionTargetSelect.disabled = !radioAction2.checked;

                    var availableTargets = availableActions[actionTypeSelect.value]();
                    for(var i=0; i<availableTargets.length; i++) {
                        var target = availableTargets[i];
                        var option = actionTargetSelect.appendChild(document.createElement('option'));
                        option.value = target;
                        option.innerText = target;
                        option.selected = typeof(selectedAction)==='object' && selectedAction.target === target;
                    }
                    if(actionTypeSelect.value === 'take') {
                        var option = actionTargetSelect.appendChild(document.createElement('option'));
                        option.value = '';
                        option.innerText = "[ new item ]";
                    } else if(actionTypeSelect.value === 'goto') {
                        var option = actionTargetSelect.appendChild(document.createElement('option'));
                        option.value = '';
                        option.innerText = "[ new scene ]";
                    }

                    actionTargetSelect.addEventListener("change", (e) => {
                        if(e.currentTarget.value === '') {
                            if(actionTypeSelect.value === 'take') {
                                var newName = prompt("Enter a name for the new item");
                                if(newName && newName.trim()!=="") {
                                    if(game.data.items[newName]) {
                                        selectedAction.target = newName;
                                    } else {
                                        game.data.items[newName] = {
                                            description: "",
                                            icon:placeHolderImage,
                                        };
                                        selectedAction.target = newName;
                                        game.render();
                                        render();
                                    }
                                }
                            } else if(actionTypeSelect.value === 'goto') {
                                var newName = prompt("Enter a name for the new scene");
                                if(newName && newName.trim()!=="") {
                                    if(game.data.scenes[newName]) {
                                        selectedAction.target = newName;
                                    } else {
                                        game.data.scenes[newName] = {
                                            interactions: [],
                                            backgroundImg: placeHolderImage,
                                            name: newName,
                                        };
                                        selectedAction.target = newName;
                                        game.render();
                                        render();
                                    }
                                }
                            }
                        } else if(e.currentTarget.value !== selectedAction.target) {
                            selectedAction.target = e.currentTarget.value;
                            render();
                            game.render();
                        }
                    });

                    if(actionTypeSelect.value==='setVariable') {
                        var checkbox = radioGroup2.appendChild(document.createElement('input'));
                        checkbox.type = "checkbox";
                        checkbox.for = "radioAction2";
                        checkbox.style.backgroundColor = radioAction2.checked ? "" : "silver";
                        checkbox.disabled = !radioAction2.checked;
                        checkbox.checked = selectedAction.value;
                        checkbox.addEventListener("change", (e) => {
                            selectedAction.value = e.currentTarget.checked;
                            render();
                            game.render();
                        });
                    }

                    var links = actionEditDiv.appendChild(document.createElement("div"));
                    links.style.fontSize = "12px";
                    links.style.marginTop = "1px";

                    var moveUpLink = links.appendChild(document.createElement("span"));
                    moveUpLink.innerText = "move up";
                    if(actionIndex > 0) {
                        moveUpLink.style.cursor = "pointer";
                        moveUpLink.style.color = "blue";
                        moveUpLink.addEventListener("click", (e) => {
                            var previous = actionIndex - 1;
                            var temp = actionViewed.actions[previous];
                            actionViewed.actions[previous] = actionViewed.actions[actionIndex];
                            actionViewed.actions[actionIndex] = temp;
                            actionIndex = previous;
                            game.render();
                            render();
                        });
                    } else {
                        moveUpLink.style.color = "white";
                    }

                    links.appendChild(document.createElement("span")).innerText = " - ";

                    var moveDownLink = links.appendChild(document.createElement("span"));
                    moveDownLink.innerText = "move down";
                    if(actionIndex < actionViewed.actions.length-1) {
                        moveDownLink.style.cursor = "pointer";
                        moveDownLink.style.color = "blue";
                        moveDownLink.addEventListener("click", (e) => {
                            var next = actionIndex + 1;
                            var temp = actionViewed.actions[next];
                            actionViewed.actions[next] = actionViewed.actions[actionIndex];
                            actionViewed.actions[actionIndex] = temp;
                            actionIndex = next;
                            game.render();
                            render();
                        });
                    } else {
                        moveDownLink.style.color = "white";
                    }

                    links.appendChild(document.createElement("span")).innerText = " - ";

                    var deleteActionLink = links.appendChild(document.createElement("span"));
                    deleteActionLink.innerText = "remove step";
                    if(actionViewed.actions.length > 1) {
                        deleteActionLink.style.cursor = "pointer";
                        deleteActionLink.style.color = "crimson";
                        deleteActionLink.addEventListener("click", (e) => {
                            var answer = confirm("Delete the action \"" + (
                                getActionText(actionViewed.actions[actionIndex])
                            ) + "\"?");
                            if (answer) {
                                actionViewed.actions.splice(actionIndex);
                                actionIndex = -1;
                                game.render();
                                render();
                            }
                        });
                    } else {
                        deleteActionLink.style.color = "white";
                    }

                } else {
                    var createActionLink = actionDiv.appendChild(document.createElement("div"));
                    createActionLink.style.marginTop = "3px";
                    createActionLink.style.fontSize = "12px";
                    createActionLink.innerText = "add step";
                    createActionLink.style.cursor = "pointer";
                    createActionLink.style.color = "blue";
                    createActionLink.addEventListener("click", (e) => {
                        actionViewed.actions.push(defaultAction());
                        actionIndex = actionViewed.actions.length-1;
                        game.render();
                        render();
                    });
                }
/*
                if(actionIndex < 0 && editorTab!=='actions') {
                    var createGlobal = div.appendChild(document.createElement('input'));
                    createGlobal.type="button";
                    createGlobal.style.marginTop = "2px";
                    createGlobal.style.borderRadius = "5px";
                    createGlobal.value = "Create global action";
                    createGlobal.addEventListener("click", (e) => {
                        var name = prompt("This will turn those steps into a global action.\nEnter a name for the global action", "");
                        if(name) {
                            if(name.trim() === '') {
                                alert("The global action requires a name");
                            } else {
                                var nameCollide = false;
                                for(var action in game.data.globalActions) {
                                    if(action===name) {
                                        nameCollide = true;
                                    }
                                }

                                var accept = true;
                                if(nameCollide) {
                                    for(var i=0; i<actionViewed.actions.length;i++) {
                                        var action = actionViewed.actions[i];
                                        var actionName = typeof(action)==='string'
                                            ? action
                                            : action.useRef
                                            ? action.ref
                                            : null;
                                        if(name === actionName) {
                                            accept = false;
                                            alert("An action cannot contain itself");
                                            break;
                                        }
                                    }
                                    if(accept) {
                                        accept = confirm("Action \"" + name + "\" already exists.\nDo you want to overwrite it?");
                                    }
                                }

                                if(accept) {
                                    game.data.globalActions[name] = {
                                        actions: actionViewed.actions,
                                    };
                                    actionViewed.actions = [
                                        name,
                                    ];
                                }
                            }
                        }
                    });
                }
                */
            }
        }

        function defaultAction() {
            return {
                type: 'goto',
                target: game.data.startScene,
            };
        }

        function selectInteraction(interaction) {
            if(lastInteractionSelected !== interaction) {
                lastInteractionSelected = interaction;
                actionIndex = -1;
                rollOvered = null;
                render();
            }
        }

        function addInteractionEditor(div) {
            var scene = getActiveScene();
            var interactions = scene.interactions;
            var interactionSelect = div.appendChild(document.createElement('select'));
            interactionSelect.id = "interactionSelect";
            interactionSelect.style.margin = "4px 0";
            for(var i=-1; i<interactions.length; i++) {
                var option = interactionSelect.appendChild(document.createElement('option'));
                var interaction = i>=0 ? interactions[i] : null;
                option.value = i;
                option.innerText = !interaction ? "Select an interaction" : interaction.name || "interaction " + (i+1);
                option.selected = lastInteractionSelected === interaction;
            }
            interactionSelect.addEventListener("change", (e) => {
                selectInteraction(interactions[e.currentTarget.value]);
                render();
            });

            var divInteractionRow = div.appendChild(document.createElement("div"));
            divInteractionRow.style.display = "flex";
            divInteractionRow.style.flexDirection = "row";

            if(!lastInteractionSelected) {
                var linksDiv = divInteractionRow.appendChild(document.createElement("div"));
                linksDiv.style.fontSize = "12px";
                for(var i=0; i<interactions.length; i++) {
                    var link = linksDiv.appendChild(document.createElement("div"));
                    var interaction = interactions[i];
                    link.innerText = interaction.name || "interaction " + (i+1);
                    link.style.cursor = "pointer";
                    link.style.color = interaction===rollOvered?"teal" : "blue";
                    link.interaction = interaction;
                    link.addEventListener("click", (e) => {
                        selectInteraction(e.currentTarget.interaction);
                        render();
                    });
                    link.addEventListener('mouseover', (e) => {
                        if(rollOvered !== e.currentTarget.interaction) {
                            rollOvered = e.currentTarget.interaction;
                            render();
                        }
                    });
                    link.addEventListener('mouseout', (e) => {
                        if(rollOvered === e.currentTarget.interaction) {
                            rollOvered = null;
                            render();
                        }
                    });
                }

                var createLink = linksDiv.appendChild(document.createElement("div"));
                createLink.style.marginTop = "5px";
                createLink.innerText = "create interaction";
                createLink.style.cursor = "pointer";
                createLink.style.color = "blue";
                createLink.addEventListener("click", (e) => {
                    var scene = getActiveScene();
                    var w = game.renderer.get$Canvas().width(),
                        h = game.renderer.get$Canvas().height();

                    var radius = game.renderer.convertBackgroundToValue(w/20);
                    var coordinate = game.renderer.convertBackgroundToCoordinate({
                        x: w/2 + (Math.random()-.5)*w/2, y: h/2 + (Math.random()-.5)*h/2,
                    });

                    scene.interactions.push({
                        actions: [
                            defaultAction(),
                        ],
                        hidden: false,
                        location: {
                            shape: "circle",
                            description: {
                                radius,
                                center: coordinate,
                            },
                        },
                    });

                    selectInteraction(scene.interactions[scene.interactions.length-1]);
                    game.render();
                    render();
                });

            } else {
                var renamelink = div.insertBefore(document.createElement('span'), interactionSelect.nextSibling);
                renamelink.style.cursor = "pointer";
                renamelink.style.color = "blue";
                renamelink.style.fontSize = "12px";
                renamelink.style.marginLeft = "2px";
                renamelink.innerText="rename";
                renamelink.addEventListener("click", (e) => {
                    var newName = prompt("Enter a name for this interaction",
                        lastInteractionSelected.name || '');
                    if(newName !== null) {
                        lastInteractionSelected.name = newName;
                    }
                    render();
                });


                var divIcon = divInteractionRow.appendChild(document.createElement("div"));
                divIcon.style.margin = "4px";
                divIcon.style.padding = "2px";
                divIcon.style.backgroundColor = "#eeeeee";
                divIcon.style.display = "flex";
                divIcon.style.flexDirection = "column";
                divIcon.style.alignItems = "center";
                divIcon.style.justifyContent = "center";

                switch(lastInteractionSelected.location.shape) {
                    case "circle":
                        var circle = divIcon.appendChild(document.createElement("div"));
                        circle.style.width = "32px";
                        circle.style.height = "32px";
                        circle.style.borderRadius = "50%";
                        circle.style.border = "3px solid black";
                        circle.style.margin = "2px";
                        break;
                    case "square":
                        var square = divIcon.appendChild(document.createElement("div"));
                        square.style.width = "32px";
                        square.style.height = "32px";
                        square.style.border = "3px solid black";
                        square.style.margin = "2px";
                        break;
                    case "icon":
                        var icon = divIcon.appendChild(document.createElement("div"));
                        icon.style.width = "32px";
                        icon.style.height = "32px";
                        icon.style.border = "3px solid white";
                        icon.style.backgroundSize = "100% 100%";
                        icon.style.backgroundImage = "url(" + lastInteractionSelected.location.description.image +")";
                        icon.style.cursor = "pointer";
                        icon.style.margin = "2px";
                        var divUpload = divIcon.appendChild(document.createElement("div"));
                        divUpload.style.width = 0;
                        divUpload.style.height = 0;
                        divUpload.style.overflow = "hidden";
                        var input = divUpload.appendChild(document.createElement("input"));
                        input.type = "file";
                        input.addEventListener("change", onUpload);
                        input.setAttribute("accept", "image/*");

                        icon.addEventListener("click", () => {
                            input.click();
                        });
                        break;
                }
                var divDescription = divInteractionRow.appendChild(document.createElement("div"));
                var shapeSelect = divIcon.appendChild(document.createElement('select'));
                for(var i=0; i<shapes.length; i++) {
                    var option = shapeSelect.appendChild(document.createElement('option'));
                    option.value = shapes[i];
                    option.innerText = shapes[i];
                    option.selected = lastInteractionSelected.location.shape === shapes[i];
                }
                shapeSelect.addEventListener("change", (e) => {
                    changeShape(lastInteractionSelected.location, e.currentTarget.value);
                    game.render();
                    render();
                });

                var hiddenCheck = divDescription.appendChild(document.createElement('div'));
                var checkbox = hiddenCheck.appendChild(document.createElement("input"));
                checkbox.type = "checkbox";
                checkbox.id = "hiddenCheckbox";
                checkbox.checked = lastInteractionSelected.hidden;
                var labelCheck = hiddenCheck.appendChild(document.createElement("label"));
                labelCheck.for = "hiddenCheckbox";
                labelCheck.innerText = "hidden?";
                checkbox.addEventListener("change", () => {
                    lastInteractionSelected.hidden = checkbox.checked;
                    game.render();
                });

                var variableLabel = divDescription.appendChild(document.createElement('label'));
                variableLabel.innerText = "if:";
                variableLabel.for = "variableSelect";
                var variableSelect = divDescription.appendChild(document.createElement('select'));
                variableSelect.id = "variableSelect";

                var option = variableSelect.appendChild(document.createElement('option'));
                option.value = "";
                option.innerText = "";
                option.selected = !lastInteractionSelected.if;

                for(var v in game.data.variables) {
                    var option = variableSelect.appendChild(document.createElement('option'));
                    option.value = v;
                    option.innerText = v;
                    option.selected = v === lastInteractionSelected.if;
                }

                variableSelect.addEventListener("change", function(e) {
                    if(!e.currentTarget.value) {
                        delete lastInteractionSelected.if;
                    } else {
                        lastInteractionSelected.if = e.currentTarget.value;
                    }
                    render();
                    game.render();
                });

                var deletelink = divDescription.appendChild(document.createElement('div'));
                deletelink.style.cursor = "pointer";
                deletelink.style.color = "crimson";
                deletelink.style.fontSize = "12px";
                deletelink.innerText="delete interaction";
                deletelink.addEventListener("click", (e) => {
                    var answer = confirm("Delete the interaction \"" + (
                        lastInteractionSelected.name
                        || "interaction " + (getActiveScene().interactions.indexOf(lastInteractionSelected)+1)
                    ) + "\"?");
                    if(answer) {
                        var index = getActiveScene().interactions.indexOf(lastInteractionSelected);
                        getActiveScene().interactions.splice(index, 1);
                        lastInteractionSelected = null;
                        render();
                        game.render();
                    }
                });
            }
        }

        function changeShape(location, value) {
            var topLeft, bottomRight;
            if(location.shape==='square' || location.shape==='icon') {
                topLeft = location.description.topLeftCorner;
                bottomRight = location.description.bottomRightCorner;
            }
            if(location.shape==='circle') {
                var center = location.description.center;
                var radius = location.description.radius;
                topLeft = {x:center.x - radius, y:center.y - radius};
                bottomRight = {x:center.x + radius, y:center.y + radius};
            }

            location.shape = value;

            var previousImage = location.description.image;
            if(location.shape==='square' || location.shape==='icon') {
                location.description = {
                    topLeftCorner: topLeft,
                    bottomRightCorner: bottomRight,
                };
            }
            if(location.shape==='circle') {
                location.description = {
                    center: {
                        x: (topLeft.x + bottomRight.x) / 2,
                        y: (topLeft.y + bottomRight.y) / 2,
                    },
                    radius: (bottomRight.x - topLeft.x) / 2,
                };
            }
            if(previousImage) {
                location.description.image = previousImage;
            }
            if(location.shape==='icon' && !location.description.image) {
                location.description.image = placeHolderImage;
            }
        }

        render();

        function cornerToCursor(corner) {
            switch(corner) {
                case "nw": case "se":
                    return "nwse-resize";
                case "ne": case "sw":
                    return "nesw-resize";
                case "e": case "w":
                    return "ew-resize";
                case "n": case "s":
                    return "ns-resize";
                default:
                    return "pointer";
            }
        }

        function getCorner(e) {
            var target = e.currentTarget;
            var diffLeft = Math.abs(target.offsetLeft - e.clientX);
            var diffRight = Math.abs(target.offsetLeft + target.offsetWidth - e.clientX);
            var diffTop = Math.abs(target.offsetTop - e.clientY);
            var diffBottom = Math.abs(target.offsetTop + target.offsetHeight - e.clientY);

            if(diffLeft < 10 && diffTop < 10) {
                return "nw";
            } else if(diffRight < 10 && diffBottom < 10) {
                return "se";
            } else if(diffLeft < 10 && diffBottom < 10) {
                return "sw";
            } else if(diffRight < 10 && diffTop < 10) {
                return "ne";
            } else if(diffLeft < 10) {
                return "w";
            } else if(diffRight < 10) {
                return "e";
            } else if(diffTop < 10) {
                return "n";
            } else if(diffBottom < 10) {
                return "s";
            } else {
                return null;
            }
        }

        document.addEventListener("mousemove", function(e) {
            var x = (e.clientX + divOffset.x);
            var y = (e.clientY + divOffset.y);
            if(e.target !== game.renderer.getCanvas()) {
                if(e.target.interactionBox && e.target.interaction) {
                    if (!divOffset.cornerDragged && !divOffset.selection) {
                        e.target.style.cursor = cornerToCursor(getCorner(e));
                    }
                }
            }

            if(divOffset.selection && e.buttons) {
                var d = divOffset.selection;

                if(divOffset.cornerDragged) {
                    var oppositeX, oppositeY;
                    switch(divOffset.cornerDragged) {
                        case "nw":
                            oppositeX = d.offsetLeft + d.offsetWidth - borderWidth*2;
                            oppositeY = d.offsetTop + d.offsetHeight - borderWidth*2;
                            break;
                        case "se":
                            oppositeX = d.offsetLeft;
                            oppositeY = d.offsetTop;
                            break;
                        case "ne":
                            oppositeX = d.offsetLeft;
                            oppositeY = d.offsetTop + d.offsetHeight - borderWidth*2;
                            break;
                        case "sw":
                            oppositeX = d.offsetLeft + d.offsetWidth - borderWidth*2;
                            oppositeY = d.offsetTop;
                            break;
                        case "n":
                            oppositeX = null;
                            oppositeY = d.offsetTop + d.offsetHeight - borderWidth*2;
                            break;
                        case "s":
                            oppositeX = null;
                            oppositeY = d.offsetTop;
                            break;
                        case "e":
                            oppositeX = d.offsetLeft;
                            oppositeY = null;
                            break;
                        case "w":
                            oppositeX = d.offsetLeft + d.offsetWidth - borderWidth*2;
                            oppositeY = null;
                            break;
                        default:
                            return;
                    }
                    var left = oppositeX ? Math.min(e.clientX, oppositeX) : d.offsetLeft;
                    var top = oppositeY ? Math.min(e.clientY, oppositeY) : d.offsetTop;
                    var right = oppositeX ? Math.max(e.clientX, oppositeX) : d.offsetLeft + d.offsetWidth - borderWidth*2;
                    var bottom = oppositeY ? Math.max(e.clientY, oppositeY) : d.offsetTop + d.offsetHeight - borderWidth*2;
                    adjustInteraction(d, left, top, right-left, bottom-top);
                } else {
                    adjustInteraction(d, x, y);
                }
                e.preventDefault();
                e.stopPropagation();
            }
        });

        function adjustInteraction(d, x, y, offsetWidth, offsetHeight) {
            var topOffset = game.renderer.getCanvas().offsetTop;
            var coordinate = game.renderer.convertBackgroundToCoordinate({
                x: x + borderWidth, y: y - topOffset + borderWidth,
            });

            var interaction = d.interaction;


            if (interaction.location.shape === 'square' || interaction.location.shape === 'icon') {
                var width = offsetWidth ? game.renderer.convertBackgroundToValue(
                    offsetWidth
                ) : interaction.location.description.bottomRightCorner.x
                    - interaction.location.description.topLeftCorner.x;
                var height = offsetHeight ? game.renderer.convertBackgroundToValue(
                    offsetHeight
                ) : interaction.location.description.bottomRightCorner.y
                    - interaction.location.description.topLeftCorner.y;
                interaction.location.description.topLeftCorner.x = Math.round(coordinate.x);
                interaction.location.description.topLeftCorner.y = Math.round(coordinate.y);
                interaction.location.description.bottomRightCorner.x = Math.round(coordinate.x + width);
                interaction.location.description.bottomRightCorner.y = Math.round(coordinate.y + height);
            } else if(interaction.location.shape === 'circle') {
                if(offsetWidth || offsetHeight) {
                    var width = game.renderer.convertBackgroundToValue(offsetWidth);
                    var height = game.renderer.convertBackgroundToValue(offsetHeight);
                    interaction.location.description.radius = Math.round(Math.min(width, height)/2);
                    interaction.location.description.center.x = Math.round(coordinate.x + width/2);
                    interaction.location.description.center.y = Math.round(coordinate.y + height/2);
                } else {
                    interaction.location.description.center.x = Math.round(coordinate.x
                        + interaction.location.description.radius);
                    interaction.location.description.center.y = Math.round(coordinate.y
                        + interaction.location.description.radius);
                }
            }

            d.style.left = x + 'px';
            d.style.top = y + 'px';
            if(offsetWidth || offsetHeight) {
                d.style.width = offsetWidth + 'px';
                d.style.height = offsetHeight + 'px';
            }
        }

        document.addEventListener("mouseup", function(e) {
            if (divOffset.selection) {
                divOffset.selection.style.border = borderWidth + "px solid black";
                divOffset.selection.style.cursor = "pointer";
                divOffset.selection = null;
                divOffset.cornerDragged = null;
                divOffset.originalSize = null;
                if(e.target.interactionBox) {
                    selectInteraction(e.target.interaction);
                    render();
                    game.render();
                } else {
                    render();
                    game.render();
                }
            }
        });

        this.render = render;
        this.onSceneChange = onSceneChange;
        window.gg = game;
    };
});
