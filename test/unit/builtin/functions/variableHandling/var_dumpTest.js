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
    variableHandlingFunctionFactory = require('../../../../../src/builtin/functions/variableHandling'),
    CallStack = require('phpcore/src/CallStack'),
    ElementReference = require('phpcore/src/Reference/Element'),
    Output = require('phpcore/src/Output/Output'),
    Value = require('phpcore/src/Value').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "var_dump" builtin function', function () {
    var callStack,
        callVardump,
        internals,
        output,
        outputContents,
        valueFactory,
        valueReference,
        variableHandlingFunctions,
        variableReference,
        var_dump;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);
        valueFactory = sinon.createStubInstance(ValueFactory);
        output = sinon.createStubInstance(Output);
        outputContents = '';
        output.write.callsFake(function (data) {
            outputContents += data;
        });
        internals = {
            callStack: callStack,
            output: output,
            valueFactory: valueFactory
        };
        variableHandlingFunctions = variableHandlingFunctionFactory(internals);
        var_dump = variableHandlingFunctions.var_dump;

        valueReference = sinon.createStubInstance(Value);
        variableReference = sinon.createStubInstance(Variable);
        variableReference.getValue.returns(valueReference);

        callVardump = function () {
            return var_dump(variableReference);
        };
    });

    it('should write NULL to the output when value is null', function () {
        valueReference.getType.returns('null');

        callVardump();

        expect(outputContents).to.equal('NULL\n');
    });

    it('should limit the length of dumped strings to 2048 characters', function () {
        valueReference.getType.returns('string');
        valueReference.getNative.returns(repeatString('a', 2060));

        callVardump();

        expect(outputContents).to.equal('string(2060) "' + repeatString('a', 2048) + '..."\n');
    });

    it('should handle a reference to a variable containing an array assigned to an element of itself', function () {
        var firstElement = sinon.createStubInstance(ElementReference),
            myselfElement = sinon.createStubInstance(ElementReference),
            firstKey = sinon.createStubInstance(Value),
            myselfKey = sinon.createStubInstance(Value),
            firstValue = sinon.createStubInstance(Value);
        valueReference.getLength.returns(2);
        valueReference.getNative.callsFake(function () {
            // Array.getNative() always returns a new JS array object
            return [];
        });
        valueReference.getType.returns('array');
        valueReference.getKeys = sinon.stub().returns([firstKey, myselfKey]);
        valueReference.getElementByKey.withArgs(sinon.match.same(firstKey)).returns(firstElement);
        valueReference.getElementByKey.withArgs(sinon.match.same(myselfKey)).returns(myselfElement);
        firstElement.getValue.returns(firstValue);
        firstElement.isReference.returns(false);
        firstValue.getType.returns('string');
        firstValue.getNative.returns('my first string');
        myselfElement.getValue.returns(valueReference);
        myselfElement.isReference.returns(true);
        firstKey.getNative.returns('first');
        myselfKey.getNative.returns('myself');

        callVardump();

        expect(outputContents).to.equal(
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

    it('should handle array elements with references to variables containing strings', function () {
        var firstElement = sinon.createStubInstance(ElementReference),
            secondElement = sinon.createStubInstance(ElementReference),
            firstKey = sinon.createStubInstance(Value),
            secondKey = sinon.createStubInstance(Value),
            firstValue = sinon.createStubInstance(Value),
            secondValue = sinon.createStubInstance(Value);
        valueReference.getLength.returns(2);
        valueReference.getNative.callsFake(function () {
            // Array.getNative() always returns a new JS array object
            return [];
        });
        valueReference.getType.returns('array');
        valueReference.getKeys = sinon.stub().returns([firstKey, secondKey]);
        valueReference.getElementByKey.withArgs(sinon.match.same(firstKey)).returns(firstElement);
        valueReference.getElementByKey.withArgs(sinon.match.same(secondKey)).returns(secondElement);
        firstElement.getValue.returns(firstValue);
        firstElement.isReference.returns(false);
        firstValue.getType.returns('string');
        firstValue.getNative.returns('my first string');

        secondElement.getValue.returns(secondValue);
        secondElement.isReference.returns(true);
        secondValue.getType.returns('string');
        secondValue.getNative.returns('my second string');

        firstKey.getNative.returns('first');
        secondKey.getNative.returns('second');

        callVardump();

        expect(outputContents).to.equal(
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
