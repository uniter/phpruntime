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
    slice = [].slice,
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Exception = phpCommon.Exception,
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var COUNT_NORMAL = internals.getConstant('COUNT_NORMAL'),
        SORT_REGULAR = internals.getConstant('SORT_REGULAR'),
        SORT_STRING = internals.getConstant('SORT_STRING'),
        callStack = internals.callStack,
        flow = internals.flow,
        globalNamespace = internals.globalNamespace,
        methods,
        valueFactory = internals.valueFactory;

    methods = {
        /**
         * Determines the difference between arrays. A new array will be returned,
         * with all the elements of the first array that are not present in any of the other arrays.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-diff.php}
         */
        'array_diff': internals.typeFunction(
            'array $array, array ...$arrays : array',
            function (firstArrayValue) {
                var remainingElementPairs;

                // Start with the key-value pairs for the elements of the first array,
                // as for each successive array we will compare their values against the values
                // of this first one.
                remainingElementPairs = firstArrayValue.getKeys().map(function (keyValue) {
                    return firstArrayValue.getElementPairByKey(keyValue);
                });

                return flow
                    .eachAsync(slice.call(arguments, 1), function (arrayValue) {
                        return flow.eachAsync(arrayValue.getKeys(), function (keyValue) {
                            var elementValue = arrayValue.getElementByKey(keyValue).getValue(),
                                filteredElementPairs = [];

                            return flow
                                .eachAsync(remainingElementPairs, function (remainingElementPair) {
                                    return elementValue.isNotEqualTo(remainingElementPair.getValue())
                                        .next(function (inequalityValue) {
                                            if (inequalityValue.getNative()) {
                                                filteredElementPairs.push(remainingElementPair);
                                            }
                                        });
                                })
                                .next(function () {
                                    remainingElementPairs = filteredElementPairs;
                                });
                        });
                    })
                    .next(function () {
                        return valueFactory.createArray(remainingElementPairs);
                    });
            }
        ),

        /**
         * Filters the elements of an array, optionally using a callback function.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-filter.php}
         */
        'array_filter': internals.typeFunction(
            'array $array, ?callable $callback, int $mode = 0 : array',
            function (arrayValue, callbackValue, modeValue) {
                var mode = modeValue.getNative(),
                    resultPairs = [];

                if (callbackValue.getType() === 'null') {
                    throw new Exception('array_filter() :: Callback cannot yet be omitted');
                }

                if (mode !== 0) {
                    throw new Exception('array_filter() :: Mode flags are not yet supported');
                }

                // Work on a copy, so we don't mutate the original array.
                arrayValue = arrayValue.getForAssignment();

                return flow.eachAsync(arrayValue.getKeys(), function (keyValue) {
                    var elementPair = arrayValue.getElementPairByKey(keyValue);

                    return elementPair.getValue().next(function (elementValue) {
                        return callbackValue.call([elementValue]).next(function (resultValue) {
                            if (resultValue.getType() === 'boolean' && resultValue.getNative() === true) {
                                resultPairs.push(elementPair);
                            }
                        });
                    });
                })
                    .next(function () {
                        return valueFactory.createArray(resultPairs);
                    });
            }
        ),

        /**
         * Exchanges all element keys with their values, creating a new array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-flip.php}
         */
        'array_flip': internals.typeFunction(
            'array $array : array',
            function (arrayValue) {
                var resultArray = valueFactory.createArray([]);

                return flow
                    .eachAsync(arrayValue.getKeys(), function (keyValue) {
                        return arrayValue.getElementByKey(keyValue).getValue()
                            .next(function (elementValue) {
                                return resultArray.getElementByKey(elementValue).setValue(keyValue);
                            });
                    })
                    .next(function () {
                        return resultArray;
                    });
            }
        ),

        /**
         * Associative sort - sorts an array in-place, by value, in ascending order,
         * maintaining key->value associations.
         *
         * @see {@link https://secure.php.net/manual/en/function.asort.php}
         */
        'asort': internals.typeFunction(
            'array &$array, int $flags = SORT_REGULAR : bool',
            function (arraySnapshot, sortFlagsValue) {
                var arrayValue = arraySnapshot.getValue(),
                    sortFlags = sortFlagsValue.getNative();

                if (sortFlags !== SORT_REGULAR) {
                    throw new Exception(
                        'asort() :: Only SORT_REGULAR (' +
                        SORT_REGULAR +
                        ') is supported, ' +
                        sortFlags +
                        ' given'
                    );
                }

                arrayValue.sort(function (elementA, elementB) {
                    // TODO: Handle FutureValues being returned here,
                    //       if the element has a reference assigned that evaluates to a FutureValue.
                    var nativeKeyA = elementA.getValue().getNative(),
                        nativeKeyB = elementB.getValue().getNative();

                    return String(nativeKeyA).localeCompare(nativeKeyB);
                });

                return valueFactory.createBoolean(true); // asort() always returns true.
            }
        ),

        /**
         * Determines whether the given key or index exists in the array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-key-exists.php}
         */
        'array_key_exists': internals.typeFunction(
            'string|int $key, array $array : bool',
            function (keyValue, arrayValue) {
                return valueFactory.createBoolean(arrayValue.getElementByKey(keyValue).isDefined());
            }
        ),

        /**
         * Fetches all keys (or a subset of the keys) in an array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-keys.php}
         */
        'array_keys': internals.typeOverloadedFunction([
            internals.typeFunction(
                'array $array : array',
                function (arrayValue) {
                    return valueFactory.createArray(arrayValue.getKeys());
                }
            ),
            internals.typeFunction(
                'array $array, mixed $filter_value, bool $strict = false : array',
                function () {
                    throw new Exception('array_keys() :: Search functionality is not yet supported');
                }
            )
        ]),

        /**
         * Maps one or more arrays to a new array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-map.php}
         */
        'array_map': internals.typeFunction(
            '?callable $callback, array $array, array ...$arrays : array',
            function (callbackValue, firstArrayValue) {
                if (arguments.length > 2) {
                    return valueFactory.createRejection(
                        new Exception('array_map() :: Multiple input arrays are not yet supported')
                    );
                }

                return flow
                    .mapAsync(firstArrayValue.getKeys(), function (keyValue) {
                        // Pass the global namespace as the namespace scope -
                        // any normal function callback will need to be fully-qualified.
                        var elementValue = firstArrayValue.getElementByKey(keyValue);

                        return callbackValue.call([elementValue], globalNamespace)
                            .next(function (mappedElementValue) {
                                return new KeyValuePair(keyValue, mappedElementValue);
                            });
                    })
                    .next(function (keyValuePairs) {
                        return valueFactory.createArray(keyValuePairs);
                    });
            }
        ),

        /**
         * Merges one or more arrays together, returning a new array with the result.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-merge.php}
         */
        'array_merge': internals.typeFunction('array ...$arrays : array', function () {
            var nativeKeyToElementMap = {},
                mergedElements,
                nativeKeys = [],
                nextIndex = 0,
                returnNull = false;

            return flow.eachAsync(arguments, function (arrayValue, argumentIndex) {
                if (arrayValue.getType() !== 'array') {
                    callStack.raiseError(
                        PHPError.E_WARNING,
                        'array_merge(): Argument #' + (argumentIndex + 1) + ' is not an array'
                    );
                    returnNull = true;
                    return false;
                }

                _.each(arrayValue.getKeys(), function (key) {
                    var mergedKey,
                        nativeKey;

                    if (key.isNumeric()) {
                        nativeKey = nextIndex++;
                        mergedKey = valueFactory.createInteger(nativeKey);
                        nativeKeys.push(nativeKey);
                    } else {
                        nativeKey = key.getNative();
                        mergedKey = key;

                        if (!hasOwn.call(nativeKeyToElementMap, nativeKey)) {
                            nativeKeys.push(nativeKey);
                        }
                    }

                    nativeKeyToElementMap[nativeKey] = arrayValue.getElementPairByKey(key, mergedKey);
                });
            })
                .next(function () {
                    if (returnNull) {
                        return valueFactory.createNull();
                    }

                    mergedElements = _.map(nativeKeys, function (nativeKey) {
                        return nativeKeyToElementMap[nativeKey];
                    });

                    return valueFactory.createArray(mergedElements);
                });
        }),

        /**
         * Pops the last element off the end of an array and returns it.
         *
         * Also resets the internal array pointer.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-pop.php}
         */
        'array_pop': internals.typeFunction(
            'array &$array : mixed',
            function (arraySnapshot) {
                var arrayValue = arraySnapshot.getValue();

                return arrayValue.pop();
            }
        ),

        /**
         * Pushes one or more elements onto the end of an array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-push.php}
         *
         * @returns {IntegerValue} The new length of the array after pushing.
         */
        'array_push': internals.typeFunction(
            'array &$array, mixed ...$values : int',
            function (arraySnapshot) {
                var arrayValue = arraySnapshot.getValue();

                return flow
                    .eachAsync(slice.call(arguments, 1), function (value) {
                        return arrayValue.push(value);
                    })
                    .next(function () {
                        return valueFactory.createInteger(arrayValue.getLength());
                    });
            }
        ),

        /**
         * Replaces elements from passed arrays into the first array.
         * If a key from the first array exists in the second array, its value will be replaced by the value from the second array.
         * If the key exists in the second array, and not the first, it will be created in the returned array.
         * If a key only exists in the first array, it will be left as is.
         * If multiple arrays are passed for replacement, they will be processed in order, the later arrays overwriting previous values.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-replace.php}
         */
        'array_replace': internals.typeFunction('array $array, array ...$replacements : array', function (arrayValue) {
            var resultArray = arrayValue.getForAssignment(),
                replacementArrays = slice.call(arguments, 1);

            return flow
                .eachAsync(replacementArrays, function (replacementArray) {
                    return flow.eachAsync(replacementArray.getKeys(), function (key) {
                        var elementPair = replacementArray.getElementPairByKey(key);
                        return resultArray.getElementByKey(key).setValue(elementPair.getValue());
                    });
                })
                .next(function () {
                    return resultArray;
                });
        }),

        /**
         * Searches for a value in an array, returning the first key with that value.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-search.php}
         *
         * @param {Variable|ArrayValue} arrayReference
         * @returns {Value}
         */
        'array_search': internals.typeFunction(
            // FIXME: Add return type once union types supported.
            'mixed $needle, array $haystack, bool $strict = false',
            function (needleValue, haystackValue, strictValue) {
                var strict = strictValue.getNative(),
                    resultKeyValue = false;

                return flow.eachAsync(haystackValue.getKeys(), function (keyValue) {
                    var elementPair = haystackValue.getElementPairByKey(keyValue);

                    return elementPair.getValue()
                        .next(function (elementValue) {
                            if (strict) {
                                return needleValue.isIdenticalTo(elementValue)
                                    .asEventualNative()
                                    .next(function (isIdentical) {
                                        if (isIdentical) {
                                            resultKeyValue = keyValue;

                                            // Value was found, no need to check any further elements.
                                            return false;
                                        }
                                    });
                            }

                            return needleValue.compareWith(elementValue)
                                .next(function (comparisonResult) {
                                    if (comparisonResult === 0) {
                                        resultKeyValue = keyValue;

                                        // Value was found, no need to check any further elements.
                                        return false;
                                    }
                                });
                        });
                })
                    .next(function () {
                        return resultKeyValue;
                    })
                    .asValue();
            }
        ),

        /**
         * Shifts an element off the beginning of an array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-shift.php}
         */
        'array_shift': internals.typeFunction('array &$array : mixed', function (arraySnapshot) {
            var arrayValue = arraySnapshot.getValue();

            return arrayValue.shift();
        }),

        /**
         * Returns a new array without duplicate values from a source array.
         *
         * @see {@link https://secure.php.net/manual/en/function.array-unique.php}
         */
        'array_unique': internals.typeFunction(
            'array $array, int $flags = SORT_STRING : array',
            function (arrayValue, sortFlagsValue) {
                var resultPairs = [],
                    sortFlags = sortFlagsValue.getNative(),
                    usedValues = {};

                if (sortFlags !== SORT_STRING) {
                    throw new Exception(
                        'array_unique() :: Only SORT_STRING (' + SORT_STRING + ') is supported, ' +
                        sortFlags + ' given'
                    );
                }

                // Work on a copy, so we don't mutate the original array.
                arrayValue = arrayValue.getForAssignment();

                // First sort the elements alphabetically by value (default/SORT_STRING behaviour).
                arrayValue.sort(function (elementA, elementB) {
                    var nativeValueA = elementA.getValue().coerceToString().getNative(),
                        nativeValueB = elementB.getValue().coerceToString().getNative();

                    return String(nativeValueB).localeCompare(nativeValueA);
                });

                _.each(arrayValue.getKeys(), function (keyValue) {
                    var elementPair = arrayValue.getElementPairByKey(keyValue),
                        nativeValue = elementPair.getValue().coerceToString().getNative();

                    if (hasOwn.call(usedValues, nativeValue)) {
                        return;
                    }

                    usedValues[nativeValue] = true;

                    resultPairs.push(elementPair);
                });

                return valueFactory.createArray(resultPairs);
            }
        ),

        /**
         * Returns all the values from the array and indexes the array numerically.
         *
         * @see {@link http://php.net/manual/en/function.array-values.php}
         *
         * @param {Variable|Value} arrayReference
         * @returns {ArrayValue}
         */
        'array_values': function (arrayReference) {
            var arrayValue;

            if (!arrayReference) {
                callStack.raiseError(PHPError.E_WARNING, 'array_values() expects exactly 1 parameter, 0 given');
                return valueFactory.createNull();
            }

            arrayValue = arrayReference.getValue();

            return valueFactory.createArray(arrayValue.getValues());
        },

        /**
         * Counts the specified array or object.
         * May be hooked by implementing interface Countable.
         *
         * @see {@link https://secure.php.net/manual/en/function.count.php}
         */
        'count': internals.typeFunction(
            'Countable|array $value, int $mode = COUNT_NORMAL : int',
            function (arrayOrCountableValue, modeValue) {
                var mode = modeValue.getNative(),
                    type = arrayOrCountableValue.getType();

                if (type === 'object' && arrayOrCountableValue.classIs('Countable')) {
                    return arrayOrCountableValue.callMethod('count');
                }

                if (mode !== COUNT_NORMAL) {
                    throw new Exception(
                        'count() :: Only COUNT_NORMAL (' + COUNT_NORMAL + ') is supported, ' + mode + ' given'
                    );
                }

                return valueFactory.createInteger(arrayOrCountableValue.getLength());
            }
        ),

        /**
         * Fetches the value of the element currently pointed to by the internal array pointer.
         *
         * @see {@link https://secure.php.net/manual/en/function.current.php}
         */
        'current': internals.typeFunction('array|object $array : mixed', function (arrayValue) {
            if (arrayValue.getPointer() >= arrayValue.getLength()) {
                return valueFactory.createBoolean(false);
            }

            return arrayValue.getCurrentElementValue();
        }),

        /**
         * Set the internal pointer of an array to its last element,
         * returning the value of that last element.
         * False will be returned for an empty array.
         *
         * @see {@link https://secure.php.net/manual/en/function.end.php}
         */
        'end': internals.typeFunction('array|object &$array : mixed', function (arraySnapshot) {
            var arrayValue = arraySnapshot.getValue(),
                keys = arrayValue.getKeys();

            if (keys.length === 0) {
                return valueFactory.createBoolean(false);
            }

            // Advance the array's internal pointer to the last element.
            arrayValue.setPointer(keys.length - 1);

            return arrayValue.getCurrentElementValue();
        }),

        /**
         * Joins substrings (the "pieces") together with a given delimiter (the "glue").
         *
         * @see {@link https://secure.php.net/manual/en/function.implode.php}
         */
        'implode': internals.typeOverloadedFunction([
            internals.typeFunction(
                'string $separator, array $array : string',
                function (glueValue, piecesValue) {
                    var values = piecesValue.getValues();

                    return flow
                        .mapAsync(values, function (value) {
                            return value.coerceToString();
                        })
                        .next(function (pieceStringValues) {
                            var pieceStrings = pieceStringValues.map(function (pieceStringValue) {
                                return pieceStringValue.getNative();
                            });

                            return valueFactory.createString(pieceStrings.join(glueValue.getNative()));
                        });
                }
            ),
            internals.typeFunction(
                'array $array : string',
                function (piecesValue) {
                    var values = piecesValue.getValues();

                    return flow
                        .mapAsync(values, function (value) {
                            return value.coerceToString();
                        })
                        .next(function (pieceStringValues) {
                            var pieceStrings = pieceStringValues.map(function (pieceStringValue) {
                                return pieceStringValue.getNative();
                            });

                            return valueFactory.createString(pieceStrings.join(''));
                        });
                }
            )
        ]),

        /**
         * Determines whether a value (the "needle") exists in a given array (the "haystack").
         *
         * @see {@link https://secure.php.net/manual/en/function.in-array.php}
         */
        'in_array': internals.typeFunction(
            'mixed $needle, array $haystack, bool $strict = false : bool',
            function (needleValue, haystackValue, strictMatchValue) {
                var contains = false,
                    strictMatch = strictMatchValue.getNative();

                return flow
                    .eachAsync(haystackValue.getValues(), function (elementValue) {
                        var equalityChainable = strictMatch ?
                                elementValue.isIdenticalTo(needleValue) :
                                elementValue.isEqualTo(needleValue);

                        return equalityChainable.next(function (equalityValue) {
                            if (equalityValue.getNative()) {
                                contains = true;
                            }
                        });
                    })
                    .next(function () {
                        return valueFactory.createBoolean(contains);
                    });
            }
        ),

        /**
         * Alias of implode().
         *
         * @see {@link https://secure.php.net/manual/en/function.join.php}
         */
        'join': 'implode',

        /**
         * Fetches the key for the element the array's internal pointer is pointing at.
         *
         * @see {@link https://secure.php.net/manual/en/function.key.php}
         */
        'key': internals.typeFunction('array|object $array : int|string|null', function (arrayValue) {
            var currentKey = arrayValue.getKeyByIndex(arrayValue.getPointer());

            return currentKey !== null ?
                currentKey :
                valueFactory.createNull();
        }),

        /**
         * Sorts an array in-place, by key, in reverse order.
         *
         * @see {@link https://secure.php.net/manual/en/function.krsort.php}
         */
        'krsort': internals.typeFunction(
            'array &$array, int $flags = SORT_REGULAR : bool',
            function (arraySnapshot, sortFlagsSnapshot) {
                var arrayValue = arraySnapshot.getValue(),
                    sortFlags = sortFlagsSnapshot.getValue().getNative();

                if (sortFlags !== SORT_REGULAR) {
                    throw new Exception(
                        'krsort() :: Only SORT_REGULAR (' +
                        SORT_REGULAR +
                        ') is supported, ' +
                        sortFlags +
                        ' given'
                    );
                }

                arrayValue.sort(function (elementA, elementB) {
                    var nativeKeyA = elementA.getKey().getNative(),
                        nativeKeyB = elementB.getKey().getNative();

                    return String(nativeKeyB).localeCompare(nativeKeyA);
                });

                return valueFactory.createBoolean(true);
            }
        ),

        /**
         * Advances the internal array pointer by one and returns the new current element's value.
         * Returns false if there are no more elements.
         *
         * @see {@link https://secure.php.net/manual/en/function.next.php}
         *
         * @returns {BooleanValue|Value}
         */
        'next': internals.typeFunction('array|object &$array : mixed', function (arraySnapshot) {
            var arrayValue = arraySnapshot.getValue();

            arrayValue.setPointer(arrayValue.getPointer() + 1);

            if (arrayValue.getPointer() >= arrayValue.getLength()) {
                return valueFactory.createBoolean(false);
            }

            return arrayValue.getCurrentElementValue();
        }),

        /**
         * Resets the internal array pointer and returns the first element, or false if none.
         *
         * @see {@link https://secure.php.net/manual/en/function.reset.php}
         */
        'reset': internals.typeFunction(
            'array|object &$array : mixed',
            function (arraySnapshot) {
                var arrayValue = arraySnapshot.getValue();

                arrayValue.reset();

                return arrayValue.getLength() > 0 ?
                    arrayValue.getElementByIndex(0).getValue() :
                    valueFactory.createBoolean(false);
            }
        ),

        /**
         * Alias of count().
         *
         * @see {@link https://secure.php.net/manual/en/function.sizeof.php}
         */
        'sizeof': 'count'
    };

    return methods;
};
