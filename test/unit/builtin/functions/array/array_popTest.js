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

describe('PHP "array_pop" builtin function', function () {
    var array_pop,
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

        array_pop = state.getFunction('array_pop');

        arrayVariable = variableFactory.createVariable('myArray');
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([
                valueFactory.createString('my first element'),
                valueFactory.createString('my second element'),
                valueFactory.createString('my last element')
            ]));
            // Fetch the clone of the array that will have been taken on assignment.
            arrayValue = arrayVariable.getValue();
        });

        it('should remove the last element', async function () {
            await array_pop(arrayVariable).toPromise();

            expect(arrayValue.getNative()).to.deep.equal([
                'my first element',
                'my second element'
            ]);
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element', async function () {
            var result = await array_pop(arrayVariable).toPromise();

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
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

        it('should remove the last element, leaving the remaining elements\' keys untouched', async function () {
            await array_pop(arrayVariable).toPromise();

            expect(arrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element',
                'my_second_key': 'my second element'
            });
            expect(arrayValue.getLength()).to.equal(2);
        });

        it('should return the last element\'s value, discarding the key', async function () {
            var result = await array_pop(arrayVariable).toPromise();

            expect(result.getType()).to.equal('string');
            expect(result.getNative()).to.equal('my last element');
        });
    });

    describe('for an empty array', function () {
        it('should return null', async function () {
            var result;
            arrayVariable.setValue(valueFactory.createArray([]));

            result = await array_pop(arrayVariable).toPromise();

            expect(result.getType()).to.equal('null');
        });
    });
});
