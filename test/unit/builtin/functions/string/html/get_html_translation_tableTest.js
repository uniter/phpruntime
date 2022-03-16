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
    htmlStringFunctionFactory = require('../../../../../../src/builtin/functions/string/html'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Variable = require('phpcore/src/Variable').sync(),

    HTML_SPECIALCHARS = 0,
    HTML_ENTITIES = 1,
    ENT_NOQUOTES = 0,
    ENT_COMPAT = 2,
    ENT_QUOTES = 3,
    ENT_HTML401 = 0;

describe('PHP "get_html_translation_table" builtin function', function () {
    var callStack,
        encodingReference,
        flagsReference,
        getBinding,
        getConstant,
        get_html_translation_table,
        internals,
        stringFunctions,
        tableReference,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        getBinding = sinon.stub();
        getConstant = sinon.stub();
        valueFactory = tools.createIsolatedState().getValueFactory();
        internals = {
            callStack: callStack,
            getBinding: getBinding,
            getConstant: getConstant,
            valueFactory: valueFactory
        };

        getConstant.withArgs('HTML_SPECIALCHARS').returns(HTML_SPECIALCHARS);
        getConstant.withArgs('HTML_ENTITIES').returns(HTML_ENTITIES);
        getConstant.withArgs('ENT_NOQUOTES').returns(ENT_NOQUOTES);
        getConstant.withArgs('ENT_COMPAT').returns(ENT_COMPAT);
        getConstant.withArgs('ENT_QUOTES').returns(ENT_QUOTES);
        getConstant.withArgs('ENT_HTML401').returns(ENT_HTML401);

        stringFunctions = htmlStringFunctionFactory(internals);
        get_html_translation_table = stringFunctions.get_html_translation_table;

        tableReference = sinon.createStubInstance(Variable);
        flagsReference = sinon.createStubInstance(Variable);
        encodingReference = sinon.createStubInstance(Variable);
    });

    it('should return the htmlspecialchars(...) table by default', function () {
        var resultValue = get_html_translation_table();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table when fetched explicitly', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));

        resultValue = get_html_translation_table(tableReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlentities(...) table when fetched explicitly', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_ENTITIES));

        resultValue = get_html_translation_table(tableReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '£': '&pound;'
        });
    });

    it('should return the htmlspecialchars(...) table with only double quotes included with ENT_COMPAT', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
        flagsReference.getValue.returns(valueFactory.createInteger(ENT_COMPAT));

        resultValue = get_html_translation_table(tableReference, flagsReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table with single quotes included with ENT_QUOTES', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
        flagsReference.getValue.returns(valueFactory.createInteger(ENT_QUOTES));

        resultValue = get_html_translation_table(tableReference, flagsReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '"': '&quot;',
            '&': '&amp;',
            '\'': '&#039;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should return the htmlspecialchars(...) table with no quotes included with ENT_NOQUOTES', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
        flagsReference.getValue.returns(valueFactory.createInteger(ENT_NOQUOTES));

        resultValue = get_html_translation_table(tableReference, flagsReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should support the UTF-8 encoding', function () {
        var resultValue;
        tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
        flagsReference.getValue.returns(valueFactory.createInteger(ENT_NOQUOTES));
        encodingReference.getValue.returns(valueFactory.createString('UTF-8'));

        resultValue = get_html_translation_table(tableReference, flagsReference, encodingReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    describe('passing NULL for table and flags when specifying UTF-8 as the encoding', function () {
        beforeEach(function () {
            tableReference.getValue.returns(valueFactory.createNull());
            flagsReference.getValue.returns(valueFactory.createNull());
            encodingReference.getValue.returns(valueFactory.createString('UTF-8'));
        });

        it('should not raise a warning', function () {
            get_html_translation_table(tableReference, flagsReference, encodingReference);

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', function () {
            var resultValue = get_html_translation_table(tableReference, flagsReference, encodingReference);

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
            tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
            flagsReference.getValue.returns(valueFactory.createInteger(ENT_NOQUOTES));
            encodingReference.getValue.returns(valueFactory.createString('uTf-8'));
        });

        it('should not raise a warning', function () {
            get_html_translation_table(tableReference, flagsReference, encodingReference);

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', function () {
            var resultValue = get_html_translation_table(tableReference, flagsReference, encodingReference);

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });

    describe('when the ISO-8859-1 encoding is given', function () {
        beforeEach(function () {
            tableReference.getValue.returns(valueFactory.createInteger(HTML_SPECIALCHARS));
            flagsReference.getValue.returns(valueFactory.createInteger(ENT_NOQUOTES));
            encodingReference.getValue.returns(valueFactory.createString('ISO-8859-1'));
        });

        it('should raise a warning', function () {
            get_html_translation_table(tableReference, flagsReference, encodingReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'get_html_translation_table(): charset `ISO-8859-1\' not supported, assuming utf-8'
            );
        });

        it('should assume UTF-8', function () {
            var resultValue = get_html_translation_table(tableReference, flagsReference, encodingReference);

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });
});
