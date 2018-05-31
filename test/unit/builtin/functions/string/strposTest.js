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
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "strpos" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getBinding = sinon.stub();
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            getBinding: this.getBinding,
            valueFactory: this.valueFactory
        };
        this.stringFunctions = stringFunctionFactory(this.internals);
        this.strpos = this.stringFunctions.strpos;

        this.haystackReference = sinon.createStubInstance(Variable);
        this.needleReference = sinon.createStubInstance(Variable);
        this.offsetReference = sinon.createStubInstance(Variable);

        this.callStrpos = function () {
            return this.strpos(this.haystackReference, this.needleReference, this.offsetReference);
        }.bind(this);
    });

    it('should return 6 when looking for "world" in "hello world out there!" with no offset', function () {
        this.haystackReference.getNative.returns('hello world, out there world!');
        this.needleReference.getNative.returns('world');
        this.offsetReference = null;

        expect(this.callStrpos()).to.be.an.instanceOf(IntegerValue);
        expect(this.callStrpos().getNative()).to.equal(6);
    });

    it('should return 21 when looking for "you" in "hello you, where are you?" with offset 10', function () {
        this.haystackReference.getNative.returns('hello you, where are you?');
        this.needleReference.getNative.returns('you');
        this.offsetReference.getNative.returns(10);

        expect(this.callStrpos()).to.be.an.instanceOf(IntegerValue);
        expect(this.callStrpos().getNative()).to.equal(21);
    });

    it('should return boolean false when the needle is not found in the haystack', function () {
        this.haystackReference.getNative.returns('This is a string.');
        this.needleReference.getNative.returns('random');
        this.offsetReference = null;

        expect(this.callStrpos()).to.be.an.instanceOf(BooleanValue);
        expect(this.callStrpos().getNative()).to.be.false;
    });
});
