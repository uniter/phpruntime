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
    Class = require('phpcore/src/Class').sync(),
    Exception = phpCommon.Exception,
    Output = require('phpcore/src/Output/Output');

describe('PHP "ob_start" builtin function', function () {
    var callFactory,
        callStack,
        ob_start,
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
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();

        // We need a call on the stack for the isolated scope evaluation of the default argument to $flags.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        ob_start = state.getFunction('ob_start');
    });

    describe('when no arguments are given', function () {
        it('should push a buffer onto the stack', async function () {
            await ob_start().toPromise();

            expect(output.pushBuffer).to.have.been.calledOnce;
        });
    });

    describe('when a callback argument is given', function () {
        it('should throw an exception as there is no support for now', async function () {
            var classObject = sinon.createStubInstance(Class);

            await expect(ob_start(valueFactory.createObject({}, classObject)).toPromise())
                .to.eventually.be.rejectedWith(
                    Exception,
                    'ob_start() :: No arguments are supported yet'
                );
        });
    });
});
