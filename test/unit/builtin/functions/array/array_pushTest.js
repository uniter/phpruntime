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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    PHPError = phpCommon.PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_push" builtin function', function () {
    beforeEach(function () {
        this.arrayReference = sinon.createStubInstance(Variable);
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.array_push = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).array_push;
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
                new KeyValuePair(
                    this.valueFactory.createInteger(0),
                    this.valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    this.valueFactory.createInteger(1),
                    this.valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    this.valueFactory.createInteger(5),
                    this.valueFactory.createString('my last element')
                )
            ]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should push the new elements on just after the highest numbered key (sparse array support)', function () {
            var newElement1 = this.valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = this.valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            this.array_push(this.arrayReference, newElementReference1, newElementReference2);

            expect(this.arrayValue.getNative()).to.deep.equal([
                'my first element',
                'my second element',
                undefined,
                undefined,
                undefined,
                'my last element',
                // New elements - should start counting just after the highest existing index (5)
                'first new one',
                'second new one'
            ]);
            expect(this.arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', function () {
            var newElement = this.valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = this.array_push(this.arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one
        });
    });

    describe('for an associative array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
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
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should index the pushed elements from 0', function () {
            var newElement1 = this.valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = this.valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            this.array_push(this.arrayReference, newElementReference1, newElementReference2);

            expect(this.arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element',
                'my_last_key': 'my last element',
                // New elements - should start counting from 0
                0: 'first new one',
                1: 'second new one'
            });
            expect(this.arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', function () {
            var newElement = this.valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = this.array_push(this.arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one
        });
    });

    describe('for an empty array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should index the pushed elements from 0', function () {
            var newElement1 = this.valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = this.valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            this.array_push(this.arrayReference, newElementReference1, newElementReference2);

            expect(this.arrayValue.getNative()).to.deep.equal([
                // New elements - should start counting from 0
                'first new one',
                'second new one'
            ]);
            expect(this.arrayValue.getLength()).to.equal(2);
        });

        it('should return the new array length', function () {
            var newElement = this.valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = this.array_push(this.arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1); // No original elements, plus the pushed one
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.array_push();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_push() expects at least 2 parameters, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.array_push();

            expect(result.getType()).to.equal('null');
        });
    });
});
