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
    CallbackValue = require('../../../../../src/builtin/functions/functionHandling/CallbackValue'),
    Reference = require('phpcore/src/Reference/Reference'),
    Value = require('phpcore/src/Value').sync();

describe('CallbackValue', function () {
    beforeEach(function () {
        this.referenceCallback = sinon.stub();
        this.valueCallback = sinon.stub();

        this.value = new CallbackValue(this.referenceCallback, this.valueCallback);
    });

    describe('getNative()', function () {
        it('should fetch the native value via the provided callback', function () {
            var value = sinon.createStubInstance(Value);
            value.getNative.returns(1001);

            this.valueCallback.returns(value);

            expect(this.value.getNative()).to.equal(1001);
        });
    });

    describe('getReference()', function () {
        it('should fetch the reference via the provided callback', function () {
            var reference = sinon.createStubInstance(Reference);

            this.referenceCallback.returns(reference);

            expect(this.value.getReference()).to.equal(reference);
        });
    });

    describe('getValue()', function () {
        it('should fetch the value via the provided callback', function () {
            var value = sinon.createStubInstance(Value);

            this.valueCallback.returns(value);

            expect(this.value.getValue()).to.equal(value);
        });
    });
});
