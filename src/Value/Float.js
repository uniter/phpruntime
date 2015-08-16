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
        util = require('util'),
        Value = require('../Value');

    function FloatValue(factory, callStack, value) {
        Value.call(this, factory, callStack, 'float', value);
    }

    util.inherits(FloatValue, Value);

    _.extend(FloatValue.prototype, {
        add: function (rightValue) {
            return rightValue.addToFloat(this);
        },

        addToBoolean: function (booleanValue) {
            var value = this;

            return value.factory.createFloat(value.value + Number(booleanValue.value));
        },

        addToInteger: function (integerValue) {
            var value = this;

            return value.factory.createFloat(value.value + integerValue.value);
        },

        addToObject: function (objectValue) {
            return objectValue.addToFloat(this);
        },

        addToNull: function () {
            return this.coerceToNumber();
        },

        coerceToBoolean: function () {
            var value = this;

            return value.factory.createBoolean(!!value.value);
        },

        coerceToFloat: function () {
            return this;
        },

        coerceToInteger: function () {
            /*jshint bitwise: false */
            var value = this;

            return value.factory.createInteger(value.value >> 0);
        },

        coerceToKey: function () {
            return this.coerceToInteger();
        },

        coerceToNumber: function () {
            return this;
        },

        coerceToString: function () {
            var value = this;

            return value.factory.createString(value.value + '');
        },

        getElement: function () {
            // Array access on floats always returns null, no notice or warning is raised
            return this.factory.createNull();
        },

        isEqualTo: function (rightValue) {
            return rightValue.isEqualToFloat(this);
        },

        isEqualToFloat: function (rightValue) {
            var leftValue = this;

            return leftValue.factory.createBoolean(rightValue.value === leftValue.value);
        },

        isEqualToInteger: function (rightValue) {
            var leftValue = this;

            return leftValue.factory.createBoolean(rightValue.coerceToFloat().value === leftValue.value);
        },

        isEqualToNull: function () {
            var leftValue = this;

            return leftValue.factory.createBoolean(leftValue.value === 0);
        },

        isEqualToObject: function (objectValue) {
            return objectValue.isEqualToFloat(this);
        },

        isEqualToString: function (stringValue) {
            var floatValue = this;

            return floatValue.factory.createBoolean(floatValue.value === stringValue.coerceToFloat().value);
        },

        onesComplement: function () {
            /*jshint bitwise: false */
            return this.factory.createInteger(~this.value);
        },

        shiftLeftBy: function (rightValue) {
            return this.coerceToInteger().shiftLeftBy(rightValue);
        },

        shiftRightBy: function (rightValue) {
            return this.coerceToInteger().shiftRightBy(rightValue);
        },

        subtract: function (rightValue) {
            var leftValue = this,
                factory = leftValue.factory;

            rightValue = rightValue.coerceToNumber();

            return factory.createFloat(leftValue.getNative() - rightValue.getNative());
        },

        toNegative: function () {
            var value = this;

            return value.factory.createFloat(-value.value);
        },

        toPositive: function () {
            var value = this;

            return value.factory.createInteger(+value.value);
        }
    });

    return FloatValue;
});
