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
        stdout = internals.stdout,
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
            var value = valueReference.getValue(),
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

        // NB: This output matches that of PHP with XDebug disabled
        'var_dump': function (valueReference) {
            var arrays = [],
                dumps = 0,
                value,
                objectIDHash = {};

            if (!valueReference) {
                callStack.raiseError(PHPError.E_WARNING, 'var_dump() expects at least 1 parameter, 0 given');
                return;
            }

            value = valueReference.getValue();

            function dump(value, depth, isReference) {
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
                    if (arrays.indexOf(value.getValue()) > -1) {
                        representation += '*RECURSION*';
                        return representation + '\n';
                    }

                    if (isReference) {
                        arrays.push(value.getValue());
                        representation += '&';
                    }

                    representation += 'array(' + value.getLength() + ') {\n';

                    _.each(value.getKeys(), function (key) {
                        var element = value.getElementByKey(key),
                            elementRepresentation;

                        elementRepresentation = dump(element.getValue(), depth + 1, element.isReference());

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
                                property.isReference()
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
                    case 'integer':
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
                    }
                }

                return representation + '\n';
            }

            stdout.write(dump(value, 1));
        }
    };
};
