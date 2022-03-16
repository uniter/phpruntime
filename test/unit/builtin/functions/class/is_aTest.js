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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    ClassAutoloader = require('phpcore/src/ClassAutoloader').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "is_a" builtin function', function () {
    var allowStringReference,
        callStack,
        classAutoloader,
        classNameReference,
        futureFactory,
        globalNamespace,
        is_a,
        objectReference,
        state,
        valueFactory;

    beforeEach(function () {
        allowStringReference = sinon.createStubInstance(Variable);
        callStack = sinon.createStubInstance(CallStack);
        classNameReference = sinon.createStubInstance(Variable);
        classAutoloader = sinon.createStubInstance(ClassAutoloader);
        globalNamespace = sinon.createStubInstance(Namespace);
        objectReference = sinon.createStubInstance(Variable);
        state = tools.createIsolatedState();
        futureFactory = state.getFutureFactory();
        valueFactory = state.getValueFactory();

        is_a = classExtension({
            callStack: callStack,
            classAutoloader: classAutoloader,
            globalNamespace: globalNamespace,
            valueFactory: valueFactory
        }).is_a;
    });

    describe('when an object is given', function () {
        var classObject,
            objectValue;

        beforeEach(function () {
            // The class of the object (1st arg)
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            objectValue = valueFactory.createObject({}, classObject);
            objectReference.getValue.returns(objectValue);

            // The class name given (2nd arg)
            classNameReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', async function () {
            var resultValue = await is_a(objectReference, classNameReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any ancestor of it implements the given class', async function () {
            var resultValue;
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = await is_a(objectReference, classNameReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectReference, classNameReference).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is true', function () {
        var classObject;

        beforeEach(function () {
            allowStringReference.getNative.returns(true);
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass
                .withArgs('My\\Namespaced\\MyClass')
                .returns(futureFactory.createPresent(classObject));

            // A class name rather than object as "object" (1st arg)
            objectReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg)
            classNameReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', async function () {
            var resultValue = await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any parent of it implements the given class', async function () {
            var resultValue;
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = await is_a(objectReference, classNameReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is false', function () {
        var classObject;

        beforeEach(function () {
            allowStringReference.getNative.returns(false);
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass
                .withArgs('My\\Namespaced\\MyClass')
                .returns(futureFactory.createPresent(classObject));

            // A class name rather than object as "object" (1st arg)
            objectReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg)
            classNameReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false, even when it implements the given class exactly', async function () {
            var resultValue = await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when an invalid value is given as the object (a number)', function () {
        var classObject;

        beforeEach(function () {
            allowStringReference.getNative.returns(false);
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass.withArgs('My\\Namespaced\\MyClass').returns(classObject);

            // A number rather than object as "object" (1st arg)
            objectReference.getValue.returns(valueFactory.createInteger(1234));

            // The class name given (2nd arg)
            classNameReference.getValue.returns(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false', async function () {
            var resultValue = await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice even though the value is invalid', async function () {
            await is_a(objectReference, classNameReference, allowStringReference).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });
});
