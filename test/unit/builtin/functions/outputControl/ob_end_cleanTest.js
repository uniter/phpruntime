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
    PHPError = phpCommon.PHPError,
    Output = require('phpcore/src/Output/Output');

describe('PHP "ob_end_clean" builtin function', function () {
    var callStack,
        ob_end_clean,
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

        ob_end_clean = state.getFunction('ob_end_clean');
    });

    it('should discard the current output buffer', async function () {
        await ob_end_clean().toPromise();

        expect(output.popBuffer).to.have.been.calledOnce;
    });

    describe('on success', function () {
        it('should return true', async function () {
            var resultValue = await ob_end_clean().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should not raise any error', async function () {
            await ob_end_clean().toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('on failure', function () {
        beforeEach(function () {
            output.popBuffer.throws(new NoActiveOutputBufferException());
        });

        it('should raise a notice', async function () {
            await ob_end_clean().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_NOTICE,
                'ob_end_clean(): failed to delete buffer. No buffer to delete'
            );
        });

        it('should return bool(false)', async function () {
            var resultValue = await ob_end_clean().toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
