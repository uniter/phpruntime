/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var classFunctionFactory = require('../../../../../src/builtin/functions/class'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync();

describe('PHP "is_a" builtin function', function () {
    var allowStringVariable,
        callFactory,
        callStack,
        classNameVariable,
        futureFactory,
        globalNamespace,
        is_a,
        objectOrClassVariable,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    classFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        futureFactory = state.getFutureFactory();
        globalNamespace = state.getGlobalNamespace();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        // TODO: Get rid of this partial stub, instead allow easier injection of stub Class instances.
        sinon.stub(globalNamespace, 'getClass').callThrough();

        is_a = state.getFunction('is_a');

        allowStringVariable = variableFactory.createVariable('myAllowString');
        classNameVariable = variableFactory.createVariable('myClassName');
        objectOrClassVariable = variableFactory.createVariable('myObjectOrClass');
    });

    describe('when an object is given', function () {
        var classObject,
            objectValue;

        beforeEach(function () {
            // The class of the object (1st arg).
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            objectValue = valueFactory.createObject({}, classObject);
            objectOrClassVariable.setValue(objectValue);

            // The class name given (2nd arg).
            classNameVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', async function () {
            var resultValue = await is_a(objectOrClassVariable, classNameVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any ancestor of it implements the given class', async function () {
            var resultValue;
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = await is_a(objectOrClassVariable, classNameVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectOrClassVariable, classNameVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is true', function () {
        var classObject;

        beforeEach(function () {
            allowStringVariable.setValue(valueFactory.createBoolean(true));
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass
                .withArgs('My\\Namespaced\\MyClass')
                .returns(futureFactory.createPresent(classObject));

            // A class name rather than object as "object" (1st arg).
            objectOrClassVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg).
            classNameVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return true when it or an ancestor class implements the given class', async function () {
            var resultValue = await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.true;
        });

        it('should return false when it nor any parent of it implements the given class', async function () {
            var resultValue;
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(false);

            resultValue = await is_a(objectOrClassVariable, classNameVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when a string is given as the object and allow_string is false', function () {
        var classObject;

        beforeEach(function () {
            allowStringVariable.setValue(valueFactory.createBoolean(false));
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass
                .withArgs('My\\Namespaced\\MyClass')
                .returns(futureFactory.createPresent(classObject));

            // A class name rather than object as "object" (1st arg).
            objectOrClassVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));

            // The class name given (2nd arg).
            classNameVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false, even when it implements the given class exactly', async function () {
            var resultValue = await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice', async function () {
            await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });

    describe('when an invalid value is given as the object (a number)', function () {
        var classObject;

        beforeEach(function () {
            allowStringVariable.setValue(valueFactory.createBoolean(false));
            classObject = sinon.createStubInstance(Class);
            classObject.getName.returns('My\\Namespaced\\MyClass');
            classObject.is.withArgs('My\\Namespaced\\MyClass').returns(true);
            globalNamespace.getClass.withArgs('My\\Namespaced\\MyClass').returns(classObject);

            // A number rather than object as "object" (1st arg).
            objectOrClassVariable.setValue(valueFactory.createInteger(1234));

            // The class name given (2nd arg).
            classNameVariable.setValue(valueFactory.createString('My\\Namespaced\\MyClass'));
        });

        it('should return false', async function () {
            var resultValue = await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });

        it('should not raise any error/warning/notice even though the value is invalid', async function () {
            await is_a(objectOrClassVariable, classNameVariable, allowStringVariable).toPromise();

            expect(callStack.raiseError).not.to.have.been.called;
        });
    });
});
