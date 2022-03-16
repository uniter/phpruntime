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
    basicSupportExtension = require('../../../../../../src/builtin/functions/pcre/basicSupport'),
    sinon = require('sinon'),
    tools = require('../../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "preg_match_all" basic-level builtin function', function () {
    var callStack,
        getConstant,
        preg_match_all,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        getConstant = sinon.stub();
        valueFactory = tools.createIsolatedState().getValueFactory();

        getConstant.withArgs('PREG_OFFSET_CAPTURE').returns(256);
        getConstant.withArgs('PREG_PATTERN_ORDER').returns(1);
        getConstant.withArgs('PREG_SET_ORDER').returns(2);

        preg_match_all = basicSupportExtension({
            callStack: callStack,
            getConstant: getConstant,
            valueFactory: valueFactory
        }).preg_match_all;
    });

    describe('on a successful match', function () {
        it('should return the number of matches', function () {
            var result = preg_match_all(
                valueFactory.createString('/hel{2}o/'),
                valueFactory.createString('hello hello hello')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(3);
        });

        it('should populate the matches variable when using implied PREG_PATTERN_ORDER', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('hello there, hello'),
                matchesVariable
            );

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

        it('should populate the matches variable for a unicode string given /u[tf8] modifier (with implied PREG_PATTERN_ORDER)', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match_all(
                valueFactory.createString('/./u'),
                valueFactory.createString('こんにちは世界'), // "hello world" in Japanese
                matchesVariable
            );

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

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified (with implied PREG_PATTERN_ORDER)', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                valueFactory.createInteger(256) // PREG_OFFSET_CAPTURE
            );

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

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified with explicit PREG_SET_ORDER', function () {
            /*jshint bitwise: false */
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match_all(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                valueFactory.createInteger(256 | 2) // PREG_OFFSET_CAPTURE
            );

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
        it('should return 0', function () {
            var result = preg_match_all(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match_all(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match'),
                matchesVariable
            );

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([]);
        });
    });

    describe('when not enough args are given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = preg_match_all(
                    valueFactory.createString('/only a regex is given/')
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all() expects at least 2 parameters, 1 given'
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when a non-string pattern is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_match_all(
                    valueFactory.createInteger(1001),
                    valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_match_all(): Non-string pattern not yet supported');
        });
    });

    describe('when a non-string subject is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_match_all(
                    valueFactory.createString('/my pattern/'),
                    valueFactory.createInteger(1001),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_match_all(): Non-string subject not yet supported');
        });
    });

    describe('when an invalid regex is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = preg_match_all(
                    valueFactory.createString('/? invalid regex/'),
                    valueFactory.createString('anything')
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'JS RegExp error: SyntaxError: Invalid regular expression: /? invalid regex/: Nothing to repeat'
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when no ending delimiter is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = preg_match_all(
                    valueFactory.createString('@invalid preg pattern'),
                    valueFactory.createString('anything')
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): No ending delimiter \'@\' found'
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when an unknown modifier is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = preg_match_all(
                    valueFactory.createString('/invalid preg modifier/a'),
                    valueFactory.createString('anything')
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Unknown modifier \'a\''
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        var doCall,
            patternReference,
            resultValue,
            subjectReference;

        // NB: preg_match_all(...) always does a global match, preg_match(...) always does a single match

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/invalid preg modifier/g'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_match_all(patternReference, subjectReference);
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Unknown modifier \'g\''
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });

    describe('when invalid flags are given', function () {
        var doCall,
            flagsReference,
            matchesReference,
            patternReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            matchesReference = sinon.createStubInstance(Variable);
            flagsReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/some regex/'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));
            matchesReference.getValue.returns(valueFactory.createNull());
            flagsReference.getValue.returns(valueFactory.createInteger(8));

            doCall = function () {
                resultValue = preg_match_all(
                    patternReference,
                    subjectReference,
                    matchesReference,
                    flagsReference
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Invalid flags specified'
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
