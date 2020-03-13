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
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "gettype" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.gettype = this.variableHandlingFunctions.gettype;

        this.valueReference = sinon.createStubInstance(Variable);
    });

    it('should return "boolean" when given a boolean', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createBoolean(false));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('boolean');
    });

    it('should return "integer" when given an integer', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createInteger(21));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('int');
    });

    it('should return "double" (for historical reasons) when given a float', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createFloat(100.4));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('double');
    });

    it('should return "string" when given a string', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createString('my string here'));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('string');
    });

    it('should return "array" when given an array', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createArray([]));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('array');
    });

    it('should return "object" when given an object', function () {
        var classObject = sinon.createStubInstance(Class),
            resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createObject({}, classObject));

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('object');
    });

    // Skipping "resource" type as we have no support yet

    it('should return "NULL" when given null', function () {
        var resultValue;
        this.valueReference.getValue.returns(this.valueFactory.createNull());

        resultValue = this.gettype(this.valueReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('NULL');
    });

    // Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

    describe('when not passed any argument', function () {
        it('should raise a warning', function () {
            this.gettype();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'gettype() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            var resultValue = this.gettype();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
