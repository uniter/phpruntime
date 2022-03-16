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
    Namespace = require('phpcore/src/Namespace').sync(),
    PHPError = require('phpcommon').PHPError;

describe('PHP "func_get_args" builtin function', function () {
    var callFuncGetArgs,
        callStack,
        func_get_args,
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
        func_get_args = functionHandlingFunctions.func_get_args;

        callFuncGetArgs = function () {
            return func_get_args.apply(null, []);
        };
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

        it('should return an array of the args passed to the caller', function () {
            var resultValue = callFuncGetArgs();

            expect(resultValue.getType()).to.equal('array');
        });
    });

    describe('when called from the global scope', function () {
        beforeEach(function () {
            callStack.getCaller.returns(null);
        });

        it('should raise a warning', function () {
            callFuncGetArgs();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'func_get_args(): Called from the global scope - no function context'
            );
        });

        it('should return false', function () {
            var resultValue = callFuncGetArgs();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
