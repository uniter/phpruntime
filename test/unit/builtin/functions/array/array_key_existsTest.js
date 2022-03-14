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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_key_exists" builtin function', function () {
    var array_key_exists,
        callStack,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = tools.createIsolatedState().getValueFactory();

        array_key_exists = arrayExtension({
            callStack: callStack,
            valueFactory: valueFactory
        }).array_key_exists;
    });

    it('should return bool(true) when the element is defined', function () {
        var keyReference = new Variable(callStack, valueFactory, 'keyVar'),
            arrayReference = new Variable(callStack, valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(valueFactory.createString('my_key'));
        arrayReference.setValue(valueFactory.createArray([
            new KeyValuePair(
                valueFactory.createString('my_key'),
                valueFactory.createString('My value')
            ),
            new KeyValuePair(
                valueFactory.createString('your_key'),
                valueFactory.createString('Your value')
            )
        ]));

        result = array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.true;
    });

    it('should return bool(true) when the element is defined but with a value of null', function () {
        var keyReference = new Variable(callStack, valueFactory, 'keyVar'),
            arrayReference = new Variable(callStack, valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(valueFactory.createString('my_key'));
        arrayReference.setValue(valueFactory.createArray([
            new KeyValuePair(
                valueFactory.createString('my_key'),
                valueFactory.createNull()
            ),
            new KeyValuePair(
                valueFactory.createString('your_key'),
                valueFactory.createString('Your value')
            )
        ]));

        result = array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.true;
    });

    it('should return bool(false) when the element is not defined', function () {
        var keyReference = new Variable(callStack, valueFactory, 'keyVar'),
            arrayReference = new Variable(callStack, valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(valueFactory.createString('some_undefined_key'));
        arrayReference.setValue(valueFactory.createArray([
            new KeyValuePair(
                valueFactory.createString('my_key'),
                valueFactory.createString('My value')
            )
        ]));

        result = array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.false;
    });
});
