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
    outputControlConstantFactory = require('../../../../../src/builtin/constants/outputControl'),
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    NoActiveOutputBufferException = require('phpcore/src/Exception/NoActiveOutputBufferException'),
    Output = require('phpcore/src/Output/Output'),
    PHPError = phpCommon.PHPError;

describe('PHP "ob_end_flush" builtin function', function () {
    var callStack,
        ob_end_flush,
        output,
        state,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        output = sinon.createStubInstance(Output);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack,
            'output': output
        }, {}, [
            {
                constantGroups: [
                    outputControlConstantFactory
                ],
                functionGroups: [
                    outputControlFunctionFactory
                ]
            }
        ]);
        valueFactory = state.getValueFactory();

        ob_end_flush = state.getFunction('ob_end_flush');
    });

    it('should flush then discard the current output buffer', async function () {
        await ob_end_flush().toPromise();

        expect(output.flushCurrentBuffer).to.have.been.calledOnce;
        expect(output.popBuffer).to.have.been.calledOnce;
        expect(output.popBuffer).to.have.been.calledAfter(output.flushCurrentBuffer);
    });

    describe('on success', function () {
        it('should return true', async function () {
            var resultValue = await ob_end_flush().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should not raise any error', async function () {
            await ob_end_flush().toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('on failure', function () {
        beforeEach(function () {
            output.flushCurrentBuffer.throws(new NoActiveOutputBufferException());
        });

        it('should raise a notice', async function () {
            await ob_end_flush().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_NOTICE,
                'ob_end_flush(): failed to delete and flush buffer. No buffer to delete or flush'
            );
        });

        it('should return bool(false)', async function () {
            var resultValue = await ob_end_flush().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
