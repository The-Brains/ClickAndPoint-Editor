// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    enforceDefine: true,
    baseUrl: 'js/lib',
    paths: {
        chai: 'chai',
        jquery: [
            'https://code.jquery.com/jquery-3.2.1.min',
            'jquery-3.2.1.min',
        ],
        lodash: [
            'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min',
            'lodash.min',
        ],
        testWrapper: 'https://the-brains.github.io/TestSuite/scripts/test/test-wrapper',
    },
    urlArgs: "bust=" + Date.now(),
});

define(function() {
    window.testFileName = 'test.html';
    // Start loading the main app file. Put all of
    // your application logic in there.
    requirejs([
        // Add your test files here
        'js/tests/app-game-test.js',
        'js/tests/app-scene-test.js',
        'js/tests/utility-read-file-test.js',
    ]);
});
