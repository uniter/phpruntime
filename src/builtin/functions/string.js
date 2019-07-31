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
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory;

    return {
        'explode': function (delimiterReference, stringReference, limitReference) {
            var delimiter,
                elements,
                limit,
                string;

            delimiter = delimiterReference.getValue().getNative();
            limit = limitReference ? limitReference.getValue().getNative() : null;
            string = stringReference.getValue().getNative();

            elements = string.split(delimiter);

            if (limit === 0) {
                limit = 1;
            }

            if (limit < 0) {
                elements = elements.slice(0, elements.length + limit);
            } else if (limit !== null) {
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

        'strrchr': function (haystackReference, needleReference) {
            var haystack = haystackReference.getNative(),
                needle = needleReference.getNative().charAt(0),
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

        'strtolower': function (stringReference) {
            var string = stringReference.getNative();

            return valueFactory.createString(string.toLowerCase());
        },

        'strtoupper': function (stringReference) {
            var string = stringReference.getNative();

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
        }
    };
};
