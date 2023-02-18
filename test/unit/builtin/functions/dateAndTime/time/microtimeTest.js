/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var clockServiceFactory = require('../../../../../../src/builtin/services/clock'),
    dateAndTimeFunctionFactory = require('../../../../../../src/builtin/functions/dateAndTime/time'),
    expect = require('chai').expect,
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Exception = phpCommon.Exception;

describe('PHP "microtime" builtin function', function () {
    var callFactory,
        callStack,
        getAsFloatVariable,
        microtime,
        optionSet,
        performance,
        state,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        performance = {
            getTimeInMicroseconds: sinon.stub()
        };
        optionSet = {
            getOption: sinon.stub()
        };
        optionSet.getOption.withArgs('performance').returns(performance);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack,
            'option_set': optionSet
        }, {}, [
            {
                functionGroups: [
                    dateAndTimeFunctionFactory
                ],
                serviceGroups: [
                    clockServiceFactory
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

        microtime = state.getFunction('microtime');

        getAsFloatVariable = variableFactory.createVariable('myGetAsFloat');
    });

    it('should return the current seconds+us when $get_as_float = true', async function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);
        getAsFloatVariable.setValue(valueFactory.createBoolean(true));

        result = await microtime(getAsFloatVariable).toPromise();

        expect(result.getType()).to.equal('float');
        expect(result.getNative()).to.equal(123.456789);
    });

    it('should return a string with the current seconds and us when $get_as_float = false', async function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);
        getAsFloatVariable.setValue(valueFactory.createBoolean(false));

        result = await microtime(getAsFloatVariable).toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal('0.456789 123');
    });

    it('should return a string with the current seconds and us when $get_as_float is not provided', async function () {
        var result;
        performance.getTimeInMicroseconds.returns(123456789);

        result = await microtime().toPromise();

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal('0.456789 123');
    });

    describe('when no "performance" option is defined', function () {
        it('should throw an error', async function () {
            optionSet.getOption.withArgs('performance').returns(null);

            await expect(microtime().toPromise()).to.eventually.be.rejectedWith(
                Exception,
                'performance :: No `performance` option is configured'
            );
        });
    });
});
