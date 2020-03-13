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
    classExtension = require('../../../../../src/builtin/functions/class'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    ClassAutoloader = require('phpcore/src/ClassAutoloader').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    PHPError = phpCommon.PHPError,
    Scope = require('phpcore/src/Scope').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "get_class" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.classAutoloader = sinon.createStubInstance(ClassAutoloader);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.objectReference = sinon.createStubInstance(Variable);
        this.valueFactory = new ValueFactory();

        this.get_class = classExtension({
            callStack: this.callStack,
            classAutoloader: this.classAutoloader,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        }).get_class;
    });

    describe('when no object is given and called inside a class', function () {
        beforeEach(function () {
            this.callerScope = sinon.createStubInstance(Scope);
            this.callStack.getCallerScope.returns(this.callerScope);

            this.currentClass = sinon.createStubInstance(Class);
            this.callerScope.getCurrentClass.returns(this.currentClass);

            this.currentClass.getName.returns('My\\Namespaced\\MyClass');
        });

        it('should return a string with the current object\'s class', function () {
            var resultValue = this.get_class();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('My\\Namespaced\\MyClass');
        });

        it('should not raise any notice', function () {
            this.get_class();

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when no object is given but called outside a class', function () {
        beforeEach(function () {
            this.callerScope = sinon.createStubInstance(Scope);
            this.callStack.getCallerScope.returns(this.callerScope);

            this.callerScope.getCurrentClass.returns(null);
        });

        it('should raise a warning', function () {
            this.get_class();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() called without object from outside a class'
            );
        });

        it('should return bool(false)', function () {
            var result = this.get_class();

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });

    describe('when an object is given', function () {
        beforeEach(function () {
            this.classObject = sinon.createStubInstance(Class);
            this.classObject.getName.returns('My\\Namespaced\\MyClass');
            this.objectValue = this.valueFactory.createObject({}, this.classObject);
            this.objectReference.getValue.returns(this.objectValue);
        });

        it('should return a string with the given object\'s class', function () {
            var resultValue = this.get_class(this.objectReference);

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('My\\Namespaced\\MyClass');
        });

        it('should not raise any notice', function () {
            this.get_class(this.objectReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object', function () {
        beforeEach(function () {
            this.objectValue = this.valueFactory.createString('I am not an object');
            this.objectReference.getValue.returns(this.objectValue);
        });

        it('should raise a warning', function () {
            this.get_class(this.objectReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() expects parameter 1 to be object, string given'
            );
        });

        it('should return bool(false)', function () {
            var result = this.get_class(this.objectReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });

    describe('when null is given as the object', function () {
        beforeEach(function () {
            this.objectValue = this.valueFactory.createNull();
            this.objectReference.getValue.returns(this.objectValue);
        });

        it('should raise a warning', function () {
            this.get_class(this.objectReference);

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() expects parameter 1 to be object, null given'
            );
        });

        it('should return bool(false)', function () {
            var result = this.get_class(this.objectReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });
});
