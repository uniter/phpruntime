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
    ENT_HTML401 = 0,
    ENT_SUBSTITUTE = 8;

describe('PHP "htmlspecialchars" builtin function', function () {
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
        this.htmlspecialchars = this.stringFunctions.htmlspecialchars;

        this.stringReference = sinon.createStubInstance(Variable);
        this.flagsReference = sinon.createStubInstance(Variable);
        this.encodingReference = sinon.createStubInstance(Variable);
        this.doubleEncodeReference = sinon.createStubInstance(Variable);
    });

    it('should return a string with only alphanumeric characters unmodified', function () {
        var resultValue;
        this.stringReference.getValue.returns(this.valueFactory.createString('hello world'));

        resultValue = this.htmlspecialchars(this.stringReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello world');
    });

    it('should encode the supported entities when only a string is given', function () {
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));

        resultValue = this.htmlspecialchars(this.stringReference);

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with the default flags,
        // and that the pound symbol £ should be left untouched (unlike htmlentities(...))
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs £45 &amp; 7p');
    });

    it('should encode the supported entities when a string is given with default flags ENT_COMPAT | ENT_HTML401', function () {
        /*jshint bitwise: false */
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_COMPAT | ENT_HTML401));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference);

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with ENT_COMPAT
        // and that the pound symbol £ should be left untouched (unlike htmlentities(...))
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs £45 &amp; 7p');
    });

    it('should also encode single quotes with ENT_QUOTES', function () {
        /*jshint bitwise: false */
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet"'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_QUOTES));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; &#039;world&#039; &amp; &quot;planet&quot;');
    });

    it('should not encode any quotes with ENT_NOQUOTES', function () {
        /*jshint bitwise: false */
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet"'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_NOQUOTES));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; "planet"');
    });

    it('should accept the ENT_SUBSTITUTE flag (not applicable)', function () {
        /*jshint bitwise: false */
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet"'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_SUBSTITUTE));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; "planet"');
    });

    it('should support the UTF-8 encoding', function () {
        /*jshint bitwise: false */
        var resultValue;
        this.stringReference.getValue
            .returns(this.valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_COMPAT | ENT_HTML401));
        this.encodingReference.getValue.returns(this.valueFactory.createString('UTF-8'));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference);

        expect(resultValue.getType()).to.equal('string');
        // Note that single-quotes should be left untouched with ENT_COMPAT
        // and that the pound symbol £ should be left untouched (unlike htmlentities(...))
        expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs £45 &amp; 7p');
    });

    describe('when the UTF-8 encoding is given with different case', function () {
        beforeEach(function () {
            /*jshint bitwise: false */
            this.stringReference.getValue
                .returns(this.valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));
            this.flagsReference.getValue
                .returns(this.valueFactory.createInteger(ENT_COMPAT | ENT_HTML401));
            this.encodingReference.getValue.returns(this.valueFactory.createString('uTf-8'));
        });

        it('should not raise a warning', function () {
            this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });

        it('should use UTF-8', function () {
            var resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference);

            expect(resultValue.getType()).to.equal('string');
            // Note that single-quotes should be left untouched with ENT_COMPAT
            // and that the pound symbol £ should be left untouched (unlike htmlentities(...))
            expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs £45 &amp; 7p');
        });
    });

    describe('when the ISO-8859-1 encoding is given', function () {
        beforeEach(function () {
            /*jshint bitwise: false */
            this.stringReference.getValue
                .returns(this.valueFactory.createString('hello <there> \'world\' & "planet", it costs £45 & 7p'));
            this.flagsReference.getValue
                .returns(this.valueFactory.createInteger(ENT_COMPAT | ENT_HTML401));
            this.encodingReference.getValue.returns(this.valueFactory.createString('ISO-8859-1'));
        });

        it('should raise a warning', function () {
            this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'htmlspecialchars(): charset `ISO-8859-1\' not supported, assuming utf-8'
            );
        });

        it('should assume UTF-8', function () {
            var resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference);

            expect(resultValue.getType()).to.equal('string');
            // Note that single-quotes should be left untouched with ENT_COMPAT
            // and that the pound symbol £ should be left untouched (unlike htmlentities(...))
            expect(resultValue.getNative()).to.equal('hello &lt;there&gt; \'world\' &amp; &quot;planet&quot;, it costs £45 &amp; 7p');
        });
    });

    it('should allow double_encode to be disabled', function () {
        var resultValue;
        /*jshint bitwise: false */
        this.stringReference.getValue
            .returns(this.valueFactory.createString('My &#039; <strong>HTML</strong> &lt; string &amp; \'then\' "some"'));
        this.flagsReference.getValue
            .returns(this.valueFactory.createInteger(ENT_QUOTES));
        this.encodingReference.getValue.returns(this.valueFactory.createString('UTF-8'));
        this.doubleEncodeReference.getValue.returns(this.valueFactory.createBoolean(false));

        resultValue = this.htmlspecialchars(this.stringReference, this.flagsReference, this.encodingReference, this.doubleEncodeReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('My &#039; &lt;strong&gt;HTML&lt;/strong&gt; &lt; string &amp; &#039;then&#039; &quot;some&quot;');
    });

    describe('when no arguments are given', function () {
        it('should raise a warning', function () {
            this.htmlspecialchars();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'htmlspecialchars() expects at least 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            expect(this.htmlspecialchars().getType()).to.equal('null');
        });
    });
});
