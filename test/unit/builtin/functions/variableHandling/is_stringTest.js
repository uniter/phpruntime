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
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_string" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.is_string = this.variableHandlingFunctions.is_string;

        this.variable = sinon.createStubInstance(Variable);

        this.callIsString = function () {
            return this.is_string(this.variable);
        }.bind(this);
    });

    it('should return false when given an array', function () {
        this.variable.getValue.returns(this.valueFactory.createArray([]));

        expect(this.callIsString()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsString().getNative()).to.be.false;
    });

    it('should return false when given a boolean', function () {
        this.variable.getValue.returns(this.valueFactory.createBoolean(true));

        expect(this.callIsString()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsString().getNative()).to.be.false;
    });

    it('should return true when given a string', function () {
        this.variable.getValue.returns(this.valueFactory.createString('this is my string'));

        expect(this.callIsString()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsString().getNative()).to.be.true;
    });

    it('should return false when not passed any argument', function () {
        var result = this.is_string();

        expect(result).to.be.an.instanceOf(BooleanValue);
        expect(result.getNative()).to.be.false;
    });

    it('should raise a warning when not passed any argument', function () {
        this.is_string();

        expect(this.callStack.raiseError).to.have.been.calledOnce;
        expect(this.callStack.raiseError).to.have.been.calledWith(
            PHPError.E_WARNING,
            'is_string() expects exactly 1 parameter, 0 given'
        );
    });
});
