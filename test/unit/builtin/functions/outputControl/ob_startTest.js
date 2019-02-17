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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    outputControlFunctionFactory = require('../../../../../src/builtin/functions/outputControl'),
    CallStack = require('phpcore/src/CallStack'),
    Class = require('phpcore/src/Class').sync(),
    Exception = phpCommon.Exception,
    Output = require('phpcore/src/Output/Output'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "ob_start" builtin function', function () {
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
        this.ob_start = this.outputControlFunctions.ob_start;
    });

    describe('when no arguments are given', function () {
        it('should push a buffer onto the stack', function () {
            this.ob_start();

            expect(this.output.pushBuffer).to.have.been.calledOnce;
        });
    });

    describe('when a callback argument is given', function () {
        it('should throw an exception as there is no support for now', function () {
            var classObject = sinon.createStubInstance(Class);

            expect(function () {
                this.ob_start(this.valueFactory.createObject({}, classObject));
            }.bind(this)).to.throw(Exception, 'ob_start() :: No arguments are supported yet');
        });
    });
});
