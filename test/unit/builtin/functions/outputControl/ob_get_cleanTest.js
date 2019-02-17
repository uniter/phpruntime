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
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    CallStack = require('phpcore/src/CallStack'),
    Output = require('phpcore/src/Output/Output'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "ob_get_clean" builtin function', function () {
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
        this.ob_get_clean = this.outputControlFunctions.ob_get_clean;
    });

    describe('on success', function () {
        beforeEach(function () {
            this.output.getDepth.returns(4);
        });

        it('should clean and then return the current output buffer', function () {
            var resultValue;
            this.output.getCurrentBufferContents.returns('my buffered output');
            this.output.popBuffer.callsFake(function () {
                this.output.getCurrentBufferContents.returns('');
            }.bind(this));

            resultValue = this.ob_get_clean();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('my buffered output');
            expect(this.output.popBuffer).to.have.been.calledOnce;
        });

        it('should not raise any error', function () {
            this.ob_get_clean();

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('on failure', function () {
        beforeEach(function () {
            this.output.getDepth.returns(0);
        });

        it('should STILL not raise a notice (unlike some other ob_* functions)', function () {
            this.ob_get_clean();

            expect(this.callStack.raiseError).not.to.have.been.calledOnce;
        });

        it('should return bool(false)', function () {
            var resultValue = this.ob_get_clean();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
