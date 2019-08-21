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
    optionsAndInfoFunctionFactory = require('../../../../../../src/builtin/functions/optionsAndInfo/config'),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "get_cfg_var" builtin function', function () {
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
        this.get_cfg_var = this.optionsAndInfoFunctions.get_cfg_var;
    });

    it('should return the fake Uniter php.ini path for "cfg_file_path"', function () {
        var resultValue = this.get_cfg_var(this.valueFactory.createString('cfg_file_path'));

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('/pseudo/uniter/php.ini');
    });

    it('should throw an error for an unsupported option name', function () {
        expect(function () {
            this.get_cfg_var(this.valueFactory.createString('my_unsupported_option'));
        }.bind(this)).to.throw(
            'Cannot fetch option "my_unsupported_option" - only cfg_file_path config option is currently supported'
        );
    });
});
