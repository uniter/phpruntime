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
    CallbackValue = require('../../../../../src/builtin/functions/functionHandling/CallbackValue'),
    CallStack = require('phpcore/src/CallStack'),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    PHPError = require('phpcommon').PHPError;

describe('PHP "call_user_func" builtin function', function () {
    var callbackValue,
        callbackVariable,
        callFactory,
        callStack,
        call_user_func,
        futureFactory,
        globalNamespace,
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
        futureFactory = state.getFutureFactory();
        globalNamespace = state.getGlobalNamespace();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        call_user_func = state.getFunction('call_user_func');

        callbackVariable = variableFactory.createVariable('myCallback');
        callbackValue = sinon.createStubInstance(ObjectValue);
        callbackValue.call.returns(valueFactory.createNull());
        callbackValue.getCallableName.withArgs(globalNamespace).returns('myFunc');
        callbackValue.getForAssignment.returns(callbackValue);
        callbackValue.getType.returns('object');
        callbackValue.isCallable.returns(futureFactory.createPresent(true));
        callbackValue.next.callsArgWith(0, callbackValue);
        callbackVariable.setValue(callbackValue);
    });

    it('should call the callback value once', async function () {
        await call_user_func(callbackVariable).toPromise();

        expect(callbackValue.call).to.have.been.calledOnce;
    });

    it('should call the function with the resolved arguments passed as CallbackValues', async function () {
        var argumentVariable1 = variableFactory.createVariable('myFirstArgument'),
            argumentValue1 = valueFactory.createString('my first arg'),
            argumentVariable2 = variableFactory.createVariable('mySecondArgument'),
            argumentValue2 = valueFactory.createString('my second arg');
        argumentVariable1.setValue(argumentValue1);
        argumentVariable2.setValue(argumentValue2);

        await call_user_func(callbackVariable, argumentVariable1, argumentVariable2).toPromise();

        expect(callbackValue.call.args[0][0][0]).to.be.an.instanceof(CallbackValue);
        expect(callbackValue.call.args[0][0][0].getValue()).to.equal(argumentValue1);
        expect(callbackValue.call.args[0][0][1]).to.be.an.instanceof(CallbackValue);
        expect(callbackValue.call.args[0][0][1].getValue()).to.equal(argumentValue2);
    });

    it('should call the function with the global namespace', async function () {
        await call_user_func(callbackVariable).toPromise();

        expect(callbackValue.call).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.same(globalNamespace)
        );
    });

    it('should return the result of the call', async function () {
        var resultValue = valueFactory.createInteger(21);
        callbackValue.call.returns(resultValue);

        expect(await call_user_func(callbackVariable).toPromise()).to.equal(resultValue);
    });

    it('should allow errors from .call(...) to go up the call stack', async function () {
        callbackValue.call.throws(new Error('My custom error'));

        await expect(call_user_func(callbackVariable).toPromise())
            .to.eventually.be.rejectedWith('My custom error');
    });

    describe('when an argument is expected to be passed by reference', function () {
        var argumentVariable1,
            argumentVariable2,
            argumentValue1,
            argumentValue2;

        beforeEach(function () {
            argumentVariable1 = variableFactory.createVariable('myFirstArgument');
            argumentValue1 = valueFactory.createString('my first arg');
            argumentVariable2 = variableFactory.createVariable('mySecondArgument');
            argumentValue2 = valueFactory.createString('my second arg');
            argumentVariable1.setValue(argumentValue1);
            argumentVariable2.setValue(argumentValue2);
        });

        it('should raise a warning when attempting to fetch the reference of the first argument', async function () {
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[0].getReference());
                });
            });

            await call_user_func(callbackVariable, argumentVariable1, argumentVariable2).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 1 to myFunc() expected to be a reference, value given'
            );
        });

        it('should raise a warning when attempting to fetch the reference of the second argument', async function () {
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[1].getReference());
                });
            });

            await call_user_func(callbackVariable, argumentVariable1, argumentVariable2).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 2 to myFunc() expected to be a reference, value given'
            );
        });

        it('should return FutureValue<NullValue>', async function () {
            var result;
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[0].getReference());
                });
            });

            result = await call_user_func(callbackVariable, argumentVariable1, argumentVariable2).toPromise();

            expect(result.getType()).to.equal('null');
        });
    });
});
