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
    tools = require('../../../tools'),
    CallbackValue = require('../../../../../src/builtin/functions/functionHandling/CallbackValue'),
    Reference = require('phpcore/src/Reference/Reference'),
    Value = require('phpcore/src/Value').sync();

describe('CallbackValue', function () {
    var callbackValue,
        referenceCallback,
        state,
        valueCallback;

    beforeEach(function () {
        state = tools.createIsolatedState('async');
        referenceCallback = sinon.stub();
        valueCallback = sinon.stub();

        callbackValue = new CallbackValue(
            state.getReferenceFactory(),
            state.getFutureFactory(),
            state.getFlow(),
            referenceCallback,
            valueCallback
        );
    });

    describe('getNative()', function () {
        it('should fetch the native value via the provided callback', function () {
            var value = sinon.createStubInstance(Value);
            value.getNative.returns(1001);
            valueCallback.returns(value);

            expect(callbackValue.getNative()).to.equal(1001);
        });
    });

    describe('getReference()', function () {
        it('should fetch the reference via the provided callback', function () {
            var reference = sinon.createStubInstance(Reference);
            referenceCallback.returns(reference);

            expect(callbackValue.getReference()).to.equal(reference);
        });
    });

    describe('getValue()', function () {
        it('should fetch the value via the provided callback', function () {
            var value = sinon.createStubInstance(Value);
            valueCallback.returns(value);

            expect(callbackValue.getValue()).to.equal(value);
        });
    });

    describe('getValueOrNull()', function () {
        it('should fetch the value via the provided callback', function () {
            var value = sinon.createStubInstance(Value);
            valueCallback.returns(value);

            expect(callbackValue.getValueOrNull()).to.equal(value);
        });
    });

    describe('isDefined()', function () {
        it('should return true', function () {
            expect(callbackValue.isDefined()).to.be.true;
        });
    });
});
