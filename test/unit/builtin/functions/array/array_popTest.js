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
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_pop" builtin function', function () {
    beforeEach(function () {
        this.arrayReference = sinon.createStubInstance(Variable);
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.array_pop = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).array_pop;
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
                this.valueFactory.createString('my first element'),
                this.valueFactory.createString('my second element'),
                this.valueFactory.createString('my last element')
            ]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should remove the last element', function () {
            this.array_pop(this.arrayReference);

            expect(this.arrayValue.getNative()).to.deep.equal([
                'my first element',
                'my second element'
            ]);
            expect(this.arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element', function () {
            var result = this.array_pop(this.arrayReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
        });
    });

    describe('for an associative array', function () {
        it('should remove the last element, leaving the remaining elements\' keys untouched', function () {
            var arrayValue = this.valueFactory.createArray([
                new KeyValuePair(
                    this.valueFactory.createString('my_first_key'),
                    this.valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('my_second_key'),
                    this.valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('my_last_key'),
                    this.valueFactory.createString('my last element')
                )
            ]);
            this.arrayReference.getValue.returns(arrayValue);

            this.array_pop(this.arrayReference);

            expect(arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element'
            });
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element\'s value, discarding the key', function () {
            var arrayValue = this.valueFactory.createArray([
                new KeyValuePair(
                    this.valueFactory.createString('my_first_key'),
                    this.valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('my_second_key'),
                    this.valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('my_last_key'),
                    this.valueFactory.createString('my last element')
                )
            ]),
                result;
            this.arrayReference.getValue.returns(arrayValue);

            result = this.array_pop(this.arrayReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
        });
    });

    describe('for an empty array', function () {
        it('should return null', function () {
            var result;
            this.arrayReference.getValue.returns(this.valueFactory.createArray([]));

            result = this.array_pop(this.arrayReference);

            expect(result.getType()).to.equal('null');
        });
    });
});
