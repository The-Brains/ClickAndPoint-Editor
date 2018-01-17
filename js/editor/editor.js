define(function() {
    var placeHolderImage = "assets/placeholder.svg";
    return function(div, gameInterface) {
        var game = gameInterface;
        var scenes = [];
        var currentScene;
        var self = this;
        self.active = false;
        var lastInteractionSelected = null;
        var borderWidth = 3;
        var cornerDragged = null;
        function setScenes(value, current) {
            scenes = value;
            if(current) {
                currentScene = current;
            }
        }

        function onSceneChange(scene) {
            if (scene !== currentScene) {
                var locationDiv = document.getElementById('locationDiv');
                if (locationDiv) {
                    locationDiv.style.display = "none";
                }
                currentScene = scene;
                lastInteractionSelected= null;
                render();
            }
        }

        function addSceneSelector(div) {
            var label = div.appendChild(document.createElement('label'));
            label.innerText = "Change scene: ";
            label.for = "sceneSelector";

            var select = div.appendChild(document.createElement('select'));
            select.id = "sceneSelector";
            for(var i=0; i<scenes.length; i++) {
                var option = select.appendChild(document.createElement('option'));
                option.value = scenes[i].value;
                option.innerText = scenes[i].name;
                option.selected = scenes[i].value === currentScene;
            }

            select.addEventListener("change", function() {
                currentScene = select.value;
                var locationDiv = document.getElementById('locationDiv');
                locationDiv.style.display = "none";
                lastInteractionSelected= null;
                game.gotoScene(currentScene).then(() => {
                    render();
                });
            });
        }

        function updateLocations(div) {
            var scene = game.data.scenes[currentScene];
            var interactions = scene.interactions;
            for(var i=0; i<interactions.length; i++) {
                var interaction = interactions[i];
                var location = interaction.location;
                var d = div.appendChild(document.createElement('div'));
                d.style.backgroundColor = 'silver';
                d.style.position = "absolute";
                var topLeft, bottomRight;
                var topOffset = game.renderer.getCanvas().offsetTop;

                if(location.shape==='square' || location.shape==='icon') {
                    topLeft = game.renderer.convertCoordonateToBackground(
                        location.description.topLeftCorner
                    );
                    bottomRight = game.renderer.convertCoordonateToBackground(
                        location.description.bottomRightCorner
                    );
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
                    d.interaction = interaction;
                    d.addEventListener("mousedown", selectLocation);
                }
            }
        }

        var divOffset = {x:0,y:0, selection: null, cornerDragged: null, originalSize: null};
        function selectLocation(e) {
            var d = e.target;
            d.style.border = borderWidth + "px solid yellow";
            divOffset.x = d.offsetLeft - e.clientX;
            divOffset.y = d.offsetTop - e.clientY;
            divOffset.cornerDragged = getCorner(e);
            divOffset.originalSize = {
                x: d.offsetLeft,
                y: d.offsetTop,
                width: d.offsetWidth,
                height: d.offsetHeight,
            };
            divOffset.selection = d;
            d.style.cursor = "move";
            lastInteractionSelected = d.interaction;
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

        function render() {
            var activeChange = (self.active && !document.getElementById('divContainer')
            || !self.active && document.getElementById('divContainer'));

            div.innerHTML = "";
            if(!self.active) {
                showEditIcon(div, "/click-and-point-editor/assets/edit.svg", true);
                div.style.height = "24px";
                div.style.position = "absolute";
                game.render();
            } else {
                div.style.height = "80px";
                div.style.position = "";
                var divContainer = div.appendChild(document.createElement('div'));
                divContainer.id = "divContainer";
                divContainer.style.width = "100vw";

                var divRow = div.appendChild(document.createElement('div'));
                divRow.style.display = "flex";
                divRow.style.flexDirection = "row";
                var divLeft = divRow.appendChild(document.createElement('div'));
                divLeft.style.flex = '50%';

                showEditIcon(divLeft, "/click-and-point-editor/assets/close.svg", false);
                addSceneSelector(divLeft);

                var divRight = divRow.appendChild(document.createElement('div'));
                divRight.style.flex = '50%';

                addInteractionEditor(divRight);

                setTimeout(() => {
                    var locationDiv = divContainer.appendChild(document.createElement('div'));
                    locationDiv.id="locationDiv";
                    updateLocations(locationDiv);
                    game.render();
                },activeChange ? 510 : 0);
            }
        }
        var shapes = ['circle','square','icon'];

        function onUpload(e) {
            var uploader = e.target;
            if (uploader.files && uploader.files[0]) {
                var reader = new FileReader();
                reader.addEventListener('load', onFileRead);
                reader.readAsDataURL(uploader.files[0]);
            }
        }

        function onFileRead(e) {
            var reader = e.target;
            if(lastInteractionSelected) {
                lastInteractionSelected.location.description.image = reader.result;
                render();
                game.render();
            }
        }

        function addInteractionEditor(div) {
            if(lastInteractionSelected) {
                var scene = game.data.scenes[currentScene];
                var interactions = scene.interactions;
                var divInteractionRow = div.appendChild(document.createElement("div"));
                divInteractionRow.style.display = "flex";
                divInteractionRow.style.flexDirection = "row";
                var divIcon = divInteractionRow.appendChild(document.createElement("div"));
                divIcon.style.width = "40px";
                divIcon.style.height = "40px";
                divIcon.style.margin = "4px";
                switch(lastInteractionSelected.location.shape) {
                    case "circle":
                        var circle = divIcon.appendChild(document.createElement("div"));
                        circle.style.width = "32px";
                        circle.style.height = "32px";
                        circle.style.borderRadius = "50%";
                        circle.style.border = "3px solid black";
                        break;
                    case "square":
                        var square = divIcon.appendChild(document.createElement("div"));
                        square.style.width = "32px";
                        square.style.height = "32px";
                        square.style.border = "3px solid black";
                        break;
                    case "icon":
                        var icon = divIcon.appendChild(document.createElement("div"));
                        icon.style.width = "32px";
                        icon.style.height = "32px";
                        icon.style.backgroundSize = "100% 100%";
                        icon.style.backgroundImage = "url(" + lastInteractionSelected.location.description.image +")";
                        icon.style.cursor = "pointer";
                        var divUpload = divIcon.appendChild(document.createElement("div"));
                        divUpload.style.width = 0;
                        divUpload.style.height = 0;
                        divUpload.style.overflow = "hidden";
                        var input = divUpload.appendChild(document.createElement("input"));
                        input.type = "file";
                        input.addEventListener("change", onUpload);
                        input.setAttribute("accept", "image/*");

                        icon.addEventListener("mousedown", () => {
                            input.click();
                        });
                        break;
                }

                var divDescription = divInteractionRow.appendChild(document.createElement("div"));

                divDescription.appendChild(document.createElement('div')).innerText = "Interaction " +
                    interactions.indexOf(lastInteractionSelected);
                var select = divDescription.appendChild(document.createElement('select'));
                for(var i=0; i<shapes.length; i++) {
                    var option = select.appendChild(document.createElement('option'));
                    option.value = shapes[i];
                    option.innerText = shapes[i];
                    option.selected = lastInteractionSelected.location.shape === shapes[i];
                }

                select.addEventListener("change", function(e) {
                    changeShape(lastInteractionSelected.location, e.target.value);
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
                    if(!e.target.value) {
                        delete lastInteractionSelected.if;
                    } else {
                        lastInteractionSelected.if = e.target.value;
                    }
                    render();
                    game.render();
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

        setScenes(_.orderBy(_.map(game.data.scenes, function(value, prop) {
            return { value: prop, name: value.name };
        }), 'name'), game.data.startScene);
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
            var target = e.target;
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
                if(e.target.interaction) {
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
                render();
                game.render();
            }
        });

        this.render = render;
        this.onSceneChange = onSceneChange;
        window.gg = game;
    };
});
