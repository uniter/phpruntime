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

describe('PHP "rawurlencode" builtin function', function () {
    var callFactory,
        callStack,
        rawurlencode,
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

        rawurlencode = state.getFunction('rawurlencode');

        stringVariable = variableFactory.createVariable('myString');
    });

    it('should return a string with alphanumeric characters unmodified', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('hello123'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello123');
    });

    it('should encode special characters', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('hello world!'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello%20world%21');
    });

    it('should encode multiple special characters', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('Hello World & Goodbye World!'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('Hello%20World%20%26%20Goodbye%20World%21');
    });

    it('should not encode hyphen, underscore, dot, or tilde', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('hello-world_123.456~'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello-world_123.456~');
    });

    it('should encode non-ASCII characters', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('héllö wörld'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('h%C3%A9ll%C3%B6%20w%C3%B6rld');
    });

    it('should not encode plus symbol to %20 (unlike urlencode)', async function () {
        const resultValue = await rawurlencode(stringVariable.setValue(valueFactory.createString('hello+world'))).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello%2Bworld');
    });
});
