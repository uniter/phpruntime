/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    phpCommon = require('phpcommon'),
    util = require('util'),
    PHPFatalError = phpCommon.PHPFatalError,
    Value = require('../Value');

function BooleanValue(factory, callStack, value) {
    Value.call(this, factory, callStack, 'boolean', !!value);
}

util.inherits(BooleanValue, Value);

_.extend(BooleanValue.prototype, {
    add: function (rightValue) {
        return rightValue.addToBoolean(this);
    },

    addToBoolean: function (rightValue) {
        var value = this;

        return value.factory.createInteger(value.value + rightValue.value);
    },

    addToInteger: function (integerValue) {
        return integerValue.addToBoolean(this);
    },

    addToNull: function () {
        return this.coerceToInteger();
    },

    addToObject: function (objectValue) {
        return objectValue.addToBoolean(this);
    },

    coerceToBoolean: function () {
        return this;
    },

    coerceToInteger: function () {
        var value = this;

        return value.factory.createInteger(value.value ? 1 : 0);
    },

    coerceToKey: function () {
        return this.coerceToInteger();
    },

    coerceToNumber: function () {
        return this.coerceToInteger();
    },

    coerceToString: function () {
        var value = this;

        return value.factory.createString(value.value ? '1' : '');
    },

    getElement: function () {
        // Array access on booleans always returns null, no notice or warning is raised
        return this.factory.createNull();
    },

    isEqualTo: function (rightValue) {
        var leftValue = this,
            factory = leftValue.factory;

        return factory.createBoolean(rightValue.coerceToBoolean().value === leftValue.value);
    },

    isEqualToObject: function () {
        return this;
    },

    isEqualToString: function (stringValue) {
        var booleanValue = this;

        return stringValue.factory.createBoolean(
            stringValue.coerceToBoolean().getNative() === booleanValue.getNative()
        );
    },

    onesComplement: function () {
        throw new PHPFatalError(PHPFatalError.UNSUPPORTED_OPERAND_TYPES);
    },

    shiftLeftBy: function (rightValue) {
        return this.coerceToInteger().shiftLeftBy(rightValue);
    },

    shiftRightBy: function (rightValue) {
        return this.coerceToInteger().shiftRightBy(rightValue);
    }
});

module.exports = BooleanValue;
