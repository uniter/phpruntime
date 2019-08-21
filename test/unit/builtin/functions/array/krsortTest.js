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
    SORT_NATURAL = 6,
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    ElementReference = require('phpcore/src/Reference/Element'),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    Value = require('phpcore/src/Value').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "krsort" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.arrayFunctions = arrayFunctionFactory(this.internals);
        this.krsort = this.arrayFunctions.krsort;

        this.arrayReference = sinon.createStubInstance(Variable);
        this.args = [this.arrayReference];
        this.arrayValue = sinon.createStubInstance(ArrayValue);
        this.arrayValue.getType.returns('array');

        this.arrayReference.getValue.returns(this.arrayValue);

        this.callKrsort = function () {
            return this.krsort.apply(null, this.args);
        }.bind(this);
    });

    it('should return boolean true', function () {
        expect(this.callKrsort()).to.be.an.instanceOf(BooleanValue);
        expect(this.callKrsort().getNative()).to.be.true;
    });

    it('should sort the array once', function () {
        this.callKrsort();

        expect(this.arrayValue.sort).to.have.been.calledOnce;
    });

    it('should sort the array by key in reverse alphabetical order', function () {
        var elementA = sinon.createStubInstance(ElementReference),
            elementB = sinon.createStubInstance(ElementReference),
            keyA = sinon.createStubInstance(Value),
            keyB = sinon.createStubInstance(Value);
        elementA.getKey.returns(keyA);
        elementB.getKey.returns(keyB);

        this.callKrsort();

        keyA.getNative.returns('alfie');
        keyB.getNative.returns('alfie');
        expect(this.arrayValue.sort.args[0][0](elementA, elementB)).to.equal(0);

        keyA.getNative.returns('fred');
        keyB.getNative.returns('george');
        expect(this.arrayValue.sort.args[0][0](elementA, elementB)).to.equal(1);

        keyA.getNative.returns('mark');
        keyB.getNative.returns('john');
        expect(this.arrayValue.sort.args[0][0](elementA, elementB)).to.equal(-1);
    });

    it('should throw an error when SORT_NATURAL is provided for the sort flags', function () {
        var sortFlagsReference = sinon.createStubInstance(Variable),
            sortFlagsValue = sinon.createStubInstance(Value);
        sortFlagsReference.getValue.returns(sortFlagsValue);
        sortFlagsValue.getNative.returns(SORT_NATURAL);
        this.args[1] = sortFlagsReference;

        expect(function () {
            this.callKrsort();
        }.bind(this)).to.throw('krsort() :: Only SORT_REGULAR (0) is supported, 6 given');
    });

    describe('when a non-array is provided', function () {
        beforeEach(function () {
            this.stringValue = sinon.createStubInstance(StringValue);
            this.stringValue.getType.returns('string');
            this.arrayReference.getValue.returns(this.stringValue);
        });

        it('should raise a warning', function () {
            this.callKrsort();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'krsort() expects parameter 1 to be array, string given'
            );
        });

        it('should return boolean false', function () {
            var resultValue = this.callKrsort();

            expect(resultValue).to.be.an.instanceOf(BooleanValue);
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when no arguments are provided', function () {
        beforeEach(function () {
            this.args.length = 0;
        });

        it('should raise a warning', function () {
            this.callKrsort();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'krsort() expects at least 1 parameter, 0 given'
            );
        });

        it('should return boolean false', function () {
            var resultValue = this.callKrsort();

            expect(resultValue).to.be.an.instanceOf(BooleanValue);
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
