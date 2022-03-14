/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    builtins = require('../../src/builtin/builtins'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    runtimeFactory = require('phpcore/src/shared/runtimeFactory'),
    transpile = function (path, php, phpCore, options) {
        var js,
            module,
            phpCoreOptions = {},
            phpParser;

        options = options || {};

        phpParser = phpToAST.create(null, _.extend({
            captureAllBounds: true
        }, options.phpToAST));

        if (path) {
            phpParser.getState().setPath(path);
        }

        js = phpToJS.transpile(phpParser.parse(php), _.extend({
            lineNumbers: true,
            path: path || null
        }, options.phpToJS), options.transpiler);

        module = new Function(
            'require',
            'return ' + js
        )(function () {
            return phpCore;
        });

        if (path !== null) {
            phpCoreOptions.path = path;
        }

        phpCoreOptions = _.extend({}, phpCoreOptions, options.phpCore);

        return module.using(phpCoreOptions);
    };

module.exports = {
    createAsyncRuntime: function () {
        // Create an isolated runtime we can install builtins into without affecting the main singleton one
        var runtime = runtimeFactory.create('async');

        // Install the standard set of builtins
        runtime.install(builtins);

        return runtime;
    },

    createSyncRuntime: function () {
        // Create an isolated runtime we can install builtins into without affecting the main singleton one
        var runtime = runtimeFactory.create('sync');

        // Install the standard set of builtins
        runtime.install(builtins);

        return runtime;
    },

    asyncTranspile: function (path, php, options) {
        return transpile(path, php, this.createAsyncRuntime(), options);
    },

    syncTranspile: function (path, php, options) {
        return transpile(path, php, this.createSyncRuntime(), options);
    },

    transpile: function (runtime, path, php, options) {
        return transpile(path, php, runtime, options);
    }
};
