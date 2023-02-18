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

describe('PHP "get_html_translation_table" builtin function', function () {
    var callFactory,
        callStack,
        encodingVariable,
        flagsVariable,
        get_html_translation_table,
        state,
        tableVariable,
        valueFactory,
        variableFactory,

        HTML_SPECIALCHARS,
        HTML_ENTITIES,
        ENT_NOQUOTES,
        ENT_COMPAT,
        ENT_QUOTES,
        ENT_HTML401;

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

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        get_html_translation_table = state.getFunction('get_html_translation_table');

        tableVariable = variableFactory.createVariable('myTable');
        flagsVariable = variableFactory.createVariable('myFlags');
        encodingVariable = variableFactory.createVariable('myEncoding');
    });

    it('should return the htmlspecialchars(...) table by default', async function () {
        var resultValue = await get_html_translation_table().toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table when fetched explicitly', async function () {
        var resultValue;
        tableVariable.setValue(HTML_SPECIALCHARS);

        resultValue = await get_html_translation_table(tableVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlentities(...) table when fetched explicitly', async function () {
        var resultValue;
        tableVariable.setValue(HTML_ENTITIES);

        resultValue = await get_html_translation_table(tableVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '£': '&pound;'
        });
    });

    it('should return the htmlspecialchars(...) table with only double quotes included with ENT_COMPAT', async function () {
        var resultValue;
        tableVariable.setValue(HTML_SPECIALCHARS);
        flagsVariable.setValue(ENT_COMPAT);

        resultValue = await get_html_translation_table(tableVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table with single quotes included with ENT_QUOTES', async function () {
        var resultValue;
        tableVariable.setValue(HTML_SPECIALCHARS);
        flagsVariable.setValue(ENT_QUOTES);

        resultValue = await get_html_translation_table(tableVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '\'': '&#039;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table with no quotes included with ENT_NOQUOTES', async function () {
        var resultValue;
        tableVariable.setValue(HTML_SPECIALCHARS);
        flagsVariable.setValue(ENT_NOQUOTES);

        resultValue = await get_html_translation_table(tableVariable, flagsVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should support the UTF-8 encoding', async function () {
        var resultValue;
        tableVariable.setValue(HTML_SPECIALCHARS);
        flagsVariable.setValue(ENT_NOQUOTES);
        encodingVariable.setValue(valueFactory.createString('UTF-8'));

        resultValue = await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    describe('passing NULL for table and flags when specifying UTF-8 as the encoding', async function () {
        beforeEach(function () {
            tableVariable.setValue(valueFactory.createNull());
            flagsVariable.setValue(valueFactory.createNull());
            encodingVariable.setValue(valueFactory.createString('UTF-8'));
        });

        it('should not raise a warning', async function () {
            await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', async function () {
            var resultValue = await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });

    describe('when the UTF-8 encoding is given with different case', function () {
        beforeEach(function () {
            tableVariable.setValue(HTML_SPECIALCHARS);
            flagsVariable.setValue(ENT_NOQUOTES);
            encodingVariable.setValue(valueFactory.createString('uTf-8'));
        });

        it('should not raise a warning', async function () {
            await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', async function () {
            var resultValue = await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });

    // ISO-8859-1 is not yet supported, only UTF-8.
    describe('when the ISO-8859-1 encoding is given', function () {
        beforeEach(function () {
            tableVariable.setValue(HTML_SPECIALCHARS);
            flagsVariable.setValue(ENT_NOQUOTES);
            encodingVariable.setValue(valueFactory.createString('ISO-8859-1'));
        });

        it('should raise a warning', async function () {
            await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_html_translation_table(): charset `ISO-8859-1\' not supported, assuming utf-8'
            );
        });

        it('should assume UTF-8', async function () {
            var resultValue = await get_html_translation_table(tableVariable, flagsVariable, encodingVariable).toPromise();

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });
});
