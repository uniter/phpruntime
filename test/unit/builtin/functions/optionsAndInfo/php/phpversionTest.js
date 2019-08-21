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
    optionsAndInfoFunctionFactory = require('../../../../../../src/builtin/functions/optionsAndInfo/php'),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "phpversion" builtin function', function () {
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
        this.phpversion = this.optionsAndInfoFunctions.phpversion;
    });

    it('should return the correct string when no extension is specified', function () {
        var resultValue = this.phpversion();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('5.4.0');
    });

    it('should return false for now when any extension is specified', function () {
        var extensionNameReference = sinon.createStubInstance(Variable),
            resultValue;
        extensionNameReference.getValue.returns(this.valueFactory.createString('any_ext'));

        resultValue = this.phpversion(extensionNameReference);

        expect(resultValue.getType()).to.equal('boolean');
        expect(resultValue.getNative()).to.be.false;
    });
});
