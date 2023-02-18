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
    stringBindingFactory = require('../../../../../src/builtin/bindings/string'),
    stringFunctionFactory = require('../../../../../src/builtin/functions/string'),
    tools = require('../../../tools'),
    CallStack = require('phpcore/src/CallStack');

describe('PHP "explode" builtin function', function () {
    var callFactory,
        callStack,
        explode,
        stringVariable,
        delimiterVariable,
        limitVariable,
        state,
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
        callFactory = state.getCallFactory();
        valueFactory = state.getValueFactory();
        variableFactory = state.getService('variable_factory');

        // We need a call on the stack for any isolated scope evaluation.
        callStack.getCurrent.returns(
            callFactory.create(
                state.getGlobalScope(),
                state.getService('global_namespace_scope')
            )
        );

        explode = state.getFunction('explode');

        delimiterVariable = variableFactory.createVariable('myDelimiter');
        stringVariable = variableFactory.createVariable('myString');
        limitVariable = variableFactory.createVariable('myLimit');
    });

    it('should return an array with the correct elements when delimiter appears', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createString(','));
        stringVariable.setValue(valueFactory.createString('first,second,third'));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', 'third']);
    });

    it('should include elements with empty strings where multiple instances of the delimiter are touching', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createString(','));
        stringVariable.setValue(valueFactory.createString('first,second,,,third,fourth'));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['first', 'second', '', '', 'third', 'fourth']);
    });

    it('should return an array with a single empty-string element when the string is empty', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createString('.'));
        stringVariable.setValue(valueFactory.createString(''));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['']);
    });

    it('should return an array with a single element containing the number coerced to string when the "string" argument is an integer', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createString('.'));
        stringVariable.setValue(valueFactory.createInteger(212));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "string" argument to a string', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createString('.'));
        stringVariable.setValue(valueFactory.createInteger(212));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['212']);
    });

    it('should coerce the "delimiter" argument to a string', async function () {
        var resultValue;
        delimiterVariable.setValue(valueFactory.createInteger(4));
        stringVariable.setValue(valueFactory.createInteger(22499));

        resultValue = await explode(delimiterVariable, stringVariable).toPromise();

        expect(resultValue.getType()).to.equal('array');
        expect(resultValue.getNative()).to.deep.equal(['22', '99']);
    });
});
