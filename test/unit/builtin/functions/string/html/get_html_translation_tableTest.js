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
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync(),

    HTML_SPECIALCHARS = 0,
    HTML_ENTITIES = 1,
    ENT_NOQUOTES = 0,
    ENT_COMPAT = 2,
    ENT_QUOTES = 3,
    ENT_HTML401 = 0;

describe('PHP "get_html_translation_table" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getBinding = sinon.stub();
        this.getConstant = sinon.stub();
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            getBinding: this.getBinding,
            getConstant: this.getConstant,
            valueFactory: this.valueFactory
        };

        this.getConstant.withArgs('HTML_SPECIALCHARS').returns(HTML_SPECIALCHARS);
        this.getConstant.withArgs('HTML_ENTITIES').returns(HTML_ENTITIES);
        this.getConstant.withArgs('ENT_NOQUOTES').returns(ENT_NOQUOTES);
        this.getConstant.withArgs('ENT_COMPAT').returns(ENT_COMPAT);
        this.getConstant.withArgs('ENT_QUOTES').returns(ENT_QUOTES);
        this.getConstant.withArgs('ENT_HTML401').returns(ENT_HTML401);

        this.stringFunctions = htmlStringFunctionFactory(this.internals);
        this.get_html_translation_table = this.stringFunctions.get_html_translation_table;

        this.tableReference = sinon.createStubInstance(Variable);
        this.flagsReference = sinon.createStubInstance(Variable);
        this.encodingReference = sinon.createStubInstance(Variable);
    });

    it('should return the htmlspecialchars(...) table by default', function () {
        var resultValue = this.get_html_translation_table();

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
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));

        resultValue = this.get_html_translation_table(this.tableReference);

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
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_ENTITIES));

        resultValue = this.get_html_translation_table(this.tableReference);

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
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
        this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_COMPAT));

        resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference);

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
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
        this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_QUOTES));

        resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference);

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
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
        this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_NOQUOTES));

        resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    it('should support the UTF-8 encoding', function () {
        var resultValue;
        this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
        this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_NOQUOTES));
        this.encodingReference.getValue.returns(this.valueFactory.createString('UTF-8'));

        resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        });
    });

    describe('passing NULL for table and flags when specifying UTF-8 as the encoding', function () {
        beforeEach(function () {
            this.tableReference.getValue.returns(this.valueFactory.createNull());
            this.flagsReference.getValue.returns(this.valueFactory.createNull());
            this.encodingReference.getValue.returns(this.valueFactory.createString('UTF-8'));
        });

        it('should not raise a warning', function () {
            this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', function () {
            var resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

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
            this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
            this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_NOQUOTES));
            this.encodingReference.getValue.returns(this.valueFactory.createString('uTf-8'));
        });

        it('should not raise a warning', function () {
            this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', function () {
            var resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

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
            this.tableReference.getValue.returns(this.valueFactory.createInteger(HTML_SPECIALCHARS));
            this.flagsReference.getValue.returns(this.valueFactory.createInteger(ENT_NOQUOTES));
            this.encodingReference.getValue.returns(this.valueFactory.createString('ISO-8859-1'));
        });

        it('should raise a warning', function () {
            this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'get_html_translation_table(): charset `ISO-8859-1\' not supported, assuming utf-8'
            );
        });

        it('should assume UTF-8', function () {
            var resultValue = this.get_html_translation_table(this.tableReference, this.flagsReference, this.encodingReference);

            expect(resultValue.getType()).to.equal('array');
            expect(resultValue.getNative()).to.deep.equal({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            });
        });
    });
});
