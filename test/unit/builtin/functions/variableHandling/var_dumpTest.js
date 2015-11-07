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
    Stream = require('phpcore/src/Stream'),
    Value = require('phpcore/src/Value').sync(),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "var_dump" builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = sinon.createStubInstance(ValueFactory);
        this.stdout = sinon.createStubInstance(Stream);
        this.stdoutContents = '';
        this.stdout.write.restore();
        sinon.stub(this.stdout, 'write', function (data) {
            this.stdoutContents += data;
        }.bind(this));
        this.internals = {
            callStack: this.callStack,
            stdout: this.stdout,
            valueFactory: this.valueFactory
        };
        this.variableHandlingFunctions = variableHandlingFunctionFactory(this.internals);
        this.var_dump = this.variableHandlingFunctions.var_dump;

        this.valueReference = sinon.createStubInstance(Value);
        this.variableReference = sinon.createStubInstance(Variable);
        this.variableReference.getValue.returns(this.valueReference);

        this.callVardump = function () {
            return this.var_dump(this.variableReference);
        }.bind(this);
    });

    it('should write NULL to stdout when value is null', function () {
        this.valueReference.getType.returns('null');

        this.callVardump();

        expect(this.stdoutContents).to.equal('NULL\n');
    });

    it('should limit the length of dumped strings to 2048 characters', function () {
        this.valueReference.getType.returns('string');
        this.valueReference.getNative.returns(repeatString('a', 2060));

        this.callVardump();

        expect(this.stdoutContents).to.equal('string(2060) "' + repeatString('a', 2048) + '..."\n');
    });

    it('should handle a reference to a variable containing an array assigned to an element of itself', function () {
        var firstElement = sinon.createStubInstance(ElementReference),
            myselfElement = sinon.createStubInstance(ElementReference),
            firstKey = sinon.createStubInstance(Value),
            myselfKey = sinon.createStubInstance(Value),
            firstValue = sinon.createStubInstance(Value);
        this.valueReference.getLength.returns(2);
        this.valueReference.getNative.restore();
        sinon.stub(this.valueReference, 'getNative', function () {
            // Array.getNative() always returns a new JS array object
            return [];
        });
        this.valueReference.getType.returns('array');
        this.valueReference.getKeys = sinon.stub().returns([firstKey, myselfKey]);
        this.valueReference.getElementByKey.withArgs(sinon.match.same(firstKey)).returns(firstElement);
        this.valueReference.getElementByKey.withArgs(sinon.match.same(myselfKey)).returns(myselfElement);
        firstElement.getValue.returns(firstValue);
        firstElement.isReference.returns(false);
        firstValue.getType.returns('string');
        firstValue.getNative.returns('my first string');
        myselfElement.getValue.returns(this.valueReference);
        myselfElement.isReference.returns(true);
        firstKey.getNative.returns('first');
        myselfKey.getNative.returns('myself');

        this.callVardump();

        expect(this.stdoutContents).to.equal(
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
        this.valueReference.getLength.returns(2);
        this.valueReference.getNative.restore();
        sinon.stub(this.valueReference, 'getNative', function () {
            // Array.getNative() always returns a new JS array object
            return [];
        });
        this.valueReference.getType.returns('array');
        this.valueReference.getKeys = sinon.stub().returns([firstKey, secondKey]);
        this.valueReference.getElementByKey.withArgs(sinon.match.same(firstKey)).returns(firstElement);
        this.valueReference.getElementByKey.withArgs(sinon.match.same(secondKey)).returns(secondElement);
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

        this.callVardump();

        expect(this.stdoutContents).to.equal(
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
