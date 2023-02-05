/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/**
 * SPL-related PHP builtin functions.
 * Note that some functions (e.g. spl_autoload_register) are provided by PHPCore.
 *
 * @param {object} internals
 * @return {object}
 */
module.exports = function (internals) {
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Fetches the unique identifier "hash" for a PHP object.
         *
         * @see {@link https://secure.php.net/manual/en/function.spl-object-hash.php}
         */
        'spl_object_hash': internals.typeFunction(
            'object $object : string',
            function (objectValue) {
                var idString,
                    padding;

                // Use Uniter's internal unique object IDs to build the "hash".
                idString = objectValue.getID().toString();
                // PHP object "hashes" are 32 bytes long, so emulate that here.
                padding = new Array(32 - idString.length + 1).join('0');

                return valueFactory.createString(padding + idString);
            }
        )
    };
};
