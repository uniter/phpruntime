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
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    ElementProvider = require('phpcore/src/Reference/Element/ElementProvider'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Output = require('phpcore/src/Output/Output'),
    PHPError = phpCommon.PHPError,
    Translator = phpCommon.Translator,
    Value = require('phpcore/src/Value').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "var_export" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.output = sinon.createStubInstance(Output);
        this.translator = sinon.createStubInstance(Translator);
        this.valueFactory = new ValueFactory(null, 'sync', new ElementProvider(), this.translator);
        this.valueReference = sinon.createStubInstance(Variable);
        this.internals = {
            callStack: this.callStack,
            output: this.output,
            valueFactory: this.valueFactory
        };

        this.valueFactory.setCallStack(this.callStack);

        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.var_export = this.variableHandlingFunctions.var_export;
    });

    describe('in return mode', function () {
        beforeEach(function () {
            this.returnReference = sinon.createStubInstance(Variable);
            this.returnReference.getNative.returns(true);
        });

        it('should return the string "true" when given bool(true)', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createBoolean(true));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('true');
        });

        it('should return the string "false" when given bool(false)', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createBoolean(false));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('false');
        });

        it('should return an integer as a string', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createInteger(4321));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('4321');
        });

        it('should return a float as a string', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createFloat(123.56));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('123.56');
        });

        it('should return a string delimited by single quotes with escaping', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createString('my \' text with \\ escapes inside'));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('\'my \\\' text with \\\\ escapes inside\'');
        });

        it('should export an array as an array literal', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createArray([
                new KeyValuePair(
                    this.valueFactory.createInteger(21),
                    this.valueFactory.createString('first value')
                ),
                new KeyValuePair(
                    this.valueFactory.createString('second'),
                    this.valueFactory.createInteger(321321)
                )
            ]));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('array (\n  21 => \'first value\',\n  \'second\' => 321321,\n)');
        });

        it('should export an empty object as a call to ::__set_state(...)', function () {
            var myClassObject = sinon.createStubInstance(Class),
                result;
            myClassObject.getName.returns('My\\Stuff\\MyClass');
            this.valueReference.getValue.returns(this.valueFactory.createObject({}, myClassObject));

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('My\\Stuff\\MyClass::__set_state(array(\n))');
        });

        it('should throw an error when a non-empty object is given, for now (TODO)', function () {
            var myClassObject = sinon.createStubInstance(Class),
                myObjectValue = this.valueFactory.createObject({myProp: 21}, myClassObject);
            myClassObject.getName.returns('My\\Stuff\\MyClass');
            myObjectValue.declareProperty('myProp', myClassObject, 'public')
                .initialise(this.valueFactory.createInteger(21));
            this.valueReference.getValue.returns(myObjectValue);

            expect(function () {
                this.var_export(this.valueReference, this.returnReference);
            }.bind(this)).to.throw('var_export() :: Non-empty objects not implemented');
        });

        it('should throw an error when an unexpected value type is given', function () {
            var myInvalidValue = sinon.createStubInstance(Value);
            myInvalidValue.getType.returns('something-invalid');
            this.valueReference.getValue.returns(myInvalidValue);

            expect(function () {
                this.var_export(this.valueReference, this.returnReference);
            }.bind(this)).to.throw('var_export() :: Unexpected value type "something-invalid"');
        });

        // Skipping "resource" type as we have no support yet

        it('should return null as a string', function () {
            var result;
            this.valueReference.getValue.returns(this.valueFactory.createNull());

            result = this.var_export(this.valueReference, this.returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('NULL');
        });

        // Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)
    });

    describe('in print mode', function () {
        it('should print a float as a string', function () {
            this.valueReference.getValue.returns(this.valueFactory.createFloat(123.56));

            this.var_export(this.valueReference);

            expect(this.output.write).to.have.been.calledOnce;
            expect(this.output.write).to.have.been.calledWith('123.56');
        });

        it('should return NULL', function () {
            this.valueReference.getValue.returns(this.valueFactory.createFloat(123.56));

            expect(this.var_export(this.valueReference).getType()).to.equal('null');
        });
    });

    describe('when not passed any argument', function () {
        it('should raise a warning', function () {
            this.var_export();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'var_export() expects at least 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            var resultValue = this.var_export();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
