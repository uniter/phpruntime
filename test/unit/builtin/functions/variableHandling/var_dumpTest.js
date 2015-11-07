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
    repeatString = function (string, times) {
        return new Array(times + 1).join(string);
    },
    sinon = require('sinon'),
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack'),
    Stream = require('phpcore/src/Stream'),
    Value = require('phpcore/src/Value').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "var_dump" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.stdout = sinon.createStubInstance(Stream);
        this.stdoutContents = '';
        this.stdout.write.restore();
        sinon.stub(this.stdout, 'write', function (data) {
            this.stdoutContents += data;
        }.bind(this));
        this.internals = {
            callStack: this.callStack,
            stdout: this.stdout,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.var_dump = this.variableHandlingFunctions.var_dump;

        this.valueReference = sinon.createStubInstance(Value);
        this.variableReference = sinon.createStubInstance(Variable);
        this.variableReference.getValue.returns(this.valueReference);

        this.callVardump = function () {
            return this.var_dump(this.variableReference);
        }.bind(this);
    });

    it('should write NULL to stdout when value is null', function () {
        this.valueReference.getType.returns('null');

        this.callVardump();

        expect(this.stdoutContents).to.equal('NULL\n');
    });

    it('should limit the length of dumped strings to 2048 characters', function () {
        this.valueReference.getType.returns('string');
        this.valueReference.getNative.returns(repeatString('a', 2060));

        this.callVardump();

        expect(this.stdoutContents).to.equal('string(2060) "' + repeatString('a', 2048) + '..."\n');
    });
});
