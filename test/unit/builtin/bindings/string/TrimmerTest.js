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
    CallStack = require('phpcore/src/CallStack'),
    Trimmer = require('../../../../../src/builtin/bindings/string/Trimmer');

describe('Trimmer', function () {
    var callStack,
        trimmer;

    beforeEach(function () {
        callStack = sinon.createStubInstance(CallStack);

        trimmer = new Trimmer(callStack);
    });

    describe('buildTrimCharacterClass()', function () {
        it('should escape special characters for the character class', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', 'ab-c]\\def'))
                .to.equal('ab\\-c\\]\\\\def');
        });

        it('should leave ranges missing a left character unchanged', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', '..bcd'))
                .to.equal('..bcd');
        });

        it('should leave ranges missing a right character unchanged', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', 'ab..'))
                .to.equal('ab..');
        });

        it('should leave ranges that decrement unchanged', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', 'z..x'))
                .to.equal('z..x');
        });

        it('should convert ranges that increment', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', 'x..z'))
                .to.equal('x-z');
        });

        it('should convert ranges that (redundantly) have the same left & right characters', function () {
            // TODO: Consider reducing these to a single char, if worth the additional logic,
            expect(trimmer.buildTrimCharacterClass('rtrim', 'y..y'))
                .to.equal('y-y');
        });

        it('should convert ranges that use regex character class special chars', function () {
            expect(trimmer.buildTrimCharacterClass('rtrim', '\\..-'))
                // Note correct escaping!
                .to.equal('\\\\..\\-');
        });
    });
});
