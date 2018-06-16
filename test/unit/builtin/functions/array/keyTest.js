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
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "key" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.arrayFunctions = arrayFunctionFactory(this.internals);
        this.key = this.arrayFunctions.key;

        this.arrayReference = sinon.createStubInstance(Variable);
        this.args = [this.arrayReference];
        this.arrayValue = sinon.createStubInstance(ArrayValue);
        this.arrayValue.getType.returns('array');

        this.arrayReference.getValue.returns(this.arrayValue);
        this.arrayValue.getKeyByIndex.returns(null);
        this.arrayValue.getPointer.returns(0);

        this.callKey = function () {
            return this.key.apply(null, this.args);
        }.bind(this);
    });

    describe('when the internal array pointer points beyond the end of the array', function () {
        it('should return NULL', function () {
            this.arrayValue.getKeyByIndex.returns(null);

            expect(this.callKey().getType()).to.equal('null');
        });
    });

    describe('when the internal array pointer points to a valid element inside the array', function () {
        it('should return the key value', function () {
            var keyValue = this.valueFactory.createString('my_key');
            this.arrayValue.getPointer.returns(21);
            this.arrayValue.getKeyByIndex.withArgs(21).returns(keyValue);

            expect(this.callKey()).to.equal(keyValue);
        });
    });

    describe('when a non-array is provided', function () {
        beforeEach(function () {
            this.stringValue = sinon.createStubInstance(StringValue);
            this.stringValue.getType.returns('string');
            this.arrayReference.getValue.returns(this.stringValue);
        });

        it('should raise a warning', function () {
            this.callKey();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'key() expects parameter 1 to be array, string given'
            );
        });

        it('should return NULL', function () {
            var resultValue = this.callKey();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when no arguments are provided', function () {
        beforeEach(function () {
            this.args.length = 0;
        });

        it('should raise a warning', function () {
            this.callKey();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'key() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var resultValue = this.callKey();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
