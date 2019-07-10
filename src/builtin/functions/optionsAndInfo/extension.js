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
         * Fetches the names of all extension modules that have been loaded
         *
         * @see {@link https://secure.php.net/manual/en/function.get-loaded-extensions.php}
         *
         * @param {Reference|Value|Variable|null} onlyZendExtensions
         * @return {ArrayValue}
         */
        'get_loaded_extensions': function (/* onlyZendExtensions */) {
            return valueFactory.createArray([]);
        }
    };
};
