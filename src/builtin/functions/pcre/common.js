/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var REGEX_SPECIAL_CHAR_PATTERN = /[.\\+*?[^\]$(){}=!<>|:#-]/g,
    phpCommon = require('phpcommon'),
    PHPError = phpCommon.PHPError;

/**
 * Basic-level PCRE support module. JavaScript's own RegExp implementation is used,
 * meaning that only the JavaScript-compliant subset of regular expression is supported.
 */
module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Quote (escape) regular expression characters
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-quote.php}
         *
         * @param {Reference|Variable|Value} stringReference
         * @param {Reference|Variable|Value} delimiterReference
         * @returns {StringValue}
         */
        'preg_quote': function (stringReference, delimiterReference) {
            var delimiter,
                quoted,
                string;

            if (!stringReference) {
                callStack.raiseError(PHPError.E_WARNING, 'preg_quote() expects at least 1 parameter, 0 given');
                return valueFactory.createNull();
            }

            string = stringReference.getNative();

            quoted = string.replace(REGEX_SPECIAL_CHAR_PATTERN, '\\$&');

            if (delimiterReference) {
                delimiter = delimiterReference.getNative().charAt(0); // We only consider the first char of delimiter
                delimiter = delimiter.replace(REGEX_SPECIAL_CHAR_PATTERN, '');

                if (delimiter !== '') {
                    quoted = quoted.replace(new RegExp('\\' + delimiter, 'g'), '\\$&');
                }
            }

            return valueFactory.createString(quoted);
        }
    };
};
