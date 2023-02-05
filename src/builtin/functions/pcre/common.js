/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var REGEX_SPECIAL_CHAR_PATTERN = /[.\\+*?[^\]$(){}=!<>|:#-]/g;

/**
 * Common PCRE functions.
 */
module.exports = function (internals) {
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Quote (escape) regular expression characters.
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-quote.php}
         */
        'preg_quote': internals.typeFunction(
            'string $str, ?string $delimiter = null : string',
            function (stringValue, delimiterValue) {
                var delimiter,
                    quoted,
                    string = stringValue.getNative();

                quoted = string.replace(REGEX_SPECIAL_CHAR_PATTERN, '\\$&');

                if (delimiterValue.getType() !== 'null') {
                    delimiter = delimiterValue.getNative().charAt(0); // We only consider the first char of delimiter.
                    delimiter = delimiter.replace(REGEX_SPECIAL_CHAR_PATTERN, '');

                    if (delimiter !== '') {
                        quoted = quoted.replace(new RegExp('\\' + delimiter, 'g'), '\\$&');
                    }
                }

                return valueFactory.createString(quoted);
            }
        )
    };
};
