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

describe('PHP "preg_replace" basic-level builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.getConstant = sinon.stub();
        this.valueFactory = new ValueFactory();

        this.getConstant.withArgs('PREG_OFFSET_CAPTURE').returns(256);
        this.getConstant.withArgs('PREG_PATTERN_ORDER').returns(1);
        this.getConstant.withArgs('PREG_SET_ORDER').returns(2);

        this.preg_replace = basicSupportExtension({
            callStack: this.callStack,
            getConstant: this.getConstant,
            valueFactory: this.valueFactory
        }).preg_replace;
    });

    describe('on a successful replacement of a single pattern for a single subject', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.replacementReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/hel{2}o/'));
            this.replacementReference.getValue.returns(this.valueFactory.createString('goodbye'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('well hello!'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(
                    this.patternReference,
                    this.replacementReference,
                    this.subjectReference
                );
            }.bind(this);
        });

        it('should return the resulting string', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('string');
            expect(this.resultValue.getNative()).to.equal('well goodbye!');
        });

        it('should not raise any warnings', function () {
            this.doCall();

            expect(this.callStack.raiseError).not.to.have.been.called;
        });

        it('should populate the count variable if specified', function () {
            var countVariable = new Variable(this.callStack, this.valueFactory, 'count'),
                limitReference = sinon.createStubInstance(Variable);
            limitReference.getValue.returns(this.valueFactory.createInteger(-1));

            this.preg_replace(
                this.patternReference,
                this.replacementReference,
                this.subjectReference,
                limitReference,
                countVariable
            );

            expect(countVariable.getValue().getType()).to.equal('int');
            expect(countVariable.getValue().getNative()).to.equal(1);
        });
    });

    describe('when not enough args are given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/hel{2}o/'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(this.patternReference);
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace() expects at least 3 parameters, 1 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });

    describe('when a non-string pattern is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                this.preg_replace(
                    this.valueFactory.createInteger(1001),
                    this.valueFactory.createString('my replacement'),
                    this.valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }.bind(this)).to.throw('preg_replace(): Non-array/string pattern not yet supported');
        });
    });

    describe('when a non-string replacement is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                this.preg_replace(
                    this.valueFactory.createString('/my pattern/'),
                    this.valueFactory.createInteger(1001),
                    this.valueFactory.createString('my subject'),
                    sinon.createStubInstance(Variable)
                );
            }.bind(this)).to.throw('preg_replace(): Non-array/string replacement not yet supported');
        });
    });

    describe('when a non-string subject is given', function () {
        it('should throw an error (coercion not yet supported here)', function () {
            expect(function () {
                this.preg_replace(
                    this.valueFactory.createString('/my pattern/'),
                    this.valueFactory.createString('my replacement'),
                    this.valueFactory.createInteger(1001),
                    sinon.createStubInstance(Variable)
                );
            }.bind(this)).to.throw('preg_replace(): Non-array/string subject not yet supported');
        });
    });

    describe('when an invalid regex is given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.replacementReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/? invalid regex/'));
            this.replacementReference.getValue.returns(this.valueFactory.createString('some replacement'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(
                    this.patternReference,
                    this.replacementReference,
                    this.subjectReference
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"/? invalid regex/" may be a valid but unsupported PCRE regex. ' +
                'JS RegExp error: SyntaxError: Invalid regular expression: /? invalid regex/: Nothing to repeat'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });

    describe('when no ending delimiter is given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.replacementReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('@invalid preg pattern'));
            this.replacementReference.getValue.returns(this.valueFactory.createString('some replacement'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(
                    this.patternReference,
                    this.replacementReference,
                    this.subjectReference
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): No ending delimiter \'@\' found'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });

    describe('when an unknown modifier is given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.replacementReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/invalid preg modifier/a'));
            this.replacementReference.getValue.returns(this.valueFactory.createString('some replacement'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(
                    this.patternReference,
                    this.replacementReference,
                    this.subjectReference
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Unknown modifier \'a\''
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });

    describe('when the invalid, implicit global match modifier "g" is given', function () {
        beforeEach(function () {
            this.patternReference = sinon.createStubInstance(Variable);
            this.replacementReference = sinon.createStubInstance(Variable);
            this.subjectReference = sinon.createStubInstance(Variable);
            this.patternReference.getValue.returns(this.valueFactory.createString('/invalid preg modifier/g'));
            this.replacementReference.getValue.returns(this.valueFactory.createString('some replacement'));
            this.subjectReference.getValue.returns(this.valueFactory.createString('some subject'));

            this.doCall = function () {
                this.resultValue = this.preg_replace(
                    this.patternReference,
                    this.replacementReference,
                    this.subjectReference
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_replace(): Unknown modifier \'g\''
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });
});
