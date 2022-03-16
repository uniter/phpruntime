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

describe('PHP "array_unique" builtin function', function () {
    var arrayReference,
        array_unique,
        callStack,
        valueFactory;

    beforeEach(function () {
        arrayReference = sinon.createStubInstance(Variable);
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();

        array_unique = arrayExtension({
            callStack: callStack,
            valueFactory: valueFactory
        }).array_unique;
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                valueFactory.createString('first'),
                valueFactory.createString('first'),
                valueFactory.createString('second'),
                valueFactory.createString('first'),
                valueFactory.createString('third')
            ]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should not reindex the elements starting from 0', function () {
            var resultArray = array_unique(arrayReference);

            expect(resultArray.getNative()).to.deep.equal([
                'first',    // Key 0
                undefined,
                'second',   // Key 2
                undefined,
                'third'     // Key 4
            ]);
            expect(resultArray.getLength()).to.equal(3);
        });

        it('should not modify the original array', function () {
            array_unique(arrayReference);

            expect(arrayValue.getNative()).to.deep.equal([
                'first',    // Key 0
                'first',
                'second',   // Key 2
                'first',
                'third'     // Key 4
            ]);
            expect(arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an associative array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('a'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('c'),
                    valueFactory.createString('second')
                ),
                new KeyValuePair(
                    valueFactory.createString('d'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('e'),
                    valueFactory.createString('third')
                )
            ]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should preserve the keys', function () {
            var resultArray = array_unique(arrayReference);

            expect(resultArray.getNative()).to.deep.equal({
                'a': 'first',
                'c': 'second',
                'e': 'third'
            });
            expect(resultArray.getLength()).to.equal(3);
        });

        it('should not modify the original array', function () {
            array_unique(arrayReference);

            expect(arrayValue.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'first',
                'c': 'second',
                'd': 'first',
                'e': 'third'
            });
            expect(arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an empty array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should return an empty array', function () {
            var resultArray = array_unique(arrayReference);

            expect(resultArray.getLength()).to.equal(0);
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            array_unique();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_unique() expects at least 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = array_unique();

            expect(result.getType()).to.equal('null');
        });
    });

    describe('when sort flags are provided (currently unsupported)', function () {
        it('should throw an error', function () {
            var sortFlagsReference = sinon.createStubInstance(Variable);

            expect(function () {
                array_unique(arrayReference, sortFlagsReference);
            }).to.throw('array_unique() :: Sort flags are not yet supported');
        });
    });
});
