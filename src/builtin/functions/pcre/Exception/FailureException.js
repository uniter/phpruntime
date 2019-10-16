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
 * @constructor
 */
function FailureException() {
    Exception.call(this, 'Failed');
}

util.inherits(FailureException, Exception);

_.extend(FailureException.prototype, {
});

module.exports = FailureException;
