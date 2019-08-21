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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    FloatValue = require('phpcore/src/Value/Float').sync(),
    PHPError = phpCommon.PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_float" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.is_float = this.variableHandlingFunctions.is_float;

        this.valueReference = sinon.createStubInstance(Variable);

        this.callIsArray = function () {
            return this.is_float(this.valueReference);
        }.bind(this);
    });

    it('should return true when given a float', function () {
        this.valueReference = sinon.createStubInstance(FloatValue);
        this.valueReference.getType.returns('float');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.true;
    });

    it('should return false when given a string containing a float', function () {
        this.valueReference = sinon.createStubInstance(StringValue);
        this.valueReference.getNative.returns('1.2');
        this.valueReference.getType.returns('string');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.false;
    });

    it('should return true when given a variable containing a float', function () {
        var floatValue = sinon.createStubInstance(FloatValue);
        floatValue.getType.returns('float');
        this.valueReference.getValue.returns(floatValue);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.true;
    });

    it('should return false when given a variable containing a boolean', function () {
        var booleanValue = sinon.createStubInstance(BooleanValue);
        booleanValue.getType.returns('boolean');
        this.valueReference.getValue.returns(booleanValue);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.false;
    });

    it('should return false when not passed any argument', function () {
        var result = this.is_float();

        expect(result).to.be.an.instanceOf(BooleanValue);
        expect(result.getNative()).to.be.false;
    });

    it('should raise a warning when not passed any argument', function () {
        this.is_float();

        expect(this.callStack.raiseError).to.have.been.calledOnce;
        expect(this.callStack.raiseError).to.have.been.calledWith(
            PHPError.E_WARNING,
            'is_float() expects exactly 1 parameter, 0 given'
        );
    });
});
