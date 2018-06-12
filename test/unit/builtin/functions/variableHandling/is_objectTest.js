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
    Class = require('phpcore/src/Class').sync(),
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_object" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.classObject = sinon.createStubInstance(Class);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.is_object = this.variableHandlingFunctions.is_object;

        this.variable = sinon.createStubInstance(Variable);

        this.callIsObject = function () {
            return this.is_object(this.variable);
        }.bind(this);
    });

    it('should return true when given an object', function () {
        this.variable.getValue.returns(this.valueFactory.createObject({}, this.classObject));

        expect(this.callIsObject()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsObject().getNative()).to.be.true;
    });

    it('should return false when given an array', function () {
        this.variable.getValue.returns(this.valueFactory.createArray([]));

        expect(this.callIsObject()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsObject().getNative()).to.be.false;
    });

    it('should return false when given a string', function () {
        this.variable.getValue.returns(this.valueFactory.createString('this is my string'));

        expect(this.callIsObject()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsObject().getNative()).to.be.false;
    });

    it('should return false when given null', function () {
        this.variable.getValue.returns(this.valueFactory.createNull());

        expect(this.callIsObject()).to.be.an.instanceOf(BooleanValue);
        expect(this.callIsObject().getNative()).to.be.false;
    });

    it('should return false when not passed any argument', function () {
        var result = this.is_object();

        expect(result).to.be.an.instanceOf(BooleanValue);
        expect(result.getNative()).to.be.false;
    });

    it('should raise a warning when not passed any argument', function () {
        this.is_object();

        expect(this.callStack.raiseError).to.have.been.calledOnce;
        expect(this.callStack.raiseError).to.have.been.calledWith(
            PHPError.E_WARNING,
            'is_object() expects exactly 1 parameter, 0 given'
        );
    });
});
