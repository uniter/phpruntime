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
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "strtoupper" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getBinding = sinon.stub();
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            getBinding: this.getBinding,
            valueFactory: this.valueFactory
        };
        this.stringFunctions = stringFunctionFactory(this.internals);
        this.strtoupper = this.stringFunctions.strtoupper;

        this.stringReference = sinon.createStubInstance(Variable);
    });

    it('should return the uppercased version of a string', function () {
        var resultValue;
        this.stringReference.getValue.returns(this.valueFactory.createString('mY mIXEd CASE strinG!'));

        resultValue = this.strtoupper(this.stringReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('MY MIXED CASE STRING!');
    });

    it('should coerce an integer to a string', function () {
        var resultValue;
        this.stringReference.getValue.returns(this.valueFactory.createInteger(212));

        resultValue = this.strtoupper(this.stringReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('212');
    });

    describe('when no arguments are given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.strtoupper();
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'strtoupper() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });
});
