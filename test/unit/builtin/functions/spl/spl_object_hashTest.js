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
    splFunctionFactory = require('../../../../../src/builtin/functions/spl'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    ObjectValue = require('phpcore/src/Value/Object').sync();

describe('PHP "spl_object_hash" builtin function', function () {
    var callFactory,
        callStack,
        objectValue,
        objectVariable,
        spl_object_hash,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    splFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        spl_object_hash = state.getFunction('spl_object_hash');

        objectVariable = variableFactory.createVariable('myObject');
        objectValue = sinon.createStubInstance(ObjectValue);
        objectValue.getForAssignment.returns(objectValue);
        objectValue.getID.returns(21);
        objectValue.getType.returns('object');
        objectValue.next.callsArgWith(0, objectValue);
        objectVariable.setValue(objectValue);
    });

    it('should return a 32-byte 0-padded hash with the object\'s ID when 2 digits long', async function () {
        var resultValue = await spl_object_hash(objectVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('00000000000000000000000000000021');
    });

    it('should return a 32-byte 0-padded hash with the object\'s ID when 4 digits long', async function () {
        var resultValue;
        objectValue.getID.returns(4532);

        resultValue = await spl_object_hash(objectVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('00000000000000000000000000004532');
    });
});
