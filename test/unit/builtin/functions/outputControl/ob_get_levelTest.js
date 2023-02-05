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
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Output = require('phpcore/src/Output/Output');

describe('PHP "ob_get_level" builtin function', function () {
    var callStack,
        ob_get_level,
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

        ob_get_level = state.getFunction('ob_get_level');
    });

    it('should return int(0) when no output buffering is enabled', async function () {
        var resultValue;
        output.getDepth.returns(0);

        resultValue = await ob_get_level().toPromise();

        expect(resultValue.getType()).to.equal('int');
        expect(resultValue.getNative()).to.equal(0);
    });

    it('should return int(4) when 4 output buffers have been started', async function () {
        var resultValue;
        output.getDepth.returns(4);

        resultValue = await ob_get_level().toPromise();

        expect(resultValue.getType()).to.equal('int');
        expect(resultValue.getNative()).to.equal(4);
    });
});
