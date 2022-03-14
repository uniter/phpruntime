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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "trigger_error" builtin function', function () {
    var callStack,
        getConstant,
        trigger_error,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        getConstant = sinon.stub();
        valueFactory = tools.createIsolatedState().getValueFactory();

        getConstant.withArgs('E_USER_DEPRECATED').returns(16384);
        getConstant.withArgs('E_USER_ERROR').returns(256);
        getConstant.withArgs('E_USER_NOTICE').returns(1024);
        getConstant.withArgs('E_USER_WARNING').returns(512);

        trigger_error = errorHandlingExtension({
            callStack: callStack,
            getConstant: getConstant,
            valueFactory: valueFactory
        }).trigger_error;
    });

    describe('when E_USER_WARNING is given as the error type', function () {
        var errorMessageReference,
            errorTypeReference;

        beforeEach(function () {
            errorMessageReference = new Variable(callStack, valueFactory, 'errorMessageVar');
            errorTypeReference = new Variable(callStack, valueFactory, 'errorTypeVar');

            errorMessageReference.setValue(valueFactory.createString('My error message'));
            errorTypeReference.setValue(valueFactory.createInteger(512));
        });

        it('should raise the correct error', function () {
            trigger_error(errorMessageReference, errorTypeReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith('Warning', 'My error message');
        });

        it('should return bool(true)', function () {
            var result = trigger_error(errorMessageReference, errorTypeReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when no error type is given', function () {
        var errorMessageReference;

        beforeEach(function () {
            errorMessageReference = new Variable(callStack, valueFactory, 'errorMessageVar');

            errorMessageReference.setValue(valueFactory.createString('My implicit notice'));
        });

        it('should raise a notice, by default', function () {
            trigger_error(errorMessageReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith('Notice', 'My implicit notice');
        });

        it('should return bool(true)', function () {
            var result = trigger_error(errorMessageReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when an invalid error type is given', function () {
        var errorMessageReference,
            errorTypeReference;

        beforeEach(function () {
            errorMessageReference = new Variable(callStack, valueFactory, 'errorMessageVar');
            errorTypeReference = new Variable(callStack, valueFactory, 'errorTypeVar');

            errorMessageReference.setValue(valueFactory.createString('My error message'));
            errorTypeReference.setValue(valueFactory.createInteger(9999999));
        });

        it('should raise a special warning', function () {
            trigger_error(errorMessageReference, errorTypeReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith('Warning', 'Invalid error type specified');
        });

        it('should return bool(false)', function () {
            var result = trigger_error(errorMessageReference, errorTypeReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });
});
