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

        sprintf = state.getFunction('sprintf');

        templateVariable = variableFactory.createVariable('myTemplate');
        templateVariable.setValue(valueFactory.createString('my %s string'));
    });

    it('should return a string with the result from the formatter when it returns one', async function () {
        var argVariable = variableFactory.createVariable('myArg'),
            resultValue;
        argVariable.setValue(valueFactory.createString('formatted'));
        formatter.format
            .withArgs('my %s string', [sinon.match.same(argVariable)])
            .returns('my formatted string');

        resultValue = await sprintf(templateVariable, argVariable).toPromise();

        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('my formatted string');
    });

    describe('when the formatter throws a MissingFormatArgumentException', function () {
        it('should raise a warning', async function () {
            formatter.format.throws(new MissingFormatArgumentException(27));

            await sprintf(templateVariable).toPromise();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'sprintf(): Too few arguments'
            );
        });

        it('should return boolean false', async function () {
            var resultValue;
            formatter.format.throws(new MissingFormatArgumentException(27));

            resultValue = await sprintf(templateVariable).toPromise();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
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
