/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var PHPError = require('phpcommon').PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        optionSet = internals.optionSet,
        valueFactory = internals.valueFactory;

    function getPerformance() {
        var performance = optionSet.getOption('performance');

        if (!performance) {
            throw new Error('performance :: No `performance` option is configured');
        }

        return performance;
    }

    return {
        /**
         * Fetches the current Unix timestamp with microseconds
         *
         * @see {@link https://secure.php.net/manual/en/function.microtime.php}
         *
         * @param {Variable|Value} getAsFloatReference Whether to return a float with seconds + us
         * @returns {FloatValue|StringValue}
         */
        'microtime': function (getAsFloatReference) {
            var getAsFloat,
                getAsFloatValue = getAsFloatReference ?
                    getAsFloatReference.getValue() :
                    null,
                timeInSeconds;

            if (getAsFloatValue && /^(array|object)$/.test(getAsFloatValue.getType())) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'microtime() expects parameter 1 to be boolean, ' +
                    getAsFloatValue.getType() +
                    ' given'
                );
                return valueFactory.createNull();
            }

            // Default value (if argument is omitted) is `false`
            getAsFloat = getAsFloatValue ? getAsFloatValue.coerceToBoolean().getNative() : false;

            // Convert microseconds to seconds (with decimal precision to maintain microsecond accuracy)
            timeInSeconds = getPerformance().getTimeInMicroseconds() / 1000000;

            if (getAsFloat) {
                // Return the time since the Unix epoch in seconds, with microsecond accuracy
                // as a float
                return valueFactory.createFloat(timeInSeconds);
            }

            // Return the number of microseconds into the current second first, followed by
            // the number of whole seconds since the Unix epoch
            return valueFactory.createString(
                (timeInSeconds % 1).toFixed(6) + ' ' +
                Math.floor(timeInSeconds)
            );
        }
    };
};
