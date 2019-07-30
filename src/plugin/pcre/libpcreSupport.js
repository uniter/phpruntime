/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var libpcreFunctionGroup = require('../../builtin/functions/pcre/libpcreSupport');

/**
 * PCRE preg_* functions support using libpcre built with Emscripten
 */
module.exports = {
    functionGroups: [
        libpcreFunctionGroup
    ]
};
