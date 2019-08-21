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

/**
 * SPL-related PHP builtin functions.
 * Note that some functions (eg. spl_autoload_register) are provided by PHPCore
 *
 * @param {object} internals
 * @return {object}
 */
module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Fetches the unique identifier "hash" for a PHP object
         *
         * @see {@link https://secure.php.net/manual/en/function.spl-object-hash.php}
         *
         * @param {Variable|Value} haystackReference    The object to get a unique identifier for
         * @returns {StringValue}                       The unique identifier
         */
        'spl_object_hash': function (objectReference) {
            var objectValue = objectReference.getValue(),
                idString,
                padding;

            if (objectValue.getType() !== 'object') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'spl_object_hash() expects parameter 1 to be object, ' + objectValue.getType() + ' given'
                );
                return valueFactory.createNull();
            }

            // Use Uniter's internal unique object IDs to build the "hash"
            idString = objectValue.getID().toString();
            // PHP object "hashes" are 32 bytes long, so emulate that here
            padding = new Array(32 - idString.length + 1).join('0');

            return valueFactory.createString(padding + idString);
        }
    };
};
