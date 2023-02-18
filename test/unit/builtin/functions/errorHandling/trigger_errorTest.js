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
    errorHandlingFunctionFactory = require('../../../../../src/builtin/functions/errorHandling'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError;

describe('PHP "trigger_error" builtin function', function () {
    var callFactory,
        callStack,
        state,
        trigger_error,
        valueFactory,
        variableFactory,

        E_USER_DEPRECATED,
        E_USER_ERROR,
        E_USER_NOTICE,
        E_USER_WARNING;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    errorHandlingFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');
        E_USER_DEPRECATED = state.getConstantValue('E_USER_DEPRECATED');
        E_USER_ERROR = state.getConstantValue('E_USER_ERROR');
        E_USER_NOTICE = state.getConstantValue('E_USER_NOTICE');
        E_USER_WARNING = state.getConstantValue('E_USER_WARNING');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        trigger_error = state.getFunction('trigger_error');
    });

    describe('when E_USER_WARNING is given as the error type', function () {
        var errorMessageVariable,
            errorTypeVariable;

        beforeEach(function () {
            errorMessageVariable = variableFactory.createVariable('errorMessageVar');
            errorTypeVariable = variableFactory.createVariable('errorTypeVar');

            errorMessageVariable.setValue(valueFactory.createString('My error message'));
            errorTypeVariable.setValue(valueFactory.createInteger(512));
        });

        it('should raise the correct error', async function () {
            await trigger_error(errorMessageVariable, errorTypeVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith('Warning', 'My error message');
        });

        it('should return bool(true)', async function () {
            var result = await trigger_error(errorMessageVariable, errorTypeVariable).toPromise();

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when no error type is given', function () {
        var errorMessageVariable;

        beforeEach(function () {
            errorMessageVariable = variableFactory.createVariable('errorMessageVar');

            errorMessageVariable.setValue(valueFactory.createString('My implicit notice'));
        });

        it('should raise a notice, by default', async function () {
            await trigger_error(errorMessageVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_NOTICE,
                'My implicit notice'
            );
        });

        it('should return bool(true)', async function () {
            var result = await trigger_error(errorMessageVariable).toPromise();

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.true;
        });
    });

    describe('when an invalid error type is given', function () {
        var errorMessageVariable,
            errorTypeVariable;

        beforeEach(function () {
            errorMessageVariable = variableFactory.createVariable('errorMessageVar');
            errorTypeVariable = variableFactory.createVariable('errorTypeVar');

            errorMessageVariable.setValue(valueFactory.createString('My error message'));
            errorTypeVariable.setValue(valueFactory.createInteger(9999999));
        });

        it('should raise a special warning', async function () {
            await trigger_error(errorMessageVariable, errorTypeVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Invalid error type specified'
            );
        });

        it('should return bool(false)', async function () {
            var result = await trigger_error(errorMessageVariable, errorTypeVariable).toPromise();

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });
});
