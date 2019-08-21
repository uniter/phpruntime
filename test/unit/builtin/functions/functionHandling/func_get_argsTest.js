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
    Call = require('phpcore/src/Call'),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "func_get_args" builtin function', function () {
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
        this.func_get_args = this.functionHandlingFunctions.func_get_args;

        this.callFuncGetArgs = function () {
            return this.func_get_args.apply(null, []);
        }.bind(this);
    });

    describe('when called from a function scope', function () {
        beforeEach(function () {
            var callerCall = sinon.createStubInstance(Call);

            callerCall.getFunctionArgs.returns([
                this.valueFactory.createString('first'),
                this.valueFactory.createString('second')
            ]);
            this.callStack.getCaller.returns(callerCall);
        });

        it('should return an array of the args passed to the caller', function () {
            var resultValue = this.callFuncGetArgs();

            expect(resultValue.getType()).to.equal('array');
        });
    });

    describe('when called from the global scope', function () {
        beforeEach(function () {
            this.callStack.getCaller.returns(null);
        });

        it('should raise a warning', function () {
            this.callFuncGetArgs();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'func_get_args(): Called from the global scope - no function context'
            );
        });

        it('should return false', function () {
            var resultValue = this.callFuncGetArgs();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
