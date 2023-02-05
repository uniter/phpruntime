/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*
 * Translations for warning-level error messages.
 */
module.exports = {
    'en_GB': {
        'core': {
            'invalid_range_missing_left_char': '${func}(): Invalid \'..\'-range, no character to the left of \'..\'',
            'invalid_range_missing_right_char': '${func}(): Invalid \'..\'-range, no character to the right of \'..\'',
            'invalid_range_not_incrementing': '${func}(): Invalid \'..\'-range, \'..\'-range needs to be incrementing'
        }
    }
};
