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
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_key_exists" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.array_key_exists = arrayExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).array_key_exists;
    });

    it('should return bool(true) when the element is defined', function () {
        var keyReference = new Variable(this.callStack, this.valueFactory, 'keyVar'),
            arrayReference = new Variable(this.callStack, this.valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(this.valueFactory.createString('my_key'));
        arrayReference.setValue(this.valueFactory.createArray([
            new KeyValuePair(
                this.valueFactory.createString('my_key'),
                this.valueFactory.createString('My value')
            ),
            new KeyValuePair(
                this.valueFactory.createString('your_key'),
                this.valueFactory.createString('Your value')
            )
        ]));

        result = this.array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.true;
    });

    it('should return bool(true) when the element is defined but with a value of null', function () {
        var keyReference = new Variable(this.callStack, this.valueFactory, 'keyVar'),
            arrayReference = new Variable(this.callStack, this.valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(this.valueFactory.createString('my_key'));
        arrayReference.setValue(this.valueFactory.createArray([
            new KeyValuePair(
                this.valueFactory.createString('my_key'),
                this.valueFactory.createNull()
            ),
            new KeyValuePair(
                this.valueFactory.createString('your_key'),
                this.valueFactory.createString('Your value')
            )
        ]));

        result = this.array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.true;
    });

    it('should return bool(false) when the element is not defined', function () {
        var keyReference = new Variable(this.callStack, this.valueFactory, 'keyVar'),
            arrayReference = new Variable(this.callStack, this.valueFactory, 'arrayVar'),
            result;
        keyReference.setValue(this.valueFactory.createString('some_undefined_key'));
        arrayReference.setValue(this.valueFactory.createArray([
            new KeyValuePair(
                this.valueFactory.createString('my_key'),
                this.valueFactory.createString('My value')
            )
        ]));

        result = this.array_key_exists(keyReference, arrayReference);

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.false;
    });
});
