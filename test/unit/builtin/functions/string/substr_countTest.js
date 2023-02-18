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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    stringBindingFactory = require('../../../../../src/builtin/bindings/string'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack'),
    PHPError = phpCommon.PHPError;

describe('PHP "substr_count" builtin function', function () {
    var callStack,
        haystackVariable,
        lengthVariable,
        needleVariable,
        offsetVariable,
        state,
        substr_count,
        valueFactory,
        variableFactory;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                bindingGroups: [
                    stringBindingFactory
                ],
                functionGroups: [
                    stringFunctionFactory
                ]
            }
        ]);
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        substr_count = state.getFunction('substr_count');

        haystackVariable = variableFactory.createVariable('myHaystack');
        needleVariable = variableFactory.createVariable('myNeedle');
        offsetVariable = variableFactory.createVariable('myOffset');
        lengthVariable = variableFactory.createVariable('myLength');
    });

    it('should return 0 when the haystack is empty', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString(''));
        needleVariable.setValue(valueFactory.createString('stuff'));

        result = await substr_count(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(0);
    });

    it('should return 3 when the substring appears 3 times, directly adjacent, in the middle of the string', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('my strstrstr here'));
        needleVariable.setValue(valueFactory.createString('str'));

        result = await substr_count(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(3);
    });

    it('should return 4 when the substring appears 4 times, delimited by spaces, taking the entire string', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('stuff stuff stuff stuff'));
        needleVariable.setValue(valueFactory.createString('stuff'));

        result = await substr_count(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(4);
    });

    it('should support a positive offset and length, where offset cuts into a previous occurrence that should be discounted', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('my stuffstuffstuff in here'));
        needleVariable.setValue(valueFactory.createString('stuff'));
        offsetVariable.setValue(valueFactory.createInteger(4));
        lengthVariable.setValue(valueFactory.createInteger(14));

        result = await substr_count(haystackVariable, needleVariable, offsetVariable, lengthVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(2);
    });

    it('should support a positive offset and length, where offset cuts into a subsequent occurrence that should be discounted', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('my stuffstuffstuff in here'));
        needleVariable.setValue(valueFactory.createString('stuff'));
        offsetVariable.setValue(valueFactory.createInteger(2));
        lengthVariable.setValue(valueFactory.createInteger(14));

        result = await substr_count(haystackVariable, needleVariable, offsetVariable, lengthVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(2);
    });

    it('should support negative offsets by counting back from the end', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('my stuffstuffstuff here'));
        needleVariable.setValue(valueFactory.createString('stuff'));
        offsetVariable.setValue(valueFactory.createInteger(-12));

        result = await substr_count(haystackVariable, needleVariable, offsetVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(1);
    });

    it('should support negative lengths by counting back from the end', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createString('strstrstrstr'));
        needleVariable.setValue(valueFactory.createString('str'));
        offsetVariable.setValue(valueFactory.createInteger(2));
        lengthVariable.setValue(valueFactory.createInteger(-4));

        // Should search `rstrst`.
        result = await substr_count(haystackVariable, needleVariable, offsetVariable, lengthVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(1);
    });

    it('should cast the needle and haystack to string', async function () {
        var result;
        haystackVariable.setValue(valueFactory.createInteger(27773));
        needleVariable.setValue(valueFactory.createInteger(7));

        result = await substr_count(haystackVariable, needleVariable).toPromise();

        expect(result.getType()).to.equal('int');
        expect(result.getNative()).to.equal(3);
    });

    describe('when only the haystack is given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            haystackVariable.setValue(valueFactory.createString('my haystack'));

            doCall = async function () {
                resultValue = await substr_count(haystackVariable).toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'substr_count() expects at least 2 parameters, 1 given'
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });

    describe('when no arguments are given', function () {
        var doCall,
            resultValue;

        beforeEach(function () {
            doCall = async function () {
                resultValue = await substr_count().toPromise();
            };
        });

        it('should raise a warning', async function () {
            await doCall();

            expect(callStack.raiseError).to.have.been.calledOnce;
            expect(callStack.raiseError).to.have.been.calledWith(
                PHPError.E_WARNING,
                'substr_count() expects at least 2 parameters, 0 given'
            );
        });

        it('should return null', async function () {
            await doCall();

            expect(resultValue.getType()).to.equal('null');
        });
    });
});
