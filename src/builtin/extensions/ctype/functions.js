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

    /**
     * Handles integer input by converting negative numbers to positive Extended ASCII,
     * and converting integers between 0 and 255 inclusive to ASCII characters.
     *
     * @param {number} value - The integer value to handle.
     * @returns {string} The processed string representation of the value.
     */
    function handleIntegerInput(value) {
        if (typeof value === 'number') {
            // For negative numbers, convert to positive Extended ASCII.
            if (value < 0) {
                value += 256;
            }

            // For integers between 0 and 255 inclusive, convert to ASCII character.
            if (value >= 0 && value < 256) {
                return String.fromCharCode(value);
            }
        }

        // For any other value, convert to string.
        return String(value);
    }

    return {
        /**
         * Checks if all characters in the string are alphanumeric.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-alnum.php}
         */
        'ctype_alnum': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[a-zA-Z0-9]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are alphabetic.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-alpha.php}
         */
        'ctype_alpha': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[a-zA-Z]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are control characters.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-cntrl.php}
         */
        'ctype_cntrl': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[\x00-\x1F\x7F]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are decimal digits.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-digit.php}
         */
        'ctype_digit': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[0-9]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are printable and create visible output.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-graph.php}
         */
        'ctype_graph': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[\x21-\x7E]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are lowercase letters.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-lower.php}
         */
        'ctype_lower': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[a-z]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are printable.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-print.php}
         */
        'ctype_print': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[\x20-\x7E]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are punctuation characters.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-punct.php}
         */
        'ctype_punct': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[!"\#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are whitespace characters.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-space.php}
         */
        'ctype_space': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[\s\t\n\r\f\v]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are uppercase letters.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-upper.php}
         */
        'ctype_upper': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[A-Z]+$/.test(text));
            }
        ),

        /**
         * Checks if all characters in the string are hexadecimal digits.
         *
         * @see {@link https://secure.php.net/manual/en/function.ctype-xdigit.php}
         */
        'ctype_xdigit': internals.typeFunction(
            'mixed $text : bool',
            function (textValue) {
                var text = textValue.getNative();

                if (text === '') {
                    return valueFactory.createBoolean(false);
                }

                text = handleIntegerInput(text);

                return valueFactory.createBoolean(/^[0-9A-Fa-f]+$/.test(text));
            }
        )
    };
};
