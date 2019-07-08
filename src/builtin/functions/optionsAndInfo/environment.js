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
         * Fetches the value of an environment variable
         *
         * @see {@link https://secure.php.net/manual/en/function.getenv.php}
         *
         * @param {Reference|Value|Variable|null} variableNameReference
         * @return {Value}
         */
        'getenv': function (variableNameReference) {
            if (variableNameReference) {
                return valueFactory.createBoolean(false);
            }

            return valueFactory.createArray([]);
        }
    };
};
