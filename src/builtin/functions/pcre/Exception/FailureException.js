/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    util = require('util'),
    phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

/**
 * Thrown when an error occurs during PCRE matching or replacement,
 * usually causing either NULL or FALSE to be returned
 *
 * @param {Value} returnValue
 * @constructor
 */
function FailureException(returnValue) {
    Exception.call(this, 'Failed');

    /**
     * @type {Value}
     */
    this.returnValue = returnValue;
}

util.inherits(FailureException, Exception);

_.extend(FailureException.prototype, {
    /**
     * Fetches the intended return value
     *
     * @return {Value}
     */
    getReturnValue: function () {
        return this.returnValue;
    }
});

module.exports = FailureException;
