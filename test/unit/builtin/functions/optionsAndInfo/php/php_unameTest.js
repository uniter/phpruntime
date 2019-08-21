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
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "php_uname" builtin function', function () {
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
        this.php_uname = this.optionsAndInfoFunctions.php_uname;

        this.modeReference = sinon.createStubInstance(Variable);

        this.args = [this.modeReference];

        this.callPHPUname = function () {
            return this.php_uname.apply(null, this.args);
        }.bind(this);
    });

    it('should return all modes together when no mode is specified', function () {
        var resultValue;
        this.args.length = 0;

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('Uniter localhost 1.0.0 (Generic) JavaScript');
    });

    it('should also return all modes together when "a" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('a');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('Uniter localhost 1.0.0 (Generic) JavaScript');
    });

    it('should return only the operating system name when "s" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('s');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('Uniter');
    });

    it('should return only the host name when "n" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('n');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('localhost');
    });

    it('should return only the OS release name when "r" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('r');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('1.0.0');
    });

    it('should return only the version info when "v" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('v');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('(Generic)');
    });

    it('should return only the machine type when "m" mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('m');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('JavaScript');
    });

    it('should also return all modes together when an invalid mode is specified', function () {
        var resultValue;
        this.modeValue = this.valueFactory.createString('x');
        this.modeReference.getValue.returns(this.modeValue);

        resultValue = this.callPHPUname();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('Uniter localhost 1.0.0 (Generic) JavaScript');
    });
});
