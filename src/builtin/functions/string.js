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
        trimmer = internals.getBinding('stringTrimmer'),
        valueFactory = internals.valueFactory;

    return {
        /**
         * Split a string into an array by a certain substring.
         *
         * @see {@link https://secure.php.net/manual/en/function.explode.php}
         */
        'explode': internals.typeFunction(
            'string $separator, string $string, int $limit = PHP_INT_MAX : array',
            function (delimiterValue, stringValue, limitValue) {
                var delimiter = delimiterValue.getNative(),
                    string = stringValue.getNative(),
                    elements = string.split(delimiter),
                    limit = limitValue.getType() !== 'null' ?
                        limitValue.getNative() :
                        null;

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
            }
        ),

        /**
         * Strip whitespace or other characters from the end of a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.rtrim.php}
         */
        'rtrim': internals.typeFunction(
            'string $string, string $characters = " \\n\\r\\t\\u000b\\u0000" : string',
            function (stringValue, characterMaskValue) {
                var nativeString = stringValue.getNative(),
                    characterMask = characterMaskValue.getNative(),
                    // Support ".." for character ranges.
                    characterClass = trimmer.buildTrimCharacterClass('rtrim', characterMask),
                    characterMaskRegex = new RegExp(
                        '[' + characterClass + ']+$',
                        'g'
                    );

                return valueFactory.createString(nativeString.replace(characterMaskRegex, ''));
            }
        ),

        /**
         * Returns the length of a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.strlen.php}
         */
        'strlen': internals.typeFunction('string $str : int', function (stringValue) {
            return valueFactory.createInteger(stringValue.getLength());
        }),

        /**
         * Builds and returns a formatted string.
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

        /**
         * Replaces all occurrences of the search string in the subject(s) with the replacement string.
         * Optionally captures the number of replacements performed if $count is specified.
         *
         * @see {@link https://secure.php.net/manual/en/function.str-replace.php}
         */
        'str_replace': internals.typeFunction(
            'array|string $search, array|string $replace, string|array $subject, int &$count = null : string|array',
            function (
                searchValue,
                replaceValue,
                subjectValue,
                countReference
            ) {
                var count = 0,
                    search = searchValue.getNative(),
                    replacement = replaceValue.getNative(),
                    subject = subjectValue.getNative(),
                    replace,
                    replaceSingleSubject;

                if (countReference) {
                    replaceSingleSubject = function replaceSingleSubject(search, replacement, subject) {
                        // We need to keep track of the replacement count, so use a callback.
                        return subject.replace(search, function () {
                            count++;

                            return replacement;
                        });
                    };
                } else {
                    replaceSingleSubject = function replaceSingleSubject(search, replacement, subject) {
                        // No need to track replacement count, so just pass a replacement string.
                        return subject.replace(search, replacement);
                    };
                }

                if (subjectValue.getType() === 'array') {
                    // An array of potentially multiple subjects was provided,
                    // find/replace needs to happen for all of them.
                    replace = function replaceMultipleSubjects(search, replacement, subjects) {
                        return _.map(subjects, function (subject) {
                            return replaceSingleSubject(search, replacement, subject);
                        });
                    };
                } else {
                    // Only a single subject was provided.
                    replace = replaceSingleSubject;
                }

                // Use a regex to search for substrings, for speed.
                function buildRegex(search) {
                    return new RegExp(
                        _.escapeRegExp(search),
                        'g'
                    );
                }

                if (_.isArray(search)) {
                    if (_.isArray(replacement)) {
                        // Search and replacement are both arrays.
                        _.each(search, function (search, index) {
                            subject = replace(
                                buildRegex(search),
                                index < replacement.length ? replacement[index] : '',
                                subject
                            );
                        });
                    } else {
                        // Only search is an array, replacement is just a string.
                        _.each(search, function (search) {
                            subject = replace(
                                buildRegex(search),
                                replacement,
                                subject
                            );
                        });
                    }
                } else {
                    // Simple case: search and replacement are both strings.
                    subject = replace(
                        buildRegex(search),
                        replacement,
                        subject
                    );
                }

                if (countReference.isReferenceable()) {
                    // A variable was provided for $count to be written back to.
                    countReference.setValue(valueFactory.createInteger(count));
                }

                return valueFactory.createString(subject);
            }
        ),

        /**
         * Finds the position of the first occurrence of a substring.
         *
         * @see {@link https://secure.php.net/manual/en/function.strpos.php}
         */
        'strpos': internals.typeFunction(
            'string $haystack, string $needle, int $offset = 0',
            function (haystackValue, needleValue, offsetValue) {
                // TODO: Add "int|false" return type above once supported.
                var haystack = haystackValue.getNative(),
                    needle = needleValue.getNative(),
                    offset = offsetValue.getNative(),
                    position;

                // Negative offsets indicate no. of chars at end of haystack to scan.
                if (offset < 0) {
                    offset = haystack.length + offset;
                }

                position = haystack.indexOf(needle, offset);

                if (position === -1) {
                    return valueFactory.createBoolean(false);
                }

                return valueFactory.createInteger(position);
            }
        ),

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

        /**
         * Extracts part of a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.substr.php}
         *
         * @param {Reference|Variable|Value} stringValue The string to extract from.
         * @param {Reference|Variable|Value} offsetValue The position to start from.
         * @param {Reference|Variable|Value} lengthValue The no. of chars to extract.
         * @returns {StringValue} The extracted substring.
         */
        'substr': internals.typeFunction(
            'string $string, int $offset, ?int $length = null: string',
            function (stringValue, offsetValue, lengthValue) {
                var string = stringValue.getNative(),
                    start = offsetValue.getNative(),
                    length = lengthValue.getType() !== 'null' ? lengthValue.getNative() : string.length,
                    substring;

                if (start < 0) {
                    // Negative start offsets are offset from the end of the string.
                    start = string.length + start;
                }

                if (length < 0) {
                    // Negative lengths subtract the last N characters of the string.
                    length = string.length - start + length;
                }

                substring = string.substr(start, length);

                return valueFactory.createString(substring);
            }
        ),

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
        },

        /**
         * Strip whitespace or other characters from both ends of a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.trim.php}
         */
        'trim': internals.typeFunction(
            'string $string, string $characters = " \\n\\r\\t\\u000b\\u0000" : string',
            function (stringValue, characterMaskValue) {
                var nativeString = stringValue.getNative(),
                    characterMask = characterMaskValue.getNative(),
                    // Support ".." for character ranges.
                    characterClass = trimmer.buildTrimCharacterClass('trim', characterMask),
                    characterMaskRegex = new RegExp(
                        '^[' +
                        characterClass +
                        ']+|[' +
                        characterClass +
                        ']+$',
                        'g'
                    );

                return valueFactory.createString(nativeString.replace(characterMaskRegex, ''));
            }
        )
    };
};
