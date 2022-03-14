/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        mode = internals.mode,
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
         * Pauses execution for the specified number of microseconds.
         * Note that in async mode, this will be implemented by pausing execution
         * via the Futures/async functionality in PHPCore and setting a timeout to later resume.
         * In (p)sync mode, an (inefficient!) busy wait loop is used to perform the wait.
         * Relying on the busy-wait version is not recommended for production usage!
         *
         * @see {@link https://secure.php.net/manual/en/function.usleep.php}
         *
         * @param {Variable|Value} microsecondsReference
         * @returns {FutureValue|undefined}
         */
        'usleep': function (microsecondsReference) {
            var endMicroseconds,
                microsecondsValue = microsecondsReference.getValue(),
                performance;

            if (microsecondsValue.getType() !== 'int' && microsecondsValue.getType() !== 'float') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'usleep() expects parameter 1 to be integer or float, ' +
                        microsecondsValue.getType() + ' given'
                );
                return;
            }

            if (mode === 'async') {
                // Efficient version, if we're using async mode

                return valueFactory.createFuture(function (resolve) {
                    setTimeout(function () {
                        resolve();
                    }, microsecondsValue.getNative() / 1000);
                });
            }

            // Inefficient version, if we're in (p)sync mode

            performance = getPerformance();
            endMicroseconds = performance.getTimeInMicroseconds() + microsecondsValue.getNative();

            while (performance.getTimeInMicroseconds() < endMicroseconds) { //jshint ignore:line
                // Busy wait
            }
        }
    };
};
