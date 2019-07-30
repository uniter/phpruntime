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
    commonPcreFunctionFactory = require('../../../../../../src/builtin/functions/pcre/common'),
    sinon = require('sinon'),
    CallStack = require('phpcore/src/CallStack'),
    ValueFactory = require('phpcore/src/ValueFactory').sync();

describe('PHP "preg_quote" basic-level builtin function', function () {
    beforeEach(function () {
        this.callStack = sinon.createStubInstance(CallStack);
        this.valueFactory = new ValueFactory();

        this.preg_quote = commonPcreFunctionFactory({
            callStack: this.callStack,
            valueFactory: this.valueFactory
        }).preg_quote;
    });

    it('should not alter a string containing no special chars', function () {
        var result = this.preg_quote(this.valueFactory.createString('hello, this is my string'));

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal('hello, this is my string');
    });

    it('should escape all of the regex special chars', function () {
        var result = this.preg_quote(this.valueFactory.createString(
            'hello, here\n . \\ + * ? [ ^ ] $ ( ) { } = ! < > | : - # \nare all the special chars'
        ));

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here\n \\. \\\\ \\+ \\* \\? \\[ \\^ \\] \\$ \\( \\) \\{ \\} \\= \\! \\< \\> \\| \\: \\- \\# \nare all the special chars'
        );
    });

    it('should also escape all occurrences of the specified delimiter when given', function () {
        var result = this.preg_quote(
            this.valueFactory.createString('hello, here + ? is @ my @ string'),
            this.valueFactory.createString('@')
        );

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is \\@ my \\@ string'
        );
    });

    it('should not double-escape a character escaped by default when given as the delimiter', function () {
        var result = this.preg_quote(
            this.valueFactory.createString('hello, here + ? is my string'),
            this.valueFactory.createString('+')
        );

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is my string'
        );
    });

    it('should ignore all but the first character of the delimiter string when given', function () {
        var result = this.preg_quote(
            this.valueFactory.createString('hello, here + ? is @ my @ string'),
            this.valueFactory.createString('@sg')
        );

        expect(result.getType()).to.equal('string');
        expect(result.getNative()).to.equal(
            'hello, here \\+ \\? is \\@ my \\@ string'
        );
    });

    describe('when not enough args are given', function () {
        beforeEach(function () {
            this.doCall = function () {
                this.resultValue = this.preg_quote();
            }.bind(this);
        });

        it('should raise a warning', function () {
            this.doCall();

            expect(this.callStack.raiseError).to.have.been.calledOnce;
            expect(this.callStack.raiseError).to.have.been.calledWith(
                'Warning',
                'preg_quote() expects at least 1 parameter, 0 given'
            );
        });

        it('should return null', function () {
            this.doCall();

            expect(this.resultValue.getType()).to.equal('null');
        });
    });
});
