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
    dateAndTimeFunctionFactory = require('../../../../../../src/builtin/functions/dateAndTime/time'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    FloatValue = require('phpcore/src/Value/Float').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    ObjectValue = require('phpcore/src/Value/Object').sync(),
    PHPError = require('phpcommon').PHPError,
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "microtime" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.valueFactory.createArray.restore();
        sinon.stub(this.valueFactory, 'createArray', function () {
            var value = sinon.createStubInstance(ArrayValue);
            value.getType.returns('array');
            return value;
        });
        this.valueFactory.createBoolean.restore();
        sinon.stub(this.valueFactory, 'createBoolean', function (native) {
            var value = sinon.createStubInstance(BooleanValue);
            value.coerceToBoolean.returns(value);
            value.getNative.returns(native);
            value.getType.returns('boolean');
            return value;
        });
        this.valueFactory.createFloat.restore();
        sinon.stub(this.valueFactory, 'createFloat', function (native) {
            var value = sinon.createStubInstance(FloatValue);
            value.getNative.returns(native);
            value.getType.returns('float');
            return value;
        });
        this.valueFactory.createNull.restore();
        sinon.stub(this.valueFactory, 'createNull', function () {
            var value = sinon.createStubInstance(NullValue);
            value.getType.returns('null');
            return value;
        });
        this.valueFactory.createObject.restore();
        sinon.stub(this.valueFactory, 'createObject', function () {
            var value = sinon.createStubInstance(ObjectValue);
            value.getType.returns('object');
            return value;
        });
        this.valueFactory.createString.restore();
        sinon.stub(this.valueFactory, 'createString', function (native) {
            var value = sinon.createStubInstance(StringValue);
            value.getNative.returns(native);
            value.getType.returns('string');
            return value;
        });
        this.performance = {
            getTimeInMicroseconds: sinon.stub()
        };
        this.optionSet = {
            getOption: sinon.stub()
        };
        this.optionSet.getOption.withArgs('performance').returns(this.performance);
        this.internals = {
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            optionSet: this.optionSet,
            valueFactory: this.valueFactory
        };
        this.dateAndTimeFunctions = dateAndTimeFunctionFactory(this.internals);
        this.microtime = this.dateAndTimeFunctions.microtime;

        this.getAsFloatReference = sinon.createStubInstance(Variable);

        this.args = [this.getAsFloatReference];

        this.callMicrotime = function () {
            return this.microtime.apply(null, this.args);
        }.bind(this);
    });

    it('should return the current seconds+us when $get_as_float = true', function () {
        var result;
        this.performance.getTimeInMicroseconds.returns(123456789);
        this.getAsFloatReference.getValue.returns(this.valueFactory.createBoolean(true));

        result = this.callMicrotime();

        expect(result).to.be.an.instanceOf(FloatValue);
        expect(result.getNative()).to.equal(123.456789);
    });

    it('should return a string with the current seconds and us when $get_as_float = false', function () {
        var result;
        this.performance.getTimeInMicroseconds.returns(123456789);
        this.getAsFloatReference.getValue.returns(this.valueFactory.createBoolean(false));

        result = this.callMicrotime();

        expect(result).to.be.an.instanceOf(StringValue);
        expect(result.getNative()).to.equal('0.456789 123');
    });

    it('should return a string with the current seconds and us when $get_as_float is not provided', function () {
        var result;
        this.performance.getTimeInMicroseconds.returns(123456789);
        this.args.length = 0;

        result = this.callMicrotime();

        expect(result).to.be.an.instanceOf(StringValue);
        expect(result.getNative()).to.equal('0.456789 123');
    });

    describe('when an array is given for $get_as_float', function () {
        beforeEach(function () {
            this.getAsFloatReference.getValue.returns(this.valueFactory.createArray([21]));
        });

        it('should raise an error', function () {
            this.performance.getTimeInMicroseconds.returns(123456789);

            this.callMicrotime();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'microtime() expects parameter 1 to be boolean, array given'
            );
        });

        it('should return null', function () {
            this.performance.getTimeInMicroseconds.returns(123456789);
            this.getAsFloatReference.getValue.returns(this.valueFactory.createArray([21]));

            expect(this.callMicrotime()).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when an object is given for $get_as_float', function () {
        beforeEach(function () {
            this.getAsFloatReference.getValue.returns(this.valueFactory.createObject({}, 'MyClass'));
        });

        it('should raise an error', function () {
            this.performance.getTimeInMicroseconds.returns(123456789);

            this.callMicrotime();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'microtime() expects parameter 1 to be boolean, object given'
            );
        });

        it('should return null', function () {
            this.performance.getTimeInMicroseconds.returns(123456789);
            this.getAsFloatReference.getValue.returns(this.valueFactory.createObject({}, 'MyClass'));

            expect(this.callMicrotime()).to.be.an.instanceOf(NullValue);
        });
    });

    describe('when no "performance" option is defined', function () {
        it('should throw an error', function () {
            this.optionSet.getOption.withArgs('performance').returns(null);

            expect(function () {
                this.callMicrotime();
            }.bind(this)).to.throw('performance :: No `performance` option is configured');
        });
    });
});
