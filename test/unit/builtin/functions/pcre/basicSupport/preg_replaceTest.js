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

describe('PHP "preg_replace" basic-level builtin function', function () {
    var callStack,
        getConstant,
        preg_replace,
        valueFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        getConstant = sinon.stub();
        valueFactory = tools.createIsolatedState().getValueFactory();

        getConstant.withArgs('PREG_OFFSET_CAPTURE').returns(256);
        getConstant.withArgs('PREG_PATTERN_ORDER').returns(1);
        getConstant.withArgs('PREG_SET_ORDER').returns(2);

        preg_replace = basicSupportExtension({
            callStack: callStack,
            getConstant: getConstant,
            valueFactory: valueFactory
        }).preg_replace;
    });

    describe('on a successful replacement of a single pattern for a single subject', function () {
        var doCall,
            patternReference,
            replacementReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            replacementReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/hel{2}o/'));
            replacementReference.getValue.returns(valueFactory.createString('goodbye'));
            subjectReference.getValue.returns(valueFactory.createString('well hello!'));

            doCall = function () {
                resultValue = preg_replace(
                    patternReference,
                    replacementReference,
                    subjectReference
                );
            };
        });

        it('should return the resulting string', function () {
            doCall();

            expect(resultValue.getType()).to.equal('string');
            expect(resultValue.getNative()).to.equal('well goodbye!');
        });

        it('should not raise any warnings', function () {
            doCall();

            expect(callStack.raiseError).not.to.have.been.called;
        });

        it('should populate the count variable if specified', function () {
            var countVariable = new Variable(callStack, valueFactory, 'count'),
                limitReference = sinon.createStubInstance(Variable);
            limitReference.getValue.returns(valueFactory.createInteger(-1));

            preg_replace(
                patternReference,
                replacementReference,
                subjectReference,
                limitReference,
                countVariable
            );

            expect(countVariable.getValue().getType()).to.equal('int');
            expect(countVariable.getValue().getNative()).to.equal(1);
        });
    });

    describe('when not enough args are given', function () {
        var doCall,
            patternReference,
            resultValue;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/hel{2}o/'));

            doCall = function () {
                resultValue = preg_replace(patternReference);
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace() expects at least 3 parameters, 1 given'
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when a non-string pattern is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_replace(
                    valueFactory.createInteger(1001),
                    valueFactory.createString('my replacement'),
                    valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_replace(): Non-array/string pattern not yet supported');
        });
    });

    describe('when a non-string replacement is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_replace(
                    valueFactory.createString('/my pattern/'),
                    valueFactory.createInteger(1001),
                    valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_replace(): Non-array/string replacement not yet supported');
        });
    });

    describe('when a non-string subject is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                preg_replace(
                    valueFactory.createString('/my pattern/'),
                    valueFactory.createString('my replacement'),
                    valueFactory.createInteger(1001),
                    sinon.createStubInstance(Variable)
                );
            }).to.throw('preg_replace(): Non-array/string subject not yet supported');
        });
    });

    describe('when an invalid regex is given', function () {
        var doCall,
            patternReference,
            replacementReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            replacementReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/? invalid regex/'));
            replacementReference.getValue.returns(valueFactory.createString('some replacement'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_replace(
                    patternReference,
                    replacementReference,
                    subjectReference
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'JS RegExp error: SyntaxError: Invalid regular expression: /? invalid regex/: Nothing to repeat'
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when no ending delimiter is given', function () {
        var doCall,
            patternReference,
            replacementReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            replacementReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('@invalid preg pattern'));
            replacementReference.getValue.returns(valueFactory.createString('some replacement'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_replace(
                    patternReference,
                    replacementReference,
                    subjectReference
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): No ending delimiter \'@\' found'
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when an unknown modifier is given', function () {
        var doCall,
            patternReference,
            replacementReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            replacementReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/invalid preg modifier/a'));
            replacementReference.getValue.returns(valueFactory.createString('some replacement'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_replace(
                    patternReference,
                    replacementReference,
                    subjectReference
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Unknown modifier \'a\''
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        var doCall,
            patternReference,
            replacementReference,
            resultValue,
            subjectReference;

        beforeEach(function () {
            patternReference = sinon.createStubInstance(Variable);
            replacementReference = sinon.createStubInstance(Variable);
            subjectReference = sinon.createStubInstance(Variable);
            patternReference.getValue.returns(valueFactory.createString('/invalid preg modifier/g'));
            replacementReference.getValue.returns(valueFactory.createString('some replacement'));
            subjectReference.getValue.returns(valueFactory.createString('some subject'));

            doCall = function () {
                resultValue = preg_replace(
                    patternReference,
                    replacementReference,
                    subjectReference
                );
            };
        });

        it('should raise a warning', function () {
            doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Unknown modifier \'g\''
            );
        });

        it('should return null', function () {
            doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
