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
    tools = require('../../../tools'),
    arrayConstantFactory = require('../../../../../src/builtin/constants/array'),
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    PHPError = require('phpcommon').PHPError;

describe('PHP "array_merge" builtin function', function () {
    var array_merge,
        firstArrayVariable,
        callFactory,
        callStack,
        createKeyValuePair,
        futureFactory,
        globalNamespace,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                constantGroups: [
                    arrayConstantFactory
                ],
                functionGroups: [
                    arrayFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        createKeyValuePair = function (key, value) {
            var keyValuePair = sinon.createStubInstance(KeyValuePair);
            keyValuePair.getKey.returns(key);
            keyValuePair.getValue.returns(value);
            return keyValuePair;
        };
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

        array_merge = state.getFunction('array_merge');

        firstArrayVariable = variableFactory.createVariable('myFirstArray');
    });

    it('should return an array with the merged elements when two indexed arrays are provided', async function () {
        var result,
            secondArrayVariable = variableFactory.createVariable('mySecondArray');
        firstArrayVariable.setValue(valueFactory.createArray([
            valueFactory.createInteger(1),
            valueFactory.createInteger(4)
        ]));
        secondArrayVariable.setValue(valueFactory.createArray([
            valueFactory.createInteger(7),
            valueFactory.createInteger(21)
        ]));

        result = await array_merge(firstArrayVariable, secondArrayVariable).toPromise();

        expect(result.getType()).to.equal('array');
        expect(result.getKeys()).to.have.length(4);
        expect(result.getKeys()[0].getType()).to.equal('int');
        expect(result.getKeys()[0].getNative()).to.equal(0);
        expect(result.getKeys()[1].getType()).to.equal('int');
        expect(result.getKeys()[1].getNative()).to.equal(1);
        expect(result.getKeys()[2].getType()).to.equal('int');
        expect(result.getKeys()[2].getNative()).to.equal(2);
        expect(result.getKeys()[3].getType()).to.equal('int');
        expect(result.getKeys()[3].getNative()).to.equal(3);
        expect(result.getNative()).to.deep.equal([1, 4, 7, 21]);
    });

    it('should return an array with the merged elements when two associative arrays are provided', async function () {
        var result,
            secondArrayVariable = variableFactory.createVariable('mySecondArray');
        firstArrayVariable.setValue(valueFactory.createArray([
            createKeyValuePair(valueFactory.createString('first'), valueFactory.createInteger(1)),
            createKeyValuePair(valueFactory.createString('second'), valueFactory.createInteger(4))
        ]));
        secondArrayVariable.setValue(valueFactory.createArray([
            createKeyValuePair(valueFactory.createString('third'), valueFactory.createInteger(7)),

            // Overrides first array's.
            createKeyValuePair(valueFactory.createString('first'), valueFactory.createInteger(21))
        ]));

        result = await array_merge(firstArrayVariable, secondArrayVariable).toPromise();

        expect(result.getType()).to.equal('array');
        expect(result.getKeys()).to.have.length(3);
        expect(result.getKeys()[0].getType()).to.equal('string');
        expect(result.getKeys()[0].getNative()).to.equal('first');
        expect(result.getKeys()[1].getType()).to.equal('string');
        expect(result.getKeys()[1].getNative()).to.equal('second');
        expect(result.getKeys()[2].getType()).to.equal('string');
        expect(result.getKeys()[2].getNative()).to.equal('third');
        expect(result.getNative()).to.deep.equal({
            'first': 21,
            'second': 4,
            'third': 7
        });
    });

    describe('when no arguments are provided', function () {
        it('should raise a warning', async function () {
            await array_merge().toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge() expects at least 1 parameter, 0 given'
            );
        });

        it('should return NULL', async function () {
            var result = await array_merge().toPromise();

            expect(result.getType()).to.equal('null');
        });
    });

    describe('when one of the arguments is not an array', function () {
        var secondArgumentVariable;

        beforeEach(function () {
            secondArgumentVariable = variableFactory.createVariable('mySecondArg');

            firstArrayVariable.setValue(valueFactory.createArray([valueFactory.createInteger(21)]));
            secondArgumentVariable.setValue(valueFactory.createInteger(27));
        });

        it('should raise a warning', async function () {
            await array_merge(firstArrayVariable, secondArgumentVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'array_merge(): Argument #2 is not an array'
            );
        });

        it('should return NULL', async function () {
            var result = await array_merge(firstArrayVariable, secondArgumentVariable).toPromise();

            expect(result.getType()).to.equal('null');
        });
    });
});
