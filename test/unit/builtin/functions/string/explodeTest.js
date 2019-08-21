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

describe('PHP "explode" builtin function', function () {
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
        this.explode = this.stringFunctions.explode;

        this.delimiterReference = sinon.createStubInstance(Variable);
        this.stringReference = sinon.createStubInstance(Variable);
        this.limitReference = sinon.createStubInstance(Variable);
    });

    it('should return an array with the correct elements when delimiter appears', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createString(','));
        this.stringReference.getValue.returns(this.valueFactory.createString('first,second,third'));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', 'third']);
    });

    it('should include elements with empty strings where multiple instances of the delimiter are touching', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createString(','));
        this.stringReference.getValue.returns(this.valueFactory.createString('first,second,,,third,fourth'));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', '', '', 'third', 'fourth']);
    });

    it('should return an array with a single empty-string element when the string is empty', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createString('.'));
        this.stringReference.getValue.returns(this.valueFactory.createString(''));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['']);
    });

    it('should return an array with a single element containing the number coerced to string when the "string" argument is an integer', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createString('.'));
        this.stringReference.getValue.returns(this.valueFactory.createInteger(212));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "string" argument to a string', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createString('.'));
        this.stringReference.getValue.returns(this.valueFactory.createInteger(212));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "delimiter" argument to a string', function () {
        var resultValue;
        this.delimiterReference.getValue.returns(this.valueFactory.createInteger(4));
        this.stringReference.getValue.returns(this.valueFactory.createInteger(22499));

        resultValue = this.explode(this.delimiterReference, this.stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['22', '99']);
    });

    describe('when only the delimiter is given', function () {
        beforeEach(function () {
            this.delimiterReference.getValue.returns(this.valueFactory.createString('delim'));

            this.doCall = function () {
                this.resultValue = this.explode(this.delimiterReference);
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'explode() expects at least 2 parameters, 1 given'
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
                this.resultValue = this.explode();
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'explode() expects at least 2 parameters, 0 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });
});
