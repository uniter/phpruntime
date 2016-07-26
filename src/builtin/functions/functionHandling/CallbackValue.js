/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * Represents a Value object whose reference or value
 * are fetched with a callback function
 *
 * @param {Function} referenceCallback
 * @param {Function} valueCallback
 * @constructor
 */
function CallbackValue(referenceCallback, valueCallback) {
    /**
     * @type {Function}
     */
    this.referenceCallback = referenceCallback;
    /**
     * @type {Function}
     */
    this.valueCallback = valueCallback;
}

_.extend(CallbackValue.prototype, {
    /**
     * Fetches the reference for this value via the provided callback
     *
     * @returns {*}
     */
    getReference: function () {
        return this.referenceCallback();
    },

    /**
     * Fetches the eventual value of this value via the provided callback
     *
     * @returns {*}
     */
    getValue: function () {
        return this.valueCallback();
    }
});

module.exports = CallbackValue;
