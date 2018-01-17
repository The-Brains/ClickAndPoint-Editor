const gameData = {
    "globalActions": {
        "goingHome": {
            "actions": [
                {
                    "hoverCursor": "zoom-out",
                    "target": "first",
                    "type": "goto"
                }
            ]
        },
        "takeDocument1": {
            "actions": [
                {
                    "target": "document1",
                    "type": "take"
                }
            ]
        }
    },
    "items": {
        "document1": {
            "description": "This is a very cool document !",
            "icon": "./assets/document1.png"
        }
    },
    "scenes": {
        "clockView": {
            "backgroundImg": "./assets/clock_view.jpg",
            "interactions": [
                {
                    "actions": [
                        "goingHome"
                    ],
                    "hidden": false,
                    "location": {
                        "description": {
                            "bottomRightCorner": {
                                "x": 100,
                                "y": 100
                            },
                            "image": "./assets/back_icon.png",
                            "topLeftCorner": {
                                "x": 25,
                                "y": 25
                            }
                        },
                        "shape": "icon"
                    }
                }
            ],
            "name": "The Clock"
        },
        "fireView": {
            "backgroundImg": "./assets/the_fire_place.jpg",
            "interactions": [
                {
                    "actions": [
                        "goingHome"
                    ],
                    "hidden": false,
                    "location": {
                        "description": {
                            "bottomRightCorner": {
                                "x": 300,
                                "y": 300
                            },
                            "image": "./assets/back_icon.png",
                            "topLeftCorner": {
                                "x": 100,
                                "y": 100
                            }
                        },
                        "shape": "icon"
                    }
                },
                {
                    "actions": [
                        "takeDocument1",
                        {
                            "target": "clockShouldBeAccessible",
                            "type": "setVariable",
                            "value": true
                        }
                    ],
                    "hidden": false,
                    "location": {
                        "description": {
                            "bottomRightCorner": {
                                "x": 1200,
                                "y": 1225
                            },
                            "image": "./assets/document1.png",
                            "topLeftCorner": {
                                "x": 1100,
                                "y": 1100
                            }
                        },
                        "shape": "icon"
                    }
                }
            ],
            "name": "The fire"
        },
        "first": {
            "backgroundImg": "./assets/first-background.png",
            "interactions": [
                {
                    "actions": [
                        {
                            "target": "fireView",
                            "type": "goto"
                        }
                    ],
                    "hidden": true,
                    "location": {
                        "description": {
                            "bottomRightCorner": {
                                "x": 1760,
                                "y": 728
                            },
                            "topLeftCorner": {
                                "x": 1675,
                                "y": 512
                            }
                        },
                        "shape": "square"
                    }
                },
                {
                    "actions": [
                        {
                            "target": "flowerView",
                            "type": "goto"
                        }
                    ],
                    "hidden": false,
                    "location": {
                        "description": {
                            "center": {
                                "x": 1030,
                                "y": 860
                            },
                            "radius": 110
                        },
                        "shape": "circle"
                    }
                },
                {
                    "actions": [
                        {
                            "target": "clockView",
                            "type": "goto"
                        }
                    ],
                    "hidden": false,
                    "if": "clockShouldBeAccessible",
                    "location": {
                        "description": {
                            "center": {
                                "x": 1518,
                                "y": 308
                            },
                            "radius": 49
                        },
                        "shape": "circle"
                    }
                }
            ],
            "name": "Home"
        },
        "flowerView": {
            "backgroundImg": "./assets/flower_view.jpg",
            "interactions": [
                {
                    "actions": [
                        "goingHome"
                    ],
                    "hidden": false,
                    "location": {
                        "description": {
                            "bottomRightCorner": {
                                "x": 150,
                                "y": 150
                            },
                            "image": "./assets/back_icon.png",
                            "topLeftCorner": {
                                "x": 50,
                                "y": 50
                            }
                        },
                        "shape": "icon"
                    }
                }
            ],
            "name": "The Flowers"
        }
    },
    "startScene": "first",
    "variables": {
        "clockShouldBeAccessible": false
    }
};


define([
        'jquery',
        'lodash',
        './app/game.js',
    ], function($, _, Game) {
        var game = new Game(
            null,
            document.getElementById('canvas'),
            gameData
        );

        $('.CanvasArea').removeClass('is-hidden');
        game.start()
        .then(() => {
            console.log('App started.');
        });
        window.game = game;
});
