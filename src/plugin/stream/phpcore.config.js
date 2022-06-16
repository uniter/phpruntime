/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var streamAddon = require('../../addon/stream');

/**
 * PHP streams support.
 */
module.exports = {
    addons: [
        streamAddon
    ]
};
