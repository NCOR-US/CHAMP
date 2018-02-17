/*jshint node:true*/
/* global require, module */
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
    const app = new EmberApp(defaults, {
        // Add options here
        "ember-cli-babel": {
            optional: ['es6.spec.symbols'],
            includePolyfill: true
        }
    });

    // Use `app.import` to add additional libraries to the generated
    // output files.
    //
    // If you need to use different assets in different
    // environments, specify an object as the first parameter. That
    // object's keys should be the environment name and the values
    // should be the asset to use in that environment.
    //
    // If the library that you are including contains AMD or ES6
    // modules that you would like to import into your application
    // please specify an object with the list of modules as keys
    // along with the exports of each module as its value.

    app.import("bower_components/foundation/css/normalize.css");
    app.import("bower_components/foundation/css/foundation.css");
    app.import('bower_components/foundation/css/foundation.css.map');
    app.import("bower_components/foundation/js/foundation.js");
    app.import('bower_components/font-awesome/css/font-awesome.css');
    app.import('bower_components/font-awesome/css/font-awesome.css.map');
    app.import("bower_components/chosen/chosen.css");
    app.import("bower_components/chosen/chosen.jquery.js");
    app.import("bower_components/chosen/chosen.jquery.js");

    let chosenAssets = new Funnel('bower_components/chosen', {
        srcDir: '/',
        include: ['*.png'],
        destDir: '/assets'
    });

    let fontAwesomeAssets = new Funnel('bower_components/font-awesome/fonts', {
        srcDir: '/',
        include: ['*'],
        destDir: '/fonts'
    });

    return app.toTree([chosenAssets, fontAwesomeAssets]);
};
