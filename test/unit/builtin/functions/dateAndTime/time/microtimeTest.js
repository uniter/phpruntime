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
    tools = require('../../../../tools'),
    dateAndTimeFunctionFactory = require('../../../../../../src/builtin/functions/dateAndTime/time'),
    CallStack = require('phpcore/src/CallStack'),
    FloatValue = require('phpcore/src/Value/Float').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "microtime" builtin function', function () {
    var args,
        callMicrotime,
        callStack,
        dateAndTimeFunctions,
        getAsFloatReference,
        globalNamespace,
        internals,
        microtime,
        optionSet,
        performance,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        globalNamespace = sinon.createStubInstance(Namespace);
        valueFactory = tools.createIsolatedState().getValueFactory();
        performance = {
            getTimeInMicroseconds: sinon.stub()
        };
        optionSet = {
            getOption: sinon.stub()
        };
        optionSet.getOption.withArgs('performance').returns(performance);
        internals = {
            callStack: callStack,
            globalNamespace: globalNamespace,
            optionSet: optionSet,
            valueFactory: valueFactory
        };
        dateAndTimeFunctions = dateAndTimeFunctionFactory(internals);
        microtime = dateAndTimeFunctions.microtime;

        getAsFloatReference = sinon.createStubInstance(Variable);

        args = [getAsFloatReference];

        callMicrotime = function () {
            return microtime.apply(null, args);
        };
    });

    it('should return the current seconds+us when $get_as_float = true', function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);
        getAsFloatReference.getValue.returns(valueFactory.createBoolean(true));

        result = callMicrotime();

        expect(result).to.be.an.instanceOf(FloatValue);
        expect(result.getNative()).to.equal(123.456789);
    });

    it('should return a string with the current seconds and us when $get_as_float = false', function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);
        getAsFloatReference.getValue.returns(valueFactory.createBoolean(false));

        result = callMicrotime();

        expect(result).to.be.an.instanceOf(StringValue);
        expect(result.getNative()).to.equal('0.456789 123');
    });

    it('should return a string with the current seconds and us when $get_as_float is not provided', function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);
        args.length = 0;

        result = callMicrotime();

        expect(result).to.be.an.instanceOf(StringValue);
        expect(result.getNative()).to.equal('0.456789 123');
    });

    describe('when an array is given for $get_as_float', function () {
        beforeEach(function () {
            getAsFloatReference.getValue.returns(valueFactory.createArray([21]));
        });

        it('should raise an error', function () {
            performance.getTimeInMicroseconds.returns(123456789);

            callMicrotime();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'microtime() expects parameter 1 to be boolean, array given'
            );
        });

        it('should return null', function () {
            performance.getTimeInMicroseconds.returns(123456789);
            getAsFloatReference.getValue.returns(valueFactory.createArray([21]));

            expect(callMicrotime()).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when an object is given for $get_as_float', function () {
        beforeEach(function () {
            getAsFloatReference.getValue.returns(valueFactory.createObject({}, 'MyClass'));
        });

        it('should raise an error', function () {
            performance.getTimeInMicroseconds.returns(123456789);

            callMicrotime();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'microtime() expects parameter 1 to be boolean, object given'
            );
        });

        it('should return null', function () {
            performance.getTimeInMicroseconds.returns(123456789);
            getAsFloatReference.getValue.returns(valueFactory.createObject({}, 'MyClass'));

            expect(callMicrotime()).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when no "performance" option is defined', function () {
        it('should throw an error', function () {
            optionSet.getOption.withArgs('performance').returns(null);

            expect(function () {
                callMicrotime();
            }).to.throw('performance :: No `performance` option is configured');
        });
    });
});
