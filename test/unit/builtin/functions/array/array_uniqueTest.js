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

describe('PHP "array_unique" builtin function', function () {
    beforeEach(function () {
        this.arrayReference = sinon.createStubInstance(Variable);
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.array_unique = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).array_unique;
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
                this.valueFactory.createString('first'),
                this.valueFactory.createString('first'),
                this.valueFactory.createString('second'),
                this.valueFactory.createString('first'),
                this.valueFactory.createString('third')
            ]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should not reindex the elements starting from 0', function () {
            var resultArray = this.array_unique(this.arrayReference);

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
            this.array_unique(this.arrayReference);

            expect(this.arrayValue.getNative()).to.deep.equal([
                'first',    // Key 0
                'first',
                'second',   // Key 2
                'first',
                'third'     // Key 4
            ]);
            expect(this.arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an associative array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
                new KeyValuePair(
                    this.valueFactory.createString('a'),
                    this.valueFactory.createString('first')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('b'),
                    this.valueFactory.createString('first')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('c'),
                    this.valueFactory.createString('second')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('d'),
                    this.valueFactory.createString('first')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('e'),
                    this.valueFactory.createString('third')
                )
            ]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should preserve the keys', function () {
            var resultArray = this.array_unique(this.arrayReference);

            expect(resultArray.getNative()).to.deep.equal({
                'a': 'first',
                'c': 'second',
                'e': 'third'
            });
            expect(resultArray.getLength()).to.equal(3);
        });

        it('should not modify the original array', function () {
            this.array_unique(this.arrayReference);

            expect(this.arrayValue.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'first',
                'c': 'second',
                'd': 'first',
                'e': 'third'
            });
            expect(this.arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an empty array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should return an empty array', function () {
            var resultArray = this.array_unique(this.arrayReference);

            expect(resultArray.getLength()).to.equal(0);
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.array_unique();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_unique() expects at least 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.array_unique();

            expect(result.getType()).to.equal('null');
        });
    });

    describe('when sort flags are provided (currently unsupported)', function () {
        it('should throw an error', function () {
            var sortFlagsReference = sinon.createStubInstance(Variable);

            expect(function () {
                this.array_unique(this.arrayReference, sortFlagsReference);
            }.bind(this)).to.throw('array_unique() :: Sort flags are not yet supported');
        });
    });
});
