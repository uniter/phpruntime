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

describe('PHP "zend_version" builtin function', function () {
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
        this.zend_version = this.optionsAndInfoFunctions.zend_version;

        this.modeReference = sinon.createStubInstance(Variable);

        this.args = [this.modeReference];

        this.callZendVersion = function () {
            return this.zend_version.apply(null, this.args);
        }.bind(this);
    });

    it('should return the correct version string', function () {
        var resultValue;
        this.args.length = 0;

        resultValue = this.callZendVersion();

        expect(resultValue).to.be.an.instanceOf(StringValue);
        expect(resultValue.getNative()).to.equal('2.5.0');
    });
});
