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
    urlFunctionFactory = require('../../../../../src/builtin/functions/url'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack');

describe('PHP "rawurldecode" builtin function', function () {
    var callFactory,
        callStack,
        rawurldecode,
        state,
        stringVariable,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    urlFunctionFactory
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

        rawurldecode = state.getFunction('rawurldecode');

        stringVariable = variableFactory.createVariable('myString');
    });

    it('should return a string with no percent-encoded characters unmodified', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('hello world'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello world');
    });

    it('should decode percent-encoded characters', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('hello%20world%21'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello world!');
    });

    it('should decode multiple percent-encoded characters', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('%48%65%6C%6C%6F%20%57%6F%72%6C%64'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('Hello World');
    });

    it('should handle mixed encoded and unencoded characters', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('hello%20world%21%20%26%20goodbye%20world%21'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello world! & goodbye world!');
    });

    it('should handle invalid percent-encoded sequences by leaving them unchanged', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('hello%2world%'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello%2world%');
    });

    it('should not decode "+" to a space (unlike urldecode)', async function () {
        const resultValue = await rawurldecode(stringVariable.setValue(valueFactory.createString('hello+world'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello+world');
    });
});
