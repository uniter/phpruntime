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
    sinon = require('sinon'),
    constantFunctionFactory = require('../../../../../../src/builtin/functions/misc/constant'),
    BooleanValue = require('phpcore/src/Value/Boolean').sync(),
    CallStack = require('phpcore/src/CallStack'),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "defined" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.globalNamespace = sinon.createStubInstance(Namespace);
        this.valueFactory = new ValueFactory();
        this.internals = {
            callStack: this.callStack,
            globalNamespace: this.globalNamespace,
            valueFactory: this.valueFactory
        };
        this.constantFunctions = constantFunctionFactory(this.internals);
        this.defined = this.constantFunctions.defined;

        this.nameReference = sinon.createStubInstance(Variable);

        this.args = [this.nameReference];

        this.callDefined = function () {
            return this.defined.apply(null, this.args);
        }.bind(this);
    });

    it('should detect a constant in the global namespace correctly', function () {
        var resultValue;
        this.nameValue = this.valueFactory.createString('MY_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.globalNamespace.hasConstant.withArgs('MY_CONST').returns(true);

        resultValue = this.callDefined();

        expect(resultValue).to.be.an.instanceOf(BooleanValue);
        expect(resultValue.getNative()).to.be.true;
    });

    it('should not detect an undefined constant in the global namespace correctly', function () {
        var resultValue;
        this.nameValue = this.valueFactory.createString('MY_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.globalNamespace.hasConstant.returns(false);

        resultValue = this.callDefined();

        expect(resultValue).to.be.an.instanceOf(BooleanValue);
        expect(resultValue.getNative()).to.be.false;
    });

    it('should detect a constant in a sub-namespace correctly', function () {
        var resultValue;
        this.nameValue = this.valueFactory.createString('My\\Sub\\Space\\A_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.subNamespace = sinon.createStubInstance(Namespace);
        this.globalNamespace.getDescendant.withArgs('My\\Sub\\Space').returns(this.subNamespace);
        this.subNamespace.hasConstant.withArgs('A_CONST').returns(true);

        resultValue = this.callDefined();

        expect(resultValue).to.be.an.instanceOf(BooleanValue);
        expect(resultValue.getNative()).to.be.true;
    });

    it('should not detect an undefined constant in a sub-namespace correctly', function () {
        var resultValue;
        this.nameValue = this.valueFactory.createString('My\\Sub\\Space\\A_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.subNamespace = sinon.createStubInstance(Namespace);
        this.globalNamespace.getDescendant.withArgs('My\\Sub\\Space').returns(this.subNamespace);
        this.subNamespace.hasConstant.returns(false);

        resultValue = this.callDefined();

        expect(resultValue).to.be.an.instanceOf(BooleanValue);
        expect(resultValue.getNative()).to.be.false;
    });

    describe('when no arguments are provided', function () {
        beforeEach(function () {
            this.args.length = 0;
        });

        it('should raise a warning', function () {
            this.callDefined();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'defined() expects exactly 1 parameter, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callDefined();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
