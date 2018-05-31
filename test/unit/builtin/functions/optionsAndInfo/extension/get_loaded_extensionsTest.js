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
    optionsAndInfoFunctionFactory = require('../../../../../../src/builtin/functions/optionsAndInfo/extension'),
    ArrayValue = require('phpcore/src/Value/Array').sync(),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "get_loaded_extensions" builtin function', function () {
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
        this.get_loaded_extensions = this.optionsAndInfoFunctions.get_loaded_extensions;

        this.args = [];

        this.callGetLoadedExtensions = function () {
            return this.get_loaded_extensions.apply(null, this.args);
        }.bind(this);
    });

    it('should return an empty array for now', function () {
        var resultValue;
        this.args.length = 0;

        resultValue = this.callGetLoadedExtensions();

        expect(resultValue).to.be.an.instanceOf(ArrayValue);
        expect(resultValue.getLength()).to.equal(0);
    });
});
