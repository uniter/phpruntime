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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    PHPError = phpCommon.PHPError,
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_push" builtin function', function () {
    var array_push,
        arrayReference,
        callStack,
        valueFactory;

    beforeEach(function () {
        arrayReference = sinon.createStubInstance(Variable);
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();

        array_push = arrayExtension({
            callStack: callStack,
            valueFactory: valueFactory
        }).array_push;
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(0),
                    valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(5),
                    valueFactory.createString('my last element')
                )
            ]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should push the new elements on just after the highest numbered key (sparse array support)', function () {
            var newElement1 = valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            array_push(arrayReference, newElementReference1, newElementReference2);

            expect(arrayValue.getNative()).to.deep.equal([
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
            expect(arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', function () {
            var newElement = valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = array_push(arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one
        });
    });

    describe('for an associative array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
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
        });

        it('should index the pushed elements from 0', function () {
            var newElement1 = valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            array_push(arrayReference, newElementReference1, newElementReference2);

            expect(arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element',
                'my_last_key': 'my last element',
                // New elements - should start counting from 0
                0: 'first new one',
                1: 'second new one'
            });
            expect(arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', function () {
            var newElement = valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = array_push(arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one
        });
    });

    describe('for an empty array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should index the pushed elements from 0', function () {
            var newElement1 = valueFactory.createString('first new one'),
                newElementReference1,
                newElement2 = valueFactory.createString('second new one'),
                newElementReference2;
            newElementReference1 = sinon.createStubInstance(Variable);
            newElementReference1.getValue.returns(newElement1);
            newElementReference2 = sinon.createStubInstance(Variable);
            newElementReference2.getValue.returns(newElement2);

            array_push(arrayReference, newElementReference1, newElementReference2);

            expect(arrayValue.getNative()).to.deep.equal([
                // New elements - should start counting from 0
                'first new one',
                'second new one'
            ]);
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the new array length', function () {
            var newElement = valueFactory.createString('first new one'),
                newElementReference,
                result;
            newElementReference = sinon.createStubInstance(Variable);
            newElementReference.getValue.returns(newElement);

            result = array_push(arrayReference, newElementReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1); // No original elements, plus the pushed one
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            array_push();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_push() expects at least 2 parameters, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = array_push();

            expect(result.getType()).to.equal('null');
        });
    });
});
