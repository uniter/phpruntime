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
    COUNT_NORMAL = 0,
    IMPLODE = 'implode',
    SORT_REGULAR = 0,
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        methods,
        valueFactory = internals.valueFactory;

    methods = {
        /**
         * Determines whether the given key or index exists in the array
         *
         * @see {@link https://secure.php.net/manual/en/function.array-key-exists.php}
         *
         * @param {Variable|Value} keyReference
         * @param {Variable|ArrayValue} arrayReference
         * @returns {BooleanValue}
         */
        'array_key_exists': function (keyReference, arrayReference) {
            var arrayValue,
                keyValue;

            keyValue = keyReference.getValue();
            arrayValue = arrayReference.getValue();

            return valueFactory.createBoolean(arrayValue.getElementByKey(keyValue).isDefined());
        },

        /**
         * Merges one or more arrays together, returning a new array with the result
         *
         * @see {@link https://secure.php.net/manual/en/function.array-merge.php}
         *
         * @returns {IntegerValue}
         */
        'array_merge': function () {
            var nativeKeyToElementMap = {},
                mergedElements,
                nativeKeys = [],
                nextIndex = 0,
                returnNull = false;

            if (arguments.length === 0) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'array_merge() expects at least 1 parameter, 0 given'
                );
                return valueFactory.createNull();
            }

            _.each(arguments, function (arrayReference, argumentIndex) {
                var arrayValue = arrayReference.getValue();

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
            });

            if (returnNull) {
                return valueFactory.createNull();
            }

            mergedElements = _.map(nativeKeys, function (nativeKey) {
                return nativeKeyToElementMap[nativeKey];
            });

            return valueFactory.createArray(mergedElements);
        },
        'array_push': function (arrayReference) {
            var arrayValue = arrayReference.getValue(),
                i,
                reference,
                value;

            for (i = 1; i < arguments.length; i++) {
                reference = arguments[i];
                value = reference.getValue();
                arrayValue.push(value);
            }

            return valueFactory.createInteger(arrayValue.getLength());
        },
        /**
         * Counts the specified array or object. May be hooked
         * by implementing interface Countable
         *
         * @see {@link https://secure.php.net/manual/en/function.count.php}
         *
         * @param {Variable|Value} arrayReference
         * @param {Variable|Value} modeReference
         * @returns {IntegerValue}
         */
        'count': function (arrayReference, modeReference) {
            var array = arrayReference.getValue(),
                mode = modeReference ? modeReference.getNative() : 0,
                type = array.getType();

            if (type === 'object' && array.classIs('Countable')) {
                return array.callMethod('count');
            }

            if (mode !== COUNT_NORMAL) {
                throw new Error('Unsupported mode for count(...) :: ' + mode);
            }

            return valueFactory.createInteger(
                type === 'array' || type === 'object' ? array.getLength() : 1
            );
        },
        'current': function (arrayReference) {
            var arrayValue = arrayReference.getValue();

            if (arrayValue.getPointer() >= arrayValue.getLength()) {
                return valueFactory.createBoolean(false);
            }

            return arrayValue.getCurrentElement().getValue();
        },
        'implode': function (glueReference, piecesReference) {
            var glueValue = glueReference.getValue(),
                piecesValue = piecesReference.getValue(),
                tmp,
                values;

            // For backwards-compatibility, PHP supports receiving args in either order
            if (glueValue.getType() === 'array') {
                tmp = glueValue;
                glueValue = piecesValue;
                piecesValue = tmp;
            }

            values = piecesValue.getValues();

            _.each(values, function (value, key) {
                values[key] = value.coerceToString().getNative();
            });

            return valueFactory.createString(values.join(glueValue.getNative()));
        },
        'join': function (glueReference, piecesReference) {
            return methods[IMPLODE](glueReference, piecesReference);
        },
        /**
         * Sorts an array in-place, by key, in reverse order
         *
         * @see {@link https://secure.php.net/manual/en/function.krsort.php}
         *
         * @param {Variable|Value} arrayReference
         * @param {Variable|Value|undefined} sortFlagsReference
         * @returns {IntegerValue}
         */
        'krsort': function (arrayReference, sortFlagsReference) {
            var arrayValue,
                sortFlags;

            if (!arrayReference) {
                callStack.raiseError(PHPError.E_WARNING, 'krsort() expects at least 1 parameter, 0 given');
                return valueFactory.createBoolean(false);
            }

            arrayValue = arrayReference.getValue();
            sortFlags = sortFlagsReference ? sortFlagsReference.getValue().getNative() : SORT_REGULAR;

            if (arrayValue.getType() !== 'array') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'krsort() expects parameter 1 to be array, ' +
                    arrayValue.getType() +
                    ' given'
                );
                return valueFactory.createBoolean(false);
            }

            if (sortFlags !== SORT_REGULAR) {
                throw new Error(
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
        },
        'next': function (arrayReference) {
            var arrayValue = arrayReference.getValue();

            if (arrayValue.getType() !== 'array') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'next() expects parameter 1 to be array, ' +
                    arrayValue.getType() +
                    ' given'
                );
                return valueFactory.createNull();
            }

            arrayValue.setPointer(arrayValue.getPointer() + 1);

            if (arrayValue.getPointer() >= arrayValue.getLength()) {
                return valueFactory.createBoolean(false);
            }

            return arrayValue.getCurrentElement().getValue();
        }
    };

    return methods;
};
