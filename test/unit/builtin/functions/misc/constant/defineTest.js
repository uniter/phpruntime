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
    CallStack = require('phpcore/src/CallStack'),
    IntegerValue = require('phpcore/src/Value/Integer').sync(),
    Namespace = require('phpcore/src/Namespace').sync(),
    NullValue = require('phpcore/src/Value/Null').sync(),
    PHPError = require('phpcommon').PHPError,
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "define" builtin function', function () {
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
        this.define = this.constantFunctions.define;

        this.nameReference = sinon.createStubInstance(Variable);
        this.valueReference = sinon.createStubInstance(Variable);

        this.args = [this.nameReference, this.valueReference];

        this.callDefine = function () {
            return this.define.apply(null, this.args);
        }.bind(this);
    });

    it('should define a case-sensitive constant in the global namespace correctly', function () {
        this.nameValue = this.valueFactory.createString('MY_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.valueValue = this.valueFactory.createInteger(21);
        this.valueReference.getValue.returns(this.valueValue);

        this.callDefine();

        expect(this.globalNamespace.defineConstant).to.have.been.calledOnce;
        expect(this.globalNamespace.defineConstant).to.have.been.calledWith('MY_CONST');
        expect(this.globalNamespace.defineConstant.args[0][1]).to.be.an.instanceOf(IntegerValue);
        expect(this.globalNamespace.defineConstant.args[0][1].getNative()).to.equal(21);
        expect(this.globalNamespace.defineConstant).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            sinon.match({caseInsensitive: false})
        );
    });

    it('should define a case-insensitive constant in the global namespace correctly', function () {
        this.nameValue = this.valueFactory.createString('MY_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.valueValue = this.valueFactory.createInteger(21);
        this.valueReference.getValue.returns(this.valueValue);
        this.isCaseInsensitiveReference = sinon.createStubInstance(Variable);
        this.isCaseInsensitiveValue = this.valueFactory.createBoolean(true);
        this.isCaseInsensitiveReference.getValue.returns(this.isCaseInsensitiveValue);
        this.args[2] = this.isCaseInsensitiveReference;

        this.callDefine();

        expect(this.globalNamespace.defineConstant).to.have.been.calledOnce;
        expect(this.globalNamespace.defineConstant).to.have.been.calledWith('MY_CONST');
        expect(this.globalNamespace.defineConstant.args[0][1]).to.be.an.instanceOf(IntegerValue);
        expect(this.globalNamespace.defineConstant.args[0][1].getNative()).to.equal(21);
        expect(this.globalNamespace.defineConstant).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            sinon.match({caseInsensitive: true})
        );
    });

    it('should define a case-sensitive constant in a sub-namespace correctly', function () {
        this.nameValue = this.valueFactory.createString('My\\Sub\\Space\\A_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.valueValue = this.valueFactory.createInteger(21);
        this.valueReference.getValue.returns(this.valueValue);
        this.subNamespace = sinon.createStubInstance(Namespace);
        this.globalNamespace.getDescendant.withArgs('My\\Sub\\Space').returns(this.subNamespace);

        this.callDefine();

        expect(this.subNamespace.defineConstant).to.have.been.calledOnce;
        expect(this.subNamespace.defineConstant).to.have.been.calledWith('A_CONST');
        expect(this.subNamespace.defineConstant.args[0][1]).to.be.an.instanceOf(IntegerValue);
        expect(this.subNamespace.defineConstant.args[0][1].getNative()).to.equal(21);
        expect(this.subNamespace.defineConstant).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            sinon.match({caseInsensitive: false})
        );
        expect(this.globalNamespace.defineConstant).not.to.have.been.called;
    });

    it('should define a case-insensitive constant in a sub-namespace correctly', function () {
        this.nameValue = this.valueFactory.createString('My\\Sub\\Space\\A_CONST');
        this.nameReference.getValue.returns(this.nameValue);
        this.valueValue = this.valueFactory.createInteger(21);
        this.valueReference.getValue.returns(this.valueValue);
        this.isCaseInsensitiveReference = sinon.createStubInstance(Variable);
        this.isCaseInsensitiveValue = this.valueFactory.createBoolean(true);
        this.isCaseInsensitiveReference.getValue.returns(this.isCaseInsensitiveValue);
        this.args[2] = this.isCaseInsensitiveReference;
        this.subNamespace = sinon.createStubInstance(Namespace);
        this.globalNamespace.getDescendant.withArgs('My\\Sub\\Space').returns(this.subNamespace);

        this.callDefine();

        expect(this.subNamespace.defineConstant).to.have.been.calledOnce;
        expect(this.subNamespace.defineConstant).to.have.been.calledWith('A_CONST');
        expect(this.subNamespace.defineConstant.args[0][1]).to.be.an.instanceOf(IntegerValue);
        expect(this.subNamespace.defineConstant.args[0][1].getNative()).to.equal(21);
        expect(this.subNamespace.defineConstant).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            sinon.match({caseInsensitive: true})
        );
        expect(this.globalNamespace.defineConstant).not.to.have.been.called;
    });

    describe('when no arguments are provided', function () {
        beforeEach(function () {
            this.args.length = 0;
        });

        it('should raise a warning', function () {
            this.callDefine();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'define() expects at least 2 parameters, 0 given'
            );
        });

        it('should return NULL', function () {
            var result = this.callDefine();

            expect(result).to.be.an.instanceOf(NullValue);
        });
    });
});
