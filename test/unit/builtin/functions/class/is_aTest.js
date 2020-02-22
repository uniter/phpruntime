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
    sinon = require('sinon'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    ClassAutoloader = require('phpcore/src/ClassAutoloader').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_a" builtin function', function () {
    beforeEach(function () {
        this.allowStringReference = sinon.createStubInstance(Variable);
        this.callStack = sinon.createStubInstance(CallStack);
        this.classNameReference = sinon.createStubInstance(Variable);
        this.classAutoloader = sinon.createStubInstance(ClassAutoloader);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.objectReference = sinon.createStubInstance(Variable);
        this.valueFactory = new ValueFactory();

        this.is_a = classExtension({
            callStack: this.callStack,
            classAutoloader: this.classAutoloader,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        }).is_a;
    });

    describe('when an object is given', function () {
        beforeEach(function () {
            // The class of the object (1st arg)
            this.classObject = sinon.createStubInstance(Class);
            this.classObject.getName.returns('My\\Namespaced\\MyClass');
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            this.objectValue = this.valueFactory.createObject({}, this.classObject);
            this.objectReference.getValue.returns(this.objectValue);

            // The class name given (2nd arg)
            this.classNameReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', function () {
            var resultValue = this.is_a(this.objectReference, this.classNameReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any ancestor of it implements the given class', function () {
            var resultValue;
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = this.is_a(this.objectReference, this.classNameReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', function () {
            this.is_a(this.objectReference, this.classNameReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is true', function () {
        beforeEach(function () {
            this.allowStringReference.getNative.returns(true);
            this.classObject = sinon.createStubInstance(Class);
            this.classObject.getName.returns('My\\Namespaced\\MyClass');
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            this.globalNamespace.getClass.withArgs('My\\Namespaced\\MyClass').returns(this.classObject);

            // A class name rather than object as "object" (1st arg)
            this.objectReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg)
            this.classNameReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', function () {
            var resultValue = this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any parent of it implements the given class', function () {
            var resultValue;
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = this.is_a(this.objectReference, this.classNameReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', function () {
            this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is false', function () {
        beforeEach(function () {
            this.allowStringReference.getNative.returns(false);
            this.classObject = sinon.createStubInstance(Class);
            this.classObject.getName.returns('My\\Namespaced\\MyClass');
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            this.globalNamespace.getClass.withArgs('My\\Namespaced\\MyClass').returns(this.classObject);

            // A class name rather than object as "object" (1st arg)
            this.objectReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg)
            this.classNameReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false, even when it implements the given class exactly', function () {
            var resultValue = this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', function () {
            this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when an invalid value is given as the object (a number)', function () {
        beforeEach(function () {
            this.allowStringReference.getNative.returns(false);
            this.classObject = sinon.createStubInstance(Class);
            this.classObject.getName.returns('My\\Namespaced\\MyClass');
            this.classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            this.globalNamespace.getClass.withArgs('My\\Namespaced\\MyClass').returns(this.classObject);

            // A number rather than object as "object" (1st arg)
            this.objectReference.getValue.returns(this.valueFactory.createInteger(1234));

            // The class name given (2nd arg)
            this.classNameReference.getValue.returns(this.valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false', function () {
            var resultValue = this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice even though the value is invalid', function () {
            this.is_a(this.objectReference, this.classNameReference, this.allowStringReference);

            expect(this.callStack.raiseError).not.to.have.been.called;
        });
    });
});
