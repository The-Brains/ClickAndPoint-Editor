define([
    '../utility/check-data.js',
],
(CheckData) => {
    var Item = function(parent, key, data) {
        this.parent = parent;
        var myself = self;
        var game = null;

        this.getName = () => {
            return parent.getName() + ` - Item '${key}'`;
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
                'description',
                'icon',
            ],
            true,
            this.getName()
        );
    }

    return Item;
});
