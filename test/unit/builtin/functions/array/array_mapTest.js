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
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    ObjectValue = require('phpcore/src/Value/Object').sync();

describe('PHP "array_map" builtin function', function () {
    var array_map,
        callbackValue,
        callbackVariable,
        callFactory,
        callStack,
        firstArrayVariable,
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

        array_map = state.getFunction('array_map');

        callbackVariable = variableFactory.createVariable('myCallback');
        callbackValue = sinon.createStubInstance(ObjectValue);
        callbackValue.call
            .withArgs(sinon.match.any, sinon.match.same(globalNamespace))
            .callsFake(function (argValues) {
                return valueFactory.createString(argValues[0].getNative() + ' (mapped)');
            });
        callbackValue.getCallableName.withArgs(globalNamespace).returns('myFunc');
        callbackValue.getForAssignment.returns(callbackValue);
        callbackValue.getType.returns('object');
        callbackValue.isCallable.returns(futureFactory.createPresent(true));
        callbackValue.next.callsArgWith(0, callbackValue);
        callbackVariable.setValue(callbackValue);

        firstArrayVariable = variableFactory.createVariable('myFirstArray');
        firstArrayVariable.setValue(valueFactory.createArray([]));
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            firstArrayVariable.setValue(valueFactory.createArray([
                valueFactory.createString('my first element'),
                valueFactory.createString('my second element'),
                valueFactory.createString('my last element')
            ]));
        });

        it('should map each element\'s value with the callback', async function () {
            var mappedArrayValue = await array_map(callbackVariable, firstArrayVariable).toPromise();

            expect(mappedArrayValue.getType()).to.equal('array');
            expect(mappedArrayValue.getNative()).to.deep.equal([
                'my first element (mapped)',
                'my second element (mapped)',
                'my last element (mapped)'
            ]);
        });
    });

    describe('for an associative array', function () {
        it('should preserve keys if only one array is provided', async function () {
            var mappedArrayValue;
            firstArrayVariable.setValue(valueFactory.createArray([
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

            mappedArrayValue = await array_map(callbackVariable, firstArrayVariable).toPromise();

            expect(mappedArrayValue.getType()).to.equal('array');
            expect(mappedArrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element (mapped)',
                'my_second_key': 'my second element (mapped)',
                'my_last_key': 'my last element (mapped)'
            });
        });
    });

    describe('when multiple arrays are passed', function () {
        it('should throw an error, as this is not yet supported', async function () {
            var secondArrayVariable = variableFactory.createVariable('mySecondArray');

            await expect(array_map(callbackVariable, firstArrayVariable, secondArrayVariable).toPromise())
                .to.eventually.be.rejectedWith(
                    Exception,
                    'array_map() :: Multiple input arrays are not yet supported'
                );
        });
    });

    describe('for an empty array', function () {
        it('should return an empty array', async function () {
            var result;
            firstArrayVariable.setValue(valueFactory.createArray([]));

            result = await array_map(callbackVariable, firstArrayVariable).toPromise();

            expect(result.getType()).to.equal('array');
            expect(result.getNative()).to.deep.equal([]);
        });
    });
});
