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
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "preg_match_all" basic-level builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getConstant = sinon.stub();
        this.valueFactory = new ValueFactory();

        this.getConstant.withArgs('PREG_OFFSET_CAPTURE').returns(256);
        this.getConstant.withArgs('PREG_PATTERN_ORDER').returns(1);
        this.getConstant.withArgs('PREG_SET_ORDER').returns(2);

        this.preg_match_all = basicSupportExtension({
            callStack: this.callStack,
            getConstant: this.getConstant,
            valueFactory: this.valueFactory
        }).preg_match_all;
    });

    describe('on a successful match', function () {
        it('should return the number of matches', function () {
            var result = this.preg_match_all(
                this.valueFactory.createString('/hel{2}o/'),
                this.valueFactory.createString('hello hello hello')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(3);
        });

        it('should populate the matches variable when using implied PREG_PATTERN_ORDER', function () {
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match_all(
                this.valueFactory.createString('/h(el{2})o/'),
                this.valueFactory.createString('hello there, hello'),
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
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match_all(
                this.valueFactory.createString('/./u'),
                this.valueFactory.createString('こんにちは世界'), // "hello world" in Japanese
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
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match_all(
                this.valueFactory.createString('/h(el{2})o/'),
                this.valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                this.valueFactory.createInteger(256) // PREG_OFFSET_CAPTURE
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
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match_all(
                this.valueFactory.createString('/h(el{2})o/'),
                this.valueFactory.createString('well hello there, hello!'),
                matchesVariable,
                this.valueFactory.createInteger(256 | 2) // PREG_OFFSET_CAPTURE
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
            var result = this.preg_match_all(
                this.valueFactory.createString('/regexp?/'),
                this.valueFactory.createString('this will not match')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', function () {
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match_all(
                this.valueFactory.createString('/regexp?/'),
                this.valueFactory.createString('this will not match'),
                matchesVariable
            );

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([]);
        });
    });

    describe('when not enough args are given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_match_all(
                    this.valueFactory.createString('/only a regex is given/')
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all() expects at least 2 parameters, 1 given'
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when a non-string pattern is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                this.preg_match_all(
                    this.valueFactory.createInteger(1001),
                    this.valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }.bind(this)).to.throw('preg_match_all(): Non-string pattern not yet supported');
        });
    });

    describe('when a non-string subject is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                this.preg_match_all(
                    this.valueFactory.createString('/my pattern/'),
                    this.valueFactory.createInteger(1001),
                    sinon.createStubInstance(Variable)
                );
            }.bind(this)).to.throw('preg_match_all(): Non-string subject not yet supported');
        });
    });

    describe('when an invalid regex is given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_match_all(
                    this.valueFactory.createString('/? invalid regex/'),
                    this.valueFactory.createString('anything')
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'JS RegExp error: SyntaxError: Invalid regular expression: /? invalid regex/: Nothing to repeat'
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when no ending delimiter is given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_match_all(
                    this.valueFactory.createString('@invalid preg pattern'),
                    this.valueFactory.createString('anything')
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): No ending delimiter \'@\' found'
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when an unknown modifier is given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_match_all(
                    this.valueFactory.createString('/invalid preg modifier/a'),
                    this.valueFactory.createString('anything')
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Unknown modifier \'a\''
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        // NB: preg_match_all(...) always does a global match, preg_match(...) always does a single match

        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/invalid preg modifier/g'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));

            this.doCall = function () {
                this.resultValue = this.preg_match_all(this.patternReference, this.subjectReference);
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Unknown modifier \'g\''
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when invalid flags are given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.matchesReference = sinon.createStubInstance(Variable);
            this.flagsReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/some regex/'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));
            this.matchesReference.getValue.returns(this.valueFactory.createNull());
            this.flagsReference.getValue.returns(this.valueFactory.createInteger(8));

            this.doCall = function () {
                this.resultValue = this.preg_match_all(
                    this.patternReference,
                    this.subjectReference,
                    this.matchesReference,
                    this.flagsReference
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match_all(): Invalid flags specified'
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });
});
