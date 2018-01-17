define(
    [
        'chai',
        'testWrapper',
        '../app/scene.js',
        '../utility/read-file.js',
    ],
    function(chai, testWrapper, Scene, ReadFile) {
        var expect = chai.expect;
        var mainName = 'app-scene';

        testWrapper.execTest(mainName, 'should load data properly', function() {
            return ReadFile.readFileAsJson('./game-files-examples/scene-1.json')
            .then((data) => {
                var scene = new Scene(null, 'test scene', data);
            })
        });
    }
);
