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
    commonPcreFunctionFactory = require('../../../../../../src/builtin/functions/pcre/common'),
    sinon = require('sinon'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack');

describe('PHP "preg_quote" basic-level builtin function', function () {
    var callFactory,
        callStack,
        delimiterVariable,
        preg_quote,
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
                    commonPcreFunctionFactory
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

        preg_quote = state.getFunction('preg_quote');

        stringVariable = variableFactory.createVariable('myString');
        delimiterVariable = variableFactory.createVariable('myDelimiter');
    });

    it('should not alter a string containing no special chars', async function () {
        var result;
        stringVariable.setValue(valueFactory.createString('hello, this is my string'));

        result = await preg_quote(stringVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal('hello, this is my string');
    });

    it('should escape all of the regex special chars', async function () {
        var result;
        stringVariable.setValue(
            valueFactory.createString(
                'hello, here\n . \\ + * ? [ ^ ] $ ( ) { } = ! < > | : - # \nare all the special chars'
            )
        );

        result = await preg_quote(stringVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here\n \\. \\\\ \\+ \\* \\? \\[ \\^ \\] \\$ \\( \\) \\{ \\} \\= \\! \\< \\> \\| \\: \\- \\# \nare all the special chars'
        );
    });

    it('should also escape all occurrences of the specified delimiter when given', async function () {
        var result;
        stringVariable.setValue(valueFactory.createString('hello, here + ? is @ my @ string'));
        delimiterVariable.setValue(valueFactory.createString('@'));

        result = await preg_quote(stringVariable, delimiterVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is \\@ my \\@ string'
        );
    });

    it('should not double-escape a character escaped by default when given as the delimiter', async function () {
        var result;
        stringVariable.setValue(valueFactory.createString('hello, here + ? is my string'));
        delimiterVariable.setValue(valueFactory.createString('+'));

        result = await preg_quote(stringVariable, delimiterVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is my string'
        );
    });

    it('should ignore all but the first character of the delimiter string when given', async function () {
        var result;
        stringVariable.setValue(valueFactory.createString('hello, here + ? is @ my @ string'));
        delimiterVariable.setValue(valueFactory.createString('@sg'));

        result = await preg_quote(stringVariable, delimiterVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is \\@ my \\@ string'
        );
    });
});
