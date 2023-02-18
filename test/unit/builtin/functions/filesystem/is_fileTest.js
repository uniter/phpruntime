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
    filesystemFunctionFactory = require('../../../../../src/builtin/functions/filesystem'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Exception = phpCommon.Exception,
    OptionSet = require('phpcore/src/OptionSet');

describe('PHP "is_file" builtin function', function () {
    var callFactory,
        callStack,
        fileSystem,
        is_file,
        optionSet,
        pathVariable,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        fileSystem = {
            isDirectory: sinon.stub(),
            isFile: sinon.stub()
        };
        optionSet = sinon.createStubInstance(OptionSet);
        optionSet.getOption
            .withArgs('fileSystem')
            .returns(fileSystem);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack,
            'option_set': optionSet
        }, {}, [
            {
                functionGroups: [
                    filesystemFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        is_file = state.getFunction('is_file');

        pathVariable = variableFactory.createVariable('myPath');
        pathVariable.setValue(valueFactory.createString('/my/path'));
    });

    it('should return true when a file exists with the given path', async function () {
        var result;
        fileSystem.isDirectory.withArgs('/my/path').returns(false);
        fileSystem.isDirectory.returns(false);
        fileSystem.isFile.withArgs('/my/path').returns(true);
        fileSystem.isFile.returns(false);

        result = await is_file(pathVariable).toPromise();

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.true;
    });

    it('should return false when no file but a directory exists with the given path', async function () {
        var result;
        fileSystem.isDirectory.withArgs('/my/path').returns(true);
        fileSystem.isDirectory.returns(false);
        fileSystem.isFile.withArgs('/my/path').returns(false);
        fileSystem.isFile.returns(false);

        result = await is_file(pathVariable).toPromise();

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.false;
    });

    it('should return false when no file or directory exists with the given path', async function () {
        var result;
        fileSystem.isDirectory.returns(false);
        fileSystem.isFile.returns(false);

        result = await is_file(pathVariable).toPromise();

        expect(result.getType()).to.equal('boolean');
        expect(result.getNative()).to.be.false;
    });

    it('should raise an error when no "fileSystem" option is configured', async function () {
        optionSet.getOption.withArgs('fileSystem').returns(null);

        await expect(is_file(pathVariable).toPromise())
            .to.eventually.be.rejectedWith(
                Exception,
                'filesystem :: No `fileSystem` option is configured'
            );
    });
});
