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
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "call_user_func_array" builtin function', function () {
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
        this.call_user_func_array = this.functionHandlingFunctions.call_user_func_array;
        this.callbackReference = sinon.createStubInstance(Variable);
        this.callbackValue = sinon.createStubInstance(ObjectValue);
        this.argumentArrayReference = sinon.createStubInstance(Variable);
        this.argumentArrayValue = sinon.createStubInstance(ArrayValue);

        this.callbackReference.getValue.returns(this.callbackValue);
        this.argumentArrayReference.getValue.returns(this.argumentArrayValue);

        this.callUserFunc = function () {
            return this.call_user_func_array(this.callbackReference, this.argumentArrayReference);
        }.bind(this);
    });

    it('should call the callback value once', function () {
        this.callUserFunc();

        expect(this.callbackValue.call).to.have.been.calledOnce;
    });

    it('should call the function with the resolved argument array', function () {
        var argumentValue1 = sinon.createStubInstance(IntegerValue),
            argumentValue2 = sinon.createStubInstance(IntegerValue);
        this.argumentArrayValue.getValueReferences.returns([argumentValue1, argumentValue2]);

        this.callUserFunc();

        expect(this.callbackValue.call).to.have.been.calledWith([
            argumentValue1,
            argumentValue2
        ]);
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
});
