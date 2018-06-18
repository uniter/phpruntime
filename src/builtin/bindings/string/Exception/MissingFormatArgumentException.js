/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var util = require('util'),
    phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

/**
 * Thrown when a format by the printf(...) family of functions is missing an argument
 *
 * @param {number} argumentPosition
 * @constructor
 */
function MissingFormatArgumentException(argumentPosition) {
    Exception.call(this, 'Missing argument #' + (argumentPosition + 1));

    /**
     * @type {number}
     */
    this.argumentPosition = argumentPosition;
}

util.inherits(MissingFormatArgumentException, Exception);

module.exports = MissingFormatArgumentException;
