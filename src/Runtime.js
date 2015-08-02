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
    Engine = require('./Engine'),
    Stream = require('./Stream');

function Runtime(phpCommon) {
    this.phpCommon = phpCommon;
}

_.extend(Runtime.prototype, {
    compile: function (wrapper, pausable, phpToAST, phpToJS) {
        var runtime = this,
            phpCommon = runtime.phpCommon;

        return function (options, state, tools, phpParser, context) {
            var stderr,
                stdin,
                stdout;

            if (state) {
                stdin = state.getStdin();
                stdout = state.getStdout();
                stderr = state.getStderr();
            } else {
                stdin = new Stream();
                stdout = new Stream();
                stderr = new Stream();
            }

            return new Engine(
                runtime,
                phpCommon,
                stdin,
                stdout,
                stderr,
                options,
                state,
                tools,
                phpParser,
                context,
                wrapper,
                pausable,
                phpToAST,
                phpToJS
            );
        };
    }
});

module.exports = Runtime;
