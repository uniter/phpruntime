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
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    MAX_DUMPS = 20000,
    MAX_RECURSION_DEPTH = 5,
    MAX_STRING_LENGTH = 2048,
    Exception = phpCommon.Exception,
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        flow = internals.flow,
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
         * Generates a storable representation of a value.
         *
         * Supports null, bool, int, float, string, array and object types.
         * Object properties of all visibilities (public, protected, private) are included.
         * Circular object references are encoded as r:N back-references.
         *
         * @see {@link https://secure.php.net/manual/en/function.serialize.php}
         */
        'serialize': internals.typeFunction(
            'mixed $value',
            function (value) {
                var objectPositions = {},
                    positionCounter = 0,
                    referenceSlots = [],
                    referenceSlotPositions = [];

                function serializeValue(val) {
                    var allPropertyInfos,
                        className,
                        floatStr,
                        keys,
                        nativeFloat,
                        nativeString,
                        objId,
                        type = val.getType();

                    switch (type) {
                    case 'null':
                        positionCounter++;
                        return futureFactory.createPresent('N;');
                    case 'boolean':
                        positionCounter++;
                        return futureFactory.createPresent('b:' + (val.getNative() ? '1' : '0') + ';');
                    case 'int':
                        positionCounter++;
                        return futureFactory.createPresent('i:' + val.getNative() + ';');
                    case 'float':
                        positionCounter++;
                        nativeFloat = val.getNative();
                        if (isNaN(nativeFloat)) {
                            floatStr = 'NAN';
                        } else if (nativeFloat === Infinity) {
                            floatStr = 'INF';
                        } else if (nativeFloat === -Infinity) {
                            floatStr = '-INF';
                        } else {
                            floatStr = String(nativeFloat);
                        }

                        return futureFactory.createPresent('d:' + floatStr + ';');
                    case 'string':
                        positionCounter++;
                        nativeString = val.getNative();

                        return futureFactory.createPresent('s:' + nativeString.length + ':"' + nativeString + '";');
                    case 'array':
                        positionCounter++;
                        keys = val.getKeys();
                        return flow.mapAsync(keys, function (keyValue) {
                            var element = val.getElementByKey(keyValue),
                                refSlot,
                                slotIndex,
                                slotPos;

                            if (element.isReference()) {
                                refSlot = element.getReference();
                                slotIndex = referenceSlots.indexOf(refSlot);

                                if (slotIndex !== -1) {
                                    // Back-reference to a reference seen before; emit R:N.
                                    slotPos = referenceSlotPositions[slotIndex];

                                    return serializeValue(keyValue).next(function (serializedKey) {
                                        return serializedKey + 'R:' + slotPos + ';';
                                    });
                                }

                                // First encounter: register the reference slot position.
                                positionCounter++;
                                referenceSlots.push(refSlot);
                                referenceSlotPositions.push(positionCounter);
                            }

                            return element.getValue().next(function (elementValue) {
                                return serializeValue(keyValue).next(function (serializedKey) {
                                    return serializeValue(elementValue).next(function (serializedValue) {
                                        return serializedKey + serializedValue;
                                    });
                                });
                            });
                        }).next(function (pairs) {
                            return 'a:' + keys.length + ':{' + pairs.join('') + '}';
                        });
                    case 'object':
                        objId = val.getID();

                        if (hasOwn.call(objectPositions, objId)) {
                            // Circular reference: emit back-reference without incrementing counter.
                            return futureFactory.createPresent('r:' + objectPositions[objId] + ';');
                        }

                        positionCounter++;
                        objectPositions[objId] = positionCounter;
                        className = val.getClassName();

                        // Collect all properties regardless of visibility by accessing
                        // the object's internal property stores directly.
                        allPropertyInfos = [];

                        Object.keys(val.nonPrivateProperties).forEach(function (propName) {
                            var prop = val.nonPrivateProperties[propName];

                            if (prop.isDefined()) {
                                allPropertyInfos.push({
                                    prop: prop,
                                    visibility: prop.getVisibility(),
                                    name: propName,
                                    fqcn: null,
                                    index: prop.getIndex()
                                });
                            }
                        });

                        Object.keys(val.privatePropertiesByFQCN).forEach(function (fqcn) {
                            Object.keys(val.privatePropertiesByFQCN[fqcn]).forEach(function (propName) {
                                var prop = val.privatePropertiesByFQCN[fqcn][propName];

                                if (prop.isDefined()) {
                                    allPropertyInfos.push({
                                        prop: prop,
                                        visibility: 'private',
                                        name: propName,
                                        fqcn: fqcn,
                                        index: prop.getIndex()
                                    });
                                }
                            });
                        });

                        allPropertyInfos.sort(function (a, b) {
                            // Ensure source (RHS) reference slots are serialised before targets (LHS).
                            if (a.prop.isReference() && b.prop.isReference() &&
                                    a.prop.getReference() === b.prop.getReference()) {

                                return b.index - a.index;
                            }

                            return a.index - b.index;
                        });

                        return flow.mapAsync(allPropertyInfos, function (propInfo) {
                            var encodedName,
                                refSlot,
                                slotIndex,
                                slotPos;

                            // Encode visibility into the property name using PHP's null-byte convention:
                            //   protected -> \0*\0name
                            //   private   -> \0ClassName\0name
                            //   public    -> name (no prefix)
                            if (propInfo.visibility === 'protected') {
                                encodedName = '\0*\0' + propInfo.name;
                            } else if (propInfo.visibility === 'private') {
                                encodedName = '\0' + propInfo.fqcn + '\0' + propInfo.name;
                            } else {
                                encodedName = propInfo.name;
                            }

                            if (propInfo.prop.isReference()) {
                                refSlot = propInfo.prop.getReference();
                                slotIndex = referenceSlots.indexOf(refSlot);

                                if (slotIndex !== -1) {
                                    // Back-reference to a reference seen before; emit `R:N`.
                                    slotPos = referenceSlotPositions[slotIndex];

                                    return serializeValue(valueFactory.createString(encodedName)).next(function (serializedName) {
                                        return serializedName + 'R:' + slotPos + ';';
                                    });
                                }

                                // First encounter: register the reference slot position.
                                positionCounter++;
                                referenceSlots.push(refSlot);
                                referenceSlotPositions.push(positionCounter);
                            }

                            return propInfo.prop.getValue().next(function (propValue) {
                                return serializeValue(valueFactory.createString(encodedName)).next(function (serializedName) {
                                    return serializeValue(propValue).next(function (serializedValue) {
                                        return serializedName + serializedValue;
                                    });
                                });
                            });
                        }).next(function (propPairs) {
                            return 'O:' + className.length + ':"' + className + '":' + allPropertyInfos.length + ':{' + propPairs.join('') + '}';
                        });
                    default:
                        positionCounter++;
                        callStack.raiseError(
                            PHPError.E_NOTICE,
                            'serialize(): Serialization of \'' + type + '\' is not allowed'
                        );

                        return futureFactory.createPresent('N;');
                    }
                }

                return serializeValue(value).next(function (serialized) {
                    return valueFactory.createString(serialized);
                });
            }
        ),

        /**
         * Creates a PHP value from a stored representation.
         *
         * Supports N, b, i, d, s, a and O tokens, plus r:N back-references for
         * circular object structures. Private (\0ClassName\0prop) and protected
         * (\0*\0prop) null-byte-encoded property names are decoded and applied
         * directly to the appropriate visibility slot on the restored object.
         *
         * @see {@link https://secure.php.net/manual/en/function.unserialize.php}
         */
        'unserialize': internals.typeFunction(
            'string $data',
            function (dataValue) {
                /*jshint latedef: false */
                var data = dataValue.getNative(),
                    // Tracks every value as it is parsed (1-indexed) for r:N back-references.
                    positionedValues = [];

                function setDeserializedProperty(objectValue, rawKey, propValue) {
                    var existingProp,
                        fqcn,
                        propName,
                        secondNull;

                    if (rawKey.charAt(0) === '\0') {
                        if (rawKey.charAt(1) === '*' && rawKey.charAt(2) === '\0') {
                            // Protected property: \0*\0propName.
                            propName = rawKey.substring(3);
                            existingProp = objectValue.nonPrivateProperties[propName];

                            if (existingProp && existingProp.getVisibility() === 'protected') {
                                existingProp.setValue(propValue);

                                return;
                            }
                        } else {
                            // Private property: \0ClassName\0propName
                            secondNull = rawKey.indexOf('\0', 1);
                            fqcn = rawKey.substring(1, secondNull);
                            propName = rawKey.substring(secondNull + 1);

                            if (objectValue.privatePropertiesByFQCN[fqcn] &&
                                    objectValue.privatePropertiesByFQCN[fqcn][propName]) {
                                objectValue.privatePropertiesByFQCN[fqcn][propName].setValue(propValue);

                                return;
                            }
                        }
                    } else {
                        propName = rawKey;
                    }

                    // Public property, or fallback for unmatched private/protected.
                    objectValue.setProperty(propName, propValue);
                }

                function parseValue(pos) {
                    var afterCountColon,
                        arrayPlaceholderIndex,
                        bodyStart,
                        className,
                        classNameLen,
                        classNameStart,
                        colonPos,
                        count,
                        firstColon,
                        floatStr,
                        len,
                        nativeFloat,
                        objPlaceholderIndex,
                        propCount,
                        propCountEnd,
                        propCountStart,
                        refIndex,
                        strStart,
                        tempValue,
                        type = data[pos];

                    switch (type) {
                    case 'N':
                        tempValue = valueFactory.createNull();
                        positionedValues.push(tempValue);
                        return futureFactory.createPresent({value: tempValue, pos: pos + 2});
                    case 'b':
                        tempValue = valueFactory.createBoolean(data[pos + 2] === '1');
                        positionedValues.push(tempValue);
                        return futureFactory.createPresent({value: tempValue, pos: pos + 4});
                    case 'i':
                        colonPos = data.indexOf(';', pos + 2);
                        tempValue = valueFactory.createInteger(parseInt(data.substring(pos + 2, colonPos), 10));
                        positionedValues.push(tempValue);
                        return futureFactory.createPresent({value: tempValue, pos: colonPos + 1});
                    case 'd':
                        colonPos = data.indexOf(';', pos + 2);
                        floatStr = data.substring(pos + 2, colonPos);
                        if (floatStr === 'NAN') {
                            nativeFloat = NaN;
                        } else if (floatStr === 'INF') {
                            nativeFloat = Infinity;
                        } else if (floatStr === '-INF') {
                            nativeFloat = -Infinity;
                        } else {
                            nativeFloat = parseFloat(floatStr);
                        }
                        tempValue = valueFactory.createFloat(nativeFloat);
                        positionedValues.push(tempValue);

                        return futureFactory.createPresent({value: tempValue, pos: colonPos + 1});
                        case 's':
                        firstColon = data.indexOf(':', pos + 2);
                        len = parseInt(data.substring(pos + 2, firstColon), 10);
                        strStart = firstColon + 2; // Skip ':"'.
                        tempValue = valueFactory.createString(data.substring(strStart, strStart + len));
                        positionedValues.push(tempValue);

                        return futureFactory.createPresent({value: tempValue, pos: strStart + len + 2});
                    case 'a':
                        afterCountColon = data.indexOf(':', pos + 2);
                        count = parseInt(data.substring(pos + 2, afterCountColon), 10);
                        bodyStart = afterCountColon + 2; // Skip ':{'.
                        // Reserve a slot before parsing contents so any r:N inside can find it.
                        arrayPlaceholderIndex = positionedValues.length;
                        positionedValues.push(null);

                        return parsePairs(count, bodyStart, []).next(function (result) {
                            tempValue = valueFactory.createArray(result.pairs.map(function (pair) {
                                return new KeyValuePair(pair.key, pair.value);
                            }));
                            positionedValues[arrayPlaceholderIndex] = tempValue;

                            return {
                                value: tempValue,
                                pos: result.pos + 1 // Skip '}'.
                            };
                        });
                    case 'O':
                        // O:namelen:"ClassName":propCount:{...}
                        colonPos = data.indexOf(':', pos + 2);
                        classNameLen = parseInt(data.substring(pos + 2, colonPos), 10);
                        classNameStart = colonPos + 2; // Skip ':"'
                        className = data.substring(classNameStart, classNameStart + classNameLen);
                        propCountStart = classNameStart + classNameLen + 2; // skip '":'
                        propCountEnd = data.indexOf(':', propCountStart);
                        propCount = parseInt(data.substring(propCountStart, propCountEnd), 10);
                        bodyStart = propCountEnd + 2; // skip ':{'
                        // Reserve a slot before instantiation so r:N inside properties can resolve back.
                        objPlaceholderIndex = positionedValues.length;
                        positionedValues.push(null);

                        return globalNamespace.getClass(className).next(function (classObject) {
                            // Use instantiateWithoutConstructor pattern: initialise defaults then
                            // create the object bare (no PHP __construct call), matching PHP's
                            // unserialize() behaviour.
                            return classObject.initialiseInstancePropertyDefaults().next(function () {
                                var objectValue = classObject.instantiateBare();

                                // Register the live object before parsing properties.
                                positionedValues[objPlaceholderIndex] = objectValue;

                                return parsePairs(propCount, bodyStart, []).next(function (result) {
                                    result.pairs.forEach(function (pair) {

                                        var pairValue = pair.value,
                                            rawKey = pair.key.getNative(),
                                            referenceSlot,
                                            sourcePropName,
                                            targetPropRef;

                                        if (pairValue && pairValue.isPhpReferenceBackRef) {
                                            // positionedValues[refIndex-1] is the source property's
                                            // key string (the slot position is invisible in the stream).
                                            sourcePropName = positionedValues[pairValue.refIndex - 1].getNative();
                                            referenceSlot = objectValue.nonPrivateProperties[sourcePropName].getReference();

                                            targetPropRef = objectValue.declareProperty(rawKey, classObject, 'public');
                                            targetPropRef.setReference(referenceSlot);
                                        } else {
                                            setDeserializedProperty(objectValue, rawKey, pairValue);
                                        }
                                    });

                                    return {
                                        value: objectValue,
                                        pos: result.pos + 1 // Skip '}'.
                                    };
                                });
                            });
                        });
                    case 'r':
                        // Object identity back-reference: r:N returns the object at position N.
                        colonPos = data.indexOf(';', pos + 2);
                        refIndex = parseInt(data.substring(pos + 2, colonPos), 10);

                        return futureFactory.createPresent({
                            value: positionedValues[refIndex - 1],
                            pos: colonPos + 1
                        });
                    case 'R':
                        // Reference-variable back-reference: R:N wires up a shared reference slot.
                        // The serialiser inserts an invisible position for the slot before the
                        // source property's key, so positionedValues[refIndex-1] holds that key
                        // (a string). The object handler resolves the slot from the source property.
                        colonPos = data.indexOf(';', pos + 2);
                        refIndex = parseInt(data.substring(pos + 2, colonPos), 10);

                        return futureFactory.createPresent({
                            value: {isPhpReferenceBackRef: true, refIndex: refIndex},
                            pos: colonPos + 1
                        });
                    default:
                        callStack.raiseError(
                            PHPError.E_NOTICE,
                            'unserialize(): Error at offset ' + pos + ' of ' + data.length + ' bytes'
                        );
                        return futureFactory.createPresent({
                            value: valueFactory.createBoolean(false),
                            pos: data.length
                        });
                    }
                }

                function parsePairs(remaining, pos, pairs) {
                    if (remaining === 0) {
                        return futureFactory.createPresent({pairs: pairs, pos: pos});
                    }

                    return parseValue(pos).next(function (keyResult) {
                        return parseValue(keyResult.pos).next(function (valResult) {
                            return parsePairs(
                                remaining - 1,
                                valResult.pos,
                                pairs.concat([{key: keyResult.value, value: valResult.value}])
                            );
                        });
                    });
                }

                return parseValue(0).next(function (result) {
                    return result.value;
                });
            }
        ),

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
