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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    stringBindingFactory = require('../../../../../src/builtin/bindings/string'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Formatter = require('../../../../../src/builtin/bindings/string/Formatter'),
    MissingFormatArgumentException = require('../../../../../src/builtin/bindings/string/Exception/MissingFormatArgumentException'),
    PHPError = phpCommon.PHPError;

describe('PHP "sprintf" builtin function', function () {
    var callStack,
        formatter,
        state,
        sprintf,
        templateVariable,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        formatter = sinon.createStubInstance(Formatter);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                bindingGroups: [
                    stringBindingFactory,

                    function () {
                        return {
                            // Override and stub the "stringFormatter" binding for this test.
                            stringFormatter: function () {
                                return formatter;
                            }
                        };
                    }
                ],
                functionGroups: [
                    stringFunctionFactory
                ]
            }
        ]);
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        callStack.raiseTranslatedError
            .withArgs(PHPError.E_ERROR)
            .callsFake(function (level, translationKey, placeholderVariables) {
                throw new Error(
                    'Fake PHP ' + level + ' for #' + translationKey + ' with ' + JSON.stringify(placeholderVariables || {})
                );
            });

        sprintf = state.getFunction('sprintf');

        templateVariable = variableFactory.createVariable('myTemplate');
        templateVariable.setValue(valueFactory.createString('my %s string'));
    });

    it('should return a string with the result from the formatter when it returns one', async function () {
        var argValue = valueFactory.createString('formatted'),
            argVariable = variableFactory.createVariable('myArg'),
            resultValue;
        argVariable.setValue(argValue);
        formatter.format
            .withArgs('my %s string', [sinon.match.same(argValue)])
            .returns('my formatted string');

        resultValue = await sprintf(templateVariable, argVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('my formatted string');
    });

    describe('when the formatter throws a MissingFormatArgumentException', function () {
        it('should raise an ArgumentCountError', async function () {
            formatter.format.throws(new MissingFormatArgumentException(27, 30));

            await expect(sprintf(templateVariable).toPromise())
                .to.eventually.be.rejectedWith(
                    'Fake PHP Fatal error for #core.arguments_missing with {"required":31,"given":28}'
                );
        });
    });

    describe('when the formatter throws a different type of error', function () {
        it('should not catch the error', async function () {
            formatter.format.throws(new Error('Bang!'));

            await expect(sprintf(templateVariable).toPromise())
                .to.eventually.be.rejectedWith('Bang!');
        });
    });
});
