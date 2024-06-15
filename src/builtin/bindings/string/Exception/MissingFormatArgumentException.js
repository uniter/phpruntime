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
 * Thrown when a format by the printf(...) family of functions is missing an argument.
 *
 * @param {number} argumentPosition
 * @param {number} parameterCount
 * @constructor
 */
function MissingFormatArgumentException(argumentPosition, parameterCount) {
    Exception.call(this, 'Missing argument #' + (argumentPosition + 1) + ' of ' + parameterCount);

    /**
     * @type {number}
     */
    this.argumentPosition = argumentPosition;
    /**
     * @type {number}
     */
    this.parameterCount = parameterCount;
}

util.inherits(MissingFormatArgumentException, Exception);

_.extend(MissingFormatArgumentException.prototype, {
    /**
     * Fetches the position of the format string parameter for which an argument is missing.
     *
     * @returns {number}
     */
    getArgumentPosition: function () {
        return this.argumentPosition;
    },

    /**
     * Fetches the number of parameters defined for the format string.
     *
     * @returns {number}
     */
    getParameterCount: function () {
        return this.parameterCount;
    }
});

module.exports = MissingFormatArgumentException;
