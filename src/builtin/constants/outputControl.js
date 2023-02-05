/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/**
 * Output control predefined constants.
 *
 * @see {@link https://secure.php.net/manual/en/outcontrol.constants.php}
 */
module.exports = function () {
    return {
        'PHP_OUTPUT_HANDLER_CLEANABLE': 16,
        'PHP_OUTPUT_HANDLER_FLUSHABLE': 32,
        'PHP_OUTPUT_HANDLER_REMOVABLE': 64,
        'PHP_OUTPUT_HANDLER_STDFLAGS': 112
    };
};
