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
    CallStack = require('phpcore/src/CallStack'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    Namespace = require('phpcore/src/Namespace').sync(),
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "array_map" builtin function', function () {
    beforeEach(function () {
        this.arrayReference = sinon.createStubInstance(Variable);
        this.callbackReference = sinon.createStubInstance(Variable);
        this.callbackValue = sinon.createStubInstance(StringValue);
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = new ValueFactory();

        this.callbackReference.getValue.returns(this.callbackValue);
        this.callbackValue.call
            .withArgs(sinon.match.any, sinon.match.same(this.globalNamespace))
            .callsFake(function (argValues) {
                return this.valueFactory.createString(argValues[0].getNative() + ' (mapped)');
            }.bind(this));

        this.array_map = arrayExtension({
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        }).array_map;
    });

    describe('for an indexed array', function () {
        beforeEach(function () {
            this.arrayValue = this.valueFactory.createArray([
                this.valueFactory.createString('my first element'),
                this.valueFactory.createString('my second element'),
                this.valueFactory.createString('my last element')
            ]);
            this.arrayReference.getValue.returns(this.arrayValue);
        });

        it('should map each element\'s value with the callback', function () {
            var mappedArrayValue = this.array_map(this.callbackReference, this.arrayReference);

            expect(mappedArrayValue.getType()).to.equal('array');
            expect(mappedArrayValue.getNative()).to.deep.equal([
                'my first element (mapped)',
                'my second element (mapped)',
                'my last element (mapped)'
            ]);
        });
    });

    describe('for an associative array', function () {
        it('should preserve keys if only one array is provided', function () {
            var arrayValue = this.valueFactory.createArray([
                    new KeyValuePair(
                        this.valueFactory.createString('my_first_key'),
                        this.valueFactory.createString('my first element')
                    ),
                    new KeyValuePair(
                        this.valueFactory.createString('my_second_key'),
                        this.valueFactory.createString('my second element')
                    ),
                    new KeyValuePair(
                        this.valueFactory.createString('my_last_key'),
                        this.valueFactory.createString('my last element')
                    )
                ]),
                mappedArrayValue;
            this.arrayReference.getValue.returns(arrayValue);

            mappedArrayValue = this.array_map(this.callbackReference, this.arrayReference);

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

            expect(function () {
                this.array_map(this.callbackReference, this.arrayReference, arrayReference2);
            }.bind(this)).to.throw('array_map() :: Multiple input arrays are not yet supported');
        });
    });

    describe('for an empty array', function () {
        it('should return an empty array', function () {
            var result;
            this.arrayReference.getValue.returns(this.valueFactory.createArray([]));

            result = this.array_map(this.callbackReference, this.arrayReference);

            expect(result.getType()).to.equal('array');
            expect(result.getNative()).to.deep.equal([]);
        });
    });
});
