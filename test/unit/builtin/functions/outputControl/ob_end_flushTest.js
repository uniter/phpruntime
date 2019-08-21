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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    CallStack = require('phpcore/src/CallStack'),
    NoActiveOutputBufferException = require('phpcore/src/Exception/NoActiveOutputBufferException'),
    PHPError = phpCommon.PHPError,
    Output = require('phpcore/src/Output/Output'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "ob_end_flush" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.output = sinon.createStubInstance(Output);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            output: this.output,
            valueFactory: this.valueFactory
        };
        this.outputControlFunctions = outputControlFunctionFactory(this.internals);
        this.ob_end_flush = this.outputControlFunctions.ob_end_flush;
    });

    it('should flush then discard the current output buffer', function () {
        this.ob_end_flush();

        expect(this.output.flushCurrentBuffer).to.have.been.calledOnce;
        expect(this.output.popBuffer).to.have.been.calledOnce;
        expect(this.output.popBuffer).to.have.been.calledAfter(this.output.flushCurrentBuffer);
    });

    describe('on success', function () {
        it('should return true', function () {
            var resultValue = this.ob_end_flush();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should not raise any error', function () {
            this.ob_end_flush();

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('on failure', function () {
        beforeEach(function () {
            this.output.flushCurrentBuffer.throws(new NoActiveOutputBufferException());
        });

        it('should raise a notice', function () {
            this.ob_end_flush();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_NOTICE,
                'ob_end_flush(): failed to delete and flush buffer. No buffer to delete or flush'
            );
        });

        it('should return bool(false)', function () {
            var resultValue = this.ob_end_flush();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
