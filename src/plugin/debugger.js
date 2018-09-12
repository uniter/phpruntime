/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var debuggerBindingGroup = require('../builtin/bindings/debugger'),
    debuggerOptionGroup = require('../builtin/options/debugger'),
    xdebugFunctionGroup = require('../builtin/functions/debugger/xdebug');

module.exports = {
    bindingGroups: [
        debuggerBindingGroup
    ],
    functionGroups: [
        xdebugFunctionGroup
    ],
    optionGroups: [
        debuggerOptionGroup
    ]
};
