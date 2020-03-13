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
    errorHandlingExtension = require('../../../../../src/builtin/functions/errorHandling'),
    sinon = require('sinon'),
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "trigger_error" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getConstant = sinon.stub();
        this.valueFactory = new ValueFactory();

        this.getConstant.withArgs('E_USER_DEPRECATED').returns(16384);
        this.getConstant.withArgs('E_USER_ERROR').returns(256);
        this.getConstant.withArgs('E_USER_NOTICE').returns(1024);
        this.getConstant.withArgs('E_USER_WARNING').returns(512);

        this.trigger_error = errorHandlingExtension({
            callStack: this.callStack,
            getConstant: this.getConstant,
            valueFactory: this.valueFactory
        }).trigger_error;
    });

    describe('when E_USER_WARNING is given as the error type', function () {
        beforeEach(function () {
            this.errorMessageReference = new Variable(this.callStack, this.valueFactory, 'errorMessageVar');
            this.errorTypeReference = new Variable(this.callStack, this.valueFactory, 'errorTypeVar');

            this.errorMessageReference.setValue(this.valueFactory.createString('My error message'));
            this.errorTypeReference.setValue(this.valueFactory.createInteger(512));
        });

        it('should raise the correct error', function () {
            this.trigger_error(this.errorMessageReference, this.errorTypeReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith('Warning', 'My error message');
        });

        it('should return bool(true)', function () {
            var result = this.trigger_error(this.errorMessageReference, this.errorTypeReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when no error type is given', function () {
        beforeEach(function () {
            this.errorMessageReference = new Variable(this.callStack, this.valueFactory, 'errorMessageVar');

            this.errorMessageReference.setValue(this.valueFactory.createString('My implicit notice'));
        });

        it('should raise a notice, by default', function () {
            this.trigger_error(this.errorMessageReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith('Notice', 'My implicit notice');
        });

        it('should return bool(true)', function () {
            var result = this.trigger_error(this.errorMessageReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when an invalid error type is given', function () {
        beforeEach(function () {
            this.errorMessageReference = new Variable(this.callStack, this.valueFactory, 'errorMessageVar');
            this.errorTypeReference = new Variable(this.callStack, this.valueFactory, 'errorTypeVar');

            this.errorMessageReference.setValue(this.valueFactory.createString('My error message'));
            this.errorTypeReference.setValue(this.valueFactory.createInteger(9999999));
        });

        it('should raise a special warning', function () {
            this.trigger_error(this.errorMessageReference, this.errorTypeReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith('Warning', 'Invalid error type specified');
        });

        it('should return bool(false)', function () {
            var result = this.trigger_error(this.errorMessageReference, this.errorTypeReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });
});
