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
    stringBindingFactory = require('../../../../../src/builtin/bindings/string'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack');

describe('PHP "strpos" builtin function', function () {
    var callFactory,
        callStack,
        haystackVariable,
        needleVariable,
        offsetVariable,
        state,
        strpos,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                bindingGroups: [
                    stringBindingFactory
                ],
                functionGroups: [
                    stringFunctionFactory
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

        strpos = state.getFunction('strpos');

        haystackVariable = variableFactory.createVariable('myHaystack');
        needleVariable = variableFactory.createVariable('myNeedle');
        offsetVariable = variableFactory.createVariable('myOffset');
    });

    it('should return 6 when looking for "world" in "hello world out there!" with no offset', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('hello world, out there world!'));
        needleVariable.setValue(valueFactory.createString('world'));

        result = await strpos(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(6);
    });

    it('should return 21 when looking for "you" in "hello you, where are you?" with offset 10', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('hello you, where are you?'));
        needleVariable.setValue(valueFactory.createString('you'));
        offsetVariable.setValue(valueFactory.createInteger(10));

        result = await strpos(haystackVariable, needleVariable, offsetVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(21);
    });

    it('should return boolean false when the needle is not found in the haystack', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('This is a string.'));
        needleVariable.setValue(valueFactory.createString('random'));

        result = await strpos(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.false;
    });
});
