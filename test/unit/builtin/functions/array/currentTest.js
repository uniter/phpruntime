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
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    IntegerValue = require('phpcore/src/Value/Integer').sync();

describe('PHP "current" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.current = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).current;

        this.args = [];
        this.callCurrent = function () {
            return this.current.apply(null, this.args);
        }.bind(this);

        this.array = this.valueFactory.createArray([
            this.valueFactory.createInteger(1),
            this.valueFactory.createInteger(4)
        ]);
    });

    it('Should return the current element in the array', function () {
        var result;

        this.args[0] = this.array;
        result = this.callCurrent();

        expect(result).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()).to.equal(1);
    });

    it('should return the current element in the array when the pointer has changed', function () {
        var result;

        this.array.setPointer(1);
        this.args[0] = this.array;
        result = this.callCurrent();

        expect(result).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()).to.equal(4);
    });

    it('should return false if the pointer exceeds the length of the array', function () {
        var result;

        this.array.setPointer(2);
        this.args[0] = this.array;
        result = this.callCurrent();

        expect(result).to.be.an.instanceOf(BooleanValue);
        expect(result.getNative()).to.equal(false);
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.callCurrent();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'current() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callCurrent();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
