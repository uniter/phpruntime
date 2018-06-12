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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/spl'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError,
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "spl_object_hash" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            valueFactory: this.valueFactory
        };
        this.splFunctions = stringFunctionFactory(this.internals);
        this.spl_object_hash = this.splFunctions.spl_object_hash;

        this.objectValue = sinon.createStubInstance(ObjectValue);
        this.objectValue.getID.returns(21);
        this.objectValue.getType.returns('object');
        this.objectReference = sinon.createStubInstance(Variable);
        this.objectReference.getValue.returns(this.objectValue);
    });

    it('should return a 32-byte 0-padded hash with the object\'s ID when 2 digits long', function () {
        var resultValue = this.spl_object_hash(this.objectReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('00000000000000000000000000000021');
    });

    it('should return a 32-byte 0-padded hash with the object\'s ID when 4 digits long', function () {
        var resultValue;
        this.objectValue.getID.returns(4532);

        resultValue = this.spl_object_hash(this.objectReference);

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('00000000000000000000000000004532');
    });

    describe('when a non-object value is given', function () {
        it('should raise a warning', function () {
            this.objectReference.getValue.returns(this.valueFactory.createString('not an object'));
            this.spl_object_hash(this.objectReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'spl_object_hash() expects parameter 1 to be object, string given'
            );
        });

        it('should return NULL', function () {
            var resultValue;
            this.objectReference.getValue.returns(this.valueFactory.createString('not an object'));

            resultValue = this.spl_object_hash(this.objectReference);

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
