define(
    [
        'chai',
        'testWrapper',
        '../app/game.js',
    ],
    function(chai, testWrapper, Game) {
        var expect = chai.expect;
        var mainName = 'app-game';

        testWrapper.execTest(mainName, 'should load file properly', function() {
            var game = new Game('./game-files-examples/test-game-1.json', null);
            return game.start()
            .catch((error) => {
                expect(error).to.equal('Renderer is not defined');
            });
        });
    }
);
