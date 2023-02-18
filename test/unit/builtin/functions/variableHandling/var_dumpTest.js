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
    nowdoc = require('nowdoc'),
    repeatString = function (string, times) {
        return new Array(times + 1).join(string);
    },
    sinon = require('sinon'),
    tools = require('../../../tools'),
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack');

describe('PHP "var_dump" builtin function', function () {
    var callStack,
        callVardump,
        flow,
        futureFactory,
        state,
        stdout,
        valueFactory,
        variableFactory,
        variableReference,
        var_dump;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        state = tools.createIsolatedState('async', {
            'call_stack': callStack
        }, {}, [
            {
                functionGroups: [
                    variableHandlingFunctionFactory
                ]
            }
        ]);
        flow = state.getFlow();
        futureFactory = state.getFutureFactory();
        valueFactory = state.getValueFactory();
        stdout = state.getStdout();
        variableFactory = state.getService('variable_factory');

        var_dump = state.getFunction('var_dump');

        variableReference = variableFactory.createVariable('myVar');

        callVardump = function () {
            return var_dump(variableReference);
        };
    });

    it('should write NULL to the output when value is null', async function () {
        variableReference.setValue(valueFactory.createNull());

        await callVardump().toPromise();

        expect(stdout.readAll()).to.equal('NULL\n');
    });

    it('should limit the length of dumped strings to 2048 characters', async function () {
        variableReference.setValue(valueFactory.createString(repeatString('a', 2060)));

        await callVardump().toPromise();

        expect(stdout.readAll()).to.equal('string(2060) "' + repeatString('a', 2048) + '..."\n');
    });

    it('should handle a reference to a variable containing an array assigned to an element of itself', async function () {
        var arrayValue = valueFactory.createArray([]),
            firstElement = arrayValue.getElementByKey(valueFactory.createString('first')),
            myselfElement = arrayValue.getElementByKey(valueFactory.createString('myself'));
        firstElement.setValue(valueFactory.createString('my first string'));
        myselfElement.setReference(variableReference.getReference());
        variableReference.setValue(arrayValue);

        await callVardump().toPromise();

        expect(stdout.readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(2) {
  ["first"]=>
  string(15) "my first string"
  ["myself"]=>
  &array(2) {
    ["first"]=>
    string(15) "my first string"
    ["myself"]=>
    *RECURSION*
  }
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should handle array elements with references to variables containing strings', async function () {
        var arrayValue = valueFactory.createArray([]),
            firstElement = arrayValue.getElementByKey(valueFactory.createString('first')),
            secondElement = arrayValue.getElementByKey(valueFactory.createString('second')),
            referencedVariable = variableFactory.createVariable('referredVar');
        firstElement.setValue(valueFactory.createString('my first string'));
        referencedVariable.setValue(valueFactory.createString('my second string'));
        secondElement.setReference(referencedVariable.getReference());
        variableReference.setValue(arrayValue);

        await callVardump().toPromise();

        expect(stdout.readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(2) {
  ["first"]=>
  string(15) "my first string"
  ["second"]=>
  &string(16) "my second string"
}

EOS
*/;}) //jshint ignore:line
        );
    });
});
