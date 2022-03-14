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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "explode" builtin function', function () {
    var callStack,
        delimiterReference,
        explode,
        internals,
        limitReference,
        stringFunctions,
        stringReference,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();
        internals = {
            callStack: callStack,
            getBinding: sinon.stub(),
            valueFactory: valueFactory
        };
        stringFunctions = stringFunctionFactory(internals);
        explode = stringFunctions.explode;

        delimiterReference = sinon.createStubInstance(Variable);
        stringReference = sinon.createStubInstance(Variable);
        limitReference = sinon.createStubInstance(Variable);
    });

    it('should return an array with the correct elements when delimiter appears', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createString(','));
        stringReference.getValue.returns(valueFactory.createString('first,second,third'));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', 'third']);
    });

    it('should include elements with empty strings where multiple instances of the delimiter are touching', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createString(','));
        stringReference.getValue.returns(valueFactory.createString('first,second,,,third,fourth'));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', '', '', 'third', 'fourth']);
    });

    it('should return an array with a single empty-string element when the string is empty', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createString('.'));
        stringReference.getValue.returns(valueFactory.createString(''));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['']);
    });

    it('should return an array with a single element containing the number coerced to string when the "string" argument is an integer', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createString('.'));
        stringReference.getValue.returns(valueFactory.createInteger(212));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "string" argument to a string', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createString('.'));
        stringReference.getValue.returns(valueFactory.createInteger(212));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "delimiter" argument to a string', function () {
        var resultValue;
        delimiterReference.getValue.returns(valueFactory.createInteger(4));
        stringReference.getValue.returns(valueFactory.createInteger(22499));

        resultValue = explode(delimiterReference, stringReference);

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['22', '99']);
    });

    describe('when only the delimiter is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            delimiterReference.getValue.returns(valueFactory.createString('delim'));

            doCall = function () {
                resultValue = explode(delimiterReference);
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'explode() expects at least 2 parameters, 1 given'
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when no arguments are given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = explode();
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'explode() expects at least 2 parameters, 0 given'
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
