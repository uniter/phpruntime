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

describe('PHP "preg_match_all" basic-level builtin function', function () {
    var callFactory,
        callStack,
        preg_match_all,
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

        preg_match_all = state.getFunction('preg_match_all');
    });

    describe('on a successful match', function () {
        it('should return the number of matches', async function () {
            var result = await preg_match_all(
                valueFactory.createString('/hel{2}o/'),
                valueFactory.createString('hello hello hello')
            ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(3);
        });

        it('should populate the matches variable when using implied PREG_PATTERN_ORDER', async function () {
            var matchesVariable = variableFactory.createVariable('matches');

            await preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('hello there, hello'),
                matchesVariable
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                [
                    'hello',
                    'hello'
                ],
                [
                    'ell',
                    'ell'
                ]
            ]);
        });

        it('should populate the matches variable for a unicode string given /u[tf8] modifier (with implied PREG_PATTERN_ORDER)', async function () {
            var matchesVariable = variableFactory.createVariable('matches');

            await preg_match_all(
                valueFactory.createString('/./u'),
                valueFactory.createString('こんにちは世界'), // "hello world" in Japanese.
                matchesVariable
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                [
                    'こ',
                    'ん',
                    'に',
                    'ち',
                    'は',
                    '世',
                    '界'
                ]
            ]);
        });

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified (with implied PREG_PATTERN_ORDER)', async function () {
            var matchesVariable = variableFactory.createVariable('matches');

            await preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                PREG_OFFSET_CAPTURE
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                [
                    [
                        'hello',
                        5
                    ],
                    [
                        'hello',
                        18
                    ],
                ],
                [
                    [
                        'ell',
                        6
                    ],
                    [
                        'ell',
                        19
                    ]
                ]
            ]);
        });

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified with explicit PREG_SET_ORDER', async function () {
            /*jshint bitwise: false */
            var matchesVariable = variableFactory.createVariable('matches');

            await preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                valueFactory.createInteger(256 | 2) // PREG_OFFSET_CAPTURE
            ).toPromise();

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                [
                    [
                        'hello',
                        5
                    ],
                    [
                        'ell',
                        6
                    ]
                ],
                [
                    [
                        'hello',
                        18
                    ],
                    [
                        'ell',
                        19
                    ]
                ]
            ]);
        });
    });

    describe('on a failed match', function () {
        it('should return 0', async function () {
            var result = await preg_match_all(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match')
            ).toPromise();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', async function () {
            var matchesVariable = variableFactory.createVariable('matches');

            await preg_match_all(
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
                resultValue = await preg_match_all(
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
                'preg_match_all(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
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
                resultValue = await preg_match_all(
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
                'preg_match_all(): No ending delimiter \'@\' found'
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
                resultValue = await preg_match_all(
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
                'preg_match_all(): Unknown modifier \'a\''
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        var doCall,
            patternVariable,
            resultValue,
            subjectVariable;

        // NB: preg_match_all(...) always does a global match, preg_match(...) always does a single match.

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            subjectVariable = variableFactory.createVariable('mySubject');
            patternVariable.setValue(valueFactory.createString('/invalid preg modifier/g'));
            subjectVariable.setValue(valueFactory.createString('some subject'));

            doCall = async function () {
                resultValue = await preg_match_all(patternVariable, subjectVariable).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match_all(): Unknown modifier \'g\''
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when invalid flags are given', function () {
        var doCall,
            flagsReference,
            matchesVariable,
            patternVariable,
            resultValue,
            subjectVariable;

        beforeEach(function () {
            patternVariable = variableFactory.createVariable('myPattern');
            subjectVariable = variableFactory.createVariable('mySubject');
            matchesVariable = variableFactory.createVariable('myMatches');
            flagsReference = variableFactory.createVariable('myFlags');
            patternVariable.setValue(valueFactory.createString('/some regex/'));
            subjectVariable.setValue(valueFactory.createString('some subject'));
            matchesVariable.setValue(valueFactory.createNull());
            flagsReference.setValue(valueFactory.createInteger(8));

            doCall = async function () {
                resultValue = await preg_match_all(
                    patternVariable,
                    subjectVariable,
                    matchesVariable,
                    flagsReference
                ).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'preg_match_all(): Invalid flags specified'
            );
        });

        it('should return false', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
