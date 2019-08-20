/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function () {
    return {
        'HTML_SPECIALCHARS': 0,
        'HTML_ENTITIES': 1,

        'ENT_NOQUOTES': 0,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,

        'ENT_HTML401': 0,

        'ENT_SUBSTITUTE': 8 // Not applicable, as JS string literals cannot contain invalid Unicode escape sequences
    };
};
