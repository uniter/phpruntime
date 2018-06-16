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
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "substr_count" builtin function', function () {
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
        this.substr_count = this.stringFunctions.substr_count;

        this.haystackReference = sinon.createStubInstance(Variable);
        this.needleReference = sinon.createStubInstance(Variable);
        this.offsetReference = sinon.createStubInstance(Variable);
        this.lengthReference = sinon.createStubInstance(Variable);
    });

    it('should return 0 when the haystack is empty', function () {
        var result;
        this.haystackReference.getNative.returns('');
        this.needleReference.getNative.returns('stuff');

        result = this.substr_count(this.haystackReference, this.needleReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(0);
    });

    it('should return 3 when the substring appears 3 times, directly adjacent, in the middle of the string', function () {
        var result;
        this.haystackReference.getNative.returns('my strstrstr here');
        this.needleReference.getNative.returns('str');

        result = this.substr_count(this.haystackReference, this.needleReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(3);
    });

    it('should return 4 when the substring appears 4 times, delimited by spaces, taking the entire string', function () {
        var result;
        this.haystackReference.getNative.returns('stuff stuff stuff stuff');
        this.needleReference.getNative.returns('stuff');

        result = this.substr_count(this.haystackReference, this.needleReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(4);
    });

    it('should support a positive offset and length, where offset cuts into a previous occurrence that should be discounted', function () {
        var result;
        this.haystackReference.getNative.returns('my stuffstuffstuff in here');
        this.needleReference.getNative.returns('stuff');
        this.offsetReference.getNative.returns(4);
        this.lengthReference.getNative.returns(14);

        result = this.substr_count(this.haystackReference, this.needleReference, this.offsetReference, this.lengthReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(2);
    });

    it('should support a positive offset and length, where offset cuts into a subsequent occurrence that should be discounted', function () {
        var result;
        this.haystackReference.getNative.returns('my stuffstuffstuff in here');
        this.needleReference.getNative.returns('stuff');
        this.offsetReference.getNative.returns(2);
        this.lengthReference.getNative.returns(14);

        result = this.substr_count(this.haystackReference, this.needleReference, this.offsetReference, this.lengthReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(2);
    });

    it('should support negative offsets by counting back from the end', function () {
        var result;
        this.haystackReference.getNative.returns('my stuffstuffstuff here');
        this.needleReference.getNative.returns('stuff');
        this.offsetReference.getNative.returns(-12);

        result = this.substr_count(this.haystackReference, this.needleReference, this.offsetReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(1);
    });

    it('should support negative lengths by counting back from the end', function () {
        var result;
        this.haystackReference.getNative.returns('strstrstrstr');
        this.needleReference.getNative.returns('str');
        this.offsetReference.getNative.returns(2);
        this.lengthReference.getNative.returns(-4);

        // Should search `rstrst`
        result = this.substr_count(this.haystackReference, this.needleReference, this.offsetReference, this.lengthReference);

        expect(result.getType()).to.equal('integer');
        expect(result.getNative()).to.equal(1);
    });
});
