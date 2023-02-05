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
    functionHandlingFunctionFactory = require('../../../../../src/builtin/functions/functionHandling'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    Call = require('phpcore/src/Call'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = require('phpcommon').PHPError;

describe('PHP "func_num_args" builtin function', function () {
    var callFactory,
        callStack,
        func_num_args,
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

        func_num_args = state.getFunction('func_num_args');
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

        it('should return the number of args passed to the caller as an integer', async function () {
            var resultValue = await func_num_args().toPromise();

            expect(resultValue.getType()).to.equal('int');
            expect(resultValue.getNative()).to.equal(2);
        });
    });

    describe('when called from the global scope', function () {
        beforeEach(function () {
            callStack.getCaller.returns(null);
        });

        it('should raise a warning', async function () {
            await func_num_args().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'func_num_args(): Called from the global scope - no function context'
            );
        });

        it('should return -1', async function () {
            var resultValue = await func_num_args().toPromise();

            expect(resultValue.getType()).to.equal('int');
            expect(resultValue.getNative()).to.equal(-1);
        });
    });
});
