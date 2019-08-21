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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    CallStack = require('phpcore/src/CallStack'),
    Formatter = require('../../../../../src/builtin/bindings/string/Formatter'),
    MissingFormatArgumentException = require('../../../../../src/builtin/bindings/string/Exception/MissingFormatArgumentException'),
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "sprintf" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.formatter = sinon.createStubInstance(Formatter);
        this.getBinding = sinon.stub();
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            getBinding: this.getBinding,
            valueFactory: this.valueFactory
        };
        this.getBinding.withArgs('stringFormatter').returns(this.formatter);
        this.stringFunctions = stringFunctionFactory(this.internals);
        this.sprintf = this.stringFunctions.sprintf;

        this.templateReference = sinon.createStubInstance(Variable);
        this.templateReference.getNative.returns('my %s string');
    });

    it('should return a string with the result from the formatter when it returns one', function () {
        var argReference = sinon.createStubInstance(Variable),
            resultValue;
        this.templateReference.getNative.returns('my %s string');
        argReference.getValue.returns(this.valueFactory.createString('formatted'));
        this.formatter.format
            .withArgs('my %s string', [sinon.match.same(argReference)])
            .returns('my formatted string');

        resultValue = this.sprintf(this.templateReference, argReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('my formatted string');
    });

    describe('when the formatter throws a MissingFormatArgumentException', function () {
        it('should raise a warning', function () {
            this.formatter.format.throws(new MissingFormatArgumentException(27));

            this.sprintf(this.templateReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'sprintf(): Too few arguments'
            );
        });

        it('should return boolean false', function () {
            var resultValue;
            this.formatter.format.throws(new MissingFormatArgumentException(27));

            resultValue = this.sprintf(this.templateReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when the formatter throws a different type of error', function () {
        it('should not catch the error', function () {
            this.formatter.format.throws(new Error('Bang!'));

            expect(function () {
                this.sprintf(this.templateReference);
            }.bind(this)).to.throw('Bang!');
        });
    });
});
