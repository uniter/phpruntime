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
    baseConversionFunctionFactory = require('../../../../../../src/builtin/functions/math/baseConversion'),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "dechex" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        };
        this.baseConversionFunctions = baseConversionFunctionFactory(this.internals);
        this.dechex = this.baseConversionFunctions.dechex;

        this.numberReference = sinon.createStubInstance(Variable);

        this.args = [this.numberReference];

        this.callDechex = function () {
            return this.dechex.apply(null, this.args);
        }.bind(this);
    });

    it('should convert a decimal < 10 to hexadecimal correctly', function () {
        var resultValue;
        this.numberValue = this.valueFactory.createInteger(7);
        this.numberReference.getValue.returns(this.numberValue);

        resultValue = this.callDechex();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('7');
    });

    it('should convert a non-numeric string value to string("0")', function () {
        var resultValue;
        this.numberValue = this.valueFactory.createString('notanumber'),
        this.numberReference.getValue.returns(this.numberValue);

        resultValue = this.callDechex();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('0');
    });

    it('should convert bool(true) to string("1")', function () {
        var resultValue;
        this.numberValue = this.valueFactory.createBoolean(true),
            this.numberReference.getValue.returns(this.numberValue);

        resultValue = this.callDechex();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('1');
    });

    describe('when no arguments are provided', function () {
        beforeEach(function () {
            this.args.length = 0;
        });

        it('should raise a warning', function () {
            this.callDechex();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'dechex() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callDechex();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
