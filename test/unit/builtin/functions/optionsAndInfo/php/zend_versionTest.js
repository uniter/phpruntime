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
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    StringValue = require('phpcore/src/Value/String').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "zend_version" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.valueFactory.createBoolean.restore();
        sinon.stub(this.valueFactory, 'createBoolean', function (native) {
            var value = sinon.createStubInstance(BooleanValue);
            value.getNative.returns(native);
            return value;
        });
        this.valueFactory.createInteger.restore();
        sinon.stub(this.valueFactory, 'createInteger', function (native) {
            var value = sinon.createStubInstance(IntegerValue);
            value.getNative.returns(native);
            return value;
        });
        this.valueFactory.createNull.restore();
        sinon.stub(this.valueFactory, 'createNull', function () {
            return sinon.createStubInstance(NullValue);
        });
        this.valueFactory.createString.restore();
        sinon.stub(this.valueFactory, 'createString', function (native) {
            var value = sinon.createStubInstance(StringValue);
            value.getNative.returns(native);
            return value;
        });
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
