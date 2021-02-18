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

describe('PHP "preg_match" basic-level builtin function', function () {
    var callStack,
        getConstant,
        preg_match,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        getConstant = sinon.stub();
        valueFactory = new ValueFactory();

        getConstant.withArgs('PREG_OFFSET_CAPTURE').returns(256);
        getConstant.withArgs('PREG_PATTERN_ORDER').returns(1);
        getConstant.withArgs('PREG_SET_ORDER').returns(2);

        preg_match = basicSupportExtension({
            callStack: callStack,
            getConstant: getConstant,
            valueFactory: valueFactory
        }).preg_match;
    });

    describe('on a successful match', function () {
        it('should return 1', function () {
            var result = preg_match(
                valueFactory.createString('/hel{2}o/'),
                valueFactory.createString('hello')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1);
        });

        it('should populate the matches variable', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('hello'),
                matchesVariable
            );

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                'hello',
                'ell'
            ]);
        });

        it('should capture offsets when PREG_OFFSET_CAPTURE is specified', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match(
                valueFactory.createString('/h(el{2})o/'),
                valueFactory.createString('well hello'),
                matchesVariable,
                valueFactory.createInteger(256) // PREG_OFFSET_CAPTURE
            );

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                ['hello', 5],
                ['ell', 6]
            ]);
        });

        it('should ignore the study modifier "S"', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches'),
                result = preg_match(
                    valueFactory.createString('/h(el{2})o/S'),
                    valueFactory.createString('well hello'),
                    matchesVariable,
                    valueFactory.createInteger(256) // PREG_OFFSET_CAPTURE
                );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(1);
            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                ['hello', 5],
                ['ell', 6]
            ]);
        });
    });

    describe('on a failed match', function () {
        it('should return 0', function () {
            var result = preg_match(
                valueFactory.createString('/regexp?/'),
                valueFactory.createString('this will not match')
            );

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', function () {
            var matchesVariable = new Variable(callStack, valueFactory, 'matches');

            preg_match(
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
                resultValue = preg_match(
                    valueFactory.createString('/only a regex is given/')
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match() expects at least 2 parameters, 1 given'
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
                preg_match(
                    valueFactory.createInteger(1001),
                    valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_match(): Non-string pattern not yet supported');
        });
    });

    describe('when a non-string subject is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_match(
                    valueFactory.createString('/my pattern/'),
                    valueFactory.createInteger(1001),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_match(): Non-string subject not yet supported');
        });
    });

    describe('when an invalid regex is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = function () {
                resultValue = preg_match(
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
                'preg_match(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
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
                resultValue = preg_match(
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
                'preg_match(): No ending delimiter \'@\' found'
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
                resultValue = preg_match(
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
                'preg_match(): Unknown modifier \'a\''
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

        // NB: For a global match, preg_match_all(...) should be used

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/invalid preg modifier/g'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_match(patternReference, subjectReference);
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match(): Unknown modifier \'g\''
            );
        });

        it('should return false', function () {
            doCall();

            expect(resultValue.getType()).to.equal('boolean');
            expect(resultValue.getNative()).to.be.false;
        });
    });
});
