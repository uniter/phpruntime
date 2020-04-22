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
    arrayFunctionFactory = require('../../../../../src/builtin/functions/array'),
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "sizeof" builtin function', function () {
    var arrayFunctions,
        callStack,
        internals,
        valueFactory;
    
    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = new ValueFactory();
        internals = {
            callStack: callStack,
            valueFactory: valueFactory
        };
        arrayFunctions = arrayFunctionFactory(internals);
    });

    it('should be defined as an alias of "count"', function () {
        expect(arrayFunctions.sizeof).to.equal('count');
    });
});
