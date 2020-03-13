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
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "count" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.arrayFunctions = arrayFunctionFactory(this.internals);
        this.count = this.arrayFunctions.count;

        this.valueReference = sinon.createStubInstance(Variable);
        this.modeReference = sinon.createStubInstance(Variable);
        this.modeReference.getNative.returns(0);

        this.callCount = function () {
            return this.count(this.valueReference, this.modeReference);
        }.bind(this);
    });

    it('should return the length of the array when an array is specified', function () {
        this.valueReference = sinon.createStubInstance(ArrayValue);
        this.valueReference.getLength.returns(21);
        this.valueReference.getType.returns('array');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callCount()).to.be.an.instanceOf(IntegerValue);
        expect(this.callCount().getNative()).to.equal(21);
    });

    it('should return the number of instance properties when an object is specified', function () {
        this.valueReference = sinon.createStubInstance(ObjectValue);
        this.valueReference.getLength.returns(27);
        this.valueReference.getType.returns('object');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callCount()).to.be.an.instanceOf(IntegerValue);
        expect(this.callCount().getNative()).to.equal(27);
    });

    it('should call and return the result from ::count when the object implements Countable', function () {
        var resultValue = sinon.createStubInstance(IntegerValue);
        this.valueReference = sinon.createStubInstance(ObjectValue);
        this.valueReference.callMethod.withArgs('count').returns(resultValue);
        this.valueReference.classIs.withArgs('Countable').returns(true);
        this.valueReference.getType.returns('object');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callCount()).to.equal(resultValue);
    });

    it('should return int(1) when a string is given, regardless of the length', function () {
        this.valueReference = sinon.createStubInstance(StringValue);
        this.valueReference.getNative.returns('my string value');
        this.valueReference.getType.returns('string');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callCount()).to.be.an.instanceOf(IntegerValue);
        expect(this.callCount().getNative()).to.equal(1);
    });

    it('should return int(1) when an integer is given, regardless of the value', function () {
        this.valueReference = sinon.createStubInstance(IntegerValue);
        this.valueReference.getNative.returns(4123);
        this.valueReference.getType.returns('int');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callCount()).to.be.an.instanceOf(IntegerValue);
        expect(this.callCount().getNative()).to.equal(1);
    });

    it('should throw when COUNT_RECURSIVE is specified', function () {
        this.valueReference = sinon.createStubInstance(IntegerValue);
        this.valueReference.getNative.returns(4123);
        this.valueReference.getType.returns('int');
        this.valueReference.getValue.returns(this.valueReference);
        this.modeReference.getNative.returns(1);

        expect(function () {
            this.callCount();
        }.bind(this)).to.throw('Unsupported mode for count(...) :: 1');
    });
});
