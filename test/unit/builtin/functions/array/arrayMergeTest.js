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
    expect = require('chai').expect,
    sinon = require('sinon'),
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "array_merge" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.valueFactory.createArray.restore();
        sinon.stub(this.valueFactory, 'createArray', function (elements) {
            var value = sinon.createStubInstance(ArrayValue);
            value.getElementPairByKey.restore();
            sinon.stub(value, 'getElementPairByKey', function (key, overrideKey) {
                var pair = sinon.createStubInstance(KeyValuePair);

                pair.getKey.returns(overrideKey || key);
                pair.getValue.returns(elements[key.getNative()]);

                return pair;
            }.bind(this));
            value.getKeys.restore();
            sinon.stub(value, 'getKeys', function () {
                var keys = [];

                _.each(elements, function (value, key) {
                    keys.push(this.valueFactory.createInteger(key));
                }.bind(this));

                return keys;
            }.bind(this));
            value.getNative.returns(elements);
            value.getType.returns('array');
            value.getValue.returns(value);
            return value;
        }.bind(this));
        this.valueFactory.createBoolean.restore();
        sinon.stub(this.valueFactory, 'createBoolean', function (native) {
            var value = sinon.createStubInstance(BooleanValue);
            value.getNative.returns(native);
            value.getType.returns('boolean');
            value.getValue.returns(value);
            value.isNumeric.returns(false);
            return value;
        });
        this.valueFactory.createInteger.restore();
        sinon.stub(this.valueFactory, 'createInteger', function (native) {
            var value = sinon.createStubInstance(IntegerValue);
            value.getNative.returns(native);
            value.getType.returns('integer');
            value.getValue.returns(value);
            value.isNumeric.returns(true);
            return value;
        });
        this.valueFactory.createNull.restore();
        sinon.stub(this.valueFactory, 'createNull', function () {
            var value = sinon.createStubInstance(NullValue);
            value.getNative.returns(null);
            value.getType.returns('null');
            value.getValue.returns(value);
            value.isNumeric.returns(false);
            return value;
        });
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.args = [];
        this.arrayFunctions = arrayFunctionFactory(this.internals);
        this.array_merge = this.arrayFunctions.array_merge;

        this.callArrayMerge = function () {
            return this.array_merge.apply(null, this.args);
        }.bind(this);
    });

    it('should return an array with the merged elements when two indexed arrays are provided', function () {
        var array1Element1 = this.valueFactory.createInteger(1),
            array1Element2 = this.valueFactory.createInteger(4),
            array2Element1 = this.valueFactory.createInteger(7),
            array2Element2 = this.valueFactory.createInteger(21),
            result;
        this.args[0] = this.valueFactory.createArray([array1Element1, array1Element2]);
        this.args[1] = this.valueFactory.createArray([array2Element1, array2Element2]);

        result = this.callArrayMerge();

        expect(result).to.be.an.instanceOf(ArrayValue);
        expect(result.getNative()).to.have.length(4);
        expect(result.getNative()[0]).to.be.an.instanceOf(KeyValuePair);
        expect(result.getNative()[0].getKey()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[0].getKey().getNative()).to.equal(0);
        expect(result.getNative()[0].getValue()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[0].getValue().getNative()).to.equal(1);
        expect(result.getNative()[1].getKey()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[1].getKey().getNative()).to.equal(1);
        expect(result.getNative()[1].getValue()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[1].getValue().getNative()).to.equal(4);
        expect(result.getNative()[2].getKey()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[2].getKey().getNative()).to.equal(2);
        expect(result.getNative()[2].getValue()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[2].getValue().getNative()).to.equal(7);
        expect(result.getNative()[3].getKey()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[3].getKey().getNative()).to.equal(3);
        expect(result.getNative()[3].getValue()).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()[3].getValue().getNative()).to.equal(21);
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.callArrayMerge();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge() expects at least 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callArrayMerge();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when one of the arguments is not an array', function () {
        beforeEach(function () {
            this.args[0] = this.valueFactory.createArray([this.valueFactory.createInteger(21)]);
            this.args[1] = this.valueFactory.createInteger(27);
        });

        it('should raise a warning', function () {
            this.callArrayMerge();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge(): Argument #2 is not an array'
            );
        });

        it('should return NULL', function () {
            var result = this.callArrayMerge();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
