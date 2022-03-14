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
    tools = require('../../../tools'),
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Output = require('phpcore/src/Output/Output'),
    PHPError = phpCommon.PHPError,
    Value = require('phpcore/src/Value').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "var_export" builtin function', function () {
    var callStack,
        internals,
        output,
        valueFactory,
        valueReference,
        var_export,
        variableHandlingFunctions;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        output = sinon.createStubInstance(Output);
        valueFactory = tools.createIsolatedState('sync').getValueFactory();
        valueReference = sinon.createStubInstance(Variable);
        internals = {
            callStack: callStack,
            output: output,
            valueFactory: valueFactory
        };

        valueFactory.setCallStack(callStack);

        variableHandlingFunctions = variableHandlingFunctionFactory(internals);
        var_export = variableHandlingFunctions.var_export;
    });

    describe('in return mode', function () {
        var returnReference;

        beforeEach(function () {
            returnReference = sinon.createStubInstance(Variable);
            returnReference.getNative.returns(true);
        });

        it('should return the string "true" when given bool(true)', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createBoolean(true));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('true');
        });

        it('should return the string "false" when given bool(false)', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createBoolean(false));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('false');
        });

        it('should return an integer as a string', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createInteger(4321));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('4321');
        });

        it('should return a float as a string', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createFloat(123.56));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('123.56');
        });

        it('should return a string delimited by single quotes with escaping', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createString('my \' text with \\ escapes inside'));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('\'my \\\' text with \\\\ escapes inside\'');
        });

        it('should export an array as an array literal', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(21),
                    valueFactory.createString('first value')
                ),
                new KeyValuePair(
                    valueFactory.createString('second'),
                    valueFactory.createInteger(321321)
                )
            ]));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('array (\n  21 => \'first value\',\n  \'second\' => 321321,\n)');
        });

        it('should export an empty object as a call to ::__set_state(...)', function () {
            var myClassObject = sinon.createStubInstance(Class),
                result;
            myClassObject.getName.returns('My\\Stuff\\MyClass');
            valueReference.getValue.returns(valueFactory.createObject({}, myClassObject));

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('My\\Stuff\\MyClass::__set_state(array(\n))');
        });

        it('should throw an error when a non-empty object is given, for now (TODO)', function () {
            var myClassObject = sinon.createStubInstance(Class),
                myObjectValue = valueFactory.createObject({myProp: 21}, myClassObject);
            myClassObject.getName.returns('My\\Stuff\\MyClass');
            myObjectValue.declareProperty('myProp', myClassObject, 'public')
                .initialise(valueFactory.createInteger(21));
            valueReference.getValue.returns(myObjectValue);

            expect(function () {
                var_export(valueReference, returnReference);
            }).to.throw('var_export() :: Non-empty objects not implemented');
        });

        it('should throw an error when an unexpected value type is given', function () {
            var myInvalidValue = sinon.createStubInstance(Value);
            myInvalidValue.getType.returns('something-invalid');
            valueReference.getValue.returns(myInvalidValue);

            expect(function () {
                var_export(valueReference, returnReference);
            }).to.throw('var_export() :: Unexpected value type "something-invalid"');
        });

        // Skipping "resource" type as we have no support yet

        it('should return null as a string', function () {
            var result;
            valueReference.getValue.returns(valueFactory.createNull());

            result = var_export(valueReference, returnReference);

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('NULL');
        });

        // Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)
    });

    describe('in print mode', function () {
        it('should print a float as a string', function () {
            valueReference.getValue.returns(valueFactory.createFloat(123.56));

            var_export(valueReference);

            expect(output.write).to.have.been.calledOnce;
            expect(output.write).to.have.been.calledWith('123.56');
        });

        it('should return NULL', function () {
            valueReference.getValue.returns(valueFactory.createFloat(123.56));

            expect(var_export(valueReference).getType()).to.equal('null');
        });
    });

    describe('when not passed any argument', function () {
        it('should raise a warning', function () {
            var_export();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'var_export() expects at least 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            var resultValue = var_export();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
