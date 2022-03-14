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
    arrayExtension = require('../../../../../src/builtin/functions/array'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Namespace = require('phpcore/src/Namespace').sync(),
    StringValue = require('phpcore/src/Value/String').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_map" builtin function', function () {
    var array_map,
        arrayReference,
        callbackReference,
        callbackValue,
        callStack,
        flow,
        futureFactory,
        globalNamespace,
        state,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        });
        arrayReference = sinon.createStubInstance(Variable);
        callbackReference = sinon.createStubInstance(Variable);
        callbackValue = sinon.createStubInstance(StringValue);
        flow = state.getFlow();
        futureFactory = state.getFutureFactory();
        globalNamespace = sinon.createStubInstance(Namespace);
        valueFactory = state.getValueFactory();

        callbackReference.getValue.returns(callbackValue);
        callbackValue.call
            .withArgs(sinon.match.any, sinon.match.same(globalNamespace))
            .callsFake(function (argValues) {
                return valueFactory.createString(argValues[0].getNative() + ' (mapped)');
            });

        array_map = arrayExtension({
            callStack: callStack,
            flow: flow,
            futureFactory: futureFactory,
            globalNamespace: globalNamespace,
            valueFactory: valueFactory
        }).array_map;
    });

    describe('for an indexed array', function () {
        var arrayValue;

        beforeEach(function () {
            arrayValue = valueFactory.createArray([
                valueFactory.createString('my first element'),
                valueFactory.createString('my second element'),
                valueFactory.createString('my last element')
            ]);
            arrayReference.getValue.returns(arrayValue);
        });

        it('should map each element\'s value with the callback', async function () {
            var mappedArrayValue = await array_map(callbackReference, arrayReference).toPromise();

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
            var arrayValue = valueFactory.createArray([
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
                ]),
                mappedArrayValue;
            arrayReference.getValue.returns(arrayValue);

            mappedArrayValue = await array_map(callbackReference, arrayReference).toPromise();

            expect(mappedArrayValue.getType()).to.equal('array');
            expect(mappedArrayValue.getNative()).to.deep.equal({
                'my_first_key': 'my first element (mapped)',
                'my_second_key': 'my second element (mapped)',
                'my_last_key': 'my last element (mapped)'
            });
        });
    });

    describe('when multiple arrays are passed', function () {
        it('should throw an error, as this is not yet supported', function () {
            var arrayReference2 = sinon.createStubInstance(Variable);

            return expect(array_map(callbackReference, arrayReference, arrayReference2).toPromise())
                .to.eventually.be.rejectedWith('array_map() :: Multiple input arrays are not yet supported');
        });
    });

    describe('for an empty array', function () {
        it('should return an empty array', async function () {
            var result;
            arrayReference.getValue.returns(valueFactory.createArray([]));

            result = await array_map(callbackReference, arrayReference).toPromise();

            expect(result.getType()).to.equal('array');
            expect(result.getNative()).to.deep.equal([]);
        });
    });
});
