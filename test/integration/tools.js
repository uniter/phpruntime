/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var builtins = require('../../src/builtin/builtins'),
    pausable = require('pausable'),
    phpCommon = require('phpcommon'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    Engine = require('phpcore/src/Engine'),
    Environment = require('phpcore/src/Environment'),
    OptionSet = require('phpcore/src/OptionSet'),
    PHPState = require('phpcore/src/PHPState').sync(),
    Runtime = require('phpcore/src/Runtime').async(pausable),
    transpile = function (path, php, phpCore, options) {
        var js,
            phpParser;

        options = options || {};

        phpParser = phpToAST.create(null, options.phpToAST);

        if (path) {
            phpParser.getState().setPath(path);
        }

        js = phpToJS.transpile(phpParser.parse(php), options.phpToJS);

        return new Function(
            'require',
            'return ' + js
        )(function () {
            return phpCore;
        });
    };

module.exports = {
    createAsyncRuntime: function () {
        // Create an isolated runtime we can install builtins into without affecting the main singleton one
        var runtime = new Runtime(
            Environment,
            Engine,
            OptionSet,
            PHPState,
            phpCommon,
            pausable,
            phpToAST,
            phpToJS
        );

        // Install the standard set of builtins
        runtime.install(builtins);

        return runtime;
    },

    createSyncRuntime: function () {
        // Create an isolated runtime we can install builtins into without affecting the main singleton one
        var runtime = new Runtime(
            Environment,
            Engine,
            OptionSet,
            PHPState,
            phpCommon,
            null, // Don't make Pausable available - running synchronously
            phpToAST,
            phpToJS
        );

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
