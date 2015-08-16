/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = require('pausable').executeSync([require], function (require) {
    var _ = require('lodash'),
        phpCommon = require('phpcommon'),
        util = require('util'),
        PHPError = phpCommon.PHPError,
        Value = require('../Value');

    function NullValue(factory, callStack) {
        Value.call(this, factory, callStack, 'null', null);
    }

    util.inherits(NullValue, Value);

    _.extend(NullValue.prototype, {
        add: function (rightValue) {
            return rightValue.addToNull();
        },

        addToBoolean: function (booleanValue) {
            return booleanValue.coerceToInteger();
        },

        coerceToArray: function () {
            // Null just casts to an empty array
            return this.factory.createArray();
        },

        coerceToBoolean: function () {
            return this.factory.createBoolean(false);
        },

        coerceToKey: function () {
            return this.factory.createString('');
        },

        coerceToString: function () {
            return this.factory.createString('');
        },

        getInstancePropertyByName: function () {
            var value = this;

            value.callStack.raiseError(
                PHPError.E_NOTICE,
                'Trying to get property of non-object'
            );

            return value.factory.createNull();
        },

        isEqualTo: function (rightValue) {
            return rightValue.isEqualToNull(this);
        },

        isEqualToFloat: function (floatValue) {
            return floatValue.isEqualToNull();
        },

        isEqualToNull: function () {
            return this.factory.createBoolean(true);
        },

        isEqualToObject: function (objectValue) {
            return objectValue.isEqualToNull();
        },

        isEqualToString: function (stringValue) {
            return stringValue.isEqualToNull();
        },

        isSet: function () {
            return false;
        },

        subtract: function (rightValue) {
            return rightValue.subtractFromNull();
        }
    });

    return NullValue;
});
