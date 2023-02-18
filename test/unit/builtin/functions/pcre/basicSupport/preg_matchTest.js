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

describe('PHP "preg_match" basic-level builtin function', function () {
    var callFactory,
        callStack,
        preg_match,
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

        preg_match = state.getFunction('preg_match');
    });

    describe('on a successful match', function () {
        it('should return 1', async function () {
            var result = await preg_match(
                valueFactory.createString('/hel{2}o/'),
                valueFactory.createString('hello')
            ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1);
        });

        it('should populate the matches variable', async function () {
            var matchesVariable = variableFactory.createVariable('myMatches');

            await preg_match(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('hello'),
                matchesVariable
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                'hello',
                'ell'
            ]);
        });

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified', async function () {
            var matchesVariable = variableFactory.createVariable('myMatches');

            await preg_match(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello'),
                matchesVariable,
                PREG_OFFSET_CAPTURE
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                ['hello', 5],
                ['ell', 6]
            ]);
        });

        it('should ignore the study modifier "S"', async function () {
            var matchesVariable = variableFactory.createVariable('myMatches'),
                result = await preg_match(
                    valueFactory.createString('/h(el{2})o/S'),
                    valueFactory.createString('well hello'),
                    matchesVariable,
                    PREG_OFFSET_CAPTURE
                ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1);
            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                ['hello', 5],
                ['ell', 6]
            ]);
        });

        it('should support the extended modifier "x"', async function () {
            var matchesVariable = variableFactory.createVariable('myMatches'),
                result = await preg_match(
                    valueFactory.createString('/   h  (  e  # A line comment\n  l{2} )  o   \\     there   /x'),
                    valueFactory.createString('well hello there'),
                    matchesVariable,
                    PREG_OFFSET_CAPTURE
                ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1);
            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                ['hello there', 5],
                ['ell', 6]
            ]);
        });
    });

    describe('on a failed match', function () {
        it('should return 0', async function () {
            var result = await preg_match(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match')
            ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', async function () {
            var matchesVariable = variableFactory.createVariable('myMatches');

            await preg_match(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match'),
                matchesVariable
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([]);
        });
    });

    describe('when an invalid regex is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = async function () {
                resultValue = await preg_match(
                    valueFactory.createString('/? invalid regex/'),
                    valueFactory.createString('anything')
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'PCREmu error: Error: Parser.parse() :: No match'
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when no ending delimiter is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = async function () {
                resultValue = await preg_match(
                    valueFactory.createString('@invalid preg pattern'),
                    valueFactory.createString('anything')
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match(): No ending delimiter \'@\' found'
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when an unknown modifier is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = async function () {
                resultValue = await preg_match(
                    valueFactory.createString('/invalid preg modifier/a'),
                    valueFactory.createString('anything')
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match(): Unknown modifier \'a\''
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', async function () {
        var doCall,
            patternVariable,
            resultValue,
            subjectVariable;

        // NB: For a global match, preg_match_all(...) should be used.

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/invalid preg modifier/g'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_match(patternVariable, subjectVariable).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match(): Unknown modifier \'g\''
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
