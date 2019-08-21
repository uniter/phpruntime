/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    phpCommon = require('phpcommon'),
    MissingFormatArgumentException = require('../bindings/string/Exception/MissingFormatArgumentException'),
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        formatter = internals.getBinding('stringFormatter'),
        valueFactory = internals.valueFactory;

    return {
        /**
         * Split a string into an array by a certain substring
         *
         * @see {@link https://secure.php.net/manual/en/function.explode.php}
         *
         * @param {Reference|StringValue|Variable} delimiterReference  The substring to split the input string on
         * @param {Reference|StringValue|Variable} stringReference  The string to split
         * @param {Reference|IntegerValue|Variable} limitReference  The string to split
         * @returns {ArrayValue|BooleanValue} The resulting array on success, or false on failure
         */
        'explode': function (delimiterReference, stringReference, limitReference) {
            var delimiter,
                elements,
                limit,
                string;

            if (arguments.length < 2) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'explode() expects at least 2 parameters, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            delimiter = delimiterReference.getValue().coerceToString().getNative();
            limit = limitReference ? limitReference.getValue().getNative() : null;
            string = stringReference.getValue().coerceToString().getNative();

            elements = string.split(delimiter);

            if (limit === 0) {
                limit = 1;
            }

            if (limit < 0) {
                elements = elements.slice(0, elements.length + limit);
            } else if (limit !== null) {
                if (limit > elements.length) {
                    limit = elements.length;
                }

                elements = elements.slice(0, limit - 1).concat(elements.slice(limit - 1).join(delimiter));
            }

            return valueFactory.createArray(elements);
        },

        'strlen': function (stringReference) {
            var stringValue = stringReference.getValue();

            if (stringValue.getType() === 'array' || stringValue.getType() === 'object') {
                callStack.raiseError(PHPError.E_WARNING, 'strlen() expects parameter 1 to be string, ' + stringValue.getType() + ' given');
                return valueFactory.createNull();
            }

            return valueFactory.createInteger(stringValue.getLength());
        },

        /**
         * Builds and returns a formatted string
         *
         * @see {@link https://secure.php.net/manual/en/function.sprintf.php}
         *
         * @param {Reference|Value|Variable} templateReference  The template format string
         * @returns {StringValue|BooleanValue} The built string on success, or false on failure
         */
        'sprintf': function (templateReference) {
            var args = [].slice.call(arguments, 1);

            try {
                return valueFactory.createString(
                    formatter.format(templateReference.getNative(), args)
                );
            } catch (error) {
                if (error instanceof MissingFormatArgumentException) {
                    callStack.raiseError(PHPError.E_WARNING, 'sprintf(): Too few arguments');

                    return valueFactory.createBoolean(false);
                }

                throw error;
            }
        },

        'str_replace': function (
            searchReference,
            replaceReference,
            subjectReference,
            countReference
        ) {
            function getNative(reference) {
                var value = reference.getValue();

                return value.getNative();
            }

            var count = 0,
                search,
                replacement,
                subject,
                replace = countReference ?
                    function replace(search, replacement, subject) {
                        return subject.replace(search, function () {
                            count++;

                            return replacement;
                        });
                    } :
                    function replace(search, replacement, subject) {
                        return subject.replace(search, replacement);
                    };

            if (arguments.length < 3) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'str_replace() expects at least 3 parameters, ' + arguments.length + ' given'
                );

                return valueFactory.createNull();
            }

            search = getNative(searchReference);
            replacement = getNative(replaceReference);
            subject = getNative(subjectReference);

            // Use a regex to search for substrings, for speed
            function buildRegex(search) {
                return new RegExp(
                    _.escapeRegExp(search),
                    'g'
                );
            }

            if (_.isArray(search)) {
                if (_.isArray(replacement)) {
                    // Search and replacement are both arrays
                    _.each(search, function (search, index) {
                        subject = replace(
                            buildRegex(search),
                            index < replacement.length ? replacement[index] : '',
                            subject
                        );
                    });
                } else {
                    // Only search is an array, replacement is just a string
                    _.each(search, function (search) {
                        subject = replace(
                            buildRegex(search),
                            replacement,
                            subject
                        );
                    });
                }
            } else {
                // Simple case: search and replacement are both strings
                subject = replace(
                    buildRegex(search),
                    replacement,
                    subject
                );
            }

            if (countReference) {
                countReference.setValue(valueFactory.createInteger(count));
            }

            return valueFactory.createString(subject);
        },

        'strpos': function (haystackReference, needleReference, offsetReference) {
            var haystack = haystackReference.getNative(),
                needle = needleReference.getNative(),
                offset = offsetReference ? offsetReference.getNative() : 0,
                position;

            // Negative offsets indicate no. of chars at end of haystack to scan
            if (offset < 0) {
                offset = haystack.length + offset;
            }

            position = haystack.substr(offset).indexOf(needle);

            if (position === -1) {
                return valueFactory.createBoolean(false);
            }

            return valueFactory.createInteger(offset + position);
        },

        /**
         * Fetch the substring after (and including) the last occurrence of a needle
         *
         * @see {@link https://secure.php.net/manual/en/function.strrchr.php}
         *
         * @param {Reference|StringValue|Variable} haystackReference  The string to search for the needle inside
         * @param {Reference|StringValue|Variable} needleReference  The substring to look for in the haystack
         * @returns {StringValue|BooleanValue|NullValue} The resulting string on success, false if not found and null on error
         */
        'strrchr': function (haystackReference, needleReference) {
            var haystack,
                needleValue,
                needle,
                position;

            if (arguments.length < 2) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'strrchr() expects exactly 2 parameters, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            haystack = haystackReference.getValue().coerceToString().getNative();
            needleValue = needleReference.getValue();
            needle = needleValue.getType() === 'string' ?
                needleValue.getNative().charAt(0) :
                String.fromCharCode(needleValue.coerceToInteger().getNative());
            position = haystack.lastIndexOf(needle);

            if (position === -1) {
                // Return FALSE if needle is not found in haystack
                return valueFactory.createBoolean(false);
            }

            return valueFactory.createString(haystack.substr(position));
        },

        'strrpos': function (haystackReference, needleReference, offsetReference) {
            var haystack = haystackReference.getValue().getNative(),
                needle = needleReference.getValue().getNative(),
                offset = offsetReference ? offsetReference.getValue().getNative() : 0,
                position;

            // Negative offsets indicate no. of chars at end of haystack to scan
            if (offset < 0) {
                offset = haystack.length + offset;
            }

            position = haystack.substr(offset).lastIndexOf(needle);

            if (position === -1) {
                return valueFactory.createBoolean(false);
            }

            return valueFactory.createInteger(offset + position);
        },

        /**
         * Convert a string to lowercase
         *
         * @see {@link https://secure.php.net/manual/en/function.strtolower.php}
         *
         * @param {Reference|StringValue|Variable} stringReference  The string to convert to lowercase
         * @returns {StringValue|NullValue} The resulting string on success, or null on failure
         */
        'strtolower': function (stringReference) {
            var string;

            if (arguments.length < 1) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'strtolower() expects exactly 1 parameter, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            string = stringReference.getValue().coerceToString().getNative();

            return valueFactory.createString(string.toLowerCase());
        },

        /**
         * Convert a string to uppercase
         *
         * @see {@link https://secure.php.net/manual/en/function.strtoupper.php}
         *
         * @param {Reference|StringValue|Variable} stringReference  The string to convert to uppercase
         * @returns {StringValue|NullValue} The resulting string on success, or null on failure
         */
        'strtoupper': function (stringReference) {
            var string;

            if (arguments.length < 1) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'strtoupper() expects exactly 1 parameter, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            string = stringReference.getValue().coerceToString().getNative();

            return valueFactory.createString(string.toUpperCase());
        },

        'strtr': function (stringReference) {
            var from,
                to,
                i,
                replacePairs,
                replaceKeys,
                replaceValues,
                string = stringReference.getValue().getNative();

            if (arguments.length === 2) {
                // 2-operand form: second argument is an associative array
                // mapping substrings to search for to their replacements
                replacePairs = arguments[1].getValue();
                replaceKeys = replacePairs.getKeys();
                replaceValues = replacePairs.getValues();

                _.each(replaceKeys, function (key, index) {
                    var find = key.coerceToString().getNative(),
                        replace = replaceValues[index].coerceToString().getNative();

                    string = string.replace(
                        new RegExp(_.escapeRegExp(find), 'g'),
                        replace
                    );
                });
            } else {
                // 3-operand form: replace all characters in $from
                // with their counterparts at that index in $to
                from = arguments[1].getValue().getNative();
                to = arguments[2].getValue().getNative();

                for (i = 0; i < from.length && i < to.length; i++) {
                    string = string.replace(
                        new RegExp(_.escapeRegExp(from.charAt(i)), 'g'),
                        to.charAt(i)
                    );
                }
            }

            return valueFactory.createString(string);
        },

        'substr': function (stringReference, startReference, lengthReference) {
            var string = stringReference.getValue().getNative(),
                start = startReference.getValue().getNative(),
                length = lengthReference ? lengthReference.getValue().getNative() : string.length,
                substring;

            if (start < 0) {
                start = string.length + start;
            }

            if (length < 0) {
                length = string.length - start + length;
            }

            substring = string.substr(start, length);

            return valueFactory.createString(substring);
        },

        /**
         * Counts the number of substring occurrences
         *
         * @see {@link https://secure.php.net/manual/en/function.substr-count.php}
         *
         * @param {Variable|Value} haystackReference    The string to search inside
         * @param {Variable|Value} needleReference      The string to search inside
         * @param {Variable|Value} offsetReference      The position to start searching from
         * @param {Variable|Value} lengthReference      The no. of chars from the offset to search inside
         * @returns {IntegerValue}                      The number of occurrences found
         */
        'substr_count': function (haystackReference, needleReference, offsetReference, lengthReference) {
            var haystack,
                needle,
                offset,
                length,
                trimmedHaystack;

            if (arguments.length < 2) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'substr_count() expects at least 2 parameters, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            haystack = haystackReference.getValue().coerceToString().getNative();
            needle = needleReference.getValue().coerceToString().getNative();
            // Negative offsets are natively supported by JS .substr()
            offset = offsetReference ? offsetReference.getNative() : 0;

            if (lengthReference) {
                length = lengthReference.getNative();

                // Negative lengths count back from the end of the string
                if (length < 0) {
                    length = haystack.length - offset + length;
                }
            }

            trimmedHaystack = haystack.substr(offset, length);

            return valueFactory.createInteger(trimmedHaystack.split(needle).length - 1);
        }
    };
};
