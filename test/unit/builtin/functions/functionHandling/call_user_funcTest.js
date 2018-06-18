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
    CallbackValue = require('../../../../../src/builtin/functions/functionHandling/CallbackValue'),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "call_user_func" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.internals = {
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        };
        this.functionHandlingFunctions = functionHandlingFunctionFactory(this.internals);
        this.call_user_func = this.functionHandlingFunctions.call_user_func;
        this.callbackReference = sinon.createStubInstance(Variable);
        this.callbackValue = sinon.createStubInstance(ObjectValue);
        this.argumentReferences = [];

        this.callbackReference.getValue.returns(this.callbackValue);
        this.callbackValue.getCallableName.withArgs(this.globalNamespace).returns('myFunc');

        this.callUserFunc = function () {
            return this.call_user_func.apply(null, [this.callbackReference].concat(this.argumentReferences));
        }.bind(this);
    });

    it('should call the callback value once', function () {
        this.callUserFunc();

        expect(this.callbackValue.call).to.have.been.calledOnce;
    });

    it('should call the function with the resolved arguments passed as CallbackValues', function () {
        var argumentReference1 = sinon.createStubInstance(Variable),
            argumentValue1 = sinon.createStubInstance(IntegerValue),
            argumentReference2 = sinon.createStubInstance(Variable),
            argumentValue2 = sinon.createStubInstance(IntegerValue);
        argumentReference1.getValue.returns(argumentValue1);
        argumentReference2.getValue.returns(argumentValue2);
        this.argumentReferences[0] = argumentReference1;
        this.argumentReferences[1] = argumentReference2;

        this.callUserFunc();

        expect(this.callbackValue.call.args[0][0][0]).to.be.an.instanceof(CallbackValue);
        expect(this.callbackValue.call.args[0][0][0].getValue()).to.equal(argumentValue1);
        expect(this.callbackValue.call.args[0][0][1]).to.be.an.instanceof(CallbackValue);
        expect(this.callbackValue.call.args[0][0][1].getValue()).to.equal(argumentValue2);
    });

    it('should call the function with the global namespace', function () {
        this.callUserFunc();

        expect(this.callbackValue.call).to.have.been.calledWith(
            sinon.match.any,
            this.globalNamespace
        );
    });

    it('should return the result of the call', function () {
        var resultValue = sinon.createStubInstance(IntegerValue);
        this.callbackValue.call.returns(resultValue);

        expect(this.callUserFunc()).to.equal(resultValue);
    });

    it('should allow errors from .call(...) to go up the call stack', function () {
        this.callbackValue.call.throws(new Error('My custom error'));

        expect(function () {
            this.callUserFunc();
        }.bind(this)).to.throw('My custom error');
    });

    describe('when an argument is expected to be passed by reference', function () {
        beforeEach(function () {
            this.argumentReference1 = sinon.createStubInstance(Variable);
            this.argumentValue1 = sinon.createStubInstance(IntegerValue);
            this.argumentReference2 = sinon.createStubInstance(Variable);
            this.argumentValue2 = sinon.createStubInstance(IntegerValue);
            this.argumentReference1.getValue.returns(this.argumentValue1);
            this.argumentReference2.getValue.returns(this.argumentValue2);
            this.argumentReferences[0] = this.argumentReference1;
            this.argumentReferences[1] = this.argumentReference2;
        });

        it('should raise a warning when attempting to fetch the reference of the first argument', function () {
            this.callbackValue.call.callsFake(function (argumentReferences) {
                argumentReferences[0].getReference();
            });

            this.callUserFunc();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 1 to myFunc() expected to be a reference, value given'
            );
        });

        it('should raise a warning when attempting to fetch the reference of the second argument', function () {
            this.callbackValue.call.callsFake(function (argumentReferences) {
                argumentReferences[1].getReference();
            });

            this.callUserFunc();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'Parameter 2 to myFunc() expected to be a reference, value given'
            );
        });

        it('should return NULL', function () {
            this.callbackValue.call.callsFake(function (argumentReferences) {
                argumentReferences[0].getReference();
            });

            expect(this.callUserFunc()).to.be.an.instanceOf(NullValue);
        });
    });
});
