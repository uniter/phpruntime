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
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    PHPError = require('phpcommon').PHPError,
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "call_user_func" builtin function', function () {
    var argumentReferences,
        callbackReference,
        callbackValue,
        callStack,
        call_user_func,
        callUserFunc,
        functionHandlingFunctions,
        globalNamespace,
        internals,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();
        globalNamespace = sinon.createStubInstance(Namespace);
        internals = {
            callStack: callStack,
            globalNamespace: globalNamespace,
            valueFactory: valueFactory
        };
        functionHandlingFunctions = functionHandlingFunctionFactory(internals);
        call_user_func = functionHandlingFunctions.call_user_func;
        callbackReference = sinon.createStubInstance(Variable);
        callbackValue = sinon.createStubInstance(ObjectValue);
        argumentReferences = [];

        callbackReference.getValue.returns(callbackValue);
        callbackValue.call.returns(valueFactory.createNull());
        callbackValue.getCallableName.withArgs(globalNamespace).returns('myFunc');

        callUserFunc = function () {
            return call_user_func.apply(null, [callbackReference].concat(argumentReferences));
        };
    });

    it('should call the callback value once', function () {
        callUserFunc();

        expect(callbackValue.call).to.have.been.calledOnce;
    });

    it('should call the function with the resolved arguments passed as CallbackValues', function () {
        var argumentReference1 = sinon.createStubInstance(Variable),
            argumentValue1 = sinon.createStubInstance(IntegerValue),
            argumentReference2 = sinon.createStubInstance(Variable),
            argumentValue2 = sinon.createStubInstance(IntegerValue);
        argumentReference1.getValue.returns(argumentValue1);
        argumentReference2.getValue.returns(argumentValue2);
        argumentReferences[0] = argumentReference1;
        argumentReferences[1] = argumentReference2;

        callUserFunc();

        expect(callbackValue.call.args[0][0][0]).to.be.an.instanceof(CallbackValue);
        expect(callbackValue.call.args[0][0][0].getValue()).to.equal(argumentValue1);
        expect(callbackValue.call.args[0][0][1]).to.be.an.instanceof(CallbackValue);
        expect(callbackValue.call.args[0][0][1].getValue()).to.equal(argumentValue2);
    });

    it('should call the function with the global namespace', function () {
        callUserFunc();

        expect(callbackValue.call).to.have.been.calledWith(
            sinon.match.any,
            globalNamespace
        );
    });

    it('should return the result of the call', function () {
        var resultValue = valueFactory.createInteger(21);
        callbackValue.call.returns(resultValue);

        expect(callUserFunc()).to.equal(resultValue);
    });

    it('should allow errors from .call(...) to go up the call stack', function () {
        callbackValue.call.throws(new Error('My custom error'));

        expect(function () {
            callUserFunc();
        }).to.throw('My custom error');
    });

    describe('when an argument is expected to be passed by reference', function () {
        var argumentReference1,
            argumentReference2,
            argumentValue1,
            argumentValue2;

        beforeEach(function () {
            argumentReference1 = sinon.createStubInstance(Variable);
            argumentValue1 = sinon.createStubInstance(IntegerValue);
            argumentReference2 = sinon.createStubInstance(Variable);
            argumentValue2 = sinon.createStubInstance(IntegerValue);
            argumentReference1.getValue.returns(argumentValue1);
            argumentReference2.getValue.returns(argumentValue2);
            argumentReferences[0] = argumentReference1;
            argumentReferences[1] = argumentReference2;
        });

        it('should raise a warning when attempting to fetch the reference of the first argument', function () {
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[0].getReference());
                });
            });

            callUserFunc();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 1 to myFunc() expected to be a reference, value given'
            );
        });

        it('should raise a warning when attempting to fetch the reference of the second argument', function () {
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[1].getReference());
                });
            });

            callUserFunc();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 2 to myFunc() expected to be a reference, value given'
            );
        });

        it('should return FutureValue<NullValue>', function () {
            callbackValue.call.callsFake(function (argumentReferences) {
                return valueFactory.createFuture(function (resolve) {
                    resolve(argumentReferences[0].getReference());
                });
            });

            expect(callUserFunc().yieldSync()).to.be.an.instanceOf(NullValue);
        });
    });
});
