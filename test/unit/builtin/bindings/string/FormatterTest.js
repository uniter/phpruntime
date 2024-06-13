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
    Formatter = require('../../../../../src/builtin/bindings/string/Formatter'),
    NativeFormatter = require('../../../../../src/builtin/bindings/string/NativeFormatter'),
    Value = require('phpcore/src/Value').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('Formatter', function () {
    var formatter,
        nativeFormatter,
        state,
        valueFactory;

    beforeEach(function () {
        nativeFormatter = sinon.createStubInstance(NativeFormatter);
        state = tools.createIsolatedState('async');
        valueFactory = state.getValueFactory();

        formatter = new Formatter(nativeFormatter);
    });

    describe('format()', function () {
        it('should convert the arg values to their native counterparts and format via the NativeFormatter', function () {
            var argValue1 = valueFactory.createInteger(21),
                argValue2 = valueFactory.createString('hello');
            nativeFormatter.format
                .withArgs('my %d %s format', [21, 'hello'])
                .returns('my 21 hello format');

            expect(formatter.format('my %d %s format', [argValue1, argValue2])).to.equal('my 21 hello format');
        });

        it('should coerce object args to string', function () {
            var argValue1 = valueFactory.createInteger(21),
                argValue2 = sinon.createStubInstance(Value);
            argValue2.getValue.returns(argValue2);
            argValue2.getType.returns('object');
            argValue2.coerceToString.returns(valueFactory.createString('[coerced object]'));
            nativeFormatter.format
                .withArgs('my %d %s format', [21, '[coerced object]'])
                .returns('my 21 [coerced object] format');

            expect(formatter.format('my %d %s format', [argValue1, argValue2]))
                .to.equal('my 21 [coerced object] format');
        });

        it('should coerce array args to string', function () {
            var argValue1 = valueFactory.createInteger(21),
                argValue2 = sinon.createStubInstance(Value);
            argValue2.getValue.returns(argValue2);
            argValue2.getType.returns('array');
            argValue2.coerceToString.returns(valueFactory.createString('Array'));
            nativeFormatter.format
                .withArgs('my %d %s format', [21, 'Array'])
                .returns('my 21 Array format');

            expect(formatter.format('my %d %s format', [argValue1, argValue2]))
                .to.equal('my 21 Array format');
        });

        it('should support variables being passed as arguments', function () {
            var argValue1 = valueFactory.createInteger(21),
                argValue2 = sinon.createStubInstance(Value),
                argVariable = sinon.createStubInstance(Variable);
            argVariable.getValue.returns(argValue2);
            argValue2.getType.returns('array');
            argValue2.coerceToString.returns(valueFactory.createString('Array'));
            nativeFormatter.format
                .withArgs('my %d %s format', [21, 'Array'])
                .returns('my 21 Array format');

            expect(formatter.format('my %d %s format', [argValue1, argVariable]))
                .to.equal('my 21 Array format');
        });
    });
});
