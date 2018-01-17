define(
    [
        'chai',
        'testWrapper',
        '../utility/read-file.js',
    ],
    function(chai, testWrapper, ReadFile) {
        var expect = chai.expect;
        var mainName = 'utility-read-file';

        testWrapper.execTest(mainName, 'should read file properly', function() {
            return ReadFile.readFileAsJson('./game-files-examples/test1.json')
            .then((data) => {
                expect(data).to.deep.equal({})
            });
        });
    }
);
