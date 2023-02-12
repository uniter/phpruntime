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
    functionHandlingFunctionFactory = require('../../../../../src/builtin/functions/functionHandling'),
    tools = require('../../../tools'),
    Call = require('phpcore/src/Call'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = require('phpcommon').PHPError;

describe('PHP "func_get_args" builtin function', function () {
    var callFactory,
        callStack,
        func_get_args,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    functionHandlingFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        func_get_args = state.getFunction('func_get_args');
    });

    describe('when called from a function scope', function () {
        beforeEach(function () {
            var callerCall = sinon.createStubInstance(Call);

            callerCall.getFunctionArgs.returns([
                valueFactory.createString('first'),
                valueFactory.createString('second')
            ]);
            callStack.getCaller.returns(callerCall);
        });

        it('should return an array of the args passed to the caller', async function () {
            var resultValue = await func_get_args().toPromise();

            expect(resultValue.getType()).to.equal('array');
        });
    });

    describe('when called from the global scope', function () {
        beforeEach(function () {
            callStack.getCaller.returns(null);
        });

        it('should raise a warning', async function () {
            await func_get_args().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'func_get_args(): Called from the global scope - no function context'
            );
        });

        it('should return false', async function () {
            var resultValue = await func_get_args().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
