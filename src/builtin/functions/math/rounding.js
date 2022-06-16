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
         * Rounds a fraction upwards.
         *
         * @see {@link https://secure.php.net/manual/en/function.ceil.php}
         *
         * @param {Variable|Value} numberReference
         * @returns {FloatValue}
         */
        'ceil': internals.typeFunction(
            // FIXME: Use union type "int|float" when supported.
            'mixed $number: float',
            function (numberValue) {
                var number = numberValue.getNative();

                return valueFactory.createFloat(Math.ceil(number));
            }
        )
    };
};
