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
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    CallStack = require('phpcore/src/CallStack'),
    Output = require('phpcore/src/Output/Output'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "ob_get_level" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.output = sinon.createStubInstance(Output);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            output: this.output,
            valueFactory: this.valueFactory
        };
        this.outputControlFunctions = outputControlFunctionFactory(this.internals);
        this.ob_get_level = this.outputControlFunctions.ob_get_level;
    });

    it('should return int(0) when no output buffering is enabled', function () {
        var resultValue;
        this.output.getDepth.returns(0);

        resultValue = this.ob_get_level();

        expect(resultValue.getType()).to.equal('int');
        expect(resultValue.getNative()).to.equal(0);
    });

    it('should return int(4) when 4 output buffers have been started', function () {
        var resultValue;
        this.output.getDepth.returns(4);

        resultValue = this.ob_get_level();

        expect(resultValue.getType()).to.equal('int');
        expect(resultValue.getNative()).to.equal(4);
    });
});
