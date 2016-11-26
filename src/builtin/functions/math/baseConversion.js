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
        valueFactory = internals.valueFactory;

    return {
        /**
         * Converts a decimal integer to hexadecimal
         *
         * @see {@link https://secure.php.net/manual/en/function.dechex.php}
         *
         * @param {Variable|Value} numberReference
         * @returns {StringValue}
         */
        'dechex': function (numberReference) {
            /*jshint bitwise:false */
            var number,
                unsignedNumber;

            if (arguments.length === 0) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'dechex() expects exactly 1 parameter, 0 given'
                );
                return valueFactory.createNull();
            }

            number = numberReference ?
                numberReference.getValue().getNative() :
                null;
            unsignedNumber = number >>> 0; // Cast to a 32-bit unsigned integer

            return valueFactory.createString(unsignedNumber.toString(16));
        }
    };
};
