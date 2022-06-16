/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var hasOwn = {}.hasOwnProperty,
    phpCommon = require('phpcommon'),
    MAX_DUMPS = 20000,
    MAX_RECURSION_DEPTH = 5,
    MAX_STRING_LENGTH = 2048,
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        flow = internals.flow,
        futureFactory = internals.futureFactory,
        globalNamespace = internals.globalNamespace,
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
         * Fetches the type of a resource value.
         *
         * @see {@link https://secure.php.net/manual/en/function.get-resource-type.php}
         *
         * @param {Variable|Value} valueReference The variable or value to fetch the type of
         * @returns {StringValue}
         */
        'get_resource_type': internals.typeFunction(
            // FIXME: Add resource parameter type once supported.
            'mixed $resource',
            function (resourceValue) {
                if (resourceValue.getType() !== 'resource') {
                    throw new Error('get_resource_type() :: Non-resource given - FIXME add parameter type');
                }

                return resourceValue.getResourceType();
            }
        ),

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

        /**
         * Determines whether a value is a valid callable function, method, closure or invokable object
         *
         * @see {@link https://secure.php.net/manual/en/function.is-callable.php}
         *
         * @param {Reference|Value|Variable} valueReference
         * @param {BooleanValue|Reference|Variable=} syntaxOnlyReference
         * @param {Reference|Variable=} callableNameReference
         * @returns {FutureValue<BooleanValue>}
         */
        'is_callable': function (valueReference, syntaxOnlyReference, callableNameReference) {
            var syntaxOnly = syntaxOnlyReference && syntaxOnlyReference.getValue().getNative(),
                value = valueReference.getValue();

            if (syntaxOnly) {
                throw new Error('is_callable() :: syntax_only=true is not supported');
            }

            if (callableNameReference) {
                throw new Error('is_callable() :: callable_name is not supported');
            }

            return value.isCallable(globalNamespace)
                .asValue();
        },

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
                    representationFuture = futureFactory.createPresent(currentIndentation);

                dumps++;

                if (depth > MAX_RECURSION_DEPTH || dumps > MAX_DUMPS) {
                    // We've not detected any circular references, but the depth or number of dumps
                    // has exceeded our hardcoded limits so bail out.
                    representationFuture = representationFuture.concatString('*RECURSION*');

                    return representationFuture.concatString('\n');
                }

                if (value.getType() === 'array') {
                    nativeValue = value.getValue();

                    if (arraysEncountered.indexOf(nativeValue) > -1) {
                        // Within the current branch of values being dumped, we've already
                        // dumped this array - bail out to avoid infinite recursion.
                        representationFuture = representationFuture.concatString('*RECURSION*');

                        return representationFuture.concatString('\n');
                    }

                    if (depth > 1) {
                        arraysEncountered.push(nativeValue);
                    }

                    if (isReference) {
                        representationFuture = representationFuture.concatString('&');
                    }

                    representationFuture = representationFuture.concatString('array(' + value.getLength() + ') {\n');

                    representationFuture = representationFuture.next(function (previousText) {
                        return flow.mapAsync(value.getKeys(), function (key) {
                            var element = value.getElementByKey(key);

                            return element.getValue().asFuture().next(function (elementValue) {
                                return dump(
                                    elementValue,
                                    depth + 1,
                                    element.isReference(),
                                    arraysEncountered.slice()
                                );
                            }).next(function (elementRepresentation) {
                                return nextIndentation +
                                    '[' +
                                    JSON.stringify(key.getNative()) +
                                    ']=>\n' +
                                    elementRepresentation;
                            });
                        }).next(function (elementTexts) {
                            return previousText + elementTexts.join('');
                        });
                    });

                    representationFuture = representationFuture.concatString(currentIndentation + '}');
                } else if (value.getType() === 'object') {
                    if (hasOwn.call(objectIDHash, value.getID())) {
                        representationFuture = representationFuture.concatString('*RECURSION*');

                        return representationFuture.concatString('\n');
                    }

                    if (isReference) {
                        representationFuture = representationFuture.concatString('&');
                    }

                    names = value.getInstancePropertyNames();

                    representationFuture = representationFuture.concatString(
                        // ObjectValues have their unique ID shown.
                        'object(' + value.getClassName() + ')#' + value.getID() + ' (' + names.length + ') {\n'
                    );

                    objectIDHash[value.getID()] = true;

                    representationFuture = representationFuture.next(function (previousText) {
                        return flow.mapAsync(names, function (nameValue) {
                            var property = value.getInstancePropertyByName(nameValue);

                            return property.getValue().asFuture().next(function (propertyValue) {
                                return dump(
                                    propertyValue,
                                    depth + 1,
                                    property.isReference(),
                                    arraysEncountered.slice()
                                );
                            }).next(function (propertyRepresentation) {
                                return nextIndentation +
                                    '[' +
                                    JSON.stringify(nameValue.getNative()) +
                                    ']=>\n' +
                                    propertyRepresentation;
                            });
                        }).next(function (propertyTexts) {
                            return previousText + propertyTexts.join('');
                        });
                    });

                    representationFuture = representationFuture.concatString(currentIndentation + '}');
                } else {
                    if (isReference) {
                        representationFuture = representationFuture.concatString('&');
                    }

                    switch (value.getType()) {
                    case 'boolean':
                        representationFuture = representationFuture.concatString(
                            'bool(' + (value.getNative() ? 'true' : 'false') + ')'
                        );
                        break;
                    case 'float':
                        representationFuture = representationFuture.concatString(
                            'float(' + value.getNative() + ')'
                        );
                        break;
                    case 'int':
                        representationFuture = representationFuture.concatString(
                            'int(' + value.getNative() + ')'
                        );
                        break;
                    case 'null':
                        representationFuture = representationFuture.concatString('NULL');
                        break;
                    case 'string':
                        nativeValue = value.getNative();
                        nativeLength = nativeValue.length;

                        if (nativeLength > MAX_STRING_LENGTH) {
                            nativeValue = nativeValue.substr(0, MAX_STRING_LENGTH) + '...';
                        }

                        representationFuture = representationFuture.concatString(
                            'string(' + nativeLength + ') "' + nativeValue + '"'
                        );
                        break;
                    default:
                        throw new Error('var_dump() :: Unsupported value type "' + value.getType() + '"');
                    }
                }

                return representationFuture.concatString('\n');
            }

            return dump(value, 1, false, []).next(function (text) {
                output.write(text);
            });
        }
    };
};
