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
    arrayConstantFactory = require('../../../../../src/builtin/constants/array'),
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair');

describe('PHP "array_push" builtin function', function () {
    var array_push,
        arrayVariable,
        callFactory,
        callStack,
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

        array_push = state.getFunction('array_push');

        arrayVariable = variableFactory.createVariable('myArray');
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(0),
                    valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(5),
                    valueFactory.createString('my last element')
                )
            ]));
            // Fetch the clone of the array that will have been taken on assignment.
            arrayValue = arrayVariable.getValue();
        });

        it('should push the new elements on just after the highest numbered key (sparse array support)', async function () {
            var newElementVariable1 = variableFactory.createVariable('myFirstArg'),
                newElementVariable2 = variableFactory.createVariable('mySecondArg');
            newElementVariable1.setValue(valueFactory.createString('first new one'));
            newElementVariable2.setValue(valueFactory.createString('second new one'));

            await array_push(arrayVariable, newElementVariable1, newElementVariable2).toPromise();

            expect(arrayValue.getNative()).to.deep.equal([
                'my first element',
                'my second element',
                undefined,
                undefined,
                undefined,
                'my last element',
                // New elements - should start counting just after the highest existing index (5).
                'first new one',
                'second new one'
            ]);
            expect(arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', async function () {
            var newElementVariable = variableFactory.createVariable('myArg'),
                result;
            newElementVariable.setValue(valueFactory.createString('my new one'));

            result = await array_push(arrayVariable, newElementVariable).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one.
        });
    });

    describe('for an associative array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('my_first_key'),
                    valueFactory.createString('my first element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_second_key'),
                    valueFactory.createString('my second element')
                ),
                new KeyValuePair(
                    valueFactory.createString('my_last_key'),
                    valueFactory.createString('my last element')
                )
            ]));
            // Fetch the clone of the array that will have been taken on assignment.
            arrayValue = arrayVariable.getValue();
        });

        it('should index the pushed elements from 0', async function () {
            var newElementVariable1 = variableFactory.createVariable('myFirstArg'),
                newElementVariable2 = variableFactory.createVariable('mySecondArg');
            newElementVariable1.setValue(valueFactory.createString('first new one'));
            newElementVariable2.setValue(valueFactory.createString('second new one'));

            await array_push(arrayVariable, newElementVariable1, newElementVariable2).toPromise();

            expect(arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element',
                'my_last_key': 'my last element',
                // New elements - should start counting from 0.
                0: 'first new one',
                1: 'second new one'
            });
            expect(arrayValue.getLength()).to.equal(5);
        });

        it('should return the new array length', async function () {
            var newElementVariable = variableFactory.createVariable('myArg'),
                result;
            newElementVariable.setValue(valueFactory.createString('my new one'));

            result = await array_push(arrayVariable, newElementVariable).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(4); // Original 3 + the pushed one.
        });
    });

    describe('for an empty array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([]));

            // Fetch the clone of the array that will have been taken on assignment.
            arrayValue = arrayVariable.getValue();
        });

        it('should index the pushed elements from 0', async function () {
            var newElementVariable1 = variableFactory.createVariable('myFirstArg'),
                newElementVariable2 = variableFactory.createVariable('mySecondArg');
            newElementVariable1.setValue(valueFactory.createString('first new one'));
            newElementVariable2.setValue(valueFactory.createString('second new one'));

            await array_push(arrayVariable, newElementVariable1, newElementVariable2).toPromise();

            expect(arrayValue.getNative()).to.deep.equal([
                // New elements - should start counting from 0.
                'first new one',
                'second new one'
            ]);
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the new array length', async function () {
            var newElementVariable = variableFactory.createVariable('myArg'),
                result;
            newElementVariable.setValue(valueFactory.createString('my new one'));

            result = await array_push(arrayVariable, newElementVariable).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1); // No original elements, plus the pushed one.
        });
    });
});
