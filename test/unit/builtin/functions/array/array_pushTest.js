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
    IntegerValue = require('phpcore/src/Value/Integer').sync();

describe('PHP "array_push" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.array_push = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).array_push;

        this.args = [];
        this.callArrayPush = function () {
            return this.array_push.apply(null, this.args);
        }.bind(this);

        this.array = this.valueFactory.createArray([
            this.valueFactory.createInteger(1),
            this.valueFactory.createInteger(4)
        ]);
    });

    it('should push values to the end of an array', function () {
        var array1Element1 = this.valueFactory.createInteger(7),
            array2Element2 = this.valueFactory.createInteger(12),
            result;

        this.args[0] = this.array;
        this.args[1] = array1Element1;
        this.args[2] = array2Element2;

        result = this.callArrayPush();

        expect(result).to.be.an.instanceOf(IntegerValue);
        expect(result.getNative()).to.equal(4);
        expect(this.array.getValues()).to.have.length.of(4);
        expect(this.array.getValues()[0]).to.be.an.instanceOf(IntegerValue);
        expect(this.array.getValues()[0].getNative()).to.equal(1);
        expect(this.array.getValues()[1]).to.be.an.instanceOf(IntegerValue);
        expect(this.array.getValues()[1].getNative()).to.equal(4);
        expect(this.array.getValues()[2]).to.be.an.instanceOf(IntegerValue);
        expect(this.array.getValues()[2].getNative()).to.equal(7);
        expect(this.array.getValues()[3]).to.be.an.instanceOf(IntegerValue);
        expect(this.array.getValues()[3].getNative()).to.equal(12);
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', function () {
            this.callArrayPush();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_push() expects at least 2 parameters, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callArrayPush();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
