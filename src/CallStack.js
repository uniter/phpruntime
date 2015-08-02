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
    phpCommon = require('phpcommon'),
    PHPError = phpCommon.PHPError;

function CallStack(stderr) {
    this.calls = [];
    this.stderr = stderr;
}

_.extend(CallStack.prototype, {
    getCurrent: function () {
        var chain = this;

        return chain.calls[chain.calls.length - 1];
    },

    pop: function () {
        this.calls.pop();
    },

    push: function (call) {
        this.calls.push(call);
    },

    raiseError: function (level, message) {
        var call,
            chain = this,
            calls = chain.calls,
            error,
            index = 0;

        for (index = calls.length - 1; index >= 0; --index) {
            call = calls[index];

            if (call.getScope().suppressesErrors()) {
                return;
            }
        }

        error = new PHPError(level, message);

        chain.stderr.write(error.message + '\n');
    }
});

module.exports = CallStack;
