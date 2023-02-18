/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var Clock = require('../../Clock');

/**
 * Provides clock-related services.
 */
module.exports = function () {
    return {
        'clock': function () {
            return new Clock(Date);
        }
    };
};
