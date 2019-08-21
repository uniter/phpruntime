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
    optionsAndInfoFunctionFactory = require('../../../../../../src/builtin/functions/optionsAndInfo/environment'),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "getenv" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        };
        this.optionsAndInfoFunctions = optionsAndInfoFunctionFactory(this.internals);
        this.getenv = this.optionsAndInfoFunctions.getenv;
    });

    it('should just return an empty array for now when trying to fetch all environment variables', function () {
        var resultValue = this.getenv();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getLength()).to.equal(0);
    });

    it('should just return false for now when trying to fetch any specific environment variable', function () {
        var resultValue,
            variableNameReference = sinon.createStubInstance(Variable);
        variableNameReference.getValue.returns(this.valueFactory.createString('MY_ENV_VAR'));

        resultValue = this.getenv(variableNameReference);

        expect(resultValue.getType()).to.equal('boolean');
        expect(resultValue.getNative()).to.be.false;
    });
});
