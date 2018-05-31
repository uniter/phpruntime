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
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "array_merge" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.createKeyValuePair = function (key, value) {
            var keyValuePair = sinon.createStubInstance(KeyValuePair);
            keyValuePair.getKey.returns(key);
            keyValuePair.getValue.returns(value);
            return keyValuePair;
        };
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.args = [];
        this.arrayFunctions = arrayFunctionFactory(this.internals);
        this.array_merge = this.arrayFunctions.array_merge;

        this.callArrayMerge = function () {
            return this.array_merge.apply(null, this.args);
        }.bind(this);
    });

    it('should return an array with the merged elements when two indexed arrays are provided', function () {
        var array1Element1 = this.valueFactory.createInteger(1),
            array1Element2 = this.valueFactory.createInteger(4),
            array2Element1 = this.valueFactory.createInteger(7),
            array2Element2 = this.valueFactory.createInteger(21),
            result;
        this.args[0] = this.valueFactory.createArray([array1Element1, array1Element2]);
        this.args[1] = this.valueFactory.createArray([array2Element1, array2Element2]);

        result = this.callArrayMerge();

        expect(result).to.be.an.instanceOf(ArrayValue);
        expect(result.getKeys()).to.have.length(4);
        expect(result.getKeys()[0]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[0].getNative()).to.equal(0);
        expect(result.getKeys()[1]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[1].getNative()).to.equal(1);
        expect(result.getKeys()[2]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[2].getNative()).to.equal(2);
        expect(result.getKeys()[3]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[3].getNative()).to.equal(3);
        expect(result.getNative()).to.deep.equal([1, 4, 7, 21]);
    });

    it('should return an array with the merged elements when two associative arrays are provided', function () {
        var array1Key1 = this.valueFactory.createString('first'),
            array1Element1 = this.valueFactory.createInteger(1),
            array1Key2 = this.valueFactory.createString('second'),
            array1Element2 = this.valueFactory.createInteger(4),
            array2Key1 = this.valueFactory.createString('third'),
            array2Element1 = this.valueFactory.createInteger(7),
            array2Key2 = this.valueFactory.createString('first'), // Overrides first array's
            array2Element2 = this.valueFactory.createInteger(21),
            result;
        this.args[0] = this.valueFactory.createArray([
            this.createKeyValuePair(array1Key1, array1Element1),
            this.createKeyValuePair(array1Key2, array1Element2)
        ]);
        this.args[1] = this.valueFactory.createArray([
            this.createKeyValuePair(array2Key1, array2Element1),
            this.createKeyValuePair(array2Key2, array2Element2)
        ]);

        result = this.callArrayMerge();

        expect(result).to.be.an.instanceOf(ArrayValue);
        expect(result.getKeys()).to.have.length(3);
        expect(result.getKeys()[0]).to.be.an.instanceOf(StringValue);
        expect(result.getKeys()[0].getNative()).to.equal('first');
        expect(result.getKeys()[1]).to.be.an.instanceOf(StringValue);
        expect(result.getKeys()[1].getNative()).to.equal('second');
        expect(result.getKeys()[2]).to.be.an.instanceOf(StringValue);
        expect(result.getKeys()[2].getNative()).to.equal('third');
        expect(result.getNative()).to.deep.equal({
            'first': 21,
            'second': 4,
            'third': 7
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.callArrayMerge();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge() expects at least 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callArrayMerge();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when one of the arguments is not an array', function () {
        beforeEach(function () {
            this.args[0] = this.valueFactory.createArray([this.valueFactory.createInteger(21)]);
            this.args[1] = this.valueFactory.createInteger(27);
        });

        it('should raise a warning', function () {
            this.callArrayMerge();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge(): Argument #2 is not an array'
            );
        });

        it('should return NULL', function () {
            var result = this.callArrayMerge();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
