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
    htmlStringFunctionFactory = require('../../../../../../src/builtin/functions/string/html'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    stringConstantFactory = require('../../../../../../src/builtin/constants/string'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError;

describe('PHP "htmlentities" builtin function', function () {
    var callFactory,
        callStack,
        doubleEncodeVariable,
        encodingVariable,
        flagsVariable,
        htmlentities,
        state,
        stringVariable,
        valueFactory,
        variableFactory,

        HTML_SPECIALCHARS,
        HTML_ENTITIES,
        ENT_NOQUOTES,
        ENT_COMPAT,
        ENT_QUOTES,
        ENT_HTML401,
        ENT_SUBSTITUTE;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                constantGroups: [
                    stringConstantFactory
                ],
                functionGroups: [
                    htmlStringFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        HTML_SPECIALCHARS = state.getConstantValue('HTML_SPECIALCHARS');
        HTML_ENTITIES = state.getConstantValue('HTML_ENTITIES');
        ENT_NOQUOTES = state.getConstantValue('ENT_NOQUOTES');
        ENT_COMPAT = state.getConstantValue('ENT_COMPAT');
        ENT_QUOTES = state.getConstantValue('ENT_QUOTES');
        ENT_HTML401 = state.getConstantValue('ENT_HTML401');
        ENT_SUBSTITUTE = state.getConstantValue('ENT_SUBSTITUTE');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        htmlentities = state.getFunction('htmlentities');

        stringVariable = variableFactory.createVariable('myString');
        flagsVariable = variableFactory.createVariable('myFlags');
        encodingVariable = variableFactory.createVariable('myEncoding');
        doubleEncodeVariable = variableFactory.createVariable('myDoubleEncode');
    });

    it('should return a string with only alphanumeric characters unmodified', async function () {
        var resultValue;
        stringVariable.setValue(valueFactory.createString('hello world'));

        resultValue = await htmlentities(stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello world');
    });

    it('should encode the supported entities when only a string is given', async function () {
        var resultValue;
        stringVariable.setValue(
            valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p')
        );

        resultValue = await htmlentities(stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with the default flags.
        expect(resultValue.getNative()).to.equal(
            'hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs &pound;45 &amp; 7p'
        );
    });

    it('should encode the supported entities when a string is given with default flags ENT_COMPAT | ENT_HTML401', async function () {
        /*jshint bitwise: false */
        var resultValue;
        stringVariable.setValue(
            valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p')
        );
        flagsVariable.setValue(ENT_COMPAT.bitwiseOr(ENT_HTML401));

        resultValue = await htmlentities(stringVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with ENT_COMPAT.
        expect(resultValue.getNative()).to.equal(
            'hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs &pound;45 &amp; 7p'
        );
    });

    it('should also encode single quotes with ENT_QUOTES', async function () {
        /*jshint bitwise: false */
        var resultValue;
        stringVariable.setValue(valueFactory.createString('hello <there> \'world\' & "planet"'));
        flagsVariable.setValue(ENT_QUOTES);

        resultValue = await htmlentities(stringVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal(
            'hello &lt;there&gt; &#039;world&#039; &amp; &quot;planet&quot;'
        );
    });

    it('should not encode any quotes with ENT_NOQUOTES', async function () {
        /*jshint bitwise: false */
        var resultValue;
        stringVariable.setValue(valueFactory.createString('hello <there> \'world\' & "planet"'));
        flagsVariable.setValue(ENT_NOQUOTES);

        resultValue = await htmlentities(stringVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; "planet"');
    });

    it('should accept the ENT_SUBSTITUTE flag (not applicable)', async function () {
        /*jshint bitwise: false */
        var resultValue;
        stringVariable.setValue(valueFactory.createString('hello <there> \'world\' & "planet"'));
        flagsVariable.setValue(ENT_SUBSTITUTE);

        resultValue = await htmlentities(stringVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; "planet"');
    });

    it('should support the UTF-8 encoding', async function () {
        /*jshint bitwise: false */
        var resultValue;
        stringVariable.setValue(valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));
        flagsVariable.setValue(ENT_COMPAT.bitwiseOr(ENT_HTML401));
        encodingVariable.setValue(valueFactory.createString('UTF-8'));

        resultValue = await htmlentities(stringVariable, flagsVariable, encodingVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with ENT_COMPAT.
        expect(resultValue.getNative()).to.equal(
            'hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs &pound;45 &amp; 7p'
        );
    });

    describe('when the UTF-8 encoding is given with different case', function () {
        beforeEach(function () {
            /*jshint bitwise: false */
            stringVariable.setValue(
                valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p')
            );
            flagsVariable.setValue(ENT_COMPAT.bitwiseOr(ENT_HTML401));
            encodingVariable.setValue(valueFactory.createString('uTf-8'));
        });

        it('should not raise a warning', async function () {
            await htmlentities(stringVariable, flagsVariable, encodingVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', async function () {
            var resultValue = await htmlentities(stringVariable, flagsVariable, encodingVariable).toPromise();

            expect(resultValue.getType()).to.equal('string');
            // Note that single-quotes should be left untouched with ENT_COMPAT.
            expect(resultValue.getNative()).to.equal(
                'hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs &pound;45 &amp; 7p'
            );
        });
    });

    describe('when the ISO-8859-1 encoding is given', function () {
        beforeEach(function () {
            /*jshint bitwise: false */
            stringVariable.setValue(
                valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p')
            );
            flagsVariable.setValue(ENT_COMPAT.bitwiseOr(ENT_HTML401));
            encodingVariable.setValue(valueFactory.createString('ISO-8859-1'));
        });

        it('should raise a warning', async function () {
            await htmlentities(stringVariable, flagsVariable, encodingVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'htmlentities(): charset `ISO-8859-1\' not supported, assuming utf-8'
            );
        });

        it('should assume UTF-8', async function () {
            var resultValue = await htmlentities(stringVariable, flagsVariable, encodingVariable).toPromise();

            expect(resultValue.getType()).to.equal('string');
            // Note that single-quotes should be left untouched with ENT_COMPAT.
            expect(resultValue.getNative()).to.equal(
                'hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs &pound;45 &amp; 7p'
            );
        });
    });

    it('should allow double_encode to be disabled', async function () {
        var resultValue;
        /*jshint bitwise: false */
        stringVariable.setValue(
            valueFactory.createString('My &#039; <strong>HTML</strong> &lt; string &amp; \'then\' "some"')
        );
        flagsVariable.setValue(ENT_QUOTES);
        encodingVariable.setValue(valueFactory.createString('UTF-8'));
        doubleEncodeVariable.setValue(valueFactory.createBoolean(false));

        resultValue = await htmlentities(stringVariable, flagsVariable, encodingVariable, doubleEncodeVariable)
            .toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal(
            'My &#039; &lt;strong&gt;HTML&lt;/strong&gt; &lt; string &amp; &#039;then&#039; &quot;some&quot;'
        );
    });
});
