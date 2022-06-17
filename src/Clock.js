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
 * Clock abstraction, defined as a service to allow overriding.
 *
 * @see also the Performance abstraction used for higher precision.
 *
 * @param {class} Date
 * @constructor
 */
function Clock(Date) {
    /**
     * @type {class}
     */
    this.Date = Date;
}

_.extend(Clock.prototype, {
    /**
     * Fetches the current Unix timestamp.
     *
     * @returns {number}
     */
    getUnixTimestamp: function () {
        return this.Date.now();
    }
});

module.exports = Clock;
