/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var networkFunctions = require('../builtin/functions/network');

/**
 * PHP networking support.
 */
module.exports = {
    functionGroups: [
        networkFunctions
    ]
};
