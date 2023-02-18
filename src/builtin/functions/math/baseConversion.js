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
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Converts a decimal integer to hexadecimal.
         *
         * @see {@link https://secure.php.net/manual/en/function.dechex.php}
         */
        'dechex': internals.typeFunction('int $num : string', function (numberValue) {
            /*jshint bitwise:false */
            var number = numberValue.getNative(),
                unsignedNumber = number >>> 0; // Cast to a 32-bit unsigned integer.

            return valueFactory.createString(unsignedNumber.toString(16));
        })
    };
};
