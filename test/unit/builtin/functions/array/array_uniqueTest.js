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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Exception = phpCommon.Exception,
    KeyValuePair = require('phpcore/src/KeyValuePair');

describe('PHP "array_unique" builtin function', function () {
    var array_unique,
        arrayVariable,
        callFactory,
        callStack,
        futureFactory,
        globalNamespace,
        sortFlagsVariable,
        state,
        valueFactory,
        variableFactory,
        SORT_NATURAL;

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
        SORT_NATURAL = state.getConstantValue('SORT_NATURAL');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        array_unique = state.getFunction('array_unique');

        arrayVariable = variableFactory.createVariable('myArray');
        sortFlagsVariable = variableFactory.createVariable('mySortFlags');
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                valueFactory.createString('first'),
                valueFactory.createString('first'),
                valueFactory.createString('second'),
                valueFactory.createString('first'),
                valueFactory.createString('third')
            ]);
            arrayVariable.setValue(arrayValue);
        });

        it('should not reindex the elements starting from 0', async function () {
            var resultArray = await array_unique(arrayVariable).toPromise();

            expect(resultArray.getNative()).to.deep.equal([
                'first',    // Key 0.
                undefined,
                'second',   // Key 2.
                undefined,
                'third'     // Key 4.
            ]);
            expect(resultArray.getLength()).to.equal(3);
        });

        it('should not modify the original array', async function () {
            await array_unique(arrayVariable).toPromise();

            expect(arrayValue.getNative()).to.deep.equal([
                'first',    // Key 0.
                'first',
                'second',   // Key 2.
                'first',
                'third'     // Key 4.
            ]);
            expect(arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an associative array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('a'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('c'),
                    valueFactory.createString('second')
                ),
                new KeyValuePair(
                    valueFactory.createString('d'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('e'),
                    valueFactory.createString('third')
                )
            ]);
            arrayVariable.setValue(arrayValue);
        });

        it('should preserve the keys', async function () {
            var resultArray = await array_unique(arrayVariable).toPromise();

            expect(resultArray.getNative()).to.deep.equal({
                'a': 'first',
                'c': 'second',
                'e': 'third'
            });
            expect(resultArray.getLength()).to.equal(3);
        });

        it('should not modify the original array', async function () {
            await array_unique(arrayVariable).toPromise();

            expect(arrayValue.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'first',
                'c': 'second',
                'd': 'first',
                'e': 'third'
            });
            expect(arrayValue.getLength()).to.equal(5);
        });
    });

    describe('for an empty array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([]);
            arrayVariable.setValue(arrayValue);
        });

        it('should return an empty array', async function () {
            var resultArray = await array_unique(arrayVariable).toPromise();

            expect(resultArray.getLength()).to.equal(0);
        });
    });

    describe('when sort flags are provided (currently unsupported)', function () {
        it('should throw a meaningful error', async function () {
            arrayVariable.setValue(valueFactory.createArray([]));
            sortFlagsVariable.setValue(SORT_NATURAL);

            await expect(array_unique(arrayVariable, sortFlagsVariable).toPromise())
                .to.eventually.be.rejectedWith(
                    Exception,
                    'array_unique() :: Only SORT_STRING (2) is supported, 6 given'
                );
        });
    });
});
