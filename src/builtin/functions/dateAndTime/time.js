/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function (internals) {
    var clock = internals.getService('clock'),
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
         * Fetches the current Unix timestamp with microseconds.
         *
         * @see {@link https://secure.php.net/manual/en/function.microtime.php}
         *
         * @param {Variable|Value} getAsFloatReference Whether to return a float with seconds + us
         * @returns {FloatValue|StringValue}
         */
        'microtime': internals.typeFunction(
            'bool $as_float = false',
            function (getAsFloatValue) {
                // FIXME: Add union return type above once supported.

                var getAsFloat = getAsFloatValue.getNative(),
                    // Convert microseconds to seconds (with decimal precision to maintain microsecond accuracy).
                    timeInSeconds = getPerformance().getTimeInMicroseconds() / 1000000;

                if (getAsFloat) {
                    // Return the time since the Unix epoch in seconds, with microsecond accuracy
                    // as a float.
                    return valueFactory.createFloat(timeInSeconds);
                }

                // Return the number of microseconds into the current second first, followed by
                // the number of whole seconds since the Unix epoch.
                return valueFactory.createString(
                    (timeInSeconds % 1).toFixed(6) + ' ' +
                    Math.floor(timeInSeconds)
                );
            }
        ),

        /**
         * Returns the current Unix timestamp;
         * the number of seconds since the Unix Epoch (1st January 1970 00:00:00 GMT).
         *
         * @see {@link https://secure.php.net/manual/en/function.time.php}
         *
         * @returns {IntegerValue}
         */
        'time': internals.typeFunction(': int', function () {
            return clock.getUnixTimestamp();
        })
    };
};
