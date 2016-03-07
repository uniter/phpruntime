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
    COUNT_NORMAL = 0,
    IMPLODE = 'implode',
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        methods,
        valueFactory = internals.valueFactory;

    methods = {
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
        'next': function (arrayReference) {
            var arrayValue = arrayReference.getValue();

            if (arrayValue.getType() !== 'array') {
                callStack.raiseError(PHPError.E_WARNING, 'next() expects parameter 1 to be array, ' + arrayValue.getType() + ' given');
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
