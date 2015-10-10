/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    PHPState = require('./PHPState'),
    Stream = require('./Stream');

function Runtime(Environment, Engine, phpCommon, pausable, phpToAST, phpToJS) {
    this.Engine = Engine;
    this.Environment = Environment;
    this.pausable = pausable;
    this.phpCommon = phpCommon;
    this.phpToAST = phpToAST;
    this.phpToJS = phpToJS;
}

_.extend(Runtime.prototype, {
    compile: function (wrapper) {
        var runtime = this,
            pausable = runtime.pausable,
            phpCommon = runtime.phpCommon,
            phpToAST = runtime.phpToAST,
            phpToJS = runtime.phpToJS;

        return function (options, environment) {
            if (environment) {
                options = _.extend({}, environment.getOptions(), options);
            } else {
                environment = runtime.createEnvironment(options);
            }

            return new runtime.Engine(
                runtime,
                environment,
                phpCommon,
                options,
                wrapper,
                pausable,
                phpToAST,
                phpToJS
            );
        };
    },

    createEnvironment: function (options) {
        var runtime = this,
            stdin = new Stream(),
            stdout = new Stream(),
            stderr = new Stream(),
            parser = runtime.phpToAST.create(stderr),
            state = new PHPState(stdin, stdout, stderr, runtime.pausable);

        return new runtime.Environment(state, parser, options);
    }
});

module.exports = Runtime;
