/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var stringTransportOptionGroup = require('../../builtin/options/transport/string');

/**
 * Support for returning a PHP code string from an include transport
 */
module.exports = {
    optionGroups: [
        stringTransportOptionGroup
    ]
};
