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
    outputControlConstantFactory = require('../../../../../src/builtin/constants/outputControl'),
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Output = require('phpcore/src/Output/Output'),
    PHPError = phpCommon.PHPError;

describe('PHP "ob_get_flush" builtin function', function () {
    var callStack,
        ob_get_flush,
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

        ob_get_flush = state.getFunction('ob_get_flush');
    });

    describe('on success', function () {
        beforeEach(function () {
            output.getDepth.returns(4);
        });

        it('should flush and then return the current output buffer', async function () {
            var resultValue;
            output.getCurrentBufferContents.returns('my buffered output');
            output.flushCurrentBuffer.callsFake(function () {
                output.getCurrentBufferContents.returns('');
            });

            resultValue = await ob_get_flush().toPromise();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('my buffered output');
            expect(output.flushCurrentBuffer).to.have.been.calledOnce;
        });

        it('should not raise any error', async function () {
            await ob_get_flush().toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('on failure', function () {
        beforeEach(function () {
            output.getDepth.returns(0);
        });

        it('should raise a notice', async function () {
            await ob_get_flush().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_NOTICE,
                'ob_get_flush(): failed to delete and flush buffer. No buffer to delete or flush'
            );
        });

        it('should return bool(false)', async function () {
            var resultValue = await ob_get_flush().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
