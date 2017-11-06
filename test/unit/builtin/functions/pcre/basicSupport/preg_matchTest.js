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
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.preg_match = basicSupportExtension({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).preg_match;
    });

    describe('on a successful match', function () {
        it('should return 1', function () {
            var result = this.preg_match(
                this.valueFactory.createString('/hel{2}o/'),
                this.valueFactory.createString('hello')
            );

            expect(result.getType()).to.equal('integer');
            expect(result.getNative()).to.equal(1);
        });

        it('should populate the matches variable', function () {
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match(
                this.valueFactory.createString('/h(el{2})o/'),
                this.valueFactory.createString('hello'),
                matchesVariable
            );

            expect(matchesVariable.getValue().getType()).to.equal('array');
            expect(matchesVariable.getValue().getNative()).to.deep.equal([
                'hello',
                'ell'
            ]);
        });

        it('should throw an error when PREG_OFFSET_CAPTURE is specified (not yet supported)', function () {
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            expect(function () {
                this.preg_match(
                    this.valueFactory.createString('/h(el{2})o/'),
                    this.valueFactory.createString('hello'),
                    matchesVariable,
                    this.valueFactory.createInteger(256)
                );
            }.bind(this)).to.throw('preg_match() - flags arg not yet supported');
        });
    });

    describe('on a failed match', function () {
        it('should return 0', function () {
            var result = this.preg_match(
                this.valueFactory.createString('/regexp?/'),
                this.valueFactory.createString('this will not match')
            );

            expect(result.getType()).to.equal('integer');
            expect(result.getNative()).to.equal(0);
        });

        it('should populate the matches variable with an empty array', function () {
            var matchesVariable = new Variable(this.callStack, this.valueFactory, 'matches');

            this.preg_match(
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
                this.resultValue = this.preg_match(
                    this.valueFactory.createString('/only a regex is given/')
                );
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_match() expects at least 2 parameters, 1 given'
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });

    describe('when an invalid regex is given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_match(
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
                'preg_match(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                'this may be a valid but unsupported PCRE regex. ' +
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
                this.resultValue = this.preg_match(
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
                'preg_match(): No ending delimiter \'@\' found'
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
                this.resultValue = this.preg_match(
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
                'preg_match(): Unknown modifier \'a\''
            );
        });

        it('should return false', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('boolean');
            expect(this.resultValue.getNative()).to.be.false;
        });
    });
});
