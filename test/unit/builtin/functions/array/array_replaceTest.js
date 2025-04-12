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
    KeyValuePair = require('phpcore/src/KeyValuePair');

describe('PHP "array_replace" builtin function', function () {
    var array_replace,
        arrayVariable,
        callFactory,
        callStack,
        futureFactory,
        globalNamespace,
        replacementArrayVariable1,
        replacementArrayVariable2,
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

        array_replace = state.getFunction('array_replace');

        arrayVariable = variableFactory.createVariable('myArray');
        replacementArrayVariable1 = variableFactory.createVariable('myReplacementArray1');
        replacementArrayVariable2 = variableFactory.createVariable('myReplacementArray2');
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(0),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('second')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(2),
                    valueFactory.createString('third')
                )
            ]));
        });

        it('should replace values from the replacement array', async function () {
            replacementArrayVariable1.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('replaced second')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(3),
                    valueFactory.createString('new fourth')
                )
            ]));

            const result = await array_replace(arrayVariable, replacementArrayVariable1).toPromise();

            expect(result.getNative()).to.deep.equal([
                'first',
                'replaced second',
                'third',
                'new fourth'
            ]);
        });

        it('should process multiple replacement arrays in order', async function () {
            replacementArrayVariable1.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('replaced second')
                )
            ]));
            replacementArrayVariable2.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createInteger(1),
                    valueFactory.createString('overridden second')
                ),
                new KeyValuePair(
                    valueFactory.createInteger(3),
                    valueFactory.createString('new fourth')
                )
            ]));

            const result = await array_replace(arrayVariable, replacementArrayVariable1, replacementArrayVariable2).toPromise();

            expect(result.getNative()).to.deep.equal([
                'first',
                'overridden second',
                'third',
                'new fourth'
            ]);
        });
    });

    describe('for an associative array', function () {
        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('a'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('second')
                ),
                new KeyValuePair(
                    valueFactory.createString('c'),
                    valueFactory.createString('third')
                )
            ]));
        });

        it('should replace values from the replacement array', async function () {
            replacementArrayVariable1.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('replaced second')
                ),
                new KeyValuePair(
                    valueFactory.createString('d'),
                    valueFactory.createString('new fourth')
                )
            ]));

            var result = await array_replace(arrayVariable, replacementArrayVariable1).toPromise();

            expect(result.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'replaced second',
                'c': 'third',
                'd': 'new fourth'
            });
        });

        it('should process multiple replacement arrays in order', async function () {
            replacementArrayVariable1.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('replaced second')
                )
            ]));
            replacementArrayVariable2.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('overridden second')
                ),
                new KeyValuePair(
                    valueFactory.createString('d'),
                    valueFactory.createString('new fourth')
                )
            ]));

            const result = await array_replace(arrayVariable, replacementArrayVariable1, replacementArrayVariable2).toPromise();

            expect(result.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'overridden second',
                'c': 'third',
                'd': 'new fourth'
            });
        });
    });

    describe('for an empty array', function () {
        beforeEach(function () {
            arrayVariable.setValue(valueFactory.createArray([]));
        });

        it('should add all elements from the replacement array', async function () {
            replacementArrayVariable1.setValue(valueFactory.createArray([
                new KeyValuePair(
                    valueFactory.createString('a'),
                    valueFactory.createString('first')
                ),
                new KeyValuePair(
                    valueFactory.createString('b'),
                    valueFactory.createString('second')
                )
            ]));

            const result = await array_replace(arrayVariable, replacementArrayVariable1).toPromise();

            expect(result.getNative()).to.deep.equal({
                'a': 'first',
                'b': 'second'
            });
        });
    });
});
