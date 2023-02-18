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
    basicSupportFunctionFactory = require('../../../../../../src/builtin/functions/pcre/basicSupport'),
    pcreConstantFactory = require('../../../../../../src/builtin/constants/pcre'),
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError;

describe('PHP "preg_replace" basic-level builtin function', function () {
    var callFactory,
        callStack,
        preg_replace,
        state,
        valueFactory,
        variableFactory,
        PREG_OFFSET_CAPTURE;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                constantGroups: [
                    pcreConstantFactory
                ],
                functionGroups: [
                    basicSupportFunctionFactory
                ]
            }
        ]);
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');
        PREG_OFFSET_CAPTURE = state.getConstantValue('PREG_OFFSET_CAPTURE');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        preg_replace = state.getFunction('preg_replace');
    });

    describe('on a successful replacement of a single pattern for a single subject', function () {
        var doCall,
            patternVariable,
            replacementVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            replacementVariable = variableFactory.createVariable('myReplacement');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/hel{2}o/'));
            replacementVariable.setValue(valueFactory.createString('goodbye'));
            subjectVariable.setValue(valueFactory.createString('well hello!'));

            doCall = async function () {
                resultValue = await preg_replace(
                    patternVariable,
                    replacementVariable,
                    subjectVariable
                ).toPromise();
            };
        });

        it('should return the resulting string', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('well goodbye!');
        });

        it('should not raise any warnings', async function () {
            await doCall();

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should populate the count variable if specified', async function () {
            var countVariable = variableFactory.createVariable('myCount'),
                limitReference = variableFactory.createVariable('myLimit');
            limitReference.setValue(valueFactory.createInteger(-1));

            await preg_replace(
                patternVariable,
                replacementVariable,
                subjectVariable,
                limitReference,
                countVariable
            ).toPromise();

            expect(countVariable.getValue().getType()).to.equal('int');
            expect(countVariable.getValue().getNative()).to.equal(1);
        });
    });

    describe('when an invalid regex is given', function () {
        var doCall,
            patternVariable,
            replacementVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            replacementVariable = variableFactory.createVariable('myReplacement');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/? invalid regex/'));
            replacementVariable.setValue(valueFactory.createString('some replacement'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_replace(
                    patternVariable,
                    replacementVariable,
                    subjectVariable
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_replace(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'PCREmu error: Error: Parser.parse() :: No match'
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when no ending delimiter is given', function () {
        var doCall,
            patternVariable,
            replacementVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            replacementVariable = variableFactory.createVariable('myReplacement');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('@invalid preg pattern'));
            replacementVariable.setValue(valueFactory.createString('some replacement'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_replace(
                    patternVariable,
                    replacementVariable,
                    subjectVariable
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_replace(): No ending delimiter \'@\' found'
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when an unknown modifier is given', function () {
        var doCall,
            patternVariable,
            replacementVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            replacementVariable = variableFactory.createVariable('myReplacement');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/invalid preg modifier/a'));
            replacementVariable.setValue(valueFactory.createString('some replacement'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_replace(
                    patternVariable,
                    replacementVariable,
                    subjectVariable
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_replace(): Unknown modifier \'a\''
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        var doCall,
            patternVariable,
            replacementVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            replacementVariable = variableFactory.createVariable('myReplacement');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/invalid preg modifier/g'));
            replacementVariable.setValue(valueFactory.createString('some replacement'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_replace(
                    patternVariable,
                    replacementVariable,
                    subjectVariable
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_replace(): Unknown modifier \'g\''
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
