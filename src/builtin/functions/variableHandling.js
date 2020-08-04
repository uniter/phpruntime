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
    hasOwn = {}.hasOwnProperty,
    phpCommon = require('phpcommon'),
    MAX_DUMPS = 20000,
    MAX_RECURSION_DEPTH = 5,
    MAX_STRING_LENGTH = 2048,
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        output = internals.output,
        valueFactory = internals.valueFactory;

    function createTypeChecker(name, type) {
        return function (valueReference) {
            if (!valueReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    name + '() expects exactly 1 parameter, 0 given'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(valueReference.getValue().getType() === type);
        };
    }

    return {
        /**
         * Fetches the type of a variable or value
         *
         * @see {@link https://secure.php.net/manual/en/function.gettype.php}
         *
         * @param {Variable|Value} valueReference The variable or value to fetch the type of
         * @returns {StringValue}
         */
        'gettype': function (valueReference) {
            var value,
                type;

            if (!valueReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'gettype() expects exactly 1 parameter, 0 given'
                );

                return valueFactory.createNull();
            }

            value = valueReference.getValue();
            type = value.getType();

            if (type === 'float') {
                // For historical reasons "double" is returned rather than "float"
                type = 'double';
            } else if (type === 'null') {
                type = 'NULL';
            }

            return valueFactory.createString(type);
        },

        'is_array': createTypeChecker('is_array', 'array'),

        'is_bool': createTypeChecker('is_bool', 'boolean'),

        'is_float': createTypeChecker('is_float', 'float'),

        /**
         * Determines whether the type of a variable is an integer
         *
         * @see {@link https://secure.php.net/manual/en/function.is-int.php}
         *
         * @param {Variable|Reference|Value} valueReference The variable or value to check the type of
         * @returns {BooleanValue}
         */
        'is_int': createTypeChecker('is_int', 'int'),

        /**
         * Determines whether a variable is a number or a string containing a number
         *
         * @see {@link https://secure.php.net/manual/en/function.is-numeric.php}
         *
         * @param {Variable|Reference|Value} valueReference The variable or value to check the numericness of
         * @returns {BooleanValue}
         */
        'is_numeric': function (valueReference) {
            var value;

            if (!valueReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'is_numeric() expects exactly 1 parameter, 0 given'
                );

                return valueFactory.createNull();
            }

            value = valueReference.getValue();

            return valueFactory.createBoolean(
                value.getType() === 'int' ||
                value.getType() === 'float' ||
                (
                    value.getType() === 'string' &&
                    isFinite(value.getNative())
                )
            );
        },

        /**
         * Determines whether the type of a variable is an object
         *
         * @see {@link https://secure.php.net/manual/en/function.is-object.php}
         *
         * @param {Variable|Reference|Value} valueReference The variable or value to check the type of
         * @returns {BooleanValue}
         */
        'is_object': createTypeChecker('is_object', 'object'),

        /**
         * Determines whether the type of a variable is a string
         *
         * @see {@link https://secure.php.net/manual/en/function.is-string.php}
         *
         * @param {Variable|Reference|Value} valueReference The variable or value to check the type of
         * @returns {BooleanValue}
         */
        'is_string': createTypeChecker('is_string', 'string'),

        /**
         * Outputs or returns a valid PHP code string that will evaluate to the given value
         *
         * @see {@link https://secure.php.net/manual/en/function.var-export.php}
         *
         * @param {Variable|Reference|Value} valueReference The variable or value to export
         * @param {Variable|Reference|Value} returnReference Whether to return the string rather than output
         * @returns {NullValue|StringValue} Returns NULL when outputting, the code string when return=true
         */
        'var_export': function (valueReference, returnReference) {
            var exportedCodeString,
                shouldReturn,
                value;

            function exportValue(value) {
                var parts;

                switch (value.getType()) {
                    case 'array':
                        parts = [];
                        value.getKeys().forEach(function (keyValue) {
                            var elementPair = value.getElementPairByKey(keyValue);

                            parts.push(
                                '  ' +
                                exportValue(elementPair.getKey()) +
                                ' => ' +
                                exportValue(elementPair.getValue()) +
                                ',\n'
                            );
                        });
                        return 'array (\n' + parts.join('') + ')';
                    case 'boolean':
                    case 'float':
                    case 'int':
                        return '' + value.getNative();
                    case 'null':
                        return 'NULL';
                    case 'object':
                        if (value.getLength() > 0) {
                            throw new Error('var_export() :: Non-empty objects not implemented');
                        }

                        return value.getClassName() + '::__set_state(array(\n))';
                    case 'string':
                        return '\'' + value.getNative().replace(/['\\]/g, '\\$&') + '\'';
                    default:
                        throw new Error('var_export() :: Unexpected value type "' + value.getType() + '"');
                }
            }

            if (!valueReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'var_export() expects at least 1 parameter, 0 given'
                );

                return valueFactory.createNull();
            }

            value = valueReference.getValue();

            // Output the string representation by default, or return it if specified
            shouldReturn = returnReference ? returnReference.getNative() : false;

            exportedCodeString = exportValue(value);

            if (shouldReturn) {
                return valueFactory.createString(exportedCodeString);
            }

            // No trailing newline should be output
            output.write(exportedCodeString);

            return valueFactory.createNull();
        },

        // NB: This output matches that of PHP with XDebug disabled
        'var_dump': function (valueReference) {
            var dumps = 0,
                value,
                objectIDHash = {};

            if (!valueReference) {
                callStack.raiseError(PHPError.E_WARNING, 'var_dump() expects at least 1 parameter, 0 given');
                return;
            }

            value = valueReference.getValue();

            function dump(value, depth, isReference, arraysEncountered) {
                var currentIndentation = new Array(depth).join('  '),
                    names,
                    nativeLength,
                    nativeValue,
                    nextIndentation = new Array(depth + 1).join('  '),
                    representation = currentIndentation;

                dumps++;

                if (depth > MAX_RECURSION_DEPTH || dumps > MAX_DUMPS) {
                    representation += '*RECURSION*';
                    return representation + '\n';
                }

                if (value.getType() === 'array') {
                    nativeValue = value.getValue();

                    if (arraysEncountered.indexOf(nativeValue) > -1) {
                        // Within the current branch of values being dumped, we've already
                        // dumped this array - bail out to avoid infinite recursion
                        representation += '*RECURSION*';

                        return representation + '\n';
                    }

                    if (depth > 1) {
                        arraysEncountered.push(nativeValue);
                    }

                    if (isReference) {
                        representation += '&';
                    }

                    representation += 'array(' + value.getLength() + ') {\n';

                    _.each(value.getKeys(), function (key) {
                        var element = value.getElementByKey(key),
                            elementRepresentation;

                        elementRepresentation = dump(
                            element.getValue(),
                            depth + 1,
                            element.isReference(),
                            arraysEncountered.slice()
                        );

                        representation += nextIndentation +
                            '[' +
                            JSON.stringify(key.getNative()) +
                            ']=>\n' +
                            elementRepresentation;
                    });

                    representation += currentIndentation + '}';
                } else if (value.getType() === 'object') {
                    if (hasOwn.call(objectIDHash, value.getID())) {
                        representation += '*RECURSION*';
                        return representation + '\n';
                    }

                    if (isReference) {
                        representation += '&';
                    }

                    names = value.getInstancePropertyNames();

                    representation += 'object(' + value.getClassName() + ')#' + value.getID() + ' (' + names.length + ') {\n';

                    objectIDHash[value.getID()] = true;

                    _.each(names, function (nameValue) {
                        var property = value.getInstancePropertyByName(nameValue);
                        representation += nextIndentation +
                            '[' +
                            JSON.stringify(nameValue.getNative()) +
                            ']=>\n' +
                            dump(
                                property.getValue(),
                                depth + 1,
                                property.isReference(),
                                arraysEncountered.slice()
                            );
                    });

                    representation += currentIndentation + '}';
                } else {
                    if (isReference) {
                        representation += '&';
                    }

                    switch (value.getType()) {
                    case 'boolean':
                        representation += 'bool(' + (value.getNative() ? 'true' : 'false') + ')';
                        break;
                    case 'float':
                        representation += 'float(' + value.getNative() + ')';
                        break;
                    case 'int':
                        representation += 'int(' + value.getNative() + ')';
                        break;
                    case 'null':
                        representation += 'NULL';
                        break;
                    case 'string':
                        nativeValue = value.getNative();
                        nativeLength = nativeValue.length;

                        if (nativeLength > MAX_STRING_LENGTH) {
                            nativeValue = nativeValue.substr(0, MAX_STRING_LENGTH) + '...';
                        }

                        representation += 'string(' + nativeLength + ') "' + nativeValue + '"';
                        break;
                    default:
                        throw new Error('var_dump() :: Unsupported value type "' + value.getType() + '"');
                    }
                }

                return representation + '\n';
            }

            output.write(dump(value, 1, false, []));
        }
    };
};
