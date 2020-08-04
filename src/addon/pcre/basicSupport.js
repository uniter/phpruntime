/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var basicLevelPcreFunctionGroup = require('../../builtin/functions/pcre/basicSupport');

/**
 * PCRE preg_* functions support using the builtin JS RegExp class
 */
module.exports = {
    functionGroups: [
        basicLevelPcreFunctionGroup
    ]
};
