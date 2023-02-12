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
    CallStack = require('phpcore/src/CallStack'),
    ObjectValue = require('phpcore/src/Value/Object').sync();

describe('PHP "call_user_func_array" builtin function', function () {
    var argumentArrayVariable,
        callbackValue,
        callbackVariable,
        callFactory,
        callStack,
        call_user_func_array,
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

        call_user_func_array = state.getFunction('call_user_func_array');

        callbackVariable = variableFactory.createVariable('myCallback');
        callbackValue = sinon.createStubInstance(ObjectValue);
        callbackValue.call.returns(valueFactory.createNull());
        callbackValue.getCallableName.withArgs(globalNamespace).returns('myFunc');
        callbackValue.getForAssignment.returns(callbackValue);
        callbackValue.getType.returns('object');
        callbackValue.isCallable.returns(futureFactory.createPresent(true));
        callbackValue.next.callsArgWith(0, callbackValue);
        callbackVariable.setValue(callbackValue);

        argumentArrayVariable = variableFactory.createVariable('myArguments');
        argumentArrayVariable.setValue(valueFactory.createArray([]));
    });

    it('should call the callback value once', async function () {
        await call_user_func_array(callbackVariable, argumentArrayVariable).toPromise();

        expect(callbackValue.call).to.have.been.calledOnce;
    });

    it('should call the function with the resolved argument array', async function () {
        var argumentValue1 = valueFactory.createString('my first arg'),
            argumentValue2 = valueFactory.createString('my second arg');
        argumentArrayVariable.setValue(valueFactory.createArray([argumentValue1, argumentValue2]));

        await call_user_func_array(callbackVariable, argumentArrayVariable).toPromise();

        expect(callbackValue.call).to.have.been.calledWith([
            argumentValue1,
            argumentValue2
        ]);
    });

    it('should call the function with the global namespace', async function () {
        await call_user_func_array(callbackVariable, argumentArrayVariable).toPromise();

        expect(callbackValue.call).to.have.been.calledOnce;
        expect(callbackValue.call).to.have.been.calledWith(
            sinon.match.any,
            globalNamespace
        );
    });

    it('should return the result of the call', async function () {
        var resultValue = valueFactory.createString('my result');
        callbackValue.call.returns(resultValue);

        expect(await call_user_func_array(callbackVariable, argumentArrayVariable).toPromise())
            .to.equal(resultValue);
    });
});
