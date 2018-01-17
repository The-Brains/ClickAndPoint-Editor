// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    enforceDefine: true,
    baseUrl: 'js/lib',
    paths: {
        jquery: [
            'https://code.jquery.com/jquery-3.2.1.min',
            'jquery-3.2.1.min',
        ],
        lodash: [
            'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min',
            'lodash.min',
        ],
    },
});

define(['js/utility/find-get-param.js'], function(findGetParameter) {
    var disable_cache = findGetParameter('disable_cache');
    var debug = findGetParameter('debug');
    var config = {
        urlArgs: disable_cache ? "time=" + Date.now() : '',
        paths: {
        }
    };
    requirejs.config(config);

    // Start loading the main app file. Put all of
    // your application logic in there.
    requirejs([
        'js/utility/resize-canvas.js',
        'js/main-demo.js',
    ]);
});
