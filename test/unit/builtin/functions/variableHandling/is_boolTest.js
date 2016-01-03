/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    sinon = require('sinon'),
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_bool" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.valueFactory.createBoolean.restore();
        sinon.stub(this.valueFactory, 'createBoolean', function (native) {
            var value = sinon.createStubInstance(BooleanValue);
            value.getNative.returns(native);
            return value;
        });
        this.valueFactory.createInteger.restore();
        sinon.stub(this.valueFactory, 'createInteger', function (native) {
            var value = sinon.createStubInstance(IntegerValue);
            value.getNative.returns(native);
            return value;
        });
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.is_bool = this.variableHandlingFunctions.is_bool;

        this.valueReference = sinon.createStubInstance(Variable);

        this.callIsBool = function () {
            return this.is_bool(this.valueReference);
        }.bind(this);
    });

    it('should return false when given an array', function () {
        this.valueReference = sinon.createStubInstance(ArrayValue);
        this.valueReference.getType.returns('array');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsBool()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsBool().getNative()).to.be.false;
    });

    it('should return true when given a boolean', function () {
        this.valueReference = sinon.createStubInstance(BooleanValue);
        this.valueReference.getType.returns('boolean');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsBool()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsBool().getNative()).to.be.true;
    });

    it('should return false when given a variable containing an array', function () {
        var arrayValue = sinon.createStubInstance(ArrayValue);
        arrayValue.getType.returns('array');
        this.valueReference.getValue.returns(arrayValue);

        expect(this.callIsBool()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsBool().getNative()).to.be.false;
    });

    it('should return true when given a variable containing a boolean', function () {
        var booleanValue = sinon.createStubInstance(BooleanValue);
        booleanValue.getType.returns('boolean');
        this.valueReference.getValue.returns(booleanValue);

        expect(this.callIsBool()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsBool().getNative()).to.be.true;
    });
});
