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
    arrayExtension = require('../../../../../src/builtin/functions/array'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    KeyValuePair = require('phpcore/src/KeyValuePair');

describe('PHP "array_values" builtin function', function () {
    var args,
        array_values,
        callArrayValues,
        callStack,
        createKeyValuePair,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();

        createKeyValuePair = function (key, value) {
            var keyValuePair = sinon.createStubInstance(KeyValuePair);
            keyValuePair.getKey.returns(key);
            keyValuePair.getValue.returns(value);
            return keyValuePair;
        };

        array_values = arrayExtension({
            callStack: callStack,
            valueFactory: valueFactory
        }).array_values;

        args = [];
        callArrayValues = function () {
            return array_values.apply(null, args);
        };
    });

    it('should return all the values from the array numerically indexed', function () {
         var array1Key1 = valueFactory.createString('first'),
             array1Element1 = valueFactory.createInteger(1),
             array2Key2 = valueFactory.createString('second'),
             array2Element2 = valueFactory.createInteger(4),
             result;

         args[0] = valueFactory.createArray([
             createKeyValuePair(array1Key1, array1Element1),
             createKeyValuePair(array2Key2, array2Element2)
         ]);

        result = callArrayValues();

        expect(result).to.be.an.instanceOf(ArrayValue);
        expect(result.getKeys()).to.have.length.of(2);
        expect(result.getKeys()[0]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[0].getNative()).to.equal(0);
        expect(result.getValues()).to.have.length.of(2);
        expect(result.getValues()[0]).to.be.an.instanceOf(IntegerValue);
        expect(result.getValues()[0].getNative()).to.equal(1);
        expect(result.getKeys()[1]).to.be.an.instanceOf(IntegerValue);
        expect(result.getKeys()[1].getNative()).to.equal(1);
        expect(result.getValues()[1]).to.be.an.instanceOf(IntegerValue);
        expect(result.getValues()[1].getNative()).to.equal(4);
        expect(result.getNative()).to.deep.equal([1, 4]);
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            callArrayValues();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_values() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = callArrayValues();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
