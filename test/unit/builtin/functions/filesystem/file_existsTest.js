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
    filesystemFunctionFactory = require('../../../../../src/builtin/functions/filesystem'),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    OptionSet = require('phpcore/src/OptionSet'),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "file_exists" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();
        this.optionSet = sinon.createStubInstance(OptionSet);
        this.fileSystem = {
            isDirectory: sinon.stub(),
            isFile: sinon.stub()
        };
        this.internals = {
            callStack: this.callStack,
            optionSet: this.optionSet,
            valueFactory: this.valueFactory
        };
        this.filesystemFunctions = filesystemFunctionFactory(this.internals);
        this.file_exists = this.filesystemFunctions.file_exists;

        this.optionSet.getOption.withArgs('fileSystem').returns(this.fileSystem);

        this.pathReference = sinon.createStubInstance(Variable);
        this.pathValue = this.valueFactory.createString('/my/path');
        this.pathReference.getValue.returns(this.pathValue);

        this.args = [this.pathReference];

        this.callFileExists = function () {
            return this.file_exists.apply(null, this.args);
        }.bind(this);
    });

    it('should return true when a file exists with the given path', function () {
        this.fileSystem.isDirectory.withArgs('/my/path').returns(false);
        this.fileSystem.isDirectory.returns(false);
        this.fileSystem.isFile.withArgs('/my/path').returns(true);
        this.fileSystem.isFile.returns(false);

        expect(this.callFileExists()).to.be.an.instanceOf(BooleanValue);
        expect(this.callFileExists().getNative()).to.be.true;
    });

    it('should return true when a directory exists with the given path', function () {
        this.fileSystem.isDirectory.withArgs('/my/path').returns(true);
        this.fileSystem.isDirectory.returns(false);
        this.fileSystem.isFile.withArgs('/my/path').returns(false);
        this.fileSystem.isFile.returns(false);

        expect(this.callFileExists()).to.be.an.instanceOf(BooleanValue);
        expect(this.callFileExists().getNative()).to.be.true;
    });

    it('should return false when no file or directory exists with the given path', function () {
        this.fileSystem.isDirectory.returns(false);
        this.fileSystem.isFile.returns(false);

        expect(this.callFileExists()).to.be.an.instanceOf(BooleanValue);
        expect(this.callFileExists().getNative()).to.be.false;
    });

    it('should raise an error when no parameters are given', function () {
        this.args.length = 0;

        this.callFileExists();

        expect(this.callStack.raiseError).to.have.been.calledOnce;
        expect(this.callStack.raiseError).to.have.been.calledWith(
            PHPError.E_WARNING,
            'file_exists() expects exactly 1 parameter, 0 given'
        );
    });

    it('should raise an error when no "fileSystem" option is configured', function () {
        this.optionSet.getOption.withArgs('fileSystem').returns(null);

        expect(function () {
            this.callFileExists();
        }.bind(this)).to.throw('filesystem :: No `fileSystem` option is configured');
    });
});
