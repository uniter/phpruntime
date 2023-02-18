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
    errorHandlingFunctionFactory = require('../../../../../src/builtin/functions/errorHandling'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    ErrorConfiguration = require('phpcore/src/Error/ErrorConfiguration');

describe('PHP "error_reporting" builtin function', function () {
    var callFactory,
        callStack,
        error_reporting,
        errorConfiguration,
        levelVariable,
        state,
        valueFactory,
        variableFactory,

        E_USER_DEPRECATED,
        E_USER_ERROR,
        E_USER_NOTICE,
        E_USER_WARNING;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        errorConfiguration = sinon.createStubInstance(ErrorConfiguration);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack,
            'error_configuration': errorConfiguration
        }, {}, [
            {
                functionGroups: [
                    errorHandlingFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');
        E_USER_DEPRECATED = state.getConstantValue('E_USER_DEPRECATED');
        E_USER_ERROR = state.getConstantValue('E_USER_ERROR');
        E_USER_NOTICE = state.getConstantValue('E_USER_NOTICE');
        E_USER_WARNING = state.getConstantValue('E_USER_WARNING');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        errorConfiguration.getErrorReportingLevel.returns(9999);
        errorConfiguration.setErrorReportingLevel.callsFake(function (level) {
            errorConfiguration.getErrorReportingLevel.returns(level);
        });

        error_reporting = state.getFunction('error_reporting');

        levelVariable = variableFactory.createVariable('myLevel');
    });

    describe('when a new level is given as an integer', function () {
        beforeEach(function () {
            levelVariable.setValue(valueFactory.createInteger(1234));
        });

        it('should set the error reporting level', async function () {
            await error_reporting(levelVariable).toPromise();

            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledWith(1234);
        });

        it('should return the old level', async function () {
            var result = await error_reporting(levelVariable).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when a new level is given as a string', function () {
        beforeEach(function () {
            levelVariable.setValue(valueFactory.createString('4321 & random text'));
        });

        it('should set the error reporting level to the given string value', async function () {
            await error_reporting(levelVariable).toPromise();

            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledWith('4321 & random text');
        });

        it('should return the old level', async function () {
            var result = await error_reporting(levelVariable).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when no level is given', function () {
        it('should return the current level', async function () {
            var result = await error_reporting().toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });
});
