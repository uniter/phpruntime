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
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "strrchr" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getBinding = sinon.stub();
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            getBinding: this.getBinding,
            valueFactory: this.valueFactory
        };
        this.stringFunctions = stringFunctionFactory(this.internals);
        this.strrchr = this.stringFunctions.strrchr;

        this.haystackReference = sinon.createStubInstance(Variable);
        this.needleReference = sinon.createStubInstance(Variable);
    });

    it('should return the portion of the string after the last occurrence of needle', function () {
        var resultValue;
        this.haystackReference.getValue.returns(this.valueFactory.createString('hello hello'));
        this.needleReference.getValue.returns(this.valueFactory.createString('el'));

        resultValue = this.strrchr(this.haystackReference, this.needleReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('ello');
    });

    it('should coerce the haystack to a string', function () {
        var resultValue;
        this.haystackReference.getValue.returns(this.valueFactory.createInteger(22499));
        this.needleReference.getValue.returns(this.valueFactory.createString('4'));

        resultValue = this.strrchr(this.haystackReference, this.needleReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('499');
    });

    it('should interpret an integer for needle as the ordinal value of a character', function () {
        var resultValue;
        this.haystackReference.getValue.returns(this.valueFactory.createString('first line\nsecond line\nthird line'));
        this.needleReference.getValue.returns(this.valueFactory.createInteger(10));

        resultValue = this.strrchr(this.haystackReference, this.needleReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('\nthird line');
    });

    it('should return false when haystack does not contain needle', function () {
        var resultValue;
        this.haystackReference.getValue.returns(this.valueFactory.createString('some string of mine'));
        this.needleReference.getValue.returns(this.valueFactory.createString('xyz'));

        resultValue = this.strrchr(this.haystackReference, this.needleReference);

        expect(resultValue.getType()).to.equal('boolean');
        expect(resultValue.getNative()).to.be.false;
    });

    describe('when only the haystack is given', function () {
        beforeEach(function () {
            this.haystackReference.getValue.returns(this.valueFactory.createString('my haystack'));

            this.doCall = function () {
                this.resultValue = this.strrchr(this.haystackReference);
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'strrchr() expects exactly 2 parameters, 1 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });

    describe('when no arguments are given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.strrchr();
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'strrchr() expects exactly 2 parameters, 0 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });
});
