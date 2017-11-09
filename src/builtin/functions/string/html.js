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
         * Converts all applicable characters to HTML entities
         *
         * @see {@link https://secure.php.net/manual/en/function.htmlentities.php}
         *
         * @param {Variable|ArrayValue} stringReference
         * @returns {StringValue}
         */
        'htmlentities': function (stringReference) {
            var string;

            string = stringReference.getNative();

            string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return valueFactory.createString(string);
        }
    };
};
