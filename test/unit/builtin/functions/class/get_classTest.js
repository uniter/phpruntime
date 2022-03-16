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
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    ClassAutoloader = require('phpcore/src/ClassAutoloader').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    PHPError = phpCommon.PHPError,
    Scope = require('phpcore/src/Scope').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "get_class" builtin function', function () {
    var callStack,
        classAutoloader,
        get_class,
        globalNamespace,
        objectReference,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        classAutoloader = sinon.createStubInstance(ClassAutoloader);
        globalNamespace = sinon.createStubInstance(Namespace);
        objectReference = sinon.createStubInstance(Variable);
        valueFactory = tools.createIsolatedState().getValueFactory();

        get_class = classExtension({
            callStack: callStack,
            classAutoloader: classAutoloader,
            globalNamespace: globalNamespace,
            valueFactory: valueFactory
        }).get_class;
    });

    describe('when no object is given and called inside a class', function () {
        var callerScope,
            currentClass;

        beforeEach(function () {
            callerScope = sinon.createStubInstance(Scope);
            callStack.getCallerScope.returns(callerScope);

            currentClass = sinon.createStubInstance(Class);
            callerScope.getCurrentClass.returns(currentClass);

            currentClass.getName.returns('My\\Namespaced\\MyClass');
        });

        it('should return a string with the current object\'s class', function () {
            var resultValue = get_class();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('My\\Namespaced\\MyClass');
        });

        it('should not raise any notice', function () {
            get_class();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when no object is given but called outside a class', function () {
        var callerScope;

        beforeEach(function () {
            callerScope = sinon.createStubInstance(Scope);
            callStack.getCallerScope.returns(callerScope);

            callerScope.getCurrentClass.returns(null);
        });

        it('should raise a warning', function () {
            get_class();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() called without object from outside a class'
            );
        });

        it('should return bool(false)', function () {
            var result = get_class();

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });

    describe('when an object is given', function () {
        var classObject,
            objectValue;

        beforeEach(function () {
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            objectValue = valueFactory.createObject({}, classObject);
            objectReference.getValue.returns(objectValue);
        });

        it('should return a string with the given object\'s class', function () {
            var resultValue = get_class(objectReference);

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('My\\Namespaced\\MyClass');
        });

        it('should not raise any notice', function () {
            get_class(objectReference);

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object', function () {
        var objectValue;

        beforeEach(function () {
            objectValue = valueFactory.createString('I am not an object');
            objectReference.getValue.returns(objectValue);
        });

        it('should raise a warning', function () {
            get_class(objectReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() expects parameter 1 to be object, string given'
            );
        });

        it('should return bool(false)', function () {
            var result = get_class(objectReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });

    describe('when null is given as the object', function () {
        var objectValue;

        beforeEach(function () {
            objectValue = valueFactory.createNull();
            objectReference.getValue.returns(objectValue);
        });

        it('should raise a warning', function () {
            get_class(objectReference);

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'get_class() expects parameter 1 to be object, null given'
            );
        });

        it('should return bool(false)', function () {
            var result = get_class(objectReference);

            expect(result.getType()).to.equal('boolean');
            expect(result.getNative()).to.be.false;
        });
    });
});
