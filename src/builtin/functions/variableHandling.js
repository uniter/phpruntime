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
    Exception = phpCommon.Exception;

module.exports = function (internals) {
    var flow = internals.flow,
        futureFactory = internals.futureFactory,
        globalNamespace = internals.globalNamespace,
        output = internals.output,
        valueFactory = internals.valueFactory;

    function createTypeChecker(name, type) {
        return internals.typeFunction('mixed $value : bool', function (value) {
            return valueFactory.createBoolean(value.getType() === type);
        });
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
            'mixed $resource : string',
            function (resourceValue) {
                if (resourceValue.getType() !== 'resource') {
                    throw new Exception('get_resource_type() :: Non-resource given - FIXME add parameter type');
                }

                return resourceValue.getResourceType();
            }
        ),

        /**
         * Fetches the type of a variable or value.
         *
         * @see {@link https://secure.php.net/manual/en/function.gettype.php}
         */
        'gettype': internals.typeFunction('mixed $value : string', function (value) {
            var type = value.getType();

            if (type === 'float') {
                // For historical reasons "double" is returned rather than "float".
                type = 'double';
            } else if (type === 'null') {
                type = 'NULL';
            }

            return valueFactory.createString(type);
        }),

        /**
         * Determines whether the given value or variable is an array.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-array.php}
         */
        'is_array': createTypeChecker('is_array', 'array'),

        /**
         * Determines whether the given value or variable is a boolean.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-bool.php}
         */
        'is_bool': createTypeChecker('is_bool', 'boolean'),

        /**
         * Determines whether a value is a valid callable function, method,
         * closure or invokable object from the current scope.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-callable.php}
         */
        'is_callable': internals.typeFunction(
            'mixed $value, bool $syntax_only = false, string &$callable_name = null : bool',
            function (value, syntaxOnlyValue, callableNameReference) {
                var syntaxOnly = syntaxOnlyValue.getNative();

                if (syntaxOnly) {
                    throw new Exception('is_callable() :: $syntax_only=true is not yet supported');
                }

                if (callableNameReference.isReferenceable()) {
                    throw new Exception('is_callable() :: $callable_name is not yet supported');
                }

                return value.isCallable(globalNamespace)
                    .asValue();
            }
        ),

        /**
         * Determines whether the given value or variable is a float.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-float.php}
         */
        'is_float': createTypeChecker('is_float', 'float'),

        /**
         * Determines whether the type of a variable is an integer.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-int.php}
         */
        'is_int': createTypeChecker('is_int', 'int'),

        /**
         * Determines whether the type of a variable is an integer (alias of is_int(...)).
         *
         * @see {@link https://secure.php.net/manual/en/function.is-integer.php}
         */
        'is_integer': 'is_int',

        /**
         * Determines whether a variable is null.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-null.php}
         */
        'is_null': createTypeChecker('is_null', 'null'),

        /**
         * Determines whether a variable is a number or a string containing a number.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-numeric.php}
         */
        'is_numeric': internals.typeFunction(
            'mixed $value : bool',
            function (value) {
                return valueFactory.createBoolean(value.isNumeric());
            }
        ),

        /**
         * Determines whether the type of a variable is an object
         *
         * @see {@link https://secure.php.net/manual/en/function.is-object.php}
         */
        'is_object': createTypeChecker('is_object', 'object'),

        /**
         * Determines whether the type of a variable is a resource.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-resource.php}
         */
        'is_resource': createTypeChecker('is_resource', 'resource'),

        /**
         * Determines whether the type of a variable is a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-string.php}
         */
        'is_string': createTypeChecker('is_string', 'string'),

        /**
         * Outputs or returns a valid PHP code string that will evaluate to the given value.
         *
         * @see {@link https://secure.php.net/manual/en/function.var-export.php}
         */
        'var_export': internals.typeFunction(
            'mixed $value, bool $return = false : ?string',
            function (value, shouldReturnValue) {
                var exportedCodeString,
                    shouldReturn = shouldReturnValue.getNative();

                function exportValue(value) {
                    var parts;

                    switch (value.getType()) {
                        case 'array':
                            parts = [];
                            value.getKeys().forEach(function (keyValue) {
                                var element = value.getElementByKey(keyValue);

                                parts.push(
                                    '  ' +
                                    exportValue(element.getKey()) +
                                    ' => ' +
                                    // Note that references are followed and the eventual value exported instead.
                                    exportValue(element.getValue()) +
                                    ',\n'
                                );
                            });
                            return 'array (\n' + parts.join('') + ')';
                        case 'boolean':
                        case 'float':
                        case 'int':
                            return String(value.getNative());
                        case 'null':
                        case 'resource': // Resources cannot be exported and so become null.
                            return 'NULL';
                        case 'object':
                            if (value.getLength() > 0) {
                                throw new Exception('var_export() :: Non-empty objects not implemented');
                            }

                            return value.getClassName() + '::__set_state(array(\n))';
                        case 'string':
                            return '\'' + value.getNative().replace(/['\\]/g, '\\$&') + '\'';
                        default:
                            throw new Exception('var_export() :: Unexpected value type "' + value.getType() + '"');
                    }
                }

                exportedCodeString = exportValue(value);

                if (shouldReturn) {
                    return valueFactory.createString(exportedCodeString);
                }

                // No trailing newline should be output.
                output.write(exportedCodeString);

                return valueFactory.createNull();
            }
        ),

        /**
         * Outputs a representation of the given variable(s) to the output mechanism.
         *
         * NB: This output matches that of PHP with XDebug disabled.
         *
         * @see {@link https://secure.php.net/manual/en/function.var-dump.php}
         */
        'var_dump': internals.typeFunction('mixed $value', function (value) {
            // TODO: Use variadic param when supported.
            var dumps = 0,
                objectIDHash = {};

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

                            return element.getValue().next(function (elementValue) {
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

                            return property.getValue().next(function (propertyValue) {
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
                    case 'resource':
                        representationFuture = representationFuture.concatString(
                            // ResourceValues have their unique ID and internal type shown.
                            'resource(' + value.getNative() + ') of type (' + value.getResourceType() + ')'
                        );
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
                        throw new Exception('var_dump() :: Unsupported value type "' + value.getType() + '"');
                    }
                }

                return representationFuture.concatString('\n');
            }

            if (arguments.length > 1) {
                throw new Exception(
                    'var_dump() :: Only one argument is currently supported, ' +
                    arguments.length + ' given'
                );
            }

            return dump(value, 1, false, []).next(function (text) {
                output.write(text);
            });
        })
    };
};
