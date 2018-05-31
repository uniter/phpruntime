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
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_array" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.is_array = this.variableHandlingFunctions.is_array;

        this.valueReference = sinon.createStubInstance(Variable);

        this.callIsArray = function () {
            return this.is_array(this.valueReference);
        }.bind(this);
    });

    it('should return true when given an array', function () {
        this.valueReference = sinon.createStubInstance(ArrayValue);
        this.valueReference.getType.returns('array');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.true;
    });

    it('should return false when given a boolean', function () {
        this.valueReference = sinon.createStubInstance(BooleanValue);
        this.valueReference.getType.returns('boolean');
        this.valueReference.getValue.returns(this.valueReference);

        expect(this.callIsArray()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsArray().getNative()).to.be.false;
    });

    it('should return true when given a variable containing an array', function () {
        var arrayValue = sinon.createStubInstance(ArrayValue);
        arrayValue.getType.returns('array');
        this.valueReference.getValue.returns(arrayValue);

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
        var result = this.is_array();

        expect(result).to.be.an.instanceOf(BooleanValue);
        expect(result.getNative()).to.be.false;
    });

    it('should raise a warning when not passed any argument', function () {
        this.is_array();

        expect(this.callStack.raiseError).to.have.been.calledOnce;
        expect(this.callStack.raiseError).to.have.been.calledWith(
            PHPError.E_WARNING,
            'is_array() expects exactly 1 parameter, 0 given'
        );
    });
});
