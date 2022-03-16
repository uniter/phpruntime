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
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_pop" builtin function', function () {
    var array_pop,
        arrayReference,
        callStack,
        valueFactory;

    beforeEach(function () {
        arrayReference = sinon.createStubInstance(Variable);
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();

        array_pop = arrayExtension({
            callStack: callStack,
            valueFactory: valueFactory
        }).array_pop;
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                valueFactory.createString('my first element'),
                valueFactory.createString('my second element'),
                valueFactory.createString('my last element')
            ]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should remove the last element', function () {
            array_pop(arrayReference);

            expect(arrayValue.getNative()).to.deep.equal([
                'my first element',
                'my second element'
            ]);
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element', function () {
            var result = array_pop(arrayReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
        });
    });

    describe('for an associative array', function () {
        it('should remove the last element, leaving the remaining elements\' keys untouched', function () {
            var arrayValue = valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('my_first_key'),
                    valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_second_key'),
                    valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_last_key'),
                    valueFactory.createString('my last element')
                )
            ]);
            arrayReference.getValue.returns(arrayValue);

            array_pop(arrayReference);

            expect(arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element'
            });
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element\'s value, discarding the key', function () {
            var arrayValue = valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('my_first_key'),
                    valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_second_key'),
                    valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_last_key'),
                    valueFactory.createString('my last element')
                )
            ]),
                result;
            arrayReference.getValue.returns(arrayValue);

            result = array_pop(arrayReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
        });
    });

    describe('for an empty array', function () {
        it('should return null', function () {
            var result;
            arrayReference.getValue.returns(valueFactory.createArray([]));

            result = array_pop(arrayReference);

            expect(result.getType()).to.equal('null');
        });
    });
});
