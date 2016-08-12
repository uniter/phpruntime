/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var MAJOR_VERSION = 5,
    MINOR_VERSION = 4,
    RELEASE_VERSION = 0;

module.exports = function () {
    return {
        'PHP_VERSION_ID': MAJOR_VERSION * 10000 + MINOR_VERSION * 100 + RELEASE_VERSION
    };
};
