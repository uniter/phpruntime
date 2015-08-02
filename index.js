/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var pausable = require('pausable').create(),
    phpCommon = require('phpcommon'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    Runtime = require('./src/Runtime'),
    runtime = new Runtime(phpCommon);

module.exports = function (wrapper) {
    return runtime.compile(wrapper, pausable, phpToAST, phpToJS);
};
