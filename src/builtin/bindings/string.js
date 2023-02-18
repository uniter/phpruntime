/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var FormatConverter = require('./string/FormatConverter'),
    FormatParser = require('./string/FormatParser'),
    Formatter = require('./string/Formatter'),
    NativeFormatter = require('./string/NativeFormatter'),
    Trimmer = require('./string/Trimmer');

/**
 * String handling bindings
 */
module.exports = function (internals) {
    var callStack = internals.callStack;

    return {
        stringFormatter: function () {
            return new Formatter(new NativeFormatter(new FormatParser(), new FormatConverter()));
        },
        stringTrimmer: function () {
            return new Trimmer(callStack);
        }
    };
};
