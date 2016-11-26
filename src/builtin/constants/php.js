/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var systemConstants = require('../../../constants');

module.exports = function () {
    // NB: Some of the most basic constants (eg. PHP_EOL) are defined by the PHPCore library

    return {
        'PHP_OS': 'Uniter',
        'PHP_SAPI': systemConstants.sapi,
        'PHP_VERSION':
            systemConstants.phpVersion.major + '.' +
            systemConstants.phpVersion.minor + '.' +
            systemConstants.phpVersion.release,
        'PHP_VERSION_ID':
            systemConstants.phpVersion.major * 10000 +
            systemConstants.phpVersion.minor * 100 +
            systemConstants.phpVersion.release
    };
};
